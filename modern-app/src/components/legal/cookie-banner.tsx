"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Local cn helper to avoid importing src/lib/utils (server-only deps like firebase-admin)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CONSENT_KEY = "pp-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  // Initial load: check consent
  useEffect(() => {
    if (typeof window === "undefined") return;
    const consent = window.localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  // Allow re-open from "Manage Cookies"
  useEffect(() => {
    if (typeof window === "undefined") return;

    const open = () => setVisible(true);
    window.addEventListener("open-cookie-banner", open as EventListener);

    return () => {
      window.removeEventListener("open-cookie-banner", open as EventListener);
    };
  }, []);

  const accept = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CONSENT_KEY, "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50",
        "border-t bg-destructive/65 border-destructive/40 backdrop-blur supports-[backdrop-filter]:bg-destructive/20"
      )}>
      <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 text-sm">
        <div className="text-center md:text-left leading-relaxed text-foreground">
          <h2 id="cookie-banner-title" className="sr-only">
            Cookie preferences
          </h2>
          <p id="cookie-banner-desc">
            We use cookies to improve performance and your experience.{" "}
            <a href="/cookies" className="font-medium underline underline-offset-4">
              Learn more
            </a>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="subtle" onClick={decline} aria-label="Decline non-essential cookies">
            Decline
          </Button>
          <Button size="sm" variant="primary" onClick={accept} aria-label="Accept cookies and continue">
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
