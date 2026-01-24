// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type Stripe from "stripe";
import { getEnv } from "@/lib/env";
import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/require-session";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  tier: z.enum(["pro", "business"]),
  isYearly: z.boolean().optional()
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    if (session.user.role !== "tradesperson") {
      return NextResponse.json({ error: "Only tradespeople can subscribe to plans." }, { status: 403 });
    }

    const parse = bodySchema.safeParse(await req.json());
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid request body", issues: parse.error.issues }, { status: 400 });
    }

    const { tier, isYearly } = parse.data;

    const priceMap: Record<"pro" | "business", { monthly?: string; yearly?: string }> = {
      pro: {
        monthly: process.env.STRIPE_PRO_PRICE_MONTHLY,
        yearly: process.env.STRIPE_PRO_PRICE_YEARLY
      },
      business: {
        monthly: process.env.STRIPE_BUSINESS_PRICE_MONTHLY,
        yearly: process.env.STRIPE_BUSINESS_PRICE_YEARLY
      }
    };

    const billingInterval = isYearly ? "yearly" : "monthly";
    const priceId = priceMap[tier]?.[billingInterval];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid tier or billing interval" }, { status: 400 });
    }

    const origin = req.nextUrl.origin;

    const existingCustomerId =
      typeof (session.user as { stripeCustomerId?: string }).stripeCustomerId === "string"
        ? (session.user as { stripeCustomerId?: string }).stripeCustomerId
        : undefined;

    // 🔒 Explicit type = no overload confusion
    const payload: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      locale: "auto",
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
        tier,
        billingInterval
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          tier,
          billingInterval
        }
      }
    };

    if (existingCustomerId) {
      payload.customer = existingCustomerId;
    } else if (typeof session.user.email === "string" && session.user.email.length > 0) {
      // Let Stripe create a customer for the supplied email address.
      // Checkout will automatically attach the new customer to the session.
      payload.customer_email = session.user.email;
    }

    // The payload we send to Stripe can legitimately change between attempts
    // (e.g. the first upgrade might rely on customer_email while later ones
    // attach an existing customer). Stripe requires that idempotency keys are
    // only reused for identical payloads, so we include the customer context in
    // the key to avoid clashes once a customer record exists.
    const customerDiscriminator = existingCustomerId
      ? `customer:${existingCustomerId}`
      : typeof payload.customer_email === "string" && payload.customer_email.length > 0
        ? `email:${payload.customer_email}`
        : "no-customer";

    const idempotencyKey = `checkout:${session.user.id}:${tier}:${billingInterval}:${customerDiscriminator}`;

    logger.info("[stripe/checkout] Creating session", {
      hasCustomer: Boolean(existingCustomerId),
      tier,
      billingInterval,
      idempotencyKey
    });

    const checkoutSession = await stripe.checkout.sessions.create(payload, {
      idempotencyKey
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : undefined;
    const code = typeof err === "object" && err !== null && "code" in err ? (err as { code?: string }).code : undefined;

    logger.error("[stripe/checkout] Failed to create session", {
      message,
      code
    });

    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
