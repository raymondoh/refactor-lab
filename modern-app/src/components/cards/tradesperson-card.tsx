// src/components/cards/tradesperson-card.tsx
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types/user";
import { CertificationBadge } from "@/components/certifications/certification-badge";
import { FavoriteButton } from "@/components/favorites/favorite-button";

interface TradespersonCardProps {
  tradesperson: User;
}

export function TradespersonCard({ tradesperson }: TradespersonCardProps) {
  const subjectTier = (tradesperson.subscriptionTier ?? "basic") as "basic" | "pro" | "business";
  const canShowBadges = subjectTier === "pro" || subjectTier === "business";

  const certificationsArray = Array.isArray(tradesperson.certifications) ? tradesperson.certifications : [];
  const verifiedCerts = certificationsArray.filter(cert => cert && cert.verified);

  const averageRating = tradesperson.avgRating ?? 0;
  const reviewCount = tradesperson.reviewsCount ?? 0;

  const rawImage = tradesperson.profilePicture || "";
  const profileImageSrc =
    process.env.NODE_ENV === "test" && rawImage.includes("firebasestorage")
      ? "/images/profile-pics/plumber-generic.webp"
      : rawImage || "/images/profile-pics/plumber-generic.webp";

  const locationLabel = tradesperson.location?.town || tradesperson.location?.postcode || "UK-based";

  return (
    <Card
      className="
    relative flex h-full flex-col
    bg-secondary text-secondary-foreground
    dark:bg-[#181a20] dark:text-secondary-foreground

    border border-border/60
    hover:border-primary/40

    shadow-sm
    transition-all duration-150 ease-in-out

    hover:shadow-md
    hover:bg-secondary/90
    dark:hover:bg-[#1f2128]
    hover:-translate-y-[2px]
  ">
      <div className="absolute right-2 top-2 z-10">
        <FavoriteButton tradespersonId={tradesperson.id} />
      </div>

      <CardContent className="flex flex-col flex-grow p-4">
        {/* Header Section with Avatar, Name, and Ratings */}
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border bg-muted">
            <Image
              src={profileImageSrc}
              alt={tradesperson.businessName || tradesperson.name || "Tradesperson"}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {tradesperson.businessName || tradesperson.name || "Plumbing Professional"}
            </h3>

            {reviewCount > 0 && (
              <div className="mt-1 flex items-center gap-1.5 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({reviewCount} reviews)</span>
              </div>
            )}

            {canShowBadges && verifiedCerts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {verifiedCerts.slice(0, 2).map(cert => (
                  <CertificationBadge key={cert.id} cert={cert} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location and Service Areas */}
        <div className="mt-4 space-y-2 text-left text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>Based in {locationLabel}</span>
          </div>
          {tradesperson.serviceAreas && (
            <div className="flex items-start gap-2">
              <Globe className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>Areas covered: {tradesperson.serviceAreas}</span>
            </div>
          )}
        </div>

        {/* Specialties and Profile Button */}
        <div className="mt-4 flex flex-grow flex-col justify-end border-t border-border/40 pt-4">
          {tradesperson.specialties && tradesperson.specialties.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {tradesperson.specialties.slice(0, 3).map((specialty, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="
                    px-3 py-1
                    bg-background/80 text-foreground
                    dark:bg-background/70 dark:text-foreground
                    border border-border/40
                  ">
                  {specialty}
                </Badge>
              ))}
            </div>
          )}

          <Button asChild className="mt-auto w-full">
            <Link href={`/profile/tradesperson/${tradesperson.slug}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
