// src/lib/env.ts
import { z } from "zod";
import { logger } from "@/lib/logger";

/* -------------------------------------------------------------------------- */
/*                                ENV SCHEMA                                  */
/* -------------------------------------------------------------------------- */

const requiredEnv = z.object({
  // --- Firebase Admin (server) ---
  AUTH_FIREBASE_PROJECT_ID: z.string().min(1),
  AUTH_FIREBASE_CLIENT_EMAIL: z.string().min(1),
  AUTH_FIREBASE_PRIVATE_KEY: z.string().min(1),

  // --- App / Auth ---
  AUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1),

  // --- Firebase Client ---
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),

  // --- Analytics ---
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().min(1),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().min(1),

  // --- Recaptcha ---
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().min(1),
  RECAPTCHA_SECRET_KEY: z.string().min(1),

  // --- Stripe ---
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_PRO_PRICE_MONTHLY: z.string().min(1),
  STRIPE_PRO_PRICE_YEARLY: z.string().min(1),
  STRIPE_BUSINESS_PRICE_MONTHLY: z.string().min(1),
  STRIPE_BUSINESS_PRICE_YEARLY: z.string().min(1),
  STRIPE_PLATFORM_FEE_BPS_BASIC: z.string().min(1),
  STRIPE_PLATFORM_FEE_BPS_PRO: z.string().min(1),
  STRIPE_PLATFORM_FEE_BPS_BUSINESS: z.string().min(1),

  // --- Email ---
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  SUPPORT_EMAIL: z.string().min(1),
  CONTACT_FORM_RECEIVER_EMAIL: z.string().email(),

  // --- Algolia (current) ---
  NEXT_PUBLIC_ALGOLIA_APP_ID: z.string().min(1),
  NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY: z.string().min(1),
  ALGOLIA_ADMIN_API_KEY: z.string().min(1)
});

const optionalEnv = z.object({
  // --- App ---
  NEXT_PUBLIC_APP_MODE: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_COOKIE_BANNER: z.string().optional(),
  NEXT_PUBLIC_MAINTENANCE_MODE: z.string().optional(),

  // --- OAuth ---
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // --- Stripe ---
  STRIPE_BASIC_PRICE_ID: z.string().optional(),
  STRIPE_REMINDER_CRON_SECRET: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().optional(),
  STRIPE_CANCEL_URL: z.string().optional(),

  // --- Alerts ---
  ALERT_WEBHOOK_URL: z.string().optional(),

  // --- Legacy Algolia (non-blocking) ---
  ALGOLIA_APPID: z.string().optional(),
  ALGOLIA_ADMINKEY: z.string().optional(),

  // ✅ Firebase emulators
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: z.string().optional(),

  NEXT_PUBLIC_EMAIL_BASE_URL: z.string().min(1).optional(),
  EMAIL_BASE_URL: z.string().min(1).optional()
});

const envSchema = requiredEnv.merge(optionalEnv);
type Env = z.infer<typeof envSchema>;

/* -------------------------------------------------------------------------- */
/*                              VALIDATION CORE                               */
/* -------------------------------------------------------------------------- */

let validated = false;
let parsedEnv: Env | null = null;

export function validateEnv() {
  if (validated) return true;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = Object.keys(result.error.flatten().fieldErrors);

    if (process.env.NODE_ENV !== "production") {
      logger.warn("[env] Missing or invalid environment variables (development):", missing.join(", "));
      validated = true; // avoid repeated warnings
      return true;
    }

    throw new Error(`Missing or invalid environment variables:\n${missing.map(k => `- ${k}`).join("\n")}`);
  }

  parsedEnv = result.data;
  validated = true;
  return true;
}

/* -------------------------------------------------------------------------- */
/*                             SAFE ENV ACCESSOR                               */
/* -------------------------------------------------------------------------- */

export function getEnv(): Env {
  if (!validated) validateEnv();
  return parsedEnv ?? (process.env as unknown as Env);
}

/* -------------------------------------------------------------------------- */
/*                               ENV HELPERS                                   */
/* -------------------------------------------------------------------------- */

export const isServer = typeof window === "undefined";
export const isProduction = process.env.NODE_ENV === "production";
