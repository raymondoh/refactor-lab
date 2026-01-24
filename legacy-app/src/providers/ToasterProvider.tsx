//src/providers/ToasterProvider.tsx
"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";
import { useTheme } from "next-themes";

export function ToasterProvider() {
  const { resolvedTheme } = useTheme();

  return <SonnerToaster theme={resolvedTheme as ToasterProps["theme"]} />;
}
