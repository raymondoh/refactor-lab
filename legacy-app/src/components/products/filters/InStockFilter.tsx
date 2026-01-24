"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface InStockFilterProps {
  checked: boolean;
  onToggle: () => void;
}

export function InStockFilter({ checked, onToggle }: InStockFilterProps) {
  return (
    <div className="space-y-4">
      {/* <h3 className="text-sm font-medium mb-3"></h3> */}
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="in-stock-filter" className="text-sm">
          Show in-stock items only
        </Label>
        <Switch id="in-stock-filter" checked={checked} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}
