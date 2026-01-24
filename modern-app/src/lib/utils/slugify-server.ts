// src/lib/utils/slugify-server.ts
import "server-only"; // Optional: Prevents accidental client import
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { toSlug } from "./slugify";

/**
 * Generates a unique slug for a document within a Firestore collection.
 *
 * If the initial slug exists, it appends a numeric suffix (e.g., 'my-slug-2')
 * until a unique slug is found. It intelligently truncates the base slug
 * to ensure the final slug (including the suffix) does not exceed the max length.
 *
 * @param collectionPath The path to the Firestore collection.
 * @param base The string to use as the basis for the slug.
 * @param excludeDocId (Optional) A document ID to ignore during the uniqueness check,
 * typically used when updating an existing document.
 * @returns A promise that resolves to a unique slug string.
 */
export async function toUniqueSlug(collectionPath: string, base: string, excludeDocId?: string): Promise<string> {
  const db = getFirebaseAdminDb();
  const baseSlug = toSlug(base);
  let candidate = baseSlug;
  let counter = 1;
  const maxLength = 64; // Define max length for consistency

  while (true) {
    const snapshot = await db.collection(collectionPath).where("slug", "==", candidate).limit(1).get();

    // If slug is not found, it's unique
    if (snapshot.empty) {
      return candidate;
    }

    // If found, check if it's the document we're allowed to ignore
    const conflictingDoc = snapshot.docs[0];
    if (excludeDocId && conflictingDoc.id === excludeDocId) {
      return candidate;
    }

    // If it's a true conflict, generate a new candidate and loop again
    counter += 1;
    const suffix = `-${counter}`;
    const truncatedBase = baseSlug.slice(0, maxLength - suffix.length);
    candidate = `${truncatedBase}${suffix}`;
  }
}
