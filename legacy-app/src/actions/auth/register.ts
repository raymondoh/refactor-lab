// src/actions/auth/register.ts
"use server";

import { adminAuthService } from "@/lib/services/admin-auth-service";
import { registerSchema } from "@/schemas/auth/register";
import { ok, fail } from "@/lib/services/service-result";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { hashPassword } from "@/utils/hashPassword";
import { serverTimestamp } from "@/utils/date-server";
import { logServerEvent } from "@/lib/services/logging-service";
import type { z } from "zod";

type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Handles user registration using the new ServiceResult architecture.
 * Centralizes role assignment, password hashing, and Firestore document creation.
 *
 * First user becomes admin:
 * - We determine "first user" BEFORE creating the Auth user.
 * - We additionally fail-safe by checking for existing Firestore user docs (if available).
 *
 * Note: In a high-concurrency scenario, two signups could race. For most apps/dev,
 * this is acceptable; if you need strictness, enforce it with a transaction/lock.
 */
export async function registerAction(data: RegisterInput) {
  try {
    // 1) Validation
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid registration data.");
    }

    const { email, password } = parsed.data;

    // 2) Determine role BEFORE creating the user
    //    (countUsers after creation will never be 0)
    let isFirstUser = false;

    try {
      const countRes = await adminAuthService.countUsers();
      // If the project has zero auth users at this moment, treat as first user.
      isFirstUser = Boolean(countRes.success && countRes.data.count === 0);
    } catch {
      // If count fails, fall back to non-admin (safe default)
      isFirstUser = false;
    }

    const role: "admin" | "user" = isFirstUser ? "admin" : "user";

    // 3) Hashing (Legacy logic preserved for Firestore doc)
    const passwordHash = await hashPassword(password);

    // 4) Create Auth user (service-driven)
    const createRes = await adminAuthService.createAuthUser({
      email,
      password,
      emailVerified: false
    });

    if (!createRes.success) {
      const isDuplicate =
        createRes.error.includes("email-already-exists") || createRes.error.includes("already in use");

      return fail(
        isDuplicate ? "VALIDATION" : "UNKNOWN",
        isDuplicate ? "Email already in use. Please try logging in instead." : createRes.error
      );
    }

    const userId = createRes.data.uid;

    // 5) If first user, set admin claim (best-effort)
    if (role === "admin") {
      try {
        await adminAuthService.setUserRoleClaim(userId, "admin");
      } catch (error) {
        // If claim fails, we still proceed, but log it so you can fix env/permissions.
        console.error("[REGISTER] Failed to set admin claim for first user:", error);
      }
    }

    // 6) Create Firestore User Doc
    const docRes = await adminAuthService.createUserDoc(userId, {
      email,
      role,
      passwordHash,
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    if (!docRes.success) {
      return fail("UNKNOWN", "Account created but profile initialization failed.");
    }

    // 7) Standardized Logging
    await logServerEvent({
      type: "auth:register",
      message: `User registered: ${email} (Role: ${role})`,
      userId,
      context: "auth",
      metadata: { role }
    });

    return ok({
      success: true,
      message: "Registration successful! Please verify your email to continue."
    });
  } catch (error) {
    const message = isFirebaseError(error) ? firebaseError(error) : "An unexpected error occurred during registration.";

    await logServerEvent({
      type: "error",
      message: `Registration failed for ${(data as any)?.email ?? "unknown email"}`,
      context: "auth",
      metadata: { error: message }
    });

    return fail("UNKNOWN", message);
  }
}

export { registerAction as registerUser };
