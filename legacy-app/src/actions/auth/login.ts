// src/actions/auth/login.ts
"use server";

import { loginSchema } from "@/schemas/auth";
import { firebaseError, isFirebaseError } from "@/utils/firebase-error";
import { logServerEvent, logger } from "@/utils/logger";
import type { Auth } from "@/types";

import { adminAuthService } from "@/lib/services/admin-auth-service";

/**
 * Handles user login by validating credentials and returning a Firebase custom token.
 *
 * 1. Validates email and password.
 * 2. Checks email verification status.
 * 3. Verifies password against stored hash.
 * 4. Returns a custom token if successful.
 */
export async function loginUser(_prevState: Auth.LoginState | null, formData: FormData): Promise<Auth.LoginState> {
  const email = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const isRegistration = formData.get("isRegistration") === "true";
  const skipSession = formData.get("skipSession") === "true";

  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) {
    const message = validation.error.issues[0]?.message || "Invalid form data";
    logger({ type: "warn", message: `Login validation failed: ${message}`, context: "auth" });
    return { success: false, message };
  }

  try {
    // 1) Auth lookup by email
    const authUserRes = await adminAuthService.getAuthUserByEmail(email);
    if (!authUserRes.success) {
      // Preserve old behavior: hide enumeration where possible
      if (authUserRes.error.includes("auth/user-not-found")) {
        return { success: false, message: "Invalid email or password" };
      }
      return { success: false, message: authUserRes.error };
    }

    const { uid, emailVerified } = authUserRes.data;

    // 2) Block unverified emails unless registering or skipping session
    if (!emailVerified && !isRegistration && !skipSession) {
      const message = "Please verify your email before logging in. Check your inbox for a verification link.";
      logger({ type: "info", message: `Blocked unverified login: ${email}`, context: "auth" });
      return { success: false, message };
    }

    // 3) Verify password hash in Firestore (service)
    const pwRes = await adminAuthService.verifyPasswordHash(uid, password);

    if (!pwRes.success) {
      logger({ type: "error", message: `Password verify error for ${email}`, context: "auth" });
      return { success: false, message: pwRes.error };
    }

    if (!pwRes.data.ok) {
      logger({ type: "warn", message: `Invalid password for ${email}`, context: "auth" });
      return { success: false, message: "Invalid email or password" };
    }

    // 4) Create custom token (service)
    const tokenRes = await adminAuthService.createCustomToken(uid);
    if (!tokenRes.success) {
      return { success: false, message: tokenRes.error };
    }

    logger({ type: "info", message: `Login success for ${email}`, context: "auth" });

    await logServerEvent({
      type: "auth:login",
      message: `User logged in: ${email}`,
      userId: uid,
      metadata: {
        uid,
        email,
        time: new Date().toISOString()
      }
    });

    return {
      success: true,
      message: "Login successful!",
      data: {
        userId: uid,
        email,
        role: pwRes.data.role === "admin" ? "admin" : "user",

        customToken: tokenRes.data.token,
        emailVerified
      }
    };
  } catch (error: unknown) {
    logger({
      type: "error",
      message: `Login error for ${email}`,
      context: "auth",
      metadata: { error }
    });

    if (isFirebaseError(error)) {
      if (error.code === "auth/user-not-found") {
        return { success: false, message: "Invalid email or password" };
      }
      return { success: false, message: firebaseError(error) };
    }

    await logServerEvent({
      type: "auth:login_error",
      message: `Failed login attempt for ${email}`,
      metadata: { error: error instanceof Error ? error.message : String(error) }
    });

    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected login error. Please try again."
    };
  }
}
