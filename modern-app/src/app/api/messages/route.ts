// src/app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ChatsCollection } from "@/lib/firebase/admin";
import { notificationService } from "@/lib/services/notification-service";
import { emailService } from "@/lib/email/email-service";
import { userService } from "@/lib/services/user-service";
import { requireSession } from "@/lib/auth/require-session";
import { standardRateLimiter } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

// Define a local payload type for clarity
interface MessagePayload {
  text: string;
  attachments?: unknown[];
  senderId: string;
  receiverId: string;
  createdAt: Date;
  readBy: string[];
  imageUrl?: string;
}
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const messageSchema = z
  .object({
    jobId: z.string().min(1),
    text: z.string().trim().optional(),
    attachments: z.array(z.string().url()).max(5).optional(),
    imageUrl: z.string().url().optional()
  })
  .refine(data => Boolean(data.text?.trim()) || (data.attachments && data.attachments.length > 0) || data.imageUrl, {
    message: "A message or attachment is required"
  });

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await standardRateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429, headers: NO_STORE_HEADERS });
  }

  logger.info("--- [API] New Message Request Received ---");

  try {
    const session = await requireSession();

    const parsed = messageSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: parsed.error.issues },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { jobId, text = "", attachments = [], imageUrl } = parsed.data;
    const senderId = session.user.id;
    logger.info("[API] Message request received", { senderId, jobId });

    const chatRef = ChatsCollection().doc(jobId);
    const chatSnap = await chatRef.get();

    type ChatDoc = { customerId: string; tradespersonId: string };
    const chatData = chatSnap.data() as (Partial<ChatDoc> & { blockedBy?: string[] }) | undefined;

    if (!chatSnap.exists || !chatData?.customerId || !chatData?.tradespersonId) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    if (Array.isArray(chatData.blockedBy) && chatData.blockedBy.length > 0) {
      return NextResponse.json(
        { message: "This conversation has been blocked" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const { customerId, tradespersonId } = chatData as ChatDoc;

    if (senderId !== customerId && senderId !== tradespersonId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const receiverId = senderId === customerId ? tradespersonId : customerId;
    logger.info(`[API] Calculated Receiver: ${receiverId}`);

    // ✅ Build payload without using `any` and only add optional fields when present
    const messagePayload: MessagePayload = {
      text,
      senderId,
      receiverId,
      createdAt: new Date(),
      readBy: [senderId]
    };

    if (attachments && attachments.length > 0) {
      messagePayload.attachments = attachments;
    }

    if (imageUrl) {
      messagePayload.imageUrl = imageUrl;
    }

    const msgRef = await chatRef.collection("messages").add(messagePayload);

    await notificationService.createNotification(receiverId, "new_message", "You have a new message", {
      jobId,
      messageId: msgRef.id
    });

    const receiver = await userService.getUserById(receiverId);
    if (receiver?.email) {
      await emailService.sendNewMessageEmail(receiver.email, jobId, text, session.user.name || "A user");
      logger.info("[API] Notification email enqueued", { receiverId, jobId });
    }

    logger.info("[API] Message stored successfully", {
      jobId,
      messageId: msgRef.id
    });

    return NextResponse.json({ message: "Message sent", id: msgRef.id }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (err: unknown) {
    logger.error("[API] Error sending message", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      { message: "Failed to send message", error: message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
