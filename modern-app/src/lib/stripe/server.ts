// src/lib/stripe/server.ts
import Stripe from "stripe";
import { logger } from "@/lib/logger";

/**
 * Ensure we only ever instantiate Stripe on the server.
 * This file must never be imported by client components.
 */

// ---- Env validation ----
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY env var");
}

// Optional safety: prevent test/live mixups during development
if (process.env.NODE_ENV !== "production") {
  const isTestKey = STRIPE_SECRET_KEY.startsWith("sk_test_");
  if (!isTestKey) {
    logger.warn(
      "[stripe] You are running in non-production with a non-test secret key. " +
        "Check your .env – expected sk_test_..."
    );
  }
}

/**
 * Stripe API version handling:
 * - If STRIPE_API_VERSION is provided, we use it (and let TS validate against the SDK's allowed literal).
 * - If it's missing, we let the SDK use the account's default (recommended if you just upgraded the SDK).
 */
const STRIPE_API_VERSION = process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion | undefined;

// ---- Global singleton (dev hot reload) ----
declare global {
  var _stripeSingleton: Stripe | undefined;
}

export const stripe: Stripe =
  globalThis._stripeSingleton ??
  new Stripe(STRIPE_SECRET_KEY, {
    // If you want to pin explicitly, set STRIPE_API_VERSION in your env to the SDK's current value,
    // e.g. STRIPE_API_VERSION=2025-10-29.clover
    apiVersion: STRIPE_API_VERSION, // undefined ⇒ use account default
    // Retries on transient network errors (Stripe recommends 2)
    maxNetworkRetries: 2,
    // 60s is a sane upper bound for server-to-server
    timeout: 60_000,
    // Helps identify your integration in Stripe logs
    appInfo: {
      name: process.env.NEXT_PUBLIC_APP_NAME || "Plumbers Portal",
      version: process.env.APP_VERSION || "1.0.0",
      url: process.env.NEXT_PUBLIC_APP_URL || "https://plumbersportal.com"
    }
  });

if (!globalThis._stripeSingleton) {
  globalThis._stripeSingleton = stripe;
}

// NOTE: Do NOT export the webhook secret here.
// Read STRIPE_WEBHOOK_SECRET directly inside the webhook route to avoid accidental client imports.
