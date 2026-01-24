// src/components/auth/use-password-reset-request.ts
"use client";

import { useCallback, useEffect, useState } from "react";

import { clientLogger } from "@/lib/utils/logger";
import { useRecaptchaAction } from "@/hooks/use-recaptcha-action";
import { RECAPTCHA_ACTIONS } from "@/lib/recaptcha-service";

const RECAPTCHA_ACTION = RECAPTCHA_ACTIONS.FORGOT_PASSWORD;

export function usePasswordResetRequest(initialEmail = "") {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { recaptcha } = useRecaptchaAction(RECAPTCHA_ACTION);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const submit = useCallback(
    async (overrideEmail?: string) => {
      const targetEmail = (overrideEmail ?? email).trim();

      if (!targetEmail) {
        setError("Please enter a valid email address.");
        return false;
      }

      setIsLoading(true);
      setError("");

      // 🔐 Get reCAPTCHA token via shared hook
      const recaptchaToken = await recaptcha();

      if (!recaptchaToken) {
        clientLogger.warn("[PasswordResetRequest] No reCAPTCHA token returned");
        setError("Could not verify reCAPTCHA. Please try again.");
        setIsLoading(false);
        return false;
      }

      try {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: targetEmail, recaptchaToken })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          setSuccess(true);
          return true;
        }

        setError(data.error || "Failed to send reset email");
        return false;
      } catch (err) {
        clientLogger.error("[PasswordResetRequest] Failed to call forgot-password API", err);
        setError("Something went wrong. Please try again.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [email, recaptcha]
  );

  const resetStatus = useCallback(() => {
    setSuccess(false);
    setError("");
  }, []);

  return { email, setEmail, isLoading, success, error, submit, resetStatus } as const;
}
