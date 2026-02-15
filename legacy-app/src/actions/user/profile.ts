// src/actions/user/profile.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { userProfileService } from "@/lib/services/user-profile-service";
import { profileUpdateSchema } from "@/schemas/user/profile";
import { ok, fail } from "@/lib/services/service-result";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { z } from "zod";

type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/**
 * Updates the current user's profile.
 * Uses the auth session to ensure users can only update their own data.
 */
export async function updateProfileAction(data: ProfileUpdateInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("UNAUTHENTICATED", "You must be logged in to update your profile.");
  }

  try {
    const parsed = profileUpdateSchema.safeParse(data);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid profile data");
    }

    const result = await userProfileService.updateProfileByUserId(session.user.id, parsed.data);

    if (!result.ok) {
      return fail("UNKNOWN", result.error || "Failed to update profile");
    }

    revalidatePath("/user/profile");
    revalidatePath("/admin/profile");

    return ok({ success: true });
  } catch (error) {
    const message = isFirebaseError(error) ? firebaseError(error) : "An unexpected error occurred";
    return fail("UNKNOWN", message);
  }
}
export { updateProfileAction as updateUserProfile };
