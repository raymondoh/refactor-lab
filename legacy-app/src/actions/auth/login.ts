"use server";

// ================= Imports =================
import bcryptjs from "bcryptjs";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { loginSchema } from "@/schemas/auth";
import { firebaseError, isFirebaseError } from "@/utils/firebase-error";
import { logServerEvent, logger } from "@/utils/logger";
//import type { LoginResponse } from "@/types/auth/login";
import type { Auth } from "@/types";
// ================= Login User =================

/**
 * Handles user login by validating credentials and returning a Firebase custom token.
 *
 * 1. Validates email and password.
 * 2. Checks email verification status.
 * 3. Verifies password against stored hash.
 * 4. Returns a custom token if successful.
 */
export async function loginUser(_prevState: Auth.LoginState | null, formData: FormData): Promise<Auth.LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const isRegistration = formData.get("isRegistration") === "true";
  const skipSession = formData.get("skipSession") === "true";

  // Step 1: Validate input
  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) {
    const message = validation.error.issues[0]?.message || "Invalid form data";
    logger({ type: "warn", message: `Login validation failed: ${message}`, context: "auth" });
    return { success: false, message };
  }

  try {
    // Step 2: Fetch user record from Firebase Auth
    const userRecord = await getAdminAuth().getUserByEmail(email);
    const isEmailVerified = userRecord.emailVerified;

    // Step 3: Block login for unverified emails unless registering or skipping session
    if (!isEmailVerified && !isRegistration && !skipSession) {
      const message = "Please verify your email before logging in. Check your inbox for a verification link.";
      logger({ type: "info", message: `Blocked unverified login: ${email}`, context: "auth" });
      return { success: false, message };
    }

    // Step 4: Verify password
    const userDoc = await getAdminFirestore().collection("users").doc(userRecord.uid).get();
    const userData = userDoc.data();

    if (!userData?.passwordHash) {
      logger({ type: "warn", message: `No passwordHash for ${email}`, context: "auth" });
      return { success: false, message: "Invalid email or password" };
    }

    const isPasswordValid = await bcryptjs.compare(password, userData.passwordHash);
    if (!isPasswordValid) {
      logger({ type: "warn", message: `Invalid password for ${email}`, context: "auth" });
      return { success: false, message: "Invalid email or password" };
    }

    // Step 5: Create a custom Firebase token
    const customToken = await getAdminAuth().createCustomToken(userRecord.uid);

    logger({ type: "info", message: `Login success for ${email}`, context: "auth" });

    await logServerEvent({
      type: "auth:login",
      message: `User logged in: ${email}`,
      userId: userRecord.uid,
      metadata: {
        uid: userRecord.uid,
        email,
        time: new Date().toISOString()
      }
    });

    return {
      success: true,
      message: "Login successful!",
      data: {
        userId: userRecord.uid,
        email,
        role: userData.role || "user",
        customToken,
        emailVerified: isEmailVerified
      }
    };
  } catch (error: unknown) {
    // Step 6: Handle login errors
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
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    });

    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected login error. Please try again."
    };
  }
}
