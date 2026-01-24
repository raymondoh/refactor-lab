// src/lib/analytics.ts
"use client";

type Gtag = (command: "event", eventName: string, params?: Record<string, unknown>) => void;

export function trackEvent(action: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  const gtag = (window as { gtag?: Gtag }).gtag;
  if (typeof gtag !== "function") return;

  gtag("event", action, params);
}
