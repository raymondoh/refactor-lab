// src/app/api/report/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ChatsCollection } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/auth/require-session";
import { logger } from "@/lib/logger";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const resolveSchema = z.object({
  jobId: z.string().min(1),
  reportId: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    if (session.user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const parsed = resolveSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.flatten() },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { jobId, reportId } = parsed.data;

    const chatRef = ChatsCollection().doc(jobId);
    const reportRef = chatRef.collection("reports").doc(reportId);

    const reportSnap = await reportRef.get();
    if (!reportSnap.exists) {
      return NextResponse.json({ message: "Report not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    await reportRef.update({
      status: "resolved",
      resolvedAt: new Date(),
      resolvedBy: session.user.id
    });

    logger.info("[reports/resolve] Report resolved", { jobId, reportId, adminId: session.user.id });

    return NextResponse.json({ message: "Report resolved" }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error) {
    logger.error("[reports/resolve] Failed to resolve report", error);
    return NextResponse.json({ message: "Failed to resolve report" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
