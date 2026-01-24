// src/components/admin/feature-user-button.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Star, StarOff } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/types/user";

export function FeatureUserButton({ user }: { user: User }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleFeature = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const newFeaturedStatus = !user.isFeatured;

    try {
      const response = await fetch("/api/admin/users/feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          isFeatured: newFeaturedStatus
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user status.");
      }

      toast.success(`User ${newFeaturedStatus ? "featured" : "unfeatured"} successfully.`);
      router.refresh(); // Refreshes the server components to show the updated status
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- START MODIFICATION ---
  // Allow featuring if the role is 'tradesperson' OR 'business_owner'
  if (user.role !== "tradesperson" && user.role !== "business_owner") {
    return null;
  }
  // --- END MODIFICATION ---

  return (
    <DropdownMenuItem
      onSelect={e => {
        e.preventDefault();
        handleToggleFeature();
      }}
      disabled={isSubmitting}
      className="cursor-pointer">
      {user.isFeatured ? <StarOff className="mr-2 h-4 w-4" /> : <Star className="mr-2 h-4 w-4" />}
      <span>{user.isFeatured ? "Remove from Homepage" : "Feature on Homepage"}</span>
    </DropdownMenuItem>
  );
}
