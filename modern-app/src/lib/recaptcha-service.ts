// src/lib/recaptcha-service.ts
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const env = getEnv();

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts: string;
  hostname: string;
  "error-codes"?: string[];
}

export type RecaptchaCheckResult = {
  ok: boolean;
  score: number;
  raw: RecaptchaResponse | null;
  reason?: string;
  token?: string;
  expectedAction?: string;
};

// 🔹 Centralised action names so client + server stay in sync
export const RECAPTCHA_ACTIONS = {
  LOGIN: "login",
  REGISTER: "register",
  RESEND_VERIFICATION: "resend_verification",
  RESEND_VERIFICATION_LOGIN: "resend_verification_login",
  RESEND_VERIFICATION_VERIFY: "resend_verification_verify_page",
  FORGOT_PASSWORD: "forgot_password",
  RESET_PASSWORD: "reset_password"
} as const;

export type RecaptchaAction = (typeof RECAPTCHA_ACTIONS)[keyof typeof RECAPTCHA_ACTIONS];

const RECAPTCHA_THRESHOLD = 0.5;

function maskToken(token: string | null): string | null {
  if (!token) return null;
  if (token.length <= 16) return token; // short, just log as-is in dev
  return `${token.slice(0, 8)}...${token.slice(-4)}`;
}

export async function verifyRecaptcha(
  token: string | null,
  expectedAction: string // keep this loose so other actions (e.g. quotes, contact forms) still work
): Promise<RecaptchaCheckResult> {
  const maskedToken = maskToken(token);

  if (!token) {
    logger.warn("[reCAPTCHA] No token provided");
    return {
      ok: false,
      score: 0,
      raw: null,
      reason: "missing-token",
      token: maskedToken ?? undefined,
      expectedAction
    };
  }

  if (!env.RECAPTCHA_SECRET_KEY) {
    logger.error("[reCAPTCHA] RECAPTCHA_SECRET_KEY not set");

    // In dev, optionally bypass
    if (process.env.NODE_ENV !== "production") {
      logger.warn("[reCAPTCHA] Bypassing reCAPTCHA in dev mode", {
        expectedAction,
        token: maskedToken
      });

      const fake: RecaptchaResponse = {
        success: true,
        score: 1,
        action: "dev_bypass",
        challenge_ts: new Date().toISOString(),
        hostname: "localhost"
      };

      return {
        ok: true,
        score: 1,
        raw: fake,
        reason: "dev-bypass",
        token: maskedToken ?? undefined,
        expectedAction
      };
    }

    return {
      ok: false,
      score: 0,
      raw: null,
      reason: "missing-secret",
      token: maskedToken ?? undefined,
      expectedAction
    };
  }

  try {
    const params = new URLSearchParams();
    params.append("secret", env.RECAPTCHA_SECRET_KEY);
    params.append("response", token);

    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });

    if (!res.ok) {
      logger.error("[reCAPTCHA] HTTP error", {
        status: res.status,
        statusText: res.statusText,
        expectedAction,
        token: maskedToken
      });

      return {
        ok: false,
        score: 0,
        raw: null,
        reason: "http-failure",
        token: maskedToken ?? undefined,
        expectedAction
      };
    }

    const data = (await res.json()) as RecaptchaResponse;
    const score = data.score ?? 0;

    logger.info("[reCAPTCHA] verification", {
      success: data.success,
      score,
      action: data.action,
      expectedAction,
      token: maskedToken
    });

    if (!data.success) {
      return {
        ok: false,
        score,
        raw: data,
        reason: "failed",
        token: maskedToken ?? undefined,
        expectedAction
      };
    }

    if (data.action && data.action !== expectedAction) {
      logger.warn("[reCAPTCHA] action mismatch", {
        expectedAction,
        actualAction: data.action,
        score,
        token: maskedToken
      });

      return {
        ok: false,
        score,
        raw: data,
        reason: "action-mismatch",
        token: maskedToken ?? undefined,
        expectedAction
      };
    }

    if (score < RECAPTCHA_THRESHOLD) {
      logger.warn("[reCAPTCHA] low score", {
        score,
        threshold: RECAPTCHA_THRESHOLD,
        expectedAction,
        token: maskedToken
      });

      return {
        ok: false,
        score,
        raw: data,
        reason: "low-score",
        token: maskedToken ?? undefined,
        expectedAction
      };
    }

    return {
      ok: true,
      score,
      raw: data,
      token: maskedToken ?? undefined,
      expectedAction
    };
  } catch (err) {
    logger.error("[reCAPTCHA] exception", {
      error: err,
      expectedAction,
      token: maskedToken
    });

    return {
      ok: false,
      score: 0,
      raw: null,
      reason: "exception",
      token: maskedToken ?? undefined,
      expectedAction
    };
  }
}
