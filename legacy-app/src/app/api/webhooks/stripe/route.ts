// // src/app/api/webhooks/stripe/route.ts
// import { NextResponse } from "next/server";
// import Stripe from "stripe";
// import { createOrder } from "@/firebase/admin/orders";
// import { getProductById } from "@/firebase/admin/products"; // Import getProductById
// import type { OrderData } from "@/types/order";

// // Initialize Stripe with your secret key
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: "2025-05-28.basil"
// });

// // IMPORTANT: Define your Stripe webhook secret
// const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET!;

// export async function POST(req: Request) {
//   const body = await req.text(); // Webhook bodies are raw text, not JSON
//   const signature = await req.headers.get("stripe-signature"); // Use req.headers.get to access headers

//   let event: Stripe.Event;

//   try {
//     // 1. Verify the webhook signature for security
//     event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
//     console.log(`✅ Webhook received: ${event.type}`); // Log successful receipt
//   } catch (err: any) {
//     // If verification fails, return 400 Bad Request
//     console.error(`❌ Webhook signature verification failed: ${err.message}`);
//     return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
//   }

//   // 2. Handle the event
//   switch (event.type) {
//     case "payment_intent.succeeded":
//       const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
//       console.log(`💰 PaymentIntent succeeded: ${paymentIntentSucceeded.id}`);
//       try {
//         const shipping = paymentIntentSucceeded.shipping;
//         if (!shipping) {
//           console.error("🚫 Missing shipping information on PaymentIntent");
//           return new NextResponse("Missing shipping information", { status: 400 });
//         }

//         let rawItems: { id: string; quantity: number }[] = [];
//         try {
//           if (paymentIntentSucceeded.metadata?.items) {
//             rawItems = JSON.parse(paymentIntentSucceeded.metadata.items);
//             if (!Array.isArray(rawItems)) {
//               console.error("Metadata items is not an array:", rawItems);
//               rawItems = [];
//             }
//           }
//         } catch (parseError) {
//           console.error("Failed to parse metadata items JSON:", parseError);
//           rawItems = [];
//         }
//         console.log("Raw items from metadata:", rawItems);

//         // --- FIX: Re-fetch full product details for order creation ---
//         const items: OrderData["items"] = [];
//         for (const item of rawItems) {
//           const productResult = await getProductById(item.id);
//           if (!productResult.success || !productResult.product) {
//             console.error(`Product with ID ${item.id} not found when creating order. Skipping item.`);
//             // You might want to handle this more robustly, e.g., mark order as problematic
//             continue;
//           }
//           const product = productResult.product;
//           const itemPrice = product.onSale && typeof product.salePrice === "number" ? product.salePrice : product.price;

//           items.push({
//             productId: product.id,
//             name: product.name,
//             price: itemPrice,
//             quantity: item.quantity,
//             image: product.image // Include image if available from product details
//           });
//         }

//         if (items.length === 0) {
//           console.error("No valid items found from metadata to create order.");
//           return new NextResponse("No valid items for order", { status: 400 });
//         }
//         // --- END FIX ---

//         const orderData: OrderData = {
//           paymentIntentId: paymentIntentSucceeded.id,
//           amount: (paymentIntentSucceeded.amount_received ?? paymentIntentSucceeded.amount) / 100,
//           currency: paymentIntentSucceeded.currency ?? "gbp",
//           userId: paymentIntentSucceeded.metadata?.userId || null,
//           customerEmail: paymentIntentSucceeded.receipt_email ?? paymentIntentSucceeded.metadata?.customerEmail ?? "",
//           customerName: shipping.name ?? "",
//           shippingAddress: {
//             name: shipping.name ?? "",
//             address: shipping.address?.line1 ?? "",
//             city: shipping.address?.city ?? "",
//             state: shipping.address?.state ?? "",
//             zipCode: shipping.address?.postal_code ?? "",
//             country: shipping.address?.country ?? ""
//           },
//           items: items, // Use the re-fetched and complete items
//           status: "processing"
//         };

//         const result = await createOrder(orderData);
//         if (!result.success) {
//           console.error("❌ Failed to create order:", result.error);
//           return new NextResponse(`Failed to create order: ${result.error}`, { status: 500 });
//         } else {
//           console.log(`✅ Order ${result.orderId} created from webhook.`);
//           return new NextResponse("Order created", { status: 200 });
//         }
//       } catch (hookErr: any) {
//         console.error("❌ Webhook order handling error:", hookErr);
//         return new NextResponse(`Webhook order handling error: ${hookErr.message}`, { status: 500 });
//       }

//     case "checkout.session.completed":
//       const checkoutSessionCompleted = event.data.object as Stripe.Checkout.Session;
//       console.log(`✅ Checkout Session completed: ${checkoutSessionCompleted.id}`);
//       return new NextResponse("Checkout Session handled", { status: 200 });

//     case "payment_intent.payment_failed":
//       const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
//       console.log(`❌ PaymentIntent failed: ${paymentIntentFailed.id}`);
//       return new NextResponse("Payment failed handled", { status: 200 });

//     case "charge.succeeded":
//     case "charge.updated":
//     case "payment_intent.created":
//       console.log(`Unhandled event type: ${event.type}`);
//       return new NextResponse(`Unhandled event type: ${event.type}`, { status: 200 });

//     default:
//       console.warn(`Unhandled event type: ${event.type}`);
//       return new NextResponse(`Unhandled event type: ${event.type}`, { status: 200 });
//   }
// }

// // IMPORTANT: Set config for raw body parsing
// export const config = {
//   api: {
//     bodyParser: false // Disable Next.js body parsing
//   }
// };
// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { createOrder } from "@/firebase/admin/orders";
import { getProductById } from "@/firebase/admin/products";
import type { OrderData } from "@/types/order";
import { formatPrice } from "@/lib/utils";
import { TAX_RATE, SHIPPING_CONFIG } from "@/config/checkout"; // Ensure TAX_RATE and SHIPPING_CONFIG are imported

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil"
});

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// IMPORTANT: Define your Stripe webhook secret
const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = await req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
    console.log(`✅ Webhook received: ${event.type}`);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded":
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
            rawItems = JSON.parse(paymentIntentSucceeded.metadata.items);
            if (!Array.isArray(rawItems)) {
              console.error("Metadata items is not an array:", rawItems);
              rawItems = [];
            }
          }
        } catch (parseError) {
          console.error("Failed to parse metadata items JSON:", parseError);
          rawItems = [];
        }
        console.log("Raw items from metadata:", rawItems);

        const items: OrderData["items"] = [];
        let calculatedSubtotal = 0; // This variable will now be used

        for (const item of rawItems) {
          const productResult = await getProductById(item.id);
          if (!productResult.success || !productResult.product) {
            console.error(`Product with ID ${item.id} not found when creating order. Skipping item.`);
            continue;
          }
          const product = productResult.product;
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

        // Recalculate tax and shipping based on the actual subtotal here for email breakdown
        const calculatedTaxForEmail = parseFloat((calculatedSubtotal * TAX_RATE).toFixed(2));
        const calculatedShippingForEmail =
          calculatedSubtotal > SHIPPING_CONFIG.freeShippingThreshold ? 0 : SHIPPING_CONFIG.flatRate;

        const orderData: OrderData = {
          paymentIntentId: paymentIntentSucceeded.id,
          amount: (paymentIntentSucceeded.amount_received ?? paymentIntentSucceeded.amount) / 100,
          currency: paymentIntentSucceeded.currency ?? "gbp",
          userId: paymentIntentSucceeded.metadata?.userId || null,
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
          items: items,
          status: "processing"
        };

        const result = await createOrder(orderData);
        if (!result.success) {
          console.error("❌ Failed to create order:", result.error);
          return new NextResponse(`Failed to create order: ${result.error}`, { status: 500 });
        } else {
          // FIX: Use non-null assertion for result.orderId! since result.success is true
          const orderId = result.orderId!;
          console.log(`✅ Order ${orderId} created from webhook.`);

          try {
            const customerEmail = orderData.customerEmail;
            if (customerEmail) {
              await resend.emails.send({
                from: "Your Store Name <onboarding@resend.dev>", // Replace with your verified Resend domain
                to: [customerEmail],
                subject: `Order Confirmation - #${orderId.slice(0, 8).toUpperCase()} from Your Store Name`, // Use orderId
                html: `
                        <p>Hi ${orderData.customerName || "there"},</p>
                        <p>Thank you for your order!</p>
                        <p>Your order #${orderId.slice(0, 8).toUpperCase()} has been confirmed and is now being processed.</p>
                        <h3>Order Summary:</h3>
                        <ul>
                            ${items
                              .map(
                                item => `
                                <li>${item.quantity} x ${item.name} - ${formatPrice(item.price * item.quantity, orderData.currency)}</li>
                            `
                              )
                              .join("")}
                        </ul>
                        <p>Subtotal: ${formatPrice(calculatedSubtotal, orderData.currency)}</p>
                        <p>Tax: ${formatPrice(calculatedTaxForEmail, orderData.currency)}</p>
                        <p>Shipping: ${formatPrice(calculatedShippingForEmail, orderData.currency)}</p>
                        <p><strong>Total Paid: ${formatPrice(orderData.amount, orderData.currency)}</strong></p>
                        <p>We'll send you another email when your order has shipped.</p>
                        <p>You can view your order details here: <a href="${process.env.NEXT_PUBLIC_APP_URL}/user/orders/${orderId}">View Order</a></p>
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
        }
      } catch (hookErr: any) {
        console.error("❌ Webhook order handling error:", hookErr);
        return new NextResponse(`Webhook order handling error: ${hookErr.message}`, { status: 500 });
      }

    case "checkout.session.completed":
      const checkoutSessionCompleted = event.data.object as Stripe.Checkout.Session;
      console.log(`✅ Checkout Session completed: ${checkoutSessionCompleted.id}`);
      return new NextResponse("Checkout Session handled", { status: 200 });

    case "payment_intent.payment_failed":
      const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
      console.log(`❌ PaymentIntent failed: ${paymentIntentFailed.id}`);
      return new NextResponse("Payment failed handled", { status: 200 });

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
  api: {
    bodyParser: false
  }
};
