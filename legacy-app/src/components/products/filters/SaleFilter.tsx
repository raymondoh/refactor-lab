"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SaleFilterProps {
  checked: boolean;
  onToggle: () => void;
}

export function SaleFilter({ checked, onToggle }: SaleFilterProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="on-sale-filter" className="text-sm">
          Show on-sale items only
        </Label>
        <Switch id="on-sale-filter" checked={checked} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}
