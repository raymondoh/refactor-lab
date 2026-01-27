// src/actions/user/profile.ts
"use server";

// ================= Imports =================
import { serverTimestamp } from "@/utils/date-server";
import { profileUpdateSchema } from "@/schemas/user";
import { logActivity } from "@/firebase/actions";
import { firebaseError, isFirebaseError } from "@/utils/firebase-error";
import { logger } from "@/utils/logger";
import { serializeUser } from "@/utils/serializeUser";
import { getUserImage } from "@/utils/get-user-image";
import { userProfileService } from "@/lib/services/user-profile-service";

import type { GetProfileResponse, UpdateUserProfileResponse } from "@/types/user/profile";
import type { User } from "@/types/user";

// ================= User Profile Actions =================

/**
 * Get the current user's profile
 */
export async function getProfile(): Promise<GetProfileResponse> {
  console.log("[Action] getProfile: START");

  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    console.log("[Action] getProfile: Session user from auth():", session?.user);

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // ✅ Service owns Firestore read
    const profileResult = await userProfileService.getMyProfile();

    if (!profileResult.success) {
      logger({
        type: "warn",
        message: "Failed to fetch user profile via service",
        metadata: { error: profileResult.error },
        context: "user-profile"
      });

      return { success: false, error: profileResult.error };
    }

    // 🔸 Support both shapes: { user } or { data: { user } }
    const serviceUser =
      // @ts-expect-error - allow legacy/transition shapes
      profileResult.data?.user ?? profileResult.user ?? null;

    if (!serviceUser) {
      return { success: false, error: "User data not found" };
    }

    // If your service returns a SerializedUser already, you can skip re-serializing here.
    // But since the action previously serialized, keep it consistent:
    const rawUser = serviceUser as User;

    // Ensure image is normalized
    rawUser.image = getUserImage(rawUser);

    console.log("[Action] getProfile: Raw user data before serialization:", rawUser);

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

    console.error("[Action] getProfile: Error details:", error);
    return { success: false, error: message };
  } finally {
    console.log("[Action] getProfile: END");
  }
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(_: unknown, formData: FormData): Promise<UpdateUserProfileResponse> {
  console.log("[Action] updateUserProfile: START");

  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    console.log("[Action] updateUserProfile: Session user from auth():", session?.user);

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const displayName = formData.get("displayName") as string;
    const bio = formData.get("bio") as string;
    const imageUrl = formData.get("imageUrl") as string | null;

    console.log("[Action] updateUserProfile: Received formData:", {
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

      console.error("[Action] updateUserProfile: Validation errors:", result.error.issues);
      return { success: false, error: errorMessage };
    }

    // ✅ 1) Update Firebase Auth profile via service (no admin auth usage here)
    const authUpdate: { displayName?: string; photoURL?: string } = {};
    if (displayName) authUpdate.displayName = displayName;
    if (imageUrl) authUpdate.photoURL = imageUrl;

    if (Object.keys(authUpdate).length > 0) {
      const authResult = await userProfileService.updateMyAuthProfile(authUpdate);
      if (!authResult.success) {
        logger({
          type: "error",
          message: "Failed to update Auth profile via service",
          metadata: { error: authResult.error },
          context: "user-profile"
        });
        return { success: false, error: authResult.error };
      }
    }

    // ✅ 2) Update Firestore profile via service (no direct collection("users") here)
    const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (displayName !== undefined && displayName !== "") updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (imageUrl) updateData.picture = imageUrl;

    console.log("[Action] updateUserProfile: updateData:", updateData);

    const profileUpdateResult = await userProfileService.updateMyProfile(updateData);
    if (!profileUpdateResult.success) {
      logger({
        type: "error",
        message: "Failed to update Firestore profile via service",
        metadata: { error: profileUpdateResult.error },
        context: "user-profile"
      });
      return { success: false, error: profileUpdateResult.error };
    }

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

    console.error("[Action] updateUserProfile: Error details:", error);
    return { success: false, error: message };
  } finally {
    console.log("[Action] updateUserProfile: END");
  }
}
