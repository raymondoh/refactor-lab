// src/app/api/report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ChatsCollection } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/auth/require-session";
import { logger } from "@/lib/logger";
import { emailService } from "@/lib/email/email-service";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const reportSchema = z.object({
  jobId: z.string().min(1),
  reason: z.string().trim().min(5, "Reason is required"),
  messageId: z.string().trim().optional()
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const parsed = reportSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const { jobId, reason, messageId } = parsed.data;
    const userId = session.user.id;

    const chatRef = ChatsCollection().doc(jobId);
    const chatSnap = await chatRef.get();

    const chatData = chatSnap.data() as { customerId?: string; tradespersonId?: string } | undefined;

    if (!chatSnap.exists || !chatData || ![chatData.customerId, chatData.tradespersonId].includes(userId)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const reportRef = await chatRef.collection("reports").add({
      reportedBy: userId,
      reason,
      messageId: messageId || null,
      createdAt: new Date(),
      status: "open" as const
    });

    // ✅ NEW: Send Email Alert to Admin
    await emailService.sendAdminReportEmail({
      reporterId: userId,
      jobId,
      reason,
      reportId: reportRef.id
    });

    logger.info("[messages/report] Report filed", {
      jobId,
      userId,
      messageId,
      reportId: reportRef.id
    });

    return NextResponse.json({ message: "Report submitted" }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    logger.error("[messages/report] Failed to submit report", error);
    return NextResponse.json({ message: "Failed to submit report" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
