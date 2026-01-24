"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

/**
 * Detects ?quote_accepted=true in the URL
 * and sends a Google Analytics event.
 */
export function QuoteAcceptedTracker() {
  const params = useSearchParams();

  useEffect(() => {
    if (params.get("quote_accepted") === "true") {
      trackEvent("quote_accepted", { source: "customer_dashboard" });
    }
  }, [params]);

  return null;
}
