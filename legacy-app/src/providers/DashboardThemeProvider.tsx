//src/providers/DashboardThemeProvider.tsx
"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Define which routes are considered dashboard routes
  const isDashboardRoute = pathname.startsWith("/admin") || pathname.startsWith("/user");

  // After hydration, we can safely show the UI with the resolved theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // We'll wrap the children with a div that has the dashboard-theme class
  // but only apply the data-theme attribute after mounting to prevent hydration mismatch
  if (isDashboardRoute) {
    return (
      <div className="dashboard-theme" data-theme={mounted ? resolvedTheme : undefined}>
        {children}
      </div>
    );
  }

  // For non-dashboard routes, just render the children as-is
  return <>{children}</>;
}
