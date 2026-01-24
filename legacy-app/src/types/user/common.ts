// src/types/user/common.ts

import type { Timestamp } from "firebase-admin/firestore";
//import type { ActionResponse } from "../common";

/**
 * User roles in the system
 */
export type UserRole = "user" | "admin" | "moderator" | "editor";

/**
 * User account status
 */
export type UserStatus = "active" | "disabled" | "pending";

/**
 * User model used across server and admin
 */
export interface User {
  id: string;
  name?: string | null; // Keep for backward compatibility or potential migration
  email?: string | null;
  image?: string | null;
  picture?: string;
  photoURL?: string | null;
  username?: string;
  profileImage?: string;

  // Highlight: Add new profile fields
  firstName?: string;
  lastName?: string;
  displayName?: string; // This will now typically hold the public-facing name

  emailVerified?: boolean;
  hasPassword?: boolean;
  has2FA?: boolean;
  provider?: "email" | "google" | string;
  passwordHash?: string;

  createdAt?: Date | string | Timestamp;
  lastLoginAt?: Date | string | Timestamp;
  updatedAt?: Date | string | Timestamp;

  bio?: string;
  location?: string;
  phone?: string;
  website?: string;

  role?: UserRole;
  permissions?: string[];
  status?: UserStatus;
}

// types/user.ts

export interface SerializedUser extends Omit<User, "createdAt" | "lastLoginAt" | "updatedAt"> {
  createdAt?: string;
  lastLoginAt?: string;
  updatedAt?: string;
}

export interface PreviewUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string;
  role?: string;
  createdAt?: Date | string;
  lastLoginAt?: Date | string;
}

/**
 * Raw user document data structure in Firestore
 * Used for direct database operations
 */
export interface UserData {
  passwordHash?: string;
  name?: string; // Keep for backward compatibility if needed, or remove if displayName replaces it completely in DB
  email?: string;
  role?: UserRole;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastLoginAt?: unknown;
  emailVerified?: boolean;
  hasPassword?: boolean;
  // Highlight: Add new profile fields to UserData as well
  firstName?: string;
  lastName?: string;
  displayName?: string;
  // Add any other fields your user documents store
}
