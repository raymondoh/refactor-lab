// src/lib/services/review-service.ts
import { getAdminCollection, COLLECTIONS } from "@/lib/firebase/admin";
import type { Review, CreateReviewData } from "@/lib/types/review";
import { notificationService } from "@/lib/services/notification-service";
import { emailService } from "@/lib/email/email-service";
import { userService } from "@/lib/services/user-service";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "@/lib/logger";

export class ReviewService {
  private static instance: ReviewService | null = null;

  static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  async createReview(data: CreateReviewData): Promise<Review> {
    const createdAt = new Date();

    // Persist shape (what goes into Firestore)
    const reviewData: Omit<Review, "id"> = {
      ...data,
      createdAt
    };

    const collection = getAdminCollection(COLLECTIONS.REVIEWS);
    const docRef = await collection.add(reviewData);

    // Domain object we return to callers
    const review: Review = {
      id: docRef.id,
      ...reviewData
    };

    // --- Side-effects: notification + email ---
    // We log failures but don't block review creation.

    // 1) In-app notification for tradesperson
    try {
      await notificationService.createNotification(
        data.tradespersonId,
        "review_left",
        "A new review was left on your profile",
        { reviewId: docRef.id, jobId: data.jobId }
      );
    } catch (error) {
      logger.error("[ReviewService] Failed to create 'review_left' notification", {
        error,
        tradespersonId: data.tradespersonId,
        reviewId: docRef.id
      });
    }

    // 2) Email the tradesperson about the new review
    try {
      const tradesperson = await userService.getUserById(data.tradespersonId);

      if (tradesperson?.email) {
        const profileSlug =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (tradesperson as any).slug ?? tradesperson.id;

        const recipientName = (tradesperson.name ?? "").trim() || undefined;

        await emailService.sendReviewLeftEmail(tradesperson.email, profileSlug, recipientName);
      }
    } catch (error) {
      logger.error("[ReviewService] Failed to send 'review left' email", {
        error,
        tradespersonId: data.tradespersonId,
        reviewId: docRef.id
      });
    }

    return review;
  }

  async getReviewsByTradespersonId(tradespersonId: string): Promise<Review[]> {
    const snapshot = await getAdminCollection(COLLECTIONS.REVIEWS)
      .where("tradespersonId", "==", tradespersonId)
      .orderBy("createdAt", "desc")
      .get();

    const reviews: Review[] = snapshot.docs.map(doc => {
      const data = doc.data() as {
        jobId: string;
        tradespersonId: string;
        customerId: string;
        rating: number;
        comment: string;
        createdAt?: Timestamp | Date;
      };

      return {
        id: doc.id,
        jobId: data.jobId,
        tradespersonId: data.tradespersonId,
        customerId: data.customerId,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ?? new Date())
      };
    });

    // Callers that need JSON-safe data can serialize at the API boundary.
    return reviews;
  }
}

export const reviewService = ReviewService.getInstance();
