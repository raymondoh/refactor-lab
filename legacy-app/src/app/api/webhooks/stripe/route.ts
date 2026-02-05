// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { adminOrderService } from "@/lib/services/admin-order-service";
import type { OrderData } from "@/types/order";
import { formatPrice } from "@/lib/utils";
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";

/**
 * Strongly-typed env helper.
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
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// SDK clients
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil"
});

const resend = new Resend(RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Fetch all line items for a session, handling pagination if necessary.
 */
async function getAllSessionLineItems(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"]
  });

  const expanded = session.line_items?.data ?? [];
  const hasMore = session.line_items?.has_more ?? false;

  if (!hasMore) {
    return { session, lineItems: expanded };
  }

  const all: Stripe.LineItem[] = [];
  let startingAfter: string | undefined = undefined;

  while (true) {
    const page: Stripe.ApiList<Stripe.LineItem> = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {})
    });

    all.push(...page.data);

    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) break;
  }

  return { session, lineItems: all };
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  try {
    if (typeof value !== "string") return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Unified handler for Checkout Session fulfillment.
 */
async function handleCheckoutSessionPaid(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return { ok: true as const, skipped: true as const };
  }

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : "";
  if (!paymentIntentId) {
    throw new Error("Missing payment_intent on paid Checkout Session.");
  }

  const rawItems = safeJsonParse<{ id: string; quantity: number }[]>(session.metadata?.items, []);
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("Missing or invalid session.metadata.items; cannot build order items.");
  }

  const items: OrderData["items"] = [];
  let productsSubtotal = 0;

  const db = getAdminFirestore();

  for (const it of rawItems) {
    if (!it?.id || !Number.isFinite(it.quantity) || it.quantity < 1) continue;
    const doc = await db.collection("products").doc(it.id).get();
    if (!doc.exists) continue;

    const data = doc.data() as any;

    const price = Number(data?.price ?? 0);
    const onSale = Boolean(data?.onSale);
    const salePrice = typeof data?.salePrice === "number" ? data.salePrice : undefined;

    const itemPrice = onSale && typeof salePrice === "number" && salePrice < price ? salePrice : price;

    items.push({
      productId: doc.id,
      name: String(data?.name ?? "Product"),
      price: itemPrice,
      quantity: it.quantity,
      image: typeof data?.image === "string" ? data.image : ""
    });

    productsSubtotal += itemPrice * it.quantity;
  }

  if (items.length === 0) {
    throw new Error("No valid products found for session.metadata.items.");
  }

  const email = session.customer_details?.email || session.customer_email || "";
  const shipping = session.shipping_details;
  const shippingCost = (session.shipping_cost?.amount_total ?? 0) / 100;
  const totalPaid = (session.amount_total ?? 0) / 100;
  const inferredTax = Math.max(0, Number.parseFloat((totalPaid - productsSubtotal - shippingCost).toFixed(2)));

  const userId = session.metadata?.userId ? String(session.metadata.userId) : null;

  const orderData: OrderData = {
    paymentIntentId,
    amount: totalPaid,
    currency: session.currency ?? "gbp",
    userId,
    customerEmail: email,
    customerName: shipping?.name ?? session.customer_details?.name ?? "",
    shippingAddress: {
      name: shipping?.name ?? "",
      address: shipping?.address?.line1 ?? "",
      city: shipping?.address?.city ?? "",
      state: shipping?.address?.state ?? "",
      zipCode: shipping?.address?.postal_code ?? "",
      country: shipping?.address?.country ?? ""
    },
    items,
    status: "processing"
  };

  const result = await adminOrderService.createOrder(orderData);
  if (!result.success) throw new Error(result.error);

  const orderId = result.data.orderId;

  try {
    if (email) {
      await resend.emails.send({
        from: "Your Store Name <onboarding@resend.dev>",
        to: [email],
        subject: `Order Confirmation - #${orderId.slice(0, 8).toUpperCase()} from Your Store Name`,
        html: `
          <p>Hi ${orderData.customerName || "there"},</p>
          <p>Thank you for your order!</p>
          <p>Your order #${orderId.slice(0, 8).toUpperCase()} has been confirmed and is now being processed.</p>
          <h3>Order Summary:</h3>
          <ul>
            ${items.map(item => `<li>${item.quantity} x ${item.name} - ${formatPrice(item.price * item.quantity, orderData.currency)}</li>`).join("")}
          </ul>
          <p>Subtotal: ${formatPrice(productsSubtotal, orderData.currency)}</p>
          <p>Tax: ${formatPrice(inferredTax, orderData.currency)}</p>
          <p>Shipping: ${formatPrice(shippingCost, orderData.currency)}</p>
          <p><strong>Total Paid: ${formatPrice(totalPaid, orderData.currency)}</strong></p>
         ${userId ? `<p>You can view your order here: <a href="${APP_URL}/user/orders/${orderId}">View Order</a></p>` : ""}

        `
      });
    }
  } catch (emailErr) {
    console.error("❌ Failed to send confirmation email:", emailErr);
  }

  return { ok: true as const, orderId, orderData };
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) return new NextResponse("Missing stripe-signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      try {
        const result = await handleCheckoutSessionPaid(session.id);
        if ("skipped" in result) return new NextResponse("Skipped", { status: 200 });
        return new NextResponse("Order created", { status: 200 });
      } catch (err: any) {
        console.error("[webhook] fulfillment error:", err);
        return new NextResponse("Webhook handler error", { status: 500 });
      }
    }

    case "checkout.session.async_payment_failed": {
      return new NextResponse("Async failure handled", { status: 200 });
    }

    default:
      return new NextResponse(`Unhandled event: ${event.type}`, { status: 200 });
  }
}

export const config = { api: { bodyParser: false } };
