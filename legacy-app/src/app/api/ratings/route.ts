// // src/app/api/ratings/route.ts

// import { NextResponse } from "next/server";
// import { FieldValue } from "firebase-admin/firestore"; // This import is correct for server-side FieldValue
// import * as z from "zod";

// // Define the schema for a new rating submission
// const ratingSubmissionSchema = z.object({
//   productId: z.string(),
//   userId: z.string(),
//   authorName: z.string().min(1, { message: "Author name is required." }),
//   rating: z.number().int().min(1).max(5, { message: "Rating must be between 1 and 5." })
// });

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const validatedData = ratingSubmissionSchema.safeParse(body);

//     if (!validatedData.success) {
//       console.error("Rating submission validation error:", validatedData.error.errors);
//       return NextResponse.json({ error: "Invalid rating data provided." }, { status: 400 });
//     }

//     const { productId, userId, authorName, rating } = validatedData.data;

//     // --- CORRECTED FIREBASE ADMIN DB IMPORT ---
//     const { adminDb } = await import("@/lib/firebase/admin/initialize"); // Dynamically import adminDb
//     // --- END CORRECTED IMPORT ---

//     const reviewsRef = getAdminFirestore().collection("reviews"); // Use adminDb
//     const productsRef = getAdminFirestore().collection("products"); // Use adminDb
//     const productDocRef = productsRef.doc(productId);

//     await getAdminFirestore().runTransaction(async transaction => {
//       // Use adminDb for transaction
//       const productDoc = await transaction.get(productDocRef);

//       if (!productDoc.exists) {
//         throw new Error("Product not found.");
//       }

//       const productData = productDoc.data();
//       const currentReviewCount = (productData?.reviewCount || 0) as number;
//       const currentAverageRating = (productData?.averageRating || 0) as number;

//       // 1. Add the new review document
//       const newReviewDocRef = reviewsRef.doc();
//       const newReview = {
//         // No "Omit<Review, "id">" here as the type `Review` is not defined in your snippets. You'd need to define it.
//         productId,
//         userId,
//         authorName,
//         rating,
//         reviewText: "",
//         createdAt: FieldValue.serverTimestamp() // Use serverTimestamp() for consistency and atomic updates
//       };
//       transaction.set(newReviewDocRef, newReview);

//       // 2. Calculate new average rating and total count
//       const newTotalRatingSum = currentAverageRating * currentReviewCount + rating;
//       const newReviewCount = currentReviewCount + 1;
//       const newAverageRating = newTotalRatingSum / newReviewCount;

//       // 3. Update the product document with new aggregated data
//       transaction.update(productDocRef, {
//         averageRating: newAverageRating,
//         reviewCount: newReviewCount
//       });
//     });

//     return NextResponse.json({ message: "Rating submitted successfully!" }, { status: 200 });
//   } catch (error: any) {
//     console.error("Failed to submit rating:", error);
//     return NextResponse.json(
//       { error: error.message || "An unexpected error occurred while submitting rating." },
//       { status: 500 }
//     );
//   }
// }
// src/app/api/ratings/route.ts

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore"; // This import is correct for server-side FieldValue
import * as z from "zod";

// Define the schema for a new rating submission
const ratingSubmissionSchema = z.object({
  productId: z.string(),
  userId: z.string(),
  authorName: z.string().min(1, { message: "Author name is required." }),
  rating: z.number().int().min(1).max(5, { message: "Rating must be between 1 and 5." })
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = ratingSubmissionSchema.safeParse(body);

    if (!validatedData.success) {
      console.error("Rating submission validation error:", validatedData.error.errors);
      return NextResponse.json({ error: "Invalid rating data provided." }, { status: 400 });
    }

    const { productId, userId, authorName, rating } = validatedData.data;

    // --- CORRECTED FIREBASE ADMIN DB IMPORT ---
    // Replace this:
    // const { adminDb } = await import("@/lib/firebase/admin/initialize"); // Dynamically import adminDb
    // With this:
    const { getAdminFirestore } = await import("@/lib/firebase/admin/initialize"); // Dynamically import getAdminFirestore
    // --- END CORRECTED IMPORT ---

    const reviewsRef = getAdminFirestore().collection("reviews"); // Use getAdminFirestore()
    const productsRef = getAdminFirestore().collection("products"); // Use getAdminFirestore()
    const productDocRef = productsRef.doc(productId);

    await getAdminFirestore().runTransaction(async transaction => {
      // Use getAdminFirestore()
      const productDoc = await transaction.get(productDocRef);

      if (!productDoc.exists) {
        throw new Error("Product not found.");
      }

      const productData = productDoc.data();
      const currentReviewCount = (productData?.reviewCount || 0) as number;
      const currentAverageRating = (productData?.averageRating || 0) as number;

      // 1. Add the new review document
      const newReviewDocRef = reviewsRef.doc();
      const newReview = {
        productId,
        userId,
        authorName,
        rating,
        reviewText: "",
        createdAt: FieldValue.serverTimestamp() // Use serverTimestamp() for consistency and atomic updates
      };
      transaction.set(newReviewDocRef, newReview);

      // 2. Calculate new average rating and total count
      const newTotalRatingSum = currentAverageRating * currentReviewCount + rating;
      const newReviewCount = currentReviewCount + 1;
      const newAverageRating = newTotalRatingSum / newReviewCount;

      // 3. Update the product document with new aggregated data
      transaction.update(productDocRef, {
        averageRating: newAverageRating,
        reviewCount: newReviewCount
      });
    });

    return NextResponse.json({ message: "Rating submitted successfully!" }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to submit rating:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred while submitting rating." },
      { status: 500 }
    );
  }
}
