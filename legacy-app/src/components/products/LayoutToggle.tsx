"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Grid2X2, List } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";

type LayoutType = "grid" | "list";

interface LayoutToggleProps {
  onLayoutChange: (layout: LayoutType) => void;
}

export function LayoutToggle({ onLayoutChange }: LayoutToggleProps) {
  // Use local storage to persist user preference
  const [layout, setLayout] = useLocalStorage<LayoutType>("product-layout", "grid");

  // Call the onLayoutChange prop when layout changes
  useEffect(() => {
    onLayoutChange(layout);
  }, [layout, onLayoutChange]);

  return (
    <div className="flex items-center space-x-1 border rounded-md">
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 rounded-none rounded-l-md ${layout === "grid" ? "bg-muted" : ""}`}
        onClick={() => setLayout("grid")}
        aria-label="Grid view">
        <Grid2X2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 rounded-none rounded-r-md ${layout === "list" ? "bg-muted" : ""}`}
        onClick={() => setLayout("list")}
        aria-label="List view">
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
