// src/components/jobs/job-card.tsx
import type { ReactNode } from "react";
import type { Job } from "@/lib/types/job";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUrgencyLabel, getUrgencyColor } from "@/lib/types/job";
import { formatDateShortGB } from "@/lib/utils";
import {
  MapPin,
  Wrench,
  Flame,
  Droplet,
  Bath,
  Utensils,
  Zap,
  FileText,
  Clock,
  PoundSterling,
  Camera
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping for common service types
const serviceIcons = {
  "Boiler Repair & Installation": Flame,
  "Leak Detection & Repair": Droplet,
  "Drain Cleaning & Unblocking": Wrench,
  "Bathroom Plumbing": Bath,
  "Kitchen Plumbing": Utensils,
  "Gas Services": Flame,
  "Central Heating Systems": Flame,
  "Emergency Plumber": Zap,
  Default: Wrench
} as const;

type ServiceIconKey = keyof typeof serviceIcons;

interface JobCardProps {
  job: Job;
  className?: string;
  footerRight?: ReactNode;

  /** Show description (homepage: false, job-board: true) */
  showDescription?: boolean;
  /** How many lines of description to show when enabled */
  descriptionLines?: 2 | 3;
  /** Show a small "New" badge for recently posted jobs */
  showNewBadge?: boolean;
  /** Optional visual variant (hero cards let the parent control bg/border) */
  variant?: "default" | "hero";
}

export function JobCard({
  job,
  className,
  footerRight,
  showDescription = false,
  descriptionLines = 3,
  showNewBadge = false,
  variant = "default"
}: JobCardProps) {
  // --- Derived fields --------------------------------------------------------

  const postcode = job.location?.postcode ?? "";
  const postcodeArea = postcode.split(" ")[0] || postcode;

  const ServiceIcon = (job.serviceType && serviceIcons[job.serviceType as ServiceIconKey]) || serviceIcons.Default;

  const postedDate = formatDateShortGB(job.createdAt);
  const hasPhotos = !!(job.photos && job.photos.length > 0);

  const createdAtDate = job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt);
  const isNew = !Number.isNaN(createdAtDate.getTime()) && Date.now() - createdAtDate.getTime() < 24 * 60 * 60 * 1000;

  const descriptionClampClass = descriptionLines === 2 ? "line-clamp-2" : "line-clamp-3";

  // --- Render --------------------------------------------------------

  return (
    <Card
      className={cn(
        "group relative h-full flex flex-col",
        "transition-all duration-150 ease-in-out",
        variant === "default" && [
          "shadow-sm hover:shadow-md",
          "bg-secondary text-secondary-foreground",
          "dark:bg-[#181a20] dark:text-secondary-foreground",
          "border border-border/60 hover:border-primary/40"
        ],
        variant === "hero" && ["bg-transparent dark:bg-transparent", "border-none shadow-none"],
        className
      )}>
      {/* ✨ SHEEN OVERLAY (default variant only) */}
      {variant === "default" && (
        <div
          className="
            absolute inset-0 pointer-events-none rounded-inherit
            bg-gradient-to-br from-white/5 to-transparent
            dark:from-white/10 dark:to-transparent
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300
          "
        />
      )}

      <CardHeader className="pb-3 pt-4 px-4 relative z-10">
        {/* Title + optional 'New' pill */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="mb-1 line-clamp-2 text-lg font-semibold capitalize">{job.title}</h3>

          {showNewBadge && isNew && <Badge className="px-2 py-0.5 text-xs bg-emerald-500 text-emerald-50">New</Badge>}
        </div>

        {/* Meta info */}
        <div className="mt-1 space-y-1.5 text-sm text-muted-foreground">
          {(job.location?.town || postcodeArea) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>
                {job.location?.town}
                {job.location?.town && postcodeArea ? ", " : ""}
                {postcodeArea}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>Posted: {postedDate}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <PoundSterling className="h-4 w-4 flex-shrink-0" />
            <span>
              Budget:{" "}
              {job.budget && job.budget > 0 ? (
                `£${job.budget}`
              ) : (
                <span className="italic opacity-80">Not specified</span>
              )}
            </span>
          </div>

          {(job.quoteCount ?? 0) > 0 && (
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span>
                {job.quoteCount} quote{job.quoteCount !== 1 ? "s" : ""} received
              </span>
            </div>
          )}

          {hasPhotos && (
            <div className="flex items-center gap-1.5">
              <Camera className="h-4 w-4 flex-shrink-0" />
              <span>Photos attached</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative z-10 flex flex-col flex-grow p-4 pt-0">
        {/* Badges */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className={cn(getUrgencyColor(job.urgency))}>{getUrgencyLabel(job.urgency)}</Badge>

          {job.serviceType && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 border-border bg-card px-3 py-1 text-card-foreground">
              <ServiceIcon className="h-3 w-3" />
              <span>{job.serviceType}</span>
            </Badge>
          )}
        </div>

        {/* Optional description */}
        {showDescription && job.description && (
          <p className={cn("text-sm text-foreground", descriptionClampClass)}>{job.description}</p>
        )}

        {/* Spacer so actions sit at bottom */}
        <div className="flex-1" />

        {/* Action row */}
        {footerRight && (
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/40 pt-3">{footerRight}</div>
        )}
      </CardContent>
    </Card>
  );
}
