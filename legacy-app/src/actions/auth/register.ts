"use server";

import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { serverTimestamp } from "@/utils/date-server";
import { logActivity } from "@/firebase/actions";
import { registerSchema } from "@/schemas";
import { firebaseError, isFirebaseError } from "@/utils/firebase-error";
import { hashPassword } from "@/utils/hashPassword";
import { logServerEvent, logger } from "@/utils/logger";
import type { Auth } from "@/types";

export async function registerUser(
  prevState: Auth.RegisterState | null,
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

    let userRecord;
    try {
      userRecord = await getAdminAuth().createUser({
        email,
        password,
        //displayName: name || email.split("@")[0],
        emailVerified: false
      });

      logger({ type: "info", message: `User created in Auth: ${email}`, context: "auth" });
    } catch (error: unknown) {
      logger({ type: "error", message: `Auth user creation failed: ${email}`, metadata: { error }, context: "auth" });

      if (isFirebaseError(error) && error.code === "auth/email-already-exists") {
        const msg = "Email already in use. Please try logging in instead.";
        return {
          success: false,
          message: msg,
          error: msg
        };
      }

      const message = isFirebaseError(error) ? firebaseError(error) : "Failed to create user";
      return {
        success: false,
        message,
        error: message
      };
    }

    const usersSnapshot = await getAdminFirestore().collection("users").count().get();
    const isFirstUser = usersSnapshot.data().count === 0;
    const role = isFirstUser ? "admin" : "user";

    if (isFirstUser) {
      await getAdminAuth().setCustomUserClaims(userRecord.uid, { role: "admin" });
      logger({ type: "info", message: `First user promoted to admin: ${email}`, context: "auth" });
    }

    await getAdminFirestore().collection("users").doc(userRecord.uid).set({
      //name: name || email.split("@")[0],
      email,
      role,
      passwordHash,
      emailVerified: false,
      createdAt: serverTimestamp()
    });

    try {
      await logActivity({
        userId: userRecord.uid,
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
      userId: userRecord.uid,
      metadata: {
        uid: userRecord.uid,
        email,
        role
      },
      context: "auth"
    });

    return {
      success: true,
      message: "Registration successful! Please verify your email.",
      data: {
        userId: userRecord.uid,
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
