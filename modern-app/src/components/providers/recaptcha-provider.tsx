"use client";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export function RecaptchaProvider({ children, siteKey }: { children: React.ReactNode; siteKey?: string | null }) {
  if (!siteKey) {
    // If no key, just render children (no recaptcha)
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{
        async: false,
        defer: false,
        appendTo: "head",
        nonce: undefined
      }}>
      {children}
    </GoogleReCaptchaProvider>
  );
}
