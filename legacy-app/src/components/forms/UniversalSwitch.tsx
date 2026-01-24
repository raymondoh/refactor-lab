"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface UniversalSwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  helpText?: string;
  disabled?: boolean;
}

export function UniversalSwitch({ id, label, checked, onChange, helpText, disabled = false }: UniversalSwitchProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-base font-medium uppercase tracking-wide">
          {label}
        </Label>
        <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
      </div>
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}
