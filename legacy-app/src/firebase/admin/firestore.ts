// src/firebase/admin/firestore.ts

import "server-only";

import { FieldValue } from "firebase-admin/firestore";

// ====== Firestore Field Operations ======

/**
 * Get the Firestore server timestamp
 */
export const serverTimestamp = () => FieldValue.serverTimestamp();

// Remove all the unused functions:
// - increment (not used)
// - dateToTimestamp (not used)
// - timestampToDate (not used)
// - timestampToISOString (not used)
// - createBatch (not used)
// - getDocRef (not used)
// - getCollectionRef (not used)
