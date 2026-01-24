"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ConsentValue = "accepted" | "declined" | null;

const STORAGE_KEY = "cookie-consent";

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null);

  // Read once on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "accepted" || saved === "declined") setConsent(saved);
    } catch {
      // ignore (private mode or SSR)
    }
  }, []);

  const accept = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {}
    setConsent("accepted");
  }, []);

  const decline = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "declined");
    } catch {}
    setConsent("declined");
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setConsent(null);
  }, []);

  /**
   * Run a callback (e.g., load analytics) ONLY if consent is "accepted".
   * If consent is undecided (null), it won't run until user accepts.
   */
  const runIfAccepted = useCallback(
    (cb: () => void) => {
      if (consent === "accepted") cb();
    },
    [consent]
  );

  /**
   * Dynamically load a script only if consent is "accepted".
   * Returns a cleanup function that removes the script.
   */
  const loadScriptIfAccepted = useCallback(
    (src: string, attrs: Record<string, string> = {}) => {
      if (consent !== "accepted") return () => {};
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
      document.head.appendChild(s);
      return () => {
        try {
          document.head.removeChild(s);
        } catch {}
      };
    },
    [consent]
  );

  const state = useMemo(
    () => ({ consent, isAccepted: consent === "accepted", isDeclined: consent === "declined" }),
    [consent]
  );

  return { ...state, accept, decline, reset, runIfAccepted, loadScriptIfAccepted };
}
