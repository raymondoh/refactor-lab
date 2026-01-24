// src/lib/firebase/collections.ts
import { collection, type CollectionReference, type DocumentData } from "firebase/firestore";
import { getFirebaseDb } from "./client";

// Ensure we only get the Firestore instance once
const db = getFirebaseDb();
if (!db) throw new Error("Firestore has not been initialized");

// Collection names (centralized)
export const COLLECTIONS = {
  USERS: "users",
  ACTIVITY_LOGS: "activity_logs",
  SESSIONS: "sessions",
  SERVICES: "services"
} as const;

// Generic helper to get a collection reference
export const getCollection = (name: keyof typeof COLLECTIONS): CollectionReference<DocumentData> => {
  return collection(db, COLLECTIONS[name]);
};

// Predefined collection accessors (optional, for convenience)
export const UsersCollection = () => getCollection("USERS");
export const ActivityLogsCollection = () => getCollection("ACTIVITY_LOGS");
export const SessionsCollection = () => getCollection("SESSIONS");
export const ServicesCollection = () => getCollection("SERVICES");
