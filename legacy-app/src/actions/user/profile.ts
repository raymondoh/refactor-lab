// src/actions/user/profile.ts
"use server";

// ================= Imports =================
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { serverTimestamp } from "@/utils/date-server";
import { profileUpdateSchema } from "@/schemas/user";
import { logActivity } from "@/firebase/actions";
import { firebaseError, isFirebaseError } from "@/utils/firebase-error";
import { logger } from "@/utils/logger";
import { serializeUser } from "@/utils/serializeUser";
import { getUserImage } from "@/utils/get-user-image";

import type { GetProfileResponse, UpdateUserProfileResponse } from "@/types/user/profile";
import type { User } from "@/types/user";

// ================= User Profile Actions =================

/**
 * Get the current user's profile
 */
export async function getProfile(): Promise<GetProfileResponse> {
  // Highlight: Log start of getProfile action
  console.log("[Action] getProfile: START");
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    console.log("[Action] getProfile: Session user from auth():", session?.user); // Highlight

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();

    const [authUser, userDoc] = await Promise.all([
      adminAuth.getUser(session.user.id),
      db.collection("users").doc(session.user.id).get()
    ]);

    const userData = userDoc.data();
    if (!userData) {
      logger({
        type: "warn",
        message: `User Firestore document not found for userId: ${session.user.id}`,
        context: "user-profile"
      });
      return { success: false, error: "User data not found" };
    }

    const rawUser: User = {
      id: authUser.uid,
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      displayName: authUser.displayName || userData.displayName || userData.name || "",
      email: authUser.email,
      bio: userData.bio || "",
      role: userData.role || "user",
      ...userData
    };

    rawUser.image = getUserImage({ ...rawUser, photoURL: authUser.photoURL });

    console.log("[Action] getProfile: Raw user data before serialization:", rawUser); // Highlight
    return {
      success: true,
      user: serializeUser(rawUser)
    };
  } catch (error) {
    const message = isFirebaseError(error) ? firebaseError(error) : "Failed to get profile";
    logger({
      type: "error",
      message: "Error in getProfile",
      metadata: { error: message },
      context: "user-profile"
    });
    console.error("[Action] getProfile: Error details:", error); // Highlight
    return { success: false, error: message };
  } finally {
    console.log("[Action] getProfile: END"); // Highlight
  }
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(_: unknown, formData: FormData): Promise<UpdateUserProfileResponse> {
  // Highlight: Log start of updateUserProfile action
  console.log("[Action] updateUserProfile: START");
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    console.log("[Action] updateUserProfile: Session user from auth():", session?.user); // Highlight

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const displayName = formData.get("displayName") as string;
    const bio = formData.get("bio") as string;
    const imageUrl = formData.get("imageUrl") as string | null;

    console.log("[Action] updateUserProfile: Received formData:", {
      // Highlight
      firstName,
      lastName,
      displayName,
      bio,
      imageUrl
    });

    const result = profileUpdateSchema.safeParse({ firstName, lastName, displayName: displayName || undefined, bio });
    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message || "Invalid form data";
      logger({
        type: "warn",
        message: "Profile update validation failed",
        metadata: { error: errorMessage, issues: result.error.issues },
        context: "user-profile"
      });
      console.error("[Action] updateUserProfile: Validation errors:", result.error.issues); // Highlight
      return { success: false, error: errorMessage };
    }

    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();

    const authUpdate: { displayName?: string; photoURL?: string } = {};
    if (displayName) authUpdate.displayName = displayName;
    if (imageUrl) authUpdate.photoURL = imageUrl;

    if (Object.keys(authUpdate).length > 0) {
      try {
        await adminAuth.updateUser(session.user.id, authUpdate);
        console.log("[Action] updateUserProfile: Firebase Auth updated."); // Highlight
      } catch (error) {
        const message = isFirebaseError(error) ? firebaseError(error) : "Failed to update auth profile";
        logger({
          type: "error",
          message: "Error updating Firebase Auth profile",
          metadata: { error: message },
          context: "user-profile"
        });
        console.error("[Action] updateUserProfile: Firebase Auth update error:", error); // Highlight
        return { success: false, error: message };
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (displayName !== undefined && displayName !== "") {
      updateData.displayName = displayName;
    }
    if (bio !== undefined) updateData.bio = bio;
    if (imageUrl) updateData.picture = imageUrl;

    console.log("[Action] updateUserProfile: Firestore updateData:", updateData); // Highlight
    await db.collection("users").doc(session.user.id).update(updateData);
    console.log("[Action] updateUserProfile: Firestore user document updated."); // Highlight

    await logActivity({
      userId: session.user.id,
      type: "profile_update",
      description: "Profile updated",
      status: "success"
    });

    logger({
      type: "info",
      message: "Profile updated successfully",
      metadata: { userId: session.user.id },
      context: "user-profile"
    });

    return { success: true };
  } catch (error) {
    const message = isFirebaseError(error) ? firebaseError(error) : "Failed to update profile";
    logger({
      type: "error",
      message: "Error updating user profile",
      metadata: { error: message },
      context: "user-profile"
    });
    console.error("[Action] updateUserProfile: Error details:", error); // Highlight
    return { success: false, error: message };
  } finally {
    console.log("[Action] updateUserProfile: END"); // Highlight
  }
}
