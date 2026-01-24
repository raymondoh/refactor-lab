"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface UniversalPasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  helpText?: string;
  variant?: "standard" | "compact";
  className?: string;
  showToggle?: boolean;
  showLabel?: boolean;
}

export function UniversalPasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Enter your password",
  required = false,
  error,
  helpText,
  variant = "standard",
  className,
  showToggle = true,
  showLabel = true
}: UniversalPasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const labelClasses = cn(
    "text-base font-semibold uppercase tracking-wide",
    variant === "compact" && "text-sm font-medium normal-case tracking-normal"
  );

  const inputClasses = cn(
    "h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary focus:border-primary",
    variant === "compact" && "h-10 text-base px-3",
    showToggle && "pr-12",
    className
  );

  return (
    <div className="space-y-2">
      {showLabel && label && (
        <Label htmlFor={id} className={labelClasses}>
          {label}
          {required && "*"}
        </Label>
      )}
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={inputClasses}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 px-4 flex items-center justify-center text-muted-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
    </div>
  );
}
