// src/lib/services/user/favorites.ts
// This module cleanly separates all logic related to managing a user's favorite tradespeople.
import { UsersCollection } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { User } from "@/lib/types/user";
import { mapToUser } from "./utils";
import { logger } from "@/lib/logger";

export async function addFavoriteTradesperson(userId: string, tradespersonId: string): Promise<void> {
  try {
    const usersCollection = UsersCollection();
    await usersCollection.doc(userId).update({
      favoriteTradespeople: FieldValue.arrayUnion(tradespersonId),
      updatedAt: new Date()
    });
  } catch (error) {
    logger.error("UserService: addFavoriteTradesperson error:", error);
    throw new Error("Failed to add favorite tradesperson");
  }
}

export async function removeFavoriteTradesperson(userId: string, tradespersonId: string): Promise<void> {
  try {
    const usersCollection = UsersCollection();
    await usersCollection.doc(userId).update({
      favoriteTradespeople: FieldValue.arrayRemove(tradespersonId),
      updatedAt: new Date()
    });
  } catch (error) {
    logger.error("UserService: removeFavoriteTradesperson error:", error);
    throw new Error("Failed to remove favorite tradesperson");
  }
}

export async function getFavoriteTradespeople(userId: string): Promise<User[]> {
  try {
    const usersCollection = UsersCollection();
    const userDoc = await usersCollection.doc(userId).get();
    const data = userDoc.data() as { favoriteTradespeople?: string[] } | undefined;
    const favoriteIds: string[] = data?.favoriteTradespeople || [];
    if (favoriteIds.length === 0) return [];

    const users = await Promise.all(favoriteIds.map(id => usersCollection.doc(id).get()));
    const favorites: User[] = users
      .filter(doc => doc.exists)
      .map(doc => mapToUser(doc.id, doc.data()! as Record<string, unknown>));

    return favorites;
  } catch (error) {
    logger.error("UserService: getFavoriteTradespeople error:", error);
    return [];
  }
}
