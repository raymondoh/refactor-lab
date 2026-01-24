"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function LoginRedirect() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const toastShownRef = useRef(false);

  useEffect(() => {
    // Only show the toast if we're coming from checkout and haven't shown it yet
    if (redirect === "checkout" && !toastShownRef.current) {
      toast.info("Please login to complete your purchase", {
        description: "You need to be logged in to proceed to checkout.",
        duration: 5000
      });

      // Mark that we've shown the toast
      toastShownRef.current = true;
    }

    // Clean up function to reset the ref when component unmounts
    return () => {
      // Only reset in production, keep it in development to handle StrictMode
      if (process.env.NODE_ENV === "production") {
        toastShownRef.current = false;
      }
    };
  }, [redirect]);

  return null;
}
