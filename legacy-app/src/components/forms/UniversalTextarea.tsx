"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface UniversalTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  helpText?: string;
  rows?: number;
  variant?: "standard" | "compact";
  className?: string;
}

export function UniversalTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  rows = 3,
  variant = "standard",
  className
}: UniversalTextareaProps) {
  const labelClasses = cn(
    "text-base font-semibold uppercase tracking-wide",
    variant === "compact" && "text-sm font-medium normal-case tracking-normal"
  );

  const textareaClasses = cn(
    "min-h-[100px] text-lg px-4 py-3 border-input focus:ring-2 focus:ring-primary focus:border-primary",
    variant === "compact" && "min-h-[80px] text-base px-3 py-2",
    className
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={labelClasses}>
        {label}
        {required && "*"}
      </Label>
      <Textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={textareaClasses}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
    </div>
  );
}
