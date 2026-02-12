// legacy-app/src/actions/auth/register.ts
"use server";

import { adminAuthService } from "@/lib/services/admin-auth-service";
import { serverTimestamp } from "@/utils/date-server";
import { logActivity } from "@/firebase/actions";
import { registerSchema } from "@/schemas";
import { firebaseError, isFirebaseError } from "@/utils/firebase-error";
import { hashPassword } from "@/utils/hashPassword";
import { logServerEvent, logger } from "@/utils/logger";
import type { Auth } from "@/types";

export async function registerUser(
  _prevState: Auth.RegisterState | null,
  formData: FormData
): Promise<Auth.RegisterState> {
  //const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const validationResult = registerSchema.safeParse({ email, password, confirmPassword });
  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Invalid form data";
    logger({ type: "warn", message: `Registration validation failed: ${errorMessage}`, context: "auth" });
    return {
      success: false,
      message: errorMessage,
      error: errorMessage
    };
  }

  try {
    const passwordHash = await hashPassword(password);

    // 1) Create Auth user (service-driven)
    const createRes = await adminAuthService.createAuthUser({
      email,
      password,
      //displayName: name || email.split("@")[0],
      emailVerified: false
    });

    if (!createRes.success) {
      // Preserve your special case
      if (createRes.error.includes("email-already-exists")) {
        const msg = "Email already in use. Please try logging in instead.";
        return { success: false, message: msg, error: msg };
      }

      return { success: false, message: createRes.error, error: createRes.error };
    }

    const userId = createRes.data.uid;

    logger({ type: "info", message: `User created in Auth: ${email}`, context: "auth" });

    // 2) Determine role (service-driven count)
    const countRes = await adminAuthService.countUsers();
    if (!countRes.success) {
      return { success: false, message: countRes.error, error: countRes.error };
    }

    const isFirstUser = countRes.data.count === 0;
    const role = isFirstUser ? "admin" : "user";

    // 3) Promote first user (service-driven)
    if (isFirstUser) {
      const claimRes = await adminAuthService.setUserRoleClaim(userId, "admin");
      if (!claimRes.success) {
        return { success: false, message: claimRes.error, error: claimRes.error };
      }

      logger({ type: "info", message: `First user promoted to admin: ${email}`, context: "auth" });
    }

    // 4) Create Firestore user doc (service-driven)
    const docRes = await adminAuthService.createUserDoc(userId, {
      //name: name || email.split("@")[0],
      email,
      role,
      passwordHash,
      emailVerified: false,
      createdAt: serverTimestamp()
    });

    if (!docRes.success) {
      return { success: false, message: docRes.error, error: docRes.error };
    }

    // 5) Log activity (best-effort)
    try {
      await logActivity({
        userId,
        type: "register",
        description: "Account created, email verification required",
        status: "success"
      });
    } catch (logError) {
      logger({
        type: "error",
        message: "Failed to log activity for registration",
        metadata: { logError },
        context: "auth"
      });
    }

    await logServerEvent({
      type: "auth:register",
      message: `User registered: ${email}`,
      userId,
      metadata: { uid: userId, email, role },
      context: "auth"
    });

    return {
      success: true,
      message: "Registration successful! Please verify your email.",
      data: {
        userId,
        email,
        role,
        requiresVerification: true,
        password
      }
    };
  } catch (error: unknown) {
    logger({ type: "error", message: "Registration error", metadata: { error }, context: "auth" });

    const message = isFirebaseError(error) ? firebaseError(error) : "Registration failed";

    await logServerEvent({
      type: "auth:register_error",
      message: `Registration error: ${email}`,
      metadata: {
        error: isFirebaseError(error) ? error.code : String(error)
      },
      context: "auth"
    });

    return {
      success: false,
      message: "An error occurred during registration. Please try again.",
      error: message
    };
  }
}
