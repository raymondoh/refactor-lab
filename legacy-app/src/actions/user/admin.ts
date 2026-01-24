"use server";

// ================= Imports =================
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { serverTimestamp } from "@/utils/date-server";
import { createUserInFirebase } from "@/firebase/admin/auth";
import { logActivity } from "@/firebase/actions";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { revalidatePath } from "next/cache";
import { serializeUser } from "@/utils/serializeUser";
import { getUserImage } from "@/utils/get-user-image";
import { logger } from "@/utils/logger";

import type { CreateUserInput, CreateUserResponse, FetchUsersResponse, UpdateUserResponse } from "@/types/user";
import type { User, SerializedUser } from "@/types/user/common";

// ================= Admin User Actions =================

/**
 * Create a new user (admin only)
 */
export async function createUser({ email, password, name, role }: CreateUserInput): Promise<CreateUserResponse> {
  // Dynamic import to avoid build-time initialization
  const { auth } = await import("@/auth");
  const session = await auth();

  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const result = await createUserInFirebase({
      email,
      password,
      displayName: name,
      createdBy: session.user.id,
      role
    });

    if (!result.success) {
      return { success: false, error: result.error || "Failed to create user" };
    }

    // Fix: Check that result.data exists and access uid safely
    if (!result.data?.uid) {
      return { success: false, error: "Failed to get user ID from created user" };
    }

    await logActivity({
      userId: session.user.id,
      type: "admin-action",
      description: `Created a new user (${email})`,
      status: "success",
      metadata: {
        createdUserId: result.data.uid,
        createdUserEmail: email,
        createdUserRole: role || "user"
      }
    });

    revalidatePath("/admin/users");

    return { success: true, userId: result.data.uid };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error";

    logger({
      type: "error",
      message: "Error in createUser",
      metadata: { error: message },
      context: "admin-users"
    });

    return { success: false, error: message };
  }
}

/**
 * Fetch users (admin only)
 */
export async function fetchUsers(limit = 10, offset = 0): Promise<FetchUsersResponse> {
  // Dynamic import to avoid build-time initialization
  const { auth } = await import("@/auth");
  const session = await auth();

  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const db = getAdminFirestore();
    const adminData = (await db.collection("users").doc(session.user.id).get()).data();
    if (!adminData || adminData.role !== "admin") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const usersQuery = db.collection("users").limit(limit).offset(offset);
    const usersSnapshot = await usersQuery.get();
    const totalSnapshot = await db.collection("users").count().get();
    const total = totalSnapshot.data().count;

    const users: SerializedUser[] = usersSnapshot.docs.map(doc => {
      const data = doc.data() as Partial<User>;
      const rawUser: User = {
        id: doc.id,
        name: data.name ?? "",
        email: data.email ?? "",
        role: data.role ?? "user",
        emailVerified: data.emailVerified ?? false,
        status: data.status ?? "active",
        image: getUserImage(data),
        createdAt: data.createdAt,
        lastLoginAt: data.lastLoginAt,
        updatedAt: data.updatedAt
      };
      return serializeUser(rawUser);
    });

    return { success: true, users, total };
  } catch (error) {
    const message = isFirebaseError(error) ? firebaseError(error) : "Failed to fetch users";
    logger({
      type: "error",
      message: "Error in fetchUsers",
      metadata: { error: message },
      context: "admin-users"
    });
    return { success: false, error: message };
  }
}

/**
 * Update user fields (admin only)
 */
export async function updateUser(userId: string, userData: Partial<User>): Promise<UpdateUserResponse> {
  // Dynamic import to avoid build-time initialization
  const { auth } = await import("@/auth");
  const session = await auth();

  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const db = getAdminFirestore();
    const adminData = (await db.collection("users").doc(session.user.id).get()).data();
    if (!adminData || adminData.role !== "admin") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const updateData = { ...userData, updatedAt: serverTimestamp() };
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    await db.collection("users").doc(userId).update(updateData);
    revalidatePath("/admin/users");

    logger({
      type: "info",
      message: `Updated user ${userId}`,
      context: "admin-users"
    });

    return { success: true };
  } catch (error) {
    const message = isFirebaseError(error) ? firebaseError(error) : "Failed to update user";
    logger({
      type: "error",
      message: "Error in updateUser",
      metadata: { error: message },
      context: "admin-users"
    });
    return { success: false, error: message };
  }
}
