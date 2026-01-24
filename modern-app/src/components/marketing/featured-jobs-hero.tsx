// // src/components/marketing/featured-jobs-hero.tsx
// import Link from "next/link";
// import {
//   Wrench,
//   Flame,
//   Droplet,
//   Bath,
//   Utensils,
//   Zap,
//   MapPin,
//   Clock,
//   PoundSterling,
//   FileText,
//   Camera
// } from "lucide-react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import type { Job } from "@/lib/types/job";
// import { getUrgencyColor, getUrgencyLabel } from "@/lib/types/job";
// import { formatDateShortGB } from "@/lib/utils";

// // Reuse same icon mapping
// const serviceIcons = {
//   "Boiler Repair & Installation": Flame,
//   "Leak Detection & Repair": Droplet,
//   "Drain Cleaning & Unblocking": Wrench,
//   "Bathroom Plumbing": Bath,
//   "Kitchen Plumbing": Utensils,
//   "Gas Services": Flame,
//   "Central Heating Systems": Flame,
//   "Emergency Plumber": Zap,
//   Default: Wrench
// } as const;

// type ServiceIconKey = keyof typeof serviceIcons;

// interface FeaturedJobsHeroProps {
//   jobs: Job[];
// }

// export function FeaturedJobsHero({ jobs }: FeaturedJobsHeroProps) {
//   if (!jobs.length) return null;

//   // Only show up to 2 cards here
//   const topTwo = jobs.slice(0, 2);

//   return (
//     <div className="mt-10 grid gap-6 md:grid-cols-2">
//       {topTwo.map(job => {
//         const Icon =
//           (job.serviceType && serviceIcons[job.serviceType as ServiceIconKey as keyof typeof serviceIcons]) ||
//           serviceIcons.Default;

//         const postcode = job.location?.postcode ?? "";
//         const postcodeArea = postcode.split(" ")[0] || postcode;
//         const town = job.location?.town;
//         const locationLabel = town || postcodeArea || "UK-based";

//         const postedDate = formatDateShortGB(job.createdAt);
//         const hasPhotos = !!(job.photos && job.photos.length > 0);

//         const createdAtDate = job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt);
//         const isNew =
//           !Number.isNaN(createdAtDate.getTime()) && Date.now() - createdAtDate.getTime() < 24 * 60 * 60 * 1000;

//         return (
//           <Card
//             key={job.id}
//             className="
//               group relative overflow-hidden rounded-2xl
//               border border-border/70
//               bg-background text-foreground
//               dark:bg-[#1c1a2e] dark:text-foreground dark:border-white/10
//               shadow-sm dark:shadow-[0_0_20px_-5px_rgba(0,0,0,0.6)]
//               transition-transform transition-shadow duration-200
//               hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg
//             ">
//             {/* gradient like featured tradespeople */}
//             <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/10 opacity-60" />

//             <CardContent className="relative flex flex-col gap-4 p-5 sm:p-6">
//               {/* Top row: Icon + Title + Recently posted */}
//               <div className="flex gap-4">
//                 {/* Icon on the left */}
//                 <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border bg-muted flex items-center justify-center">
//                   <Icon className="h-9 w-9 text-primary" />
//                 </div>

//                 <div className="flex-1 space-y-2">
//                   <div className="flex items-start justify-between gap-2">
//                     <h3 className="text-lg font-semibold leading-tight line-clamp-2">{job.title}</h3>

//                     <div className="flex flex-col items-end gap-1">
//                       <Badge className="bg-amber-500/90 text-amber-50 shadow-sm">Recently posted</Badge>
//                       {isNew && <span className="text-xs text-emerald-500">New in last 24h</span>}
//                     </div>
//                   </div>

//                   <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
//                     {locationLabel && (
//                       <div className="flex items-center gap-1.5">
//                         <MapPin className="h-4 w-4" />
//                         <span>
//                           {town}
//                           {town && postcodeArea ? ", " : ""}
//                           {postcodeArea}
//                         </span>
//                       </div>
//                     )}

//                     <div className="flex items-center gap-1.5">
//                       <Clock className="h-4 w-4" />
//                       <span>Posted: {postedDate}</span>
//                     </div>

//                     <div className="flex items-center gap-1.5">
//                       <PoundSterling className="h-4 w-4" />
//                       <span>
//                         Budget:{" "}
//                         {job.budget && job.budget > 0 ? (
//                           `£${job.budget}`
//                         ) : (
//                           <span className="italic opacity-80">Not specified</span>
//                         )}
//                       </span>
//                     </div>

//                     {(job.quoteCount ?? 0) > 0 && (
//                       <div className="flex items-center gap-1.5">
//                         <FileText className="h-4 w-4" />
//                         <span>
//                           {job.quoteCount} quote{job.quoteCount !== 1 ? "s" : ""} received
//                         </span>
//                       </div>
//                     )}

//                     {hasPhotos && (
//                       <div className="flex items-center gap-1.5">
//                         <Camera className="h-4 w-4" />
//                         <span>Photos attached</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Badges & CTA */}
//               <div className="mt-2 flex flex-col gap-3">
//                 <div className="flex flex-wrap items-center gap-2">
//                   <div className="relative">
//                     {job.urgency === "emergency" && (
//                       <div
//                         className="
//       absolute inset-0 -z-10
//       bg-gradient-to-r from-red-500/40 via-orange-500/30 to-yellow-400/20
//       blur-xl opacity-70
//     "
//                       />
//                     )}

//                     <Badge className={getUrgencyColor(job.urgency)}>{getUrgencyLabel(job.urgency)}</Badge>
//                   </div>
//                 </div>

//                 <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
//                   <p className="max-w-[260px] text-xs text-muted-foreground">
//                     Highlighted for urgency, budget, and availability to quote.
//                   </p>
//                   <Button asChild size="sm" className="shrink-0">
//                     <Link href={`/dashboard/tradesperson/job-board/${job.id}`}>View Job</Link>
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         );
//       })}
//     </div>
//   );
// }
// src/components/marketing/featured-jobs-hero.tsx
import Link from "next/link";
import {
  Wrench,
  Flame,
  Droplet,
  Bath,
  Utensils,
  Zap,
  MapPin,
  Clock,
  PoundSterling,
  FileText,
  Camera
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Job } from "@/lib/types/job";
import { getUrgencyColor, getUrgencyLabel } from "@/lib/types/job";
import { formatDateShortGB } from "@/lib/utils";

// Reuse same icon mapping
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

interface FeaturedJobsHeroProps {
  jobs: Job[];
}

export function FeaturedJobsHero({ jobs }: FeaturedJobsHeroProps) {
  if (!jobs.length) return null;

  // Only show up to 2 cards here
  const topTwo = jobs.slice(0, 2);

  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      {topTwo.map(job => {
        const Icon =
          (job.serviceType && serviceIcons[job.serviceType as ServiceIconKey as keyof typeof serviceIcons]) ||
          serviceIcons.Default;

        const postcode = job.location?.postcode ?? "";
        const postcodeArea = postcode.split(" ")[0] || postcode;
        const town = job.location?.town;
        const locationLabel = town || postcodeArea || "UK-based";

        const postedDate = formatDateShortGB(job.createdAt);
        const hasPhotos = !!(job.photos && job.photos.length > 0);

        const createdAtDate = job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt);
        const isNew =
          !Number.isNaN(createdAtDate.getTime()) && Date.now() - createdAtDate.getTime() < 24 * 60 * 60 * 1000;

        return (
          <Card
            key={job.id}
            className="
              group relative overflow-hidden rounded-2xl
              border border-border/70
              bg-background text-foreground
              dark:bg-[#1c1a2e] dark:text-foreground dark:border-white/10
              shadow-sm dark:shadow-[0_0_20px_-5px_rgba(0,0,0,0.6)]
              transition-transform transition-shadow duration-200
              hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg
            ">
            {/* gradient like featured tradespeople */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/10 opacity-60" />

            <CardContent className="relative flex flex-col gap-4 p-5 sm:p-6">
              {/* Top row: Icon + Title + Recently posted */}
              <div className="flex gap-4">
                {/* Icon on the left */}
                <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted">
                  <Icon className="h-9 w-9 text-primary" />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-lg font-semibold leading-tight capitalize">{job.title}</h3>

                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        className="
                          px-2 py-0.5 text-xs
                          border border-amber-500/40
                          bg-amber-500/10
                          text-amber-700
                          dark:text-amber-300
                        ">
                        Recently posted
                      </Badge>
                      {isNew && <span className="text-xs text-emerald-500">New in last 24h</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {locationLabel && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {town}
                          {town && postcodeArea ? ", " : ""}
                          {postcodeArea}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>Posted: {postedDate}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <PoundSterling className="h-4 w-4" />
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
                        <FileText className="h-4 w-4" />
                        <span>
                          {job.quoteCount} quote{job.quoteCount !== 1 ? "s" : ""} received
                        </span>
                      </div>
                    )}

                    {hasPhotos && (
                      <div className="flex items-center gap-1.5">
                        <Camera className="h-4 w-4" />
                        <span>Photos attached</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Badges & CTA */}
              <div className="mt-2 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    {job.urgency === "emergency" && (
                      <div
                        className="
                          absolute inset-0 -z-10
                          bg-gradient-to-r from-red-500/40 via-orange-500/30 to-yellow-400/20
                          blur-xl opacity-70
                        "
                      />
                    )}

                    <Badge className={getUrgencyColor(job.urgency)}>{getUrgencyLabel(job.urgency)}</Badge>
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-[260px] text-xs text-muted-foreground">
                    Highlighted for urgency, budget, and availability to quote.
                  </p>
                  <Button asChild size="sm" className="shrink-0">
                    <Link href={`/dashboard/tradesperson/job-board/${job.id}`}>View Job</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
