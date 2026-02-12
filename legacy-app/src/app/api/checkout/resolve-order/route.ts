// src/app/api/checkout/resolve-order/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminOrderService } from "@/lib/services/admin-order-service";
import { requireEnv } from "@/lib/env";

export const runtime = "nodejs";

const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
    if (!paymentIntentId) {
      return NextResponse.json({ error: "No payment_intent found for this session" }, { status: 400 });
    }

    const orderResult = await adminOrderService.getOrderByPaymentIntentId(paymentIntentId);

    if (!orderResult.success) {
      return NextResponse.json({ error: orderResult.error }, { status: orderResult.status ?? 500 });
    }

    if (!orderResult.data) {
      return NextResponse.json({ status: "pending" }, { status: 200 });
    }

    return NextResponse.json({ status: "ready", orderId: orderResult.data.id }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to resolve order.";
    const isNoSuchSession = typeof msg === "string" && msg.includes("No such checkout.session");

    if (isNoSuchSession) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }

    console.error("[RESOLVE_ORDER_ERROR]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
