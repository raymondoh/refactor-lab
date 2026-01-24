"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface StickySideFilterProps {
  sides: string[];
  selectedSides: string[];
  onToggle: (side: string) => void;
}

export function StickySideFilter({ sides, selectedSides, onToggle }: StickySideFilterProps) {
  if (!sides || sides.length === 0) {
    return (
      <div className="space-y-4">
        {/* <h3 className="text-sm font-medium mb-3">Sticky Side</h3> */}
        <p className="text-sm text-muted-foreground">No options available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* <h3 className="text-sm font-medium mb-3">Sticky Side</h3> */}
      <div className="space-y-2">
        {sides.map(side => (
          <div key={side} className="flex items-center space-x-2">
            <Checkbox
              id={`sticky-side-${side}`}
              checked={selectedSides.includes(side)}
              onCheckedChange={() => onToggle(side)}
            />
            <Label
              htmlFor={`sticky-side-${side}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {side}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
