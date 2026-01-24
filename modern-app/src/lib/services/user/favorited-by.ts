// src/lib/services/user/favorited-by.ts
import { UsersCollection } from "@/lib/firebase/admin";
import { mapToUser } from "./utils";
import type { User } from "@/lib/types/user";
import { logger } from "@/lib/logger";

export async function getCustomersWhoFavorited(tradespersonId: string): Promise<User[]> {
  try {
    const snapshot = await UsersCollection().where("favoriteTradespeople", "array-contains", tradespersonId).get();

    if (snapshot.empty) {
      return [];
    }

    // mapToUser ALREADY cleans timestamps & nested fields
    const users: User[] = snapshot.docs.map(doc => mapToUser(doc.id, doc.data() as Record<string, unknown>));

    return users;
  } catch (error) {
    logger.error("Error fetching users who favorited:", error);
    throw new Error("Could not retrieve list of customers.");
  }
}
