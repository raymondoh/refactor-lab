"use client";

import { useEffect, useState } from "react";

// Read from public env at build/runtime (safe for the client)
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const ENABLE_FIREBASE_ANALYTICS = process.env.NEXT_PUBLIC_ENABLE_FIREBASE_ANALYTICS === "true";

/**
 * Optional Firebase config:
 * Either provide NEXT_PUBLIC_FIREBASE_CONFIG as a JSON string,
 * OR the individual NEXT_PUBLIC_FIREBASE_* vars (shown below).
 */
const FIREBASE_CONFIG_JSON = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
const FB_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FB_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const FB_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FB_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const FB_MEASUREMENT_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

const CONSENT_KEY = "pp-cookie-consent";

/** -----------------------------
 * Type-safe window augmentation
 * ----------------------------- */
declare global {
  interface Window {
    /** GA’s opt-out mechanism dynamically adds these keys */
    [key: `ga-disable-${string}`]: boolean | undefined;
    dataLayer?: Array<unknown>;
    gtag?: (...args: unknown[]) => void;
  }
}

function parseFirebaseConfig() {
  if (FIREBASE_CONFIG_JSON) {
    try {
      return JSON.parse(FIREBASE_CONFIG_JSON);
    } catch {
      /* ignore and fall through */
    }
  }
  if (FB_API_KEY && FB_PROJECT_ID && FB_APP_ID) {
    return {
      apiKey: FB_API_KEY,
      authDomain: FB_AUTH_DOMAIN,
      projectId: FB_PROJECT_ID,
      appId: FB_APP_ID,
      measurementId: FB_MEASUREMENT_ID
    };
  }
  return null;
}

type ConsentValue = "accepted" | "rejected" | null;

export function AnalyticsGate() {
  const [hydrated, setHydrated] = useState(false);
  const [consent, setConsent] = useState<ConsentValue>(null);

  // Hydrate consent from localStorage on the client
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted" || stored === "rejected") {
      setConsent(stored);
    } else {
      setConsent(null);
    }

    setHydrated(true);
  }, []);

  // Handle GA disable flag based on consent
  useEffect(() => {
    if (typeof window === "undefined" || !GA_ID) return;

    const key = `ga-disable-${GA_ID}` as const;
    // Disable GA whenever consent is not explicitly "accepted"
    window[key] = consent !== "accepted";
  }, [consent]);

  // Load GA + Firebase Analytics only after consent AND hydration
  useEffect(() => {
    if (!hydrated) return;
    if (consent !== "accepted") return;

    const cleanups: Array<() => void> = [];

    /** ------------------------------
     * Google Analytics (gtag)
     * ------------------------------ */
    if (GA_ID) {
      const gaScript = document.createElement("script");
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
      gaScript.async = true;
      document.head.appendChild(gaScript);

      const inline = document.createElement("script");
      inline.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('consent', 'update', {
          ad_user_data: 'granted',
          ad_personalization: 'granted',
          ad_storage: 'granted',
          analytics_storage: 'granted'
        });
        gtag('config', '${GA_ID}', {
          anonymize_ip: true
        });
      `;
      document.head.appendChild(inline);

      cleanups.push(() => {
        try {
          document.head.removeChild(gaScript);
        } catch {}
        try {
          document.head.removeChild(inline);
        } catch {}
      });
    }

    /** ------------------------------
     * Firebase Analytics (optional)
     * ------------------------------ */
    if (ENABLE_FIREBASE_ANALYTICS) {
      const config = parseFirebaseConfig();
      if (config?.measurementId) {
        (async () => {
          try {
            const [{ initializeApp, getApps }, { getAnalytics, isSupported }] = await Promise.all([
              import("firebase/app"),
              import("firebase/analytics")
            ]);

            if (!getApps().length) {
              initializeApp(config);
            }

            if (await isSupported()) {
              getAnalytics();
            }
          } catch {
            /* ignore analytics load errors */
          }
        })();
      }
    }

    return () => {
      cleanups.forEach(fn => fn());
    };
  }, [hydrated, consent]);

  // We don't render any visible UI
  return null;
}
