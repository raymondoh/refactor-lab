// src/components/dashboard/getting-started-checklist.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, Circle, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types/user";

interface GettingStartedChecklistProps {
  user:
    | (User & {
        stripeOnboardingComplete?: boolean | null;
        stripeChargesEnabled?: boolean | null;
      })
    | null;
  hasQuoted?: boolean; // <-- ADDED
}

interface ChecklistItem {
  id: string;
  title: string;
  href?: string;
  completed: boolean;
  description?: string;
  actionType?: "link" | "managePayouts";
}

export default function GettingStartedChecklist({ user, hasQuoted }: GettingStartedChecklistProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState(false);

  const storageKey = useMemo(() => (user?.id ? `gettingStartedDismissed_${user.id}` : null), [user?.id]);

  const profileCompleted = Boolean(user?.onboardingComplete);
  // Consider payouts complete only when Stripe confirms onboarding/charges are enabled.
  const payoutsCompleted = Boolean(user?.stripeOnboardingComplete || user?.stripeChargesEnabled);
  // --- THIS IS THE FIX --- The final item is now dynamic
  const hasFoundJob = Boolean(hasQuoted || user?.hasSubmittedQuote);

  useEffect(() => {
    // FIX: Added explicit check for window.localStorage
    if (!storageKey || typeof window === "undefined" || !window.localStorage) return;
    const dismissed = window.localStorage.getItem(storageKey);
    setIsOpen(dismissed !== "true");
  }, [storageKey]);

  // Auto-close the checklist when all items are complete
  useEffect(() => {
    if (profileCompleted && payoutsCompleted && hasFoundJob) {
      setIsOpen(false);
    }
  }, [profileCompleted, payoutsCompleted, hasFoundJob]);

  const handleDismiss = useCallback(() => {
    // FIX: Added explicit check for window.localStorage to resolve TS2339
    if (storageKey && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(storageKey, "true");
    }
    setIsOpen(false);
  }, [storageKey]);

  const handleManagePayouts = useCallback(async () => {
    setPayoutLoading(true);
    try {
      const res = await fetch("/api/stripe/connect/link", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not create Stripe link.", {
          description: data.error || "Please try again."
        });
      }
    } catch (err) {
      toast.error("An unexpected error occurred.", {
        description: err instanceof Error ? err.message : "Please try again later."
      });
    } finally {
      setPayoutLoading(false);
    }
  }, []);

  const items: ChecklistItem[] = useMemo(
    () => [
      {
        id: "profile",
        title: "Complete Your Profile",
        href: "/dashboard/tradesperson/profile/edit",
        completed: profileCompleted,
        actionType: "link"
      },
      {
        id: "payouts",
        title: "Set Up Payouts with Stripe",
        completed: payoutsCompleted,
        actionType: "managePayouts"
      },
      {
        id: "job",
        title: "Find and Quote Your First Job",
        href: "/dashboard/tradesperson/job-board",
        completed: hasFoundJob,
        actionType: "link"
      }
    ],
    [profileCompleted, payoutsCompleted, hasFoundJob]
  );

  if (!user) {
    return null;
  }

  if (!isOpen || (profileCompleted && payoutsCompleted && hasFoundJob)) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Complete these steps to make the most of your new account.</CardDescription>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground rounded-md p-1"
          aria-label="Dismiss getting started checklist">
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map(item => {
            const isCompleted = item.completed;
            const Icon = isCompleted ? CheckCircle : Circle;
            const commonClasses =
              "flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
            const textClasses = cn("font-medium", isCompleted && "line-through text-muted-foreground");

            if (item.actionType === "managePayouts") {
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={handleManagePayouts}
                    disabled={payoutLoading}
                    className={cn(commonClasses, "disabled:opacity-70")}>
                    <span className="flex items-center gap-3">
                      <Icon className={cn("h-5 w-5", isCompleted ? "text-primary" : "text-muted-foreground")} />
                      <span className={textClasses}>{item.title}</span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {payoutLoading ? "Redirecting..." : isCompleted ? "Manage" : "Set up"}
                    </span>
                  </button>
                </li>
              );
            }

            return (
              <li key={item.id}>
                <Link href={item.href ?? "#"} className={cn(commonClasses, "no-underline")}>
                  <span className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5", isCompleted ? "text-primary" : "text-muted-foreground")} />
                    <span className={textClasses}>{item.title}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">Go</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
