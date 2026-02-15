// src/lib/services/admin-rating-service.ts
import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

import { ok, fail, type ServiceResult } from "@/lib/services/service-result";

export type UpsertReviewInput = {
  productId: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  title?: string;
  reviewId?: string; // optional deterministic id
};

function isValidRating(value: unknown): value is number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

function errMessage(error: unknown, fallback: string) {
  return isFirebaseError(error) ? firebaseError(error) : error instanceof Error ? error.message : fallback;
}

export const adminRatingService = {
  async upsertReviewAndRecomputeProductAggregates(
    input: UpsertReviewInput
  ): Promise<ServiceResult<{ productId: string }>> {
    try {
      const db = getAdminFirestore();
      const { productId, userId } = input;

      if (!productId || !userId) {
        return fail("BAD_REQUEST", "Missing productId or userId", 400);
      }

      if (!isValidRating(input.rating)) {
        return fail("BAD_REQUEST", "Invalid rating", 400);
      }

      const rating = Number(input.rating);

      const productRef = db.collection("products").doc(productId);
      const reviewDocId = input.reviewId ?? `${productId}_${userId}`;
      const reviewRef = db.collection("reviews").doc(reviewDocId);

      await db.runTransaction(async tx => {
        const productSnap = await tx.get(productRef);
        if (!productSnap.exists) throw new Error("Product not found");

        const now = FieldValue.serverTimestamp();

        const existingReviewSnap = await tx.get(reviewRef);

        tx.set(
          reviewRef,
          {
            productId,
            userId,
            rating,
            comment: input.comment ?? "",
            title: input.title ?? "",
            updatedAt: now,
            ...(existingReviewSnap.exists ? {} : { createdAt: now })
          },
          { merge: true }
        );

        const reviewsQuery = db.collection("reviews").where("productId", "==", productId);
        const reviewsSnap = await tx.get(reviewsQuery);

        let sum = 0;
        let count = 0;

        reviewsSnap.forEach(doc => {
          const r = Number((doc.data() as Record<string, unknown>).rating);
          if (!Number.isNaN(r)) {
            sum += r;
            count += 1;
          }
        });

        const avg = count > 0 ? sum / count : 0;

        tx.update(productRef, { averageRating: avg, reviewCount: count, updatedAt: now });
      });

      return ok({ productId });
    } catch (error: unknown) {
      const message = errMessage(error, "Unknown error updating rating");
      const status = message.toLowerCase().includes("product not found") ? 404 : 500;
      return fail(status === 404 ? "NOT_FOUND" : "UNKNOWN", message, status);
    }
  }
};
