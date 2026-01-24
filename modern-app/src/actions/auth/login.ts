// src/actions/auth/login.ts
"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { getDashboardRoute } from "@/lib/auth-utils";
import { loginIpBackstopRateLimiter, loginRateLimiter, rateLimitKeys } from "@/lib/rate-limiter";
import { headers } from "next/headers";
import { verifyRecaptcha } from "@/lib/recaptcha-service";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." })
});

export type LoginFormState = {
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
  success?: boolean;
  message?: string;
  redirectUrl?: string;
  // --- New fields for unverified email flow ---
  unverifiedEmail?: boolean;
  resendHintEmail?: string;
};

function getClientIpFromHeaders(h: Headers) {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim() || "unknown";
  return "unknown";
}

export async function loginAction(prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  logger.info("--- [loginAction] Start ---");

  // 1) Validate basic fields FIRST (don’t burn rate-limit tokens on invalid payloads)
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors
    };
  }

  const { email, password } = validatedFields.data;
  const normalizedEmail = email.trim().toLowerCase();

  logger.info(`[loginAction] Attempting login for email: ${normalizedEmail}`);

  // 2) Rate limiting (recommended): (IP + email) + IP backstop
  try {
    const h = await headers();
    const ip = getClientIpFromHeaders(h);

    const compositeKey = rateLimitKeys.ipEmail(ip, normalizedEmail);
    const ipKey = rateLimitKeys.ipOnly(ip);

    const [resUser, resIp] = await Promise.all([
      loginRateLimiter.limit(compositeKey),
      loginIpBackstopRateLimiter.limit(ipKey)
    ]);

    if (!resUser.success || !resIp.success) {
      logger.info("[loginAction] Rate limit exceeded", {
        ip,
        email: normalizedEmail,
        limiter: {
          user: { success: resUser.success, remaining: resUser.remaining, reset: resUser.reset },
          ip: { success: resIp.success, remaining: resIp.remaining, reset: resIp.reset }
        }
      });

      return {
        errors: {
          _form: ["Too many login attempts. Please try again later."]
        }
      };
    }
  } catch (rateError) {
    // These limiters are configured to fail closed; this catch is belt-and-braces.
    logger.error("[loginAction] Rate limiter unexpected error (failing closed)", rateError);
    return {
      errors: {
        _form: ["Login is temporarily unavailable. Please try again shortly."]
      }
    };
  }

  // 3) reCAPTCHA v3 – best-effort for login
  const recaptchaField = formData.get("recaptchaToken");
  const recaptchaToken = typeof recaptchaField === "string" && recaptchaField.length > 0 ? recaptchaField : null;

  const recaptchaResult = await verifyRecaptcha(recaptchaToken, "login");

  if (!recaptchaResult.ok) {
    // Soft-fail: allow missing-token in dev, but still log
    if (recaptchaResult.reason === "missing-token" && process.env.NODE_ENV !== "production") {
      logger.info("[loginAction] reCAPTCHA missing token (dev soft-fail)", {
        email: normalizedEmail,
        reason: recaptchaResult.reason,
        score: recaptchaResult.score,
        token: recaptchaResult.token,
        expectedAction: recaptchaResult.expectedAction
      });
    } else {
      // Hard failures: Google explicitly rejected / suspicious / misconfigured
      logger.warn("[loginAction] reCAPTCHA hard failure on login", {
        email: normalizedEmail,
        reason: recaptchaResult.reason,
        score: recaptchaResult.score,
        token: recaptchaResult.token,
        expectedAction: recaptchaResult.expectedAction
      });

      return {
        errors: {
          _form: ["reCAPTCHA verification failed. Please try again."]
        }
      };
    }
  }

  // 4) Proceed with NextAuth signIn
  try {
    logger.info("[loginAction] Calling NextAuth signIn...");
    await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false // IMPORTANT: must be false to handle errors here
    });
    logger.info("[loginAction] NextAuth signIn call completed without throwing.");
  } catch (error: unknown) {
    logger.error("[loginAction] signIn threw an error:", error);

    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      if (error.cause?.err?.message === "unverified") {
        logger.info(`[loginAction] User found but email not verified: ${normalizedEmail}`);
        return {
          unverifiedEmail: true,
          resendHintEmail: normalizedEmail,
          errors: {
            _form: ["Email not verified."]
          }
        };
      }
      logger.warn("[loginAction] Invalid credentials error caught.");
      return { errors: { _form: ["Invalid email or password."] } };
    }

    logger.warn("[loginAction] Rethrowing unexpected error.");
    throw error;
  }

  // 5) Success → figure out redirect
  logger.info(`[loginAction] Login successful for ${normalizedEmail}. Determining redirect...`);

  const { userService } = await import("@/lib/services/user-service");
  const user = await userService.getUserByEmail(normalizedEmail);
  const role = user?.role;

  const redirectUrl = getDashboardRoute(role ?? undefined);

  logger.info(`[loginAction] Redirecting to: ${redirectUrl}`);

  return { success: true, redirectUrl };
}
