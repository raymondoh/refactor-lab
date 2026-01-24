// src/components/subscriptions/manage-subscription-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ManageSubscriptionButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const res = await fetch("/api/stripe/portal", { method: "POST" });

      if (!res.ok) {
        throw new Error("Failed to open billing portal");
      }

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error || "Billing portal unavailable");
      }
    } catch (err) {
      toast.error("Unable to open billing portal", {
        description: err instanceof Error ? err.message : "Please try again in a moment."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" className={className} onClick={onClick} disabled={loading}>
      {loading ? "Opening…" : "Manage subscription"}
    </Button>
  );
}
