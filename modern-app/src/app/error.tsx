"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { clientLogger } from "@/lib/utils/logger";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to a client-side logger or 3rd-party tracking
    clientLogger.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-6">
        An unexpected error occurred. You can try again or choose another option below.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        {/* TRY AGAIN BUTTON */}
        <Button onClick={() => reset()}>Try Again</Button>

        {/* GO TO DASHBOARD */}
        <Button variant="secondary" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>

        {/* CONTACT SUPPORT */}
        <Button variant="ghost" asChild>
          <Link href="/contact">Contact Support</Link>
        </Button>
      </div>

      {/* Optional dev diagnostic block */}
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-8 p-4 bg-muted rounded-md text-left text-sm max-w-lg overflow-auto">{error?.message}</pre>
      )}
    </div>
  );
}
