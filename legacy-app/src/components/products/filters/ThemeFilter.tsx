"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ThemeFilterProps {
  themes: string[];
  selectedThemes: string[];
  onToggle: (theme: string) => void;
}

export function ThemeFilter({ themes, selectedThemes, onToggle }: ThemeFilterProps) {
  if (!themes || themes.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">No design themes available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {themes.map(theme => (
          <div key={theme} className="flex items-center space-x-2">
            <Checkbox
              id={`theme-${theme}`}
              checked={selectedThemes.includes(theme)}
              onCheckedChange={() => onToggle(theme)}
            />
            <Label
              htmlFor={`theme-${theme}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {theme}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
