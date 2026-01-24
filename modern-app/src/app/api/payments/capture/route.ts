// src/app/api/payments/capture/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/require-session";
import { JobsCollection } from "@/lib/firebase/admin";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  type: z.enum(["deposit", "final"])
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(); // throws if unauthenticated
    const { jobId, type } = bodySchema.parse(await request.json());

    // Load job and authorize
    const jobSnap = await JobsCollection().doc(jobId).get();
    if (!jobSnap.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobSnap.data() as {
      customerId: string;
      depositPaymentIntentId?: string | null;
      finalPaymentIntentId?: string | null;
    };

    const isOwner = job.customerId === session.user.id;
    const isAdmin = session.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Resolve the PI id from Firestore (authoritative)
    const field = type === "final" ? "finalPaymentIntentId" : "depositPaymentIntentId";
    const paymentIntentId = job[field];

    if (!paymentIntentId) {
      return NextResponse.json({ error: `No ${type} PaymentIntent on this job` }, { status: 400 });
    }

    // Capture
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

    // NOTE: We rely on the webhook (payment_intent.succeeded) to set depositPaidAt/finalPaidAt.

    return NextResponse.json({ paymentIntent });
  } catch (err: unknown) {
    logger.error("[payments/capture] Capture error", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    return NextResponse.json({ error: "Capture failed" }, { status: 500 });
  }
}
