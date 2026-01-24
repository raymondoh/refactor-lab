"use client";

import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface ColorFilterProps {
  colors: string[];
  selectedColors: string[];
  onToggle: (color: string) => void;
}

// Map color names to CSS color values
const colorMap: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  black: "bg-black",
  white: "bg-white",
  yellow: "bg-yellow-400",
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  gray: "bg-gray-500",
  grey: "bg-gray-500", // Alternative spelling
  brown: "bg-amber-800",
  silver: "bg-gray-300",
  gold: "bg-amber-400",
  bronze: "bg-amber-600",
  copper: "bg-amber-700",
  chrome: "bg-slate-300",
  clear: "bg-transparent border-dashed",
  transparent: "bg-transparent border-dashed"
  // Add more colors as needed
};

// Map for display names (capitalize first letter)
function getDisplayName(color: string): string {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

export function ColorFilter({ colors, selectedColors, onToggle }: ColorFilterProps) {
  if (!colors || colors.length === 0) {
    return (
      <div className="space-y-4">
        {/* <h3 className="text-sm font-medium mb-3">Colorssss</h3> */}
        <p className="text-sm text-muted-foreground">No colors available</p>
      </div>
    );
  }

  // Helper function to get the CSS class for a color
  const getColorClass = (color: string): string => {
    const lowerColor = color.toLowerCase();
    return colorMap[lowerColor] || "bg-gray-200"; // Fallback color
  };

  return (
    <div className="space-y-4">
      {/* <h3 className="text-sm font-medium mb-3">Color</h3> */}
      <div className="flex flex-wrap gap-2">
        {colors.map(color => {
          const isSelected = selectedColors.includes(color);
          return (
            <button
              key={color}
              onClick={() => onToggle(color)}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border",
                getColorClass(color),
                isSelected ? "ring-2 ring-offset-2 ring-primary" : "ring-0",
                ["white", "clear", "transparent"].includes(color.toLowerCase())
                  ? "border-gray-200"
                  : "border-transparent"
              )}
              title={getDisplayName(color)}
              aria-label={`Filter by ${getDisplayName(color)}`}
              aria-pressed={isSelected}>
              {isSelected && (
                <CheckIcon
                  className={cn(
                    "h-4 w-4",
                    ["white", "yellow", "clear", "transparent"].includes(color.toLowerCase())
                      ? "text-black"
                      : "text-white"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
