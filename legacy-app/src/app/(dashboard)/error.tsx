"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong.</h1>
      <p className="text-muted-foreground mb-6">An error occurred inside the dashboard. You can try again.</p>
      <Button onClick={() => reset()}>Try Again</Button>
    </div>
  );
}
