// // // src/components/marketing/featured-tradespeople-hero.tsx
// // import Link from "next/link";
// // import Image from "next/image";
// // import { Star, MapPin } from "lucide-react";
// // import { Card, CardContent } from "@/components/ui/card";
// // import { Badge } from "@/components/ui/badge";
// // import { Button } from "@/components/ui/button";
// // import type { User } from "@/lib/types/user";

// // interface FeaturedTradespeopleHeroProps {
// //   tradespeople: User[];
// // }

// // export function FeaturedTradespeopleHero({ tradespeople }: FeaturedTradespeopleHeroProps) {
// //   if (!tradespeople.length) return null;

// //   // Only show up to 2 cards here
// //   const topTwo = tradespeople.slice(0, 2);

// //   return (
// //     <div className="mt-10 grid gap-6 md:grid-cols-2">
// //       {topTwo.map(tradesperson => {
// //         const subjectTier = (tradesperson.subscriptionTier ?? "basic") as "basic" | "pro" | "business";
// //         const isBusiness = subjectTier === "business";
// //         const isPro = subjectTier === "pro";
// //         const isFeatured = Boolean(tradesperson.isFeatured);

// //         const averageRating = tradesperson.avgRating ?? 0;
// //         const reviewCount = tradesperson.reviewsCount ?? 0;

// //         const rawImage = tradesperson.profilePicture || "";

// //         const profileImageSrc =
// //           process.env.NODE_ENV === "test" && rawImage.includes("firebasestorage")
// //             ? "/images/profile-pics/plumber-generic.webp"
// //             : rawImage || "/images/profile-pics/plumber-generic.webp";

// //         const primaryLabel = tradesperson.businessName || tradesperson.name || "Featured Plumber";
// //         const locationLabel =
// //           tradesperson.location?.town || tradesperson.location?.postcode || tradesperson.location?.town || "UK-based";

// //         return (
// //           <Card
// //             key={tradesperson.id}
// //             className="group relative overflow-hidden border bg-background/80 shadow-sm transition-transform transition-shadow duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg">
// //             <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/10 opacity-60 pointer-events-none" />

// //             <CardContent className="relative flex flex-col gap-4 p-5 sm:p-6">
// //               {/* Top row: Image + core info */}
// //               <div className="flex gap-4">
// //                 <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border bg-muted">
// //                   <Image src={profileImageSrc} alt={primaryLabel} fill className="object-cover" sizes="80px" />
// //                 </div>

// //                 <div className="flex-1 space-y-2">
// //                   <div className="flex flex-wrap items-center gap-2">
// //                     <h3 className="text-lg font-semibold leading-tight">{primaryLabel}</h3>
// //                     {isFeatured && (
// //                       <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/40 dark:text-amber-300">
// //                         Featured
// //                       </Badge>
// //                     )}
// //                     {isBusiness && !isFeatured && (
// //                       <Badge variant="outline" className="border-primary/40 text-primary">
// //                         Business Plan
// //                       </Badge>
// //                     )}
// //                     {isPro && !isFeatured && (
// //                       <Badge variant="outline" className="border-secondary/40 text-secondary-foreground">
// //                         Pro Plan
// //                       </Badge>
// //                     )}
// //                   </div>

// //                   <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
// //                     <div className="flex items-center gap-1.5">
// //                       <MapPin className="h-4 w-4" />
// //                       <span>{locationLabel}</span>
// //                     </div>
// //                     {reviewCount > 0 && (
// //                       <div className="flex items-center gap-1.5">
// //                         <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
// //                         <span className="font-medium">{averageRating.toFixed(1)}</span>
// //                         <span>({reviewCount} reviews)</span>
// //                       </div>
// //                     )}
// //                   </div>
// //                 </div>
// //               </div>

// //               {/* Specialties & CTA */}
// //               <div className="mt-2 flex flex-col gap-3">
// //                 {tradesperson.specialties && tradesperson.specialties.length > 0 && (
// //                   <p className="text-sm text-muted-foreground line-clamp-2">
// //                     <span className="font-medium text-foreground">Specialties:&nbsp;</span>
// //                     {tradesperson.specialties.slice(0, 3).join(" • ")}
// //                     {tradesperson.specialties.length > 3 && "…"}
// //                   </p>
// //                 )}

// //                 <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
// //                   <p className="text-xs text-muted-foreground max-w-[260px]">
// //                     Hand-picked and verified for quality, reliability, and professionalism.
// //                   </p>
// //                   <Button asChild size="sm" className="shrink-0">
// //                     <Link href={`/profile/tradesperson/${tradesperson.slug}`}>View Profile</Link>
// //                   </Button>
// //                 </div>
// //               </div>
// //             </CardContent>
// //           </Card>
// //         );
// //       })}
// //     </div>
// //   );
// // }
// // src/components/marketing/featured-tradespeople-hero.tsx
// import Link from "next/link";
// import Image from "next/image";
// import { Star, MapPin } from "lucide-react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import type { User } from "@/lib/types/user";

// interface FeaturedTradespeopleHeroProps {
//   tradespeople: User[];
// }

// export function FeaturedTradespeopleHero({ tradespeople }: FeaturedTradespeopleHeroProps) {
//   if (!tradespeople.length) return null;

//   // Only show up to 2 cards here
//   const topTwo = tradespeople.slice(0, 2);

//   return (
//     <div className="mt-10 grid gap-6 md:grid-cols-2">
//       {topTwo.map(tradesperson => {
//         const subjectTier = (tradesperson.subscriptionTier ?? "basic") as "basic" | "pro" | "business";
//         const isBusiness = subjectTier === "business";
//         const isPro = subjectTier === "pro";
//         const isFeatured = Boolean(tradesperson.isFeatured);

//         const averageRating = tradesperson.avgRating ?? 0;
//         const reviewCount = tradesperson.reviewsCount ?? 0;

//         const rawImage = tradesperson.profilePicture || "";

//         const profileImageSrc =
//           process.env.NODE_ENV === "test" && rawImage.includes("firebasestorage")
//             ? "/images/profile-pics/plumber-generic.webp"
//             : rawImage || "/images/profile-pics/plumber-generic.webp";

//         const primaryLabel = tradesperson.businessName || tradesperson.name || "Featured Plumber";
//         const locationLabel = tradesperson.location?.town || tradesperson.location?.postcode || "UK-based";

//         return (
//           <Card
//             key={tradesperson.id}
//             className="
//               group relative overflow-hidden rounded-2xl
//               border border-border/70
//               bg-background text-foreground
//               dark:bg-[#1c1a2e] dark:text-foreground dark:border-white/10
//               shadow-sm dark:shadow-[0_0_20px_-5px_rgba(0,0,0,0.6)]
//               transition-transform transition-shadow duration-200
//               hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg
//             ">
//             <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/10 opacity-60" />

//             <CardContent className="relative flex flex-col gap-4 p-5 sm:p-6">
//               {/* Top row: Image + core info */}
//               <div className="flex gap-4">
//                 <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border bg-muted">
//                   <Image src={profileImageSrc} alt={primaryLabel} fill className="object-cover" sizes="80px" />
//                 </div>

//                 <div className="flex-1 space-y-2">
//                   <div className="flex flex-wrap items-center gap-2">
//                     <h3 className="text-lg font-semibold leading-tight">{primaryLabel}</h3>
//                     {isFeatured && (
//                       <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
//                         Featured
//                       </Badge>
//                     )}
//                     {isBusiness && !isFeatured && (
//                       <Badge variant="outline" className="border-primary/40 text-primary">
//                         Business Plan
//                       </Badge>
//                     )}
//                     {isPro && !isFeatured && (
//                       <Badge variant="outline" className="border-secondary/40 text-secondary-foreground">
//                         Pro Plan
//                       </Badge>
//                     )}
//                   </div>

//                   <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
//                     <div className="flex items-center gap-1.5">
//                       <MapPin className="h-4 w-4" />
//                       <span>{locationLabel}</span>
//                     </div>
//                     {reviewCount > 0 && (
//                       <div className="flex items-center gap-1.5">
//                         <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
//                         <span className="font-medium">{averageRating.toFixed(1)}</span>
//                         <span>({reviewCount} reviews)</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Specialties & CTA */}
//               <div className="mt-2 flex flex-col gap-3">
//                 {tradesperson.specialties && tradesperson.specialties.length > 0 && (
//                   <p className="line-clamp-2 text-sm text-muted-foreground">
//                     <span className="text-foreground font-medium">Specialties:&nbsp;</span>
//                     {tradesperson.specialties.slice(0, 3).join(" • ")}
//                     {tradesperson.specialties.length > 3 && "…"}
//                   </p>
//                 )}

//                 <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
//                   <p className="max-w-[260px] text-xs text-muted-foreground">
//                     Hand-picked and verified for quality, reliability, and professionalism.
//                   </p>
//                   <Button asChild size="sm" className="shrink-0">
//                     <Link href={`/profile/tradesperson/${tradesperson.slug}`}>View Profile</Link>
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
// src/components/marketing/featured-tradespeople-hero.tsx
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types/user";

interface FeaturedTradespeopleHeroProps {
  tradespeople: User[];
}

export function FeaturedTradespeopleHero({ tradespeople }: FeaturedTradespeopleHeroProps) {
  if (!tradespeople.length) return null;

  // Only show up to 2 cards here
  const topTwo = tradespeople.slice(0, 2);

  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      {topTwo.map(tradesperson => {
        const subjectTier = (tradesperson.subscriptionTier ?? "basic") as "basic" | "pro" | "business";
        const isBusiness = subjectTier === "business";
        const isPro = subjectTier === "pro";
        const isFeatured = Boolean(tradesperson.isFeatured);

        const averageRating = tradesperson.avgRating ?? 0;
        const reviewCount = tradesperson.reviewsCount ?? 0;

        const rawImage = tradesperson.profilePicture || "";

        const profileImageSrc =
          process.env.NODE_ENV === "test" && rawImage.includes("firebasestorage")
            ? "/images/profile-pics/plumber-generic.webp"
            : rawImage || "/images/profile-pics/plumber-generic.webp";

        const primaryLabel = tradesperson.businessName || tradesperson.name || "Featured Plumber";

        const town = tradesperson.location?.town;
        const postcode = tradesperson.location?.postcode;
        const locationLabel = town || postcode || "UK-based";

        return (
          <Card
            key={tradesperson.id}
            className="
              group relative overflow-hidden rounded-2xl
              border border-border/70
              bg-background text-foreground
              dark:bg-[#1c1a2e] dark:text-foreground dark:border-white/10
              shadow-sm dark:shadow-[0_0_20px_-5px_rgba(0,0,0,0.6)]
              transition-transform transition-shadow duration-200
              hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg
            ">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/10 opacity-60" />

            <CardContent className="relative flex flex-col gap-4 p-5 sm:p-6">
              {/* Top row: Image + core info */}
              <div className="flex gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border bg-muted">
                  <Image src={profileImageSrc} alt={primaryLabel} fill className="object-cover" sizes="80px" />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold leading-tight capitalize">{primaryLabel}</h3>

                    {isFeatured && (
                      <Badge className="border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        Featured
                      </Badge>
                    )}

                    {isBusiness && !isFeatured && (
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        Business Plan
                      </Badge>
                    )}

                    {isPro && !isFeatured && (
                      <Badge variant="outline" className="border-secondary/40 text-secondary-foreground">
                        Pro Plan
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{locationLabel}</span>
                    </div>
                    {reviewCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{averageRating.toFixed(1)}</span>
                        <span>({reviewCount} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Specialties & CTA */}
              <div className="mt-2 flex flex-col gap-3">
                {tradesperson.specialties && tradesperson.specialties.length > 0 && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Specialties:&nbsp;</span>
                    {tradesperson.specialties.slice(0, 3).join(" • ")}
                    {tradesperson.specialties.length > 3 && "…"}
                  </p>
                )}

                <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-[260px] text-xs text-muted-foreground">
                    Hand-picked and verified for quality, reliability, and professionalism.
                  </p>
                  <Button asChild size="sm" className="shrink-0">
                    <Link href={`/profile/tradesperson/${tradesperson.slug}`}>View Profile</Link>
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
