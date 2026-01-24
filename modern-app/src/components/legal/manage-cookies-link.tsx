// src/components/legal/manage-cookies-link.tsx
"use client";

import { cn } from "@/lib/utils";
// Import TextButton instead of Button
import { TextButton } from "@/components/ui/text-button";
import type { VariantProps } from "class-variance-authority";
import type { buttonVariants } from "@/components/ui/button";
import type { textButtonVariants } from "@/components/ui/text-button";
import { clientLogger } from "@/lib/utils/logger";

type Props = {
  /** If true, also clears the stored choice before reopening the banner */
  reset?: boolean;
  /** Optional label; defaults to "Manage Cookies" */
  children?: React.ReactNode;
  className?: string;
  /** Accept variant prop to satisfy TypeScript at call sites (not used by TextButton) */
  variant?: VariantProps<typeof buttonVariants>["variant"] | "link" | "outline"; // <-- FIX: Added "outline"
  /** Accept size prop to satisfy TypeScript at call sites (not used by TextButton) */
  size?: VariantProps<typeof textButtonVariants>["size"];
};

export function ManageCookiesLink({
  reset = true,
  children = "Manage Cookies",
  className,
  variant: _variant, // Destructure variant to "consume" it and prevent it being passed to TextButton
  size: _size // Destructure size to "consume" it
}: Props) {
  const handleClick = () => {
    if (reset) {
      // Use try...catch for localStorage in case it's disabled (e.g., private browsing)
      try {
        localStorage.removeItem("cookie-consent");
      } catch (e) {
        clientLogger.error("Could not remove cookie consent from localStorage", e);
      }
    }
    // Signal the banner to open (banner listens for these events)
    window.dispatchEvent(new Event("open-cookie-banner"));
  };

  // The variant and size props are intentionally not passed to TextButton
  return (
    <TextButton type="button" onClick={handleClick} className={cn("cursor-pointer", className)}>
      {children}
    </TextButton>
  );
}
