// src/hooks/use-recaptcha-action.ts
"use client";

import { useCallback } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { clientLogger } from "@/lib/utils/logger";
import type { RecaptchaAction } from "@/lib/recaptcha-service";

/**
 * Small helper hook to generate a reCAPTCHA v3 token for a given action.
 * Usage:
 *   const { recaptcha } = useRecaptchaAction(RECAPTCHA_ACTIONS.FORGOT_PASSWORD);
 *   const token = await recaptcha(); // or recaptcha(overrideAction)
 */
export function useRecaptchaAction(defaultAction?: RecaptchaAction | string) {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const recaptcha = useCallback(
    async (overrideAction?: RecaptchaAction | string): Promise<string | null> => {
      const action = (overrideAction ?? defaultAction) as string | undefined;

      if (!action) {
        clientLogger.warn("[useRecaptchaAction] No action provided");
        return null;
      }

      if (!executeRecaptcha) {
        clientLogger.warn("[useRecaptchaAction] executeRecaptcha not yet ready", { action });
        return null;
      }

      try {
        const token = await executeRecaptcha(action);
        if (!token) {
          clientLogger.warn("[useRecaptchaAction] No token returned", { action });
          return null;
        }
        return token;
      } catch (err) {
        clientLogger.error("[useRecaptchaAction] executeRecaptcha failed", { action, err });
        return null;
      }
    },
    [defaultAction, executeRecaptcha]
  );

  return { recaptcha };
}
