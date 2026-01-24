// src/app/api/payments/checkout/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import { stripe } from "@/lib/stripe/server";
import { JobsCollection } from "@/lib/firebase/admin";
import { userService } from "@/lib/services/user-service";
import { logger } from "@/lib/logger";
import { getApiBaseUrl } from "@/lib/url";
import { platformFee } from "@/lib/payments/fee";
import type { Tier } from "@/lib/subscription/tier";

const bodySchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  quoteId: z.string().min(1, "quoteId is required"),
  paymentType: z.enum(["deposit", "final"]).default("deposit")
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(); // ensures auth

    // Only customers (or admins) should initiate customer→TP payments
    if (!["customer", "admin"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { jobId, quoteId, paymentType } = bodySchema.parse(await request.json());

    // Load job & verify ownership (unless admin)
    const jobRef = JobsCollection().doc(jobId);
    const jobSnap = await jobRef.get();
    if (!jobSnap.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobSnap.data() as {
      customerId: string;
      title?: string;
      customerContact?: { email?: string };
    };

    const isOwner = session.user.role === "admin" || job.customerId === session.user.id;
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Load quote and derive authoritative amount
    const quoteRef = jobRef.collection("quotes").doc(quoteId);
    const quoteSnap = await quoteRef.get();
    if (!quoteSnap.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const quote = quoteSnap.data() as {
      price?: number;
      depositAmount?: number;
      status?: "pending" | "accepted" | "rejected" | "withdrawn";
      tradespersonId: string;
    };

    if (!quote.price || quote.price <= 0) {
      return NextResponse.json({ error: "Invalid quote amount" }, { status: 400 });
    }

    if (quote.status && !["pending", "accepted"].includes(quote.status)) {
      return NextResponse.json({ error: "Quote is not available for payment" }, { status: 400 });
    }

    // --- START OF DETAILED LOGGING ---
    logger.info("[PAYMENT CHECKOUT] Initiated", { jobId, paymentType });

    // Tradesperson must be onboarded to Connect
    const tp = await userService.getUserById(quote.tradespersonId);
    logger.info("[PAYMENT CHECKOUT] 1. Fetched tradesperson data from Firestore", {
      id: tp?.id,
      email: tp?.email,
      stripeConnectAccountId: tp?.stripeConnectAccountId
    });

    if (!tp?.stripeConnectAccountId) {
      logger.error("[PAYMENT CHECKOUT] ❌ FAILED: Tradesperson has no Stripe Account ID in Firestore.");
      return NextResponse.json({ error: "Tradesperson is not onboarded for payouts yet" }, { status: 409 });
    }

    logger.info(`[PAYMENT CHECKOUT] 2. Retrieving Stripe Account ID: ${tp.stripeConnectAccountId}`);
    const stripeAccount = await stripe.accounts.retrieve(tp.stripeConnectAccountId);

    // ✅ SANITIZED: Only log status flags, never PII
    logger.info("[PAYMENT CHECKOUT] 3. Stripe Account Status:", {
      id: stripeAccount.id,
      charges_enabled: stripeAccount.charges_enabled,
      payouts_enabled: stripeAccount.payouts_enabled,
      details_submitted: stripeAccount.details_submitted
    });

    if (!stripeAccount || !stripeAccount.charges_enabled) {
      logger.error(
        `[PAYMENT CHECKOUT] ❌ PAYMENT BLOCKED: Charges are not enabled. charges_enabled=${stripeAccount?.charges_enabled}, details_submitted=${stripeAccount?.details_submitted}`
      );
      return NextResponse.json({ error: "Tradesperson is not onboarded for payments yet." }, { status: 409 });
    }

    logger.info("[PAYMENT CHECKOUT] Stripe account verified", {
      jobId,
      stripeAccountId: tp.stripeConnectAccountId
    });
    // --- END OF DETAILED LOGGING ---

    const depositAmount = quote.depositAmount ?? 0;
    const isDeposit = paymentType === "deposit";
    const paymentAmount = isDeposit ? depositAmount : quote.price - depositAmount;

    if (paymentAmount <= 0) {
      const message = isDeposit ? "No deposit is due for this job" : "No remaining balance for this job";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const amount = Math.round(paymentAmount * 100); // GBP -> pence
    const paymentLabel = isDeposit ? "Deposit" : "Final Balance";
    // Normalise subscriptionTier to a valid Tier ("basic" | "pro" | "business")
    const tpTier: Tier =
      tp?.subscriptionTier === "pro" || tp?.subscriptionTier === "business" ? tp.subscriptionTier : "basic";

    const fee = platformFee(amount, tpTier);

    logger.info("[PAYMENT CHECKOUT] Platform fee debug", {
      amount,
      tier: tp?.subscriptionTier ?? "unknown",
      fee
    });
    // URLs for Checkout redirect
    const appUrl = getApiBaseUrl(request);
    const successUrl = `${appUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/dashboard/customer/jobs/${jobId}?payment_canceled=true`;

    const sessionCheckout = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: job.customerContact?.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${job.title || "Job payment"} (${paymentLabel})`
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      payment_intent_data: {
        //capture_method: mode === "authorize" ? "manual" : "automatic",
        capture_method: "automatic",
        transfer_data: { destination: tp.stripeConnectAccountId },
        application_fee_amount: fee,

        metadata: {
          jobId,
          quoteId,
          tradespersonId: quote.tradespersonId,
          customerId: job.customerId,
          paymentType
        }
      },
      metadata: { jobId, quoteId, paymentType }
    });

    await quoteRef.set(
      {
        checkoutSessionId: sessionCheckout.id,
        checkoutStatus: "created",
        updatedAt: new Date()
      },
      { merge: true }
    );

    return NextResponse.json({ url: sessionCheckout.url, sessionId: sessionCheckout.id }, { status: 201 });
  } catch (err: unknown) {
    logger.error("[PAYMENT CHECKOUT] Checkout error", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
