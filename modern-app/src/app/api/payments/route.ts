// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/require-session";
import { logger } from "@/lib/logger";

const paymentSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  // Add metadata validation
  metadata: z.object({
    jobId: z.string(),
    quoteId: z.string(),
    paymentType: z.enum(["deposit", "final"])
  })
});

export async function POST(req: NextRequest) {
  try {
    // Authentication: Ensure the user is logged in before creating a payment intent.
    await requireSession();

    const body = await req.json();
    const { amount, currency, metadata } = paymentSchema.parse(body);

    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata // Pass this to Stripe
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err: unknown) {
    logger.error("Error creating payment intent:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }
}
