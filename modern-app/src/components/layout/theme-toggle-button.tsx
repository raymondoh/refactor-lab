"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggleButton() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering UI based on theme
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render a placeholder or null during SSR/hydration mismatch phase
    return <div className="h-6 w-6 animate-pulse rounded-md bg-muted"></div>; // Or Button variant="ghost" size="icon" disabled
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button variant="primary" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="h-7 w-7">
      {resolvedTheme === "dark" ? (
        <Sun className="h-2 w-2" /> // <-- 2. Make the icon smaller
      ) : (
        <Moon className="h-2 w-2" /> // <-- 2. Make the icon smaller
      )}
    </Button>
  );
}
