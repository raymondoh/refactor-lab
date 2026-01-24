"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface UniversalSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  helpText?: string;
  disabled?: boolean;
  variant?: "standard" | "compact";
  className?: string;
  options: Array<{ value: string; label: string }>;
}

export function UniversalSelect({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  disabled = false,
  variant = "standard",
  className,
  options
}: UniversalSelectProps) {
  const labelClasses = cn(
    "text-base font-semibold uppercase tracking-wide",
    variant === "compact" && "text-sm font-medium normal-case tracking-normal"
  );

  const selectClasses = cn(
    "h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary focus:border-primary",
    variant === "compact" && "h-10 text-base px-3",
    className
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={labelClasses}>
        {label}
        {required && "*"}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className={selectClasses}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
    </div>
  );
}
