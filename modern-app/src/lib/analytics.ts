"use client";

// Define global typing for window.gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(action: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  const gtag = window.gtag;
  if (typeof gtag !== "function") return;

  gtag("event", action, params);
}
