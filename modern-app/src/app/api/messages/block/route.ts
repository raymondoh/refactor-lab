import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ChatsCollection } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireSession } from "@/lib/auth/require-session";
import { logger } from "@/lib/logger";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const blockSchema = z.object({
  jobId: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const parsed = blockSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const { jobId } = parsed.data;
    const chatRef = ChatsCollection().doc(jobId);
    const chatSnap = await chatRef.get();

    if (!chatSnap.exists) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const chatData = chatSnap.data() as { customerId?: string; tradespersonId?: string; blockedBy?: string[] } | undefined;
    if (!chatData || ![chatData.customerId, chatData.tradespersonId].includes(session.user.id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    await chatRef.set(
      {
        blockedBy: FieldValue.arrayUnion(session.user.id),
        blockedAt: new Date()
      },
      { merge: true }
    );

    logger.info("[messages/block] Conversation blocked", { jobId, userId: session.user.id });

    return NextResponse.json({ message: "Conversation blocked" }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error) {
    logger.error("[messages/block] Failed to block conversation", error);
    return NextResponse.json({ message: "Failed to block conversation" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
