"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface MaterialFilterProps {
  materials: string[];
  selectedMaterials: string[];
  onToggle: (material: string) => void;
}

export function MaterialFilter({ materials, selectedMaterials, onToggle }: MaterialFilterProps) {
  if (!materials || materials.length === 0) {
    return (
      <div className="space-y-4">
        {/* <h3 className="text-sm font-medium mb-3">Material</h3> */}
        <p className="text-sm text-muted-foreground">No materials available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* <h3 className="text-sm font-medium mb-3">Material</h3> */}
      <div className="space-y-2">
        {materials.map(material => (
          <div key={material} className="flex items-center space-x-2">
            <Checkbox
              id={`material-${material}`}
              checked={selectedMaterials.includes(material)}
              onCheckedChange={() => onToggle(material)}
            />
            <Label
              htmlFor={`material-${material}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {material}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
