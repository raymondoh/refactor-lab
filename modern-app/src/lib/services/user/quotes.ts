// src/lib/services/user/quotes.ts
// This module is now responsible for all business logic related to tradesperson quote limits.
import { UsersCollection } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserById } from "./actions";
import { logger } from "@/lib/logger";

export async function canUserSubmitQuote(userId: string): Promise<{ canSubmit: boolean; reason?: string }> {
  try {
    const user = await getUserById(userId);
    if (!user) return { canSubmit: false, reason: "User not found" };

    if (user.subscriptionTier === "pro" || user.subscriptionTier === "business") {
      return { canSubmit: true };
    }

    const now = new Date();
    const resetDate = user.quoteResetDate ? new Date(user.quoteResetDate) : null;

    if (resetDate && now >= resetDate) {
      await resetMonthlyQuotes(userId);
      return { canSubmit: true };
    }

    const monthlyLimit = 5;
    if ((user.monthlyQuotesUsed ?? 0) >= monthlyLimit) {
      return {
        canSubmit: false,
        reason: `Monthly quote limit of ${monthlyLimit} reached. Upgrade to premium for unlimited quotes.`
      };
    }

    return { canSubmit: true };
  } catch (error) {
    logger.error("UserService: canUserSubmitQuote error:", error);
    return { canSubmit: false, reason: "Error checking quote limits" };
  }
}

export async function incrementQuoteCount(userId: string): Promise<void> {
  try {
    const usersCollection = UsersCollection();
    await usersCollection.doc(userId).update({
      monthlyQuotesUsed: FieldValue.increment(1),
      updatedAt: new Date()
    });
  } catch (error) {
    logger.error("UserService: incrementQuoteCount error:", error);
    throw new Error("Failed to increment quote count");
  }
}

export async function resetMonthlyQuotes(userId: string): Promise<void> {
  try {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);

    const usersCollection = UsersCollection();
    await usersCollection.doc(userId).update({
      monthlyQuotesUsed: 0,
      quoteResetDate: nextMonth,
      updatedAt: new Date()
    });
  } catch (error) {
    logger.error("UserService: resetMonthlyQuotes error:", error);
    throw new Error("Failed to reset monthly quotes");
  }
}
