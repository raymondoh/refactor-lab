"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface UniversalInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  helpText?: string;
  step?: string;
  min?: string;
  variant?: "standard" | "compact";
  className?: string;
  disabled?: boolean;
}

export const UniversalInput = forwardRef<HTMLInputElement, UniversalInputProps>(
  (
    {
      id,
      label,
      value,
      onChange,
      type = "text",
      placeholder,
      required = false,
      error,
      helpText,
      step,
      min,
      variant = "standard",
      className
    },
    ref
  ) => {
    // Your auth forms actually use the same styling as dashboard forms!
    const labelClasses = cn(
      "text-base font-semibold uppercase tracking-wide",
      variant === "compact" && "text-sm font-medium normal-case tracking-normal"
    );

    const inputClasses = cn(
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
        <Input
          ref={ref}
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          step={step}
          min={min}
          className={inputClasses}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
      </div>
    );
  }
);

UniversalInput.displayName = "UniversalInput";
