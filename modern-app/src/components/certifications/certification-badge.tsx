"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Certification } from "@/lib/types/certification";
import type { LucideIcon } from "lucide-react";
import { BadgeCheck, Flame, ShieldCheck, Droplet, Award } from "lucide-react";

const CERT_BADGES: Record<string, { label: string; icon: LucideIcon; className: string }> = {
  "gas-safe": {
    label: "Gas Safe",
    icon: Flame,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  "city-and-guilds": {
    label: "City & Guilds",
    icon: Award,
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  ciphe: {
    label: "CIPHE",
    icon: ShieldCheck,
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  watersafe: {
    label: "WaterSafe",
    icon: Droplet,
    className: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
  aphc: {
    label: "APHC",
    icon: BadgeCheck,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  snipef: {
    label: "SNIPEF",
    icon: BadgeCheck,
    className: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
};

export function CertificationBadge({ cert }: { cert: Certification }) {
  const meta =
    CERT_BADGES[cert.issuingBody] || {
      label: cert.name,
      icon: BadgeCheck,
      className: "bg-green-100 text-green-800 border-green-200",
    };
  const Icon = meta.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={cn(meta.className, "flex items-center gap-1")}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{`${cert.name} – ${cert.issuingBody}`}</TooltipContent>
    </Tooltip>
  );
}

export { CERT_BADGES };

