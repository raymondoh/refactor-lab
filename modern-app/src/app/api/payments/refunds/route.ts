// src/app/api/payments/refunds/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/require-session";
import { isAdmin } from "@/lib/auth/roles";
import { logger } from "@/lib/logger";

const refundSchema = z.object({
  paymentIntentId: z.string().min(1, "paymentIntentId is required")
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication: Ensure the user is logged in.
    const session = await requireSession();

    // 2. Authorization: Ensure the user is an admin.
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { paymentIntentId } = refundSchema.parse(await request.json());

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId
    });

    return NextResponse.json({ refund });
  } catch (err: unknown) {
    logger.error("Refund error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}
