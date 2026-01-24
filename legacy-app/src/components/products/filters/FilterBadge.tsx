"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FilterBadgeProps {
  label: string;
  onRemove: () => void;
  className?: string;
}

export function FilterBadge({ label, onRemove, className }: FilterBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary",
        className
      )}>
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 rounded-full p-0.5 hover:bg-primary/20 transition-colors">
        <X className="h-3 w-3" />
        <span className="sr-only">Remove filter</span>
      </button>
    </motion.div>
  );
}
