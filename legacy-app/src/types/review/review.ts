// src/types/review/review.ts

import { Timestamp } from "firebase/firestore";

export interface Review {
  id?: string; // Optional: Firestore document ID can be used as a property
  productId: string;
  userId: string;
  authorName: string;
  rating: number; // Will be a number between 1 and 5
  reviewText?: string; // Optional: For Phase 1, this will be empty or not present
  createdAt: Timestamp; // Using Firestore Timestamp type
}
