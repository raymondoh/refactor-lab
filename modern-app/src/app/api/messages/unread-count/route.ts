// src/app/api/messages/unread-count/route.ts
import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { getFirebaseAdminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const chatsRef = getFirebaseAdminDb().collection(COLLECTIONS.CHATS);

    // Create two separate queries for chats where the user is either the customer or the tradesperson
    const customerChatsQuery = chatsRef.where("customerId", "==", userId);
    const tradespersonChatsQuery = chatsRef.where("tradespersonId", "==", userId);

    const [customerChatsSnapshot, tradespersonChatsSnapshot] = await Promise.all([
      customerChatsQuery.get(),
      tradespersonChatsQuery.get()
    ]);

    const allChatDocs = [...customerChatsSnapshot.docs, ...tradespersonChatsSnapshot.docs];

    if (allChatDocs.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    // For each chat, create a promise that counts unread messages
    const unreadCountPromises = allChatDocs.map(doc => {
      return doc.ref
        .collection("messages")
        .where("receiverId", "==", userId)
        .get()
        .then(messagesSnapshot => {
          let count = 0;
          messagesSnapshot.forEach(msgDoc => {
            const msgData = msgDoc.data();
            // A message is unread if the user's ID is not in the 'readBy' array
            if (!msgData.readBy || !msgData.readBy.includes(userId)) {
              count++;
            }
          });
          return count;
        });
    });

    const counts = await Promise.all(unreadCountPromises);
    const totalUnread = counts.reduce((sum, count) => sum + count, 0);

    return NextResponse.json({ count: totalUnread });
  } catch (err: unknown) {
    logger.error("[messages/unread-count] Error fetching unread message count", err);
    return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 });
  }
}
