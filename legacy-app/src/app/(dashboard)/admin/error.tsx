"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin Layout Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md space-y-4">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Something went wrong in the Admin area.</h2>
        <p className="text-muted-foreground">Please try again or contact an administrator.</p>
        <Button onClick={() => reset()}>Try Again</Button>
      </div>
    </div>
  );
}
