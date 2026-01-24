// src/utils/serializeUser.ts
import type { User, SerializedUser } from "@/types/user";
import { parseServerDate } from "./date-server";

export function serializeUser(user: User): SerializedUser {
  return {
    ...user,
    image: user.image || user.picture || user.photoURL || user.profileImage || null,
    createdAt: parseServerDate(user.createdAt)?.toISOString(),
    updatedAt: parseServerDate(user.updatedAt)?.toISOString(),
    lastLoginAt: parseServerDate(user.lastLoginAt)?.toISOString()
  };
}

export function serializeUserArray(users: User[]): SerializedUser[] {
  return users.map(serializeUser);
}
