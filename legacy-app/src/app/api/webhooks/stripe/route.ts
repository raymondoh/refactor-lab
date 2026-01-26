// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { adminOrderService } from "@/lib/services/admin-order-service";
import { adminProductService } from "@/lib/services/admin-product-service";
import type { OrderData } from "@/types/order";
import { formatPrice } from "@/lib/utils";
import { TAX_RATE, SHIPPING_CONFIG } from "@/config/checkout";

/**
 * Strongly-typed env helper.
 * Guarantees returned value is a string at runtime + compile time.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Required secrets
const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = requireEnv("STRIPE_WEBHOOK_SECRET");

// Optional (Resend tolerates undefined, but you may enforce later)
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// SDK clients
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil"
});

const resend = new Resend(RESEND_API_KEY);

// App URL fallback (safe)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: Request) {
  const body = await req.text();

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new NextResponse("Missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    console.log(`✅ Webhook received: ${event.type}`);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
      console.log(`💰 PaymentIntent succeeded: ${paymentIntentSucceeded.id}`);

      try {
        const shipping = paymentIntentSucceeded.shipping;
        if (!shipping) {
          console.error("🚫 Missing shipping information on PaymentIntent");
          return new NextResponse("Missing shipping information", { status: 400 });
        }

        let rawItems: { id: string; quantity: number }[] = [];
        try {
          if (paymentIntentSucceeded.metadata?.items) {
            const parsed = JSON.parse(paymentIntentSucceeded.metadata.items);
            rawItems = Array.isArray(parsed) ? parsed : [];
          }
        } catch (parseError) {
          console.error("Failed to parse metadata items JSON:", parseError);
          rawItems = [];
        }

        console.log("Raw items from metadata:", rawItems);

        const items: OrderData["items"] = [];
        let calculatedSubtotal = 0;

        for (const item of rawItems) {
          const productResult = await adminProductService.getProductById(item.id);

          if (!productResult.success) {
            console.error(`Product with ID ${item.id} not found when creating order. Skipping item.`);
            continue;
          }

          const product = productResult.data.product;
          const itemPrice = product.onSale && typeof product.salePrice === "number" ? product.salePrice : product.price;

          items.push({
            productId: product.id,
            name: product.name,
            price: itemPrice,
            quantity: item.quantity,
            image: product.image
          });

          calculatedSubtotal += itemPrice * item.quantity;
        }

        if (items.length === 0) {
          console.error("No valid items found from metadata to create order.");
          return new NextResponse("No valid items for order", { status: 400 });
        }

        const calculatedTaxForEmail = Number.parseFloat((calculatedSubtotal * TAX_RATE).toFixed(2));
        const calculatedShippingForEmail =
          calculatedSubtotal > SHIPPING_CONFIG.freeShippingThreshold ? 0 : SHIPPING_CONFIG.flatRate;

        const userId = paymentIntentSucceeded.metadata?.userId ? String(paymentIntentSucceeded.metadata.userId) : null;

        const orderData: OrderData = {
          paymentIntentId: paymentIntentSucceeded.id,
          amount: (paymentIntentSucceeded.amount_received ?? paymentIntentSucceeded.amount) / 100,
          currency: paymentIntentSucceeded.currency ?? "gbp",
          userId,
          customerEmail: paymentIntentSucceeded.receipt_email ?? paymentIntentSucceeded.metadata?.customerEmail ?? "",
          customerName: shipping.name ?? "",
          shippingAddress: {
            name: shipping.name ?? "",
            address: shipping.address?.line1 ?? "",
            city: shipping.address?.city ?? "",
            state: shipping.address?.state ?? "",
            zipCode: shipping.address?.postal_code ?? "",
            country: shipping.address?.country ?? ""
          },
          items,
          status: "processing"
        };

        // ✅ service already enforces idempotency internally by paymentIntentId
        const result = await adminOrderService.createOrder(orderData);

        if (!result.success) {
          console.error("❌ Failed to create order:", result.error);
          return new NextResponse(`Failed to create order: ${result.error}`, { status: 500 });
        }

        const orderId = result.data.orderId;
        console.log(`✅ Order ${orderId} created from webhook.`);

        // Email (best-effort)
        try {
          const customerEmail = orderData.customerEmail;
          if (customerEmail) {
            await resend.emails.send({
              from: "Your Store Name <onboarding@resend.dev>",
              to: [customerEmail],
              subject: `Order Confirmation - #${orderId.slice(0, 8).toUpperCase()} from Your Store Name`,
              html: `
                <p>Hi ${orderData.customerName || "there"},</p>
                <p>Thank you for your order!</p>
                <p>Your order #${orderId.slice(0, 8).toUpperCase()} has been confirmed and is now being processed.</p>
                <h3>Order Summary:</h3>
                <ul>
                  ${items
                    .map(
                      item => `
                        <li>${item.quantity} x ${item.name} - ${formatPrice(
                          item.price * item.quantity,
                          orderData.currency
                        )}</li>
                      `
                    )
                    .join("")}
                </ul>
                <p>Subtotal: ${formatPrice(calculatedSubtotal, orderData.currency)}</p>
                <p>Tax: ${formatPrice(calculatedTaxForEmail, orderData.currency)}</p>
                <p>Shipping: ${formatPrice(calculatedShippingForEmail, orderData.currency)}</p>
                <p><strong>Total Paid: ${formatPrice(orderData.amount, orderData.currency)}</strong></p>
                <p>We'll send you another email when your order has shipped.</p>
                <p>You can view your order details here: <a href="${APP_URL}/user/orders/${orderId}">View Order</a></p>
                <p>Thanks,<br/>Your Store Name Team</p>
              `
            });
            console.log(`📧 Order confirmation email sent to ${customerEmail}`);
          } else {
            console.warn("No customer email found for order confirmation.");
          }
        } catch (emailError: any) {
          console.error("❌ Failed to send order confirmation email:", emailError);
        }

        return new NextResponse("Order created", { status: 200 });
      } catch (hookErr: any) {
        console.error("❌ Webhook order handling error:", hookErr);
        return new NextResponse(`Webhook order handling error: ${hookErr.message}`, { status: 500 });
      }
    }

    case "checkout.session.completed": {
      const checkoutSessionCompleted = event.data.object as Stripe.Checkout.Session;
      console.log(`✅ Checkout Session completed: ${checkoutSessionCompleted.id}`);
      return new NextResponse("Checkout Session handled", { status: 200 });
    }

    case "payment_intent.payment_failed": {
      const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
      console.log(`❌ PaymentIntent failed: ${paymentIntentFailed.id}`);
      return new NextResponse("Payment failed handled", { status: 200 });
    }

    case "charge.succeeded":
    case "charge.updated":
    case "payment_intent.created":
      console.log(`Unhandled event type: ${event.type}`);
      return new NextResponse(`Unhandled event type: ${event.type}`, { status: 200 });

    default:
      console.warn(`Unhandled event type: ${event.type}`);
      return new NextResponse(`Unhandled event type: ${event.type}`, { status: 200 });
  }
}

export const config = {
  api: { bodyParser: false }
};
