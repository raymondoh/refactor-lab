// src/components/jobs/save-job-button.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { clientLogger } from "@/lib/utils/logger";

// ✅ NEW: tier logic comes from subscription/tier (single source of truth)
import { asTier, meets, type Tier } from "@/lib/subscription/tier";

// Local cn helper (kept intentionally client-side)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Core button variants from ButtonProps
type CoreButtonVariant = Exclude<ButtonProps["variant"], null | undefined>;

// SaveJobButton can accept all core variants + a special "outline" visual style
type SaveJobButtonVariant = CoreButtonVariant | "outline";

interface SaveJobButtonProps {
  jobId: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  allowRemove?: boolean;
  tierOverride?: Tier;
  showUpsell?: boolean;
  variant?: SaveJobButtonVariant;
}

export function SaveJobButton({
  jobId,
  className,
  size = "default",
  allowRemove = false,
  tierOverride,
  showUpsell = false,
  variant = "outline"
}: SaveJobButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const sessionTier = asTier(session?.user?.subscriptionTier);
  const tier = tierOverride ? asTier(tierOverride) : sessionTier;
  const canSave = meets("pro", tier);

  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Map "outline" style to the same look as navbar CTA
  const isOutlineStyle = variant === "outline";
  const buttonVariant: CoreButtonVariant = isOutlineStyle ? "subtle" : variant;
  const styleClasses = isOutlineStyle ? "border border-primary text-primary hover:bg-primary/10" : "";

  const baseClasses = cn(styleClasses, className);

  // Check if job is already saved
  useEffect(() => {
    if (!canSave) {
      setIsInitializing(false);
      return;
    }

    async function checkSavedStatus() {
      try {
        const response = await fetch("/api/jobs/save");
        if (response.ok) {
          const data = await response.json();
          setIsSaved((data.savedJobs as string[]).includes(jobId));
        }
      } catch (error) {
        clientLogger.error("Error checking saved status:", error);
      } finally {
        setIsInitializing(false);
      }
    }

    checkSavedStatus();
  }, [jobId, canSave]);

  const toggleSaved = async () => {
    if (isSaved && !allowRemove) return;

    setIsLoading(true);
    try {
      const method = isSaved ? "DELETE" : "POST";
      const response = await fetch("/api/jobs/save", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update saved status");
      }

      const wasSaved = isSaved;
      setIsSaved(!isSaved);

      toast.success(wasSaved ? "Job removed from saved jobs" : "Job saved successfully", {
        description: wasSaved
          ? "This job has been removed from your saved jobs."
          : "This job has been added to your saved jobs."
      });

      if (wasSaved && allowRemove) {
        router.refresh();
      }
    } catch (error) {
      toast.error("Error", {
        description: (error as Error).message || "Something went wrong. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canSave) {
    return showUpsell ? (
      <Button variant={buttonVariant} size={size} className={baseClasses} asChild>
        <Link href="/pricing">
          <Bookmark className="mr-2 h-4 w-4" />
          Upgrade to save
        </Link>
      </Button>
    ) : null;
  }

  if (isInitializing) {
    return (
      <Button variant={buttonVariant} size={size} className={baseClasses} disabled>
        <Bookmark className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  return (
    <Button
      variant={buttonVariant}
      size={size}
      className={baseClasses}
      onClick={toggleSaved}
      disabled={isLoading || (isSaved && !allowRemove)}>
      {isSaved ? (
        allowRemove ? (
          <>
            <BookmarkCheck className="mr-2 h-4 w-4" />
            {isLoading ? "Removing..." : "Remove Job"}
          </>
        ) : (
          <>
            <BookmarkCheck className="mr-2 h-4 w-4" />
            Saved
          </>
        )
      ) : (
        <>
          <Bookmark className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : "Save Job"}
        </>
      )}
    </Button>
  );
}
