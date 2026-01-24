// src/actions/auth/register.ts
"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { rateLimitKeys, registerIpBackstopRateLimiter, registerRateLimiter } from "@/lib/rate-limiter";
import { tokenService } from "@/lib/auth/tokens";
import { emailService } from "@/lib/email/email-service";
import { logger } from "@/lib/logger";
import { isRegistrationEnabled } from "@/lib/featured-flags";
import { verifyRecaptcha } from "@/lib/recaptcha-service";

const registerSchema = z
  .object({
    companyWebsite: z.string().optional(), // Honeypot field
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must be less than 100 characters"),
    terms: z.preprocess(
      value => value === "on",
      z.boolean().refine(value => value === true, {
        message: "You must accept the terms and conditions to continue.",
        path: ["terms"]
      })
    ),
    confirmPassword: z.string(),
    role: z.enum(["customer", "tradesperson"]).default("customer")
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export type RegisterFormState = {
  errors?: {
    companyWebsite?: string[];
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    role?: string[];
    _form?: string[];
    terms?: string[];
  };
  success?: boolean;
  message?: string;
};

function getClientIpFromHeaders(h: Headers) {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim() || "unknown";
  return "unknown";
}

export async function registerAction(prevState: RegisterFormState, formData: FormData): Promise<RegisterFormState> {
  logger.info("Register action called");

  // ✅ 0) Parse email early (for better rate-limit keys).
  // Don't validate here; just normalize if present.
  const emailField = formData.get("email");
  const email = typeof emailField === "string" ? emailField.trim().toLowerCase() : "unknown";

  // ✅ 1) Rate limiting (recommended): (IP + email) + IP backstop
  // - Prevents you locking yourself out when testing repeatedly on one IP.
  // - Still blocks abuse patterns.
  try {
    const h = await headers();
    const ip = getClientIpFromHeaders(h);

    const compositeKey = rateLimitKeys.ipEmail(ip, email);
    const ipKey = rateLimitKeys.ipOnly(ip);

    const [resUser, resIp] = await Promise.all([
      registerRateLimiter.limit(compositeKey),
      registerIpBackstopRateLimiter.limit(ipKey)
    ]);

    if (!resUser.success || !resIp.success) {
      logger.warn("Register rate limit exceeded", {
        ip,
        email,
        limiter: {
          user: { success: resUser.success, remaining: resUser.remaining, reset: resUser.reset },
          ip: { success: resIp.success, remaining: resIp.remaining, reset: resIp.reset }
        }
      });

      return {
        errors: {
          _form: ["Too many registration attempts. Please try again later."]
        }
      };
    }
  } catch (rateError) {
    // These limiters are configured to fail closed; this catch is belt-and-braces.
    logger.error("Rate limiter unexpected error in registerAction (failing closed)", rateError);
    return {
      errors: {
        _form: ["Registration is temporarily unavailable. Please try again shortly."]
      }
    };
  }

  // ✅ 2) Kill-switch: close registrations via env flag
  if (!isRegistrationEnabled()) {
    logger.warn("Registration blocked (REGISTRATION_ENABLED=false)");
    return {
      errors: {
        _form: ["Registration is currently closed."]
      }
    };
  }

  // ✅ 3) Honeypot check (bots fill hidden field)
  const companyWebsiteValue = formData.get("companyWebsite");

  if (typeof companyWebsiteValue === "string" && companyWebsiteValue.trim().length > 0) {
    logger.warn("Honeypot hit on registration", { email });

    // Optional delay to slow bots slightly
    await new Promise(res => setTimeout(res, 800));

    // Pretend success, but do NOT create a user
    return {
      success: true,
      message: "Account created successfully! Please check your email to verify your account."
    };
  }

  // ✅ 4) reCAPTCHA v3 verification
  // Client should send this as "recaptchaToken"
  const recaptchaField = formData.get("recaptchaToken");
  const recaptchaToken = typeof recaptchaField === "string" && recaptchaField.length > 0 ? recaptchaField : null;

  const recaptchaResult = await verifyRecaptcha(recaptchaToken, "register");

  if (!recaptchaResult.ok) {
    logger.warn("reCAPTCHA verification failed on registration", {
      email,
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

  // ✅ 5) Proceed with normal registration flow
  try {
    // Validate form data
    const validatedFields = registerSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      logger.info("Validation failed", validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors
      };
    }

    const { name, email, password, role } = validatedFields.data;
    logger.info(`Creating user: ${email} with role: ${role}`);

    // Lazily import userService only when registration is attempted
    const { userService } = await import("@/lib/services/user-service");

    // Check if a user already exists
    const existingUser = await userService.getUserByEmail(email);
    logger.info(`Existing user check: ${existingUser ? "Found" : "Not found"}`);

    if (existingUser) {
      logger.info(`User already exists: ${email}`);
      return {
        errors: {
          email: ["An account with this email already exists"]
        }
      };
    }

    // Create the user
    logger.info("Creating user");
    const user = await userService.createUser(email, password, name, role);

    if (!user) {
      logger.error(`Failed to create user: ${email}`);
      return {
        errors: {
          _form: ["Failed to create account. Please try again."]
        }
      };
    }

    logger.info(`User created successfully: ${user.id}`);

    // Create and send email verification token
    try {
      logger.info("Creating verification token");
      const verificationToken = await tokenService.createEmailVerificationToken(email);

      logger.info("Sending verification email");
      await emailService.sendVerificationEmail(email, verificationToken, name);
      logger.info(`Verification email sent successfully to: ${email}`);
    } catch (emailError) {
      logger.error("Email verification setup failed", emailError);
      // Don't fail the entire registration if the email fails to send
    }

    logger.info(`Registration completed for: ${email}`);

    return {
      success: true,
      message: "Account created successfully! Please check your email to verify your account."
    };
  } catch (error: unknown) {
    logger.error("Registration error", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";

    // Handle specific, known error messages
    if (errorMessage.includes("email-already-in-use")) {
      return { errors: { email: ["An account with this email already exists"] } };
    }
    if (errorMessage.includes("weak-password")) {
      return { errors: { password: ["Password is too weak. Please choose a stronger password."] } };
    }

    return {
      errors: {
        _form: ["Registration failed. Please try again."]
      }
    };
  }
}
