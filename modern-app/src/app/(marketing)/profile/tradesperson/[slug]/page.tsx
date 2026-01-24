// src/app/(marketing)/profile/tradesperson/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { siteConfig } from "@/config/site";
import { userService } from "@/lib/services/user-service";
import { reviewService } from "@/lib/services/review-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Briefcase, FolderKanban, CheckCircle, CircleHelp } from "lucide-react";
import SubscriptionGuard from "@/components/auth/subscription-guard";
import CertificationList from "@/components/profile/certification-list";
import { formatDateShortGB, getInitials, formatCitySlug } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { CertificationBadge } from "@/components/certifications/certification-badge";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Container } from "@/components/marketing/container";
import { isCustomer, isServiceProvider } from "@/lib/auth/roles";
import { asTier, meets } from "@/lib/subscription/tier";
import type { User } from "@/lib/types/user";
import { logger } from "@/lib/logger";

type TradespersonProfilePageParams = {
  slug: string;
};

/**
 * SEO: dynamic metadata for tradesperson profiles
 * - Builds title/description from fetched profile
 * - Sets canonical and social previews
 */
export async function generateMetadata({
  params
}: {
  params: Promise<TradespersonProfilePageParams>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Fetch lightweight profile data for SEO (safe fallbacks if errors)
  let tp: Pick<
    User,
    | "id"
    | "slug"
    | "name"
    | "businessName"
    | "profilePicture"
    | "specialties"
    | "citySlug"
    | "location"
    | "description"
    | "role"
  > | null = null;

  try {
    const userResult = await userService.getUserBySlug(slug);
    if (userResult) {
      tp = userResult;
    }
  } catch {
    // ignore – fallbacks below
  }

  if (!tp || !isServiceProvider(tp.role ?? "")) {
    return {
      title: "Profile not found | Plumbers Portal",
      description: "This tradesperson profile could not be found.",
      robots: { index: false, follow: false }
    };
  }

  const displayName = tp.businessName || tp.name || "Plumbing Professional";
  const primaryService = tp.specialties?.[0] || "Plumber";
  const city = tp.citySlug ? formatCitySlug(tp.citySlug) : tp.location?.town || undefined;

  const title = `${displayName} — ${primaryService}${city ? ` in ${city}` : ""} | Plumbers Portal`;
  const description =
    tp.description?.slice(0, 160) ||
    `View ${displayName}’s profile and request quotes. Trusted local ${primaryService.toLowerCase()}${
      city ? ` in ${city}` : ""
    }.`;

  const canonical = `${siteConfig.url}/profile/tradesperson/${encodeURIComponent(tp.slug!)}`;
  const images = tp.profilePicture ? [tp.profilePicture] : [siteConfig.ogImage];

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "profile",
      images
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images
    },
    robots: { index: true, follow: true }
  };
}

export default async function TradespersonProfilePage({ params }: { params: Promise<TradespersonProfilePageParams> }) {
  const { slug } = await params;

  const session = await auth();
  const tradesperson = await userService.getUserBySlug(slug);

  if (!tradesperson || !isServiceProvider(tradesperson.role ?? undefined)) {
    notFound();
  }

  // --- Ensure slug is non-null before using it ---
  if (!tradesperson.slug) {
    logger.error(`Tradesperson found by slug "${slug}" but has no slug property! ID: ${tradesperson.id}`);
    notFound();
  }

  // Show "Request Quote" button only to customers or unauthenticated users
  const showRequestQuoteButton = !session?.user || isCustomer(session.user.role);

  const reviews = await reviewService.getReviewsByTradespersonId(tradesperson.id);
  const averageRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const customerMap = new Map<string, Awaited<ReturnType<typeof userService.getUserById>>>();

  await Promise.all(
    reviews.map(async review => {
      if (!review.customerId || customerMap.has(review.customerId)) return;
      const customer = await userService.getUserById(review.customerId);
      customerMap.set(review.customerId, customer);
    })
  );

  const reviewsWithCustomer = reviews.map(review => ({
    review,
    customer: review.customerId ? (customerMap.get(review.customerId) ?? null) : null
  }));

  const subjectTier = asTier(tradesperson.subscriptionTier ?? "basic");
  const showAdvancedFeatures = meets(subjectTier, "pro");
  const verifiedCertifications = tradesperson.certifications?.filter(cert => cert.verified) ?? [];

  const breadcrumbSegments = [];
  if (tradesperson.citySlug) {
    const cityName = formatCitySlug(tradesperson.citySlug);
    breadcrumbSegments.push({ title: `Plumbers in ${cityName}`, href: `/plumbers/${tradesperson.citySlug}` });
  }
  breadcrumbSegments.push({
    title: tradesperson.businessName || tradesperson.name || "Profile",
    href: `/profile/tradesperson/${tradesperson.slug!}`
  });

  // --- Trust badge derived state ---
  const reviewCount = reviews.length;
  const hasReviews = reviewCount > 0;
  const isTopRated = hasReviews && averageRating >= 4.7 && reviewCount >= 10;
  const isCustomerFavourite = hasReviews && reviewCount >= 25;
  const isNewToPlatform = !hasReviews;

  const hasVerifiedCerts = verifiedCertifications.length > 0;
  const isProOrBusiness = meets(subjectTier, "pro");

  // ===== JSON-LD =====
  const canonical = `${siteConfig.url}/profile/tradesperson/${encodeURIComponent(tradesperson.slug!)}`;
  const city = tradesperson.citySlug ? formatCitySlug(tradesperson.citySlug) : tradesperson.location?.town;
  const address =
    tradesperson.location?.postcode || tradesperson.location?.town
      ? {
          "@type": "PostalAddress",
          streetAddress: undefined,
          addressLocality: tradesperson.location?.town || undefined,
          postalCode: tradesperson.location?.postcode || undefined,
          addressCountry: "GB"
        }
      : undefined;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: tradesperson.businessName || tradesperson.name || "Plumbing Professional",
    url: canonical,
    image: tradesperson.profilePicture || `${siteConfig.url}/logo.png`,
    description:
      tradesperson.description ||
      `Trusted local ${tradesperson.specialties?.[0]?.toLowerCase() || "plumber"}${city ? ` in ${city}` : ""}.`,
    telephone: tradesperson.phone || undefined,
    email: tradesperson.email || undefined,
    address,
    areaServed: city || undefined,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: [],
    serviceType: tradesperson.specialties?.[0] || "Plumber"
  };

  if (reviews.length > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(averageRating.toFixed(1)),
      reviewCount: reviews.length
    };
  }

  function formatReviewerName(name?: string | null) {
    if (!name) return "Verified customer";

    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "Verified customer";
    if (parts.length === 1) return parts[0];

    const first = parts[0];
    const last = parts[parts.length - 1];

    return `${first} ${last[0].toUpperCase()}.`;
  }

  function formatReviewerLocation(
    customer?: {
      location?: {
        town?: string | null;
        postcode?: string | null;
        address?: string | null;
        latitude?: number | null;
        longitude?: number | null;
      } | null;
    } | null
  ) {
    const loc = customer?.location;

    const town = loc?.town?.trim();
    const postcode = loc?.postcode?.trim();
    const outwardCode = postcode ? postcode.split(/\s+/)[0] : null;

    if (town && outwardCode) {
      return `${town} (${outwardCode}) customer`;
    }

    if (town) {
      return `${town} customer`;
    }

    if (outwardCode) {
      return `${outwardCode} area customer`;
    }

    return "Verified customer";
  }

  // ✅ Profile image fallback logic (same pattern as elsewhere)
  const rawImage = tradesperson.profilePicture || "";

  const profileImageSrc =
    process.env.NODE_ENV === "test" && rawImage.includes("firebasestorage")
      ? "/images/profile-pics/plumber-generic.webp"
      : rawImage || "/images/profile-pics/plumber-generic.webp";

  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader segments={breadcrumbSegments} />

      <div className="flex-1">
        <Container className="py-8 sm:py-12">
          <div className="space-y-8">
            {/* --- Header Section --- */}
            {/* --- Header Section --- */}
            <Card
              className="
    group relative overflow-hidden rounded-2xl
    border border-border/70
    bg-background text-foreground
    dark:bg-[#1c1a2e] dark:text-foreground dark:border-white/10
    shadow-sm dark:shadow-[0_0_24px_-8px_rgba(0,0,0,0.9)]
    transition-shadow duration-200
  ">
              {/* subtle sheen / gradient overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/10 opacity-70" />

              <CardContent className="relative flex flex-col items-center gap-6 p-5 text-center sm:flex-row sm:items-start sm:gap-8 sm:p-6 sm:text-left">
                {/* Avatar */}
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background/90 shadow-xl dark:border-background/40">
                  <AvatarImage
                    src={profileImageSrc}
                    alt={(tradesperson.businessName || tradesperson.name || "Tradesperson") + " profile photo"}
                  />
                  <AvatarFallback className="text-4xl">
                    {getInitials(tradesperson.businessName || tradesperson.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Main text + badges */}
                <div className="flex-1 pt-2">
                  <h1 className="text-3xl font-bold sm:text-4xl">{tradesperson.businessName || tradesperson.name}</h1>
                  <p className="mt-1 text-lg text-muted-foreground">
                    {tradesperson.specialties?.join(" • ") || "Plumbing Professional"}
                  </p>

                  {/* Location + headline rating */}
                  <div className="mt-3 flex items-center justify-center gap-4 text-muted-foreground sm:justify-start">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{tradesperson.location?.town || tradesperson.location?.postcode}</span>
                    </div>
                    {showAdvancedFeatures && hasReviews && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>
                          {averageRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Trust badges row */}
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    {isProOrBusiness && (
                      <Badge variant="outline" className="border-primary/40 text-primary text-xs font-medium">
                        {subjectTier === "business" ? "Business member" : "Pro member"}
                      </Badge>
                    )}

                    {showAdvancedFeatures && isTopRated && (
                      <Badge variant="outline" className="border-amber-400/60 text-amber-500 text-xs font-medium">
                        Top rated by customers
                      </Badge>
                    )}

                    {showAdvancedFeatures && !isTopRated && isCustomerFavourite && (
                      <Badge variant="outline" className="border-emerald-400/60 text-emerald-500 text-xs font-medium">
                        Customer favourite
                      </Badge>
                    )}

                    {hasVerifiedCerts && (
                      <Badge variant="outline" className="border-sky-400/60 text-sky-500 text-xs font-medium">
                        Independently verified certifications
                      </Badge>
                    )}

                    {isNewToPlatform && (
                      <Badge variant="secondary" className="text-xs font-medium">
                        New to Plumbers Portal
                      </Badge>
                    )}
                  </div>

                  {/* Certification chips */}
                  {showAdvancedFeatures && verifiedCertifications.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      {verifiedCertifications.map(cert => (
                        <CertificationBadge key={cert.id} cert={cert} />
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA */}
                {showRequestQuoteButton && (
                  <div className="pt-2">
                    <Button asChild size="lg">
                      <Link href={`/dashboard/customer/jobs/create?tradespersonId={tradesperson.id}`}>
                        Request Quote
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* --- Main Content --- */}
            <div className="space-y-8">
              <div className="space-y-8">
                {/* --- About Section --- */}
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {tradesperson.description || "No description provided."}
                    </p>
                  </CardContent>
                </Card>

                {/* --- Certifications Section --- */}
                <CertificationList certifications={tradesperson.certifications || []} />

                {/* --- Portfolio Section --- */}
                <SubscriptionGuard allowedTiers={["pro", "business"]} tierOverride={subjectTier}>
                  {tradesperson.portfolio?.length ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FolderKanban className="h-5 w-5 text-primary" />
                          Portfolio
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="relative">
                          <Carousel opts={{ align: "start", loop: true }} className="w-full">
                            <CarouselContent>
                              {tradesperson.portfolio.map((src, idx) => (
                                <CarouselItem key={idx} className="basis-4/5 md:basis-1/2 lg:basis-1/3">
                                  <div className="relative w-full aspect-[4/3]">
                                    <Image
                                      src={src}
                                      alt={`Portfolio image ${idx + 1}`}
                                      fill
                                      className="object-cover rounded-md"
                                      sizes="(min-width: 1024px) 20vw, 50vw"
                                      priority={idx < 2}
                                    />
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden sm:flex" />
                            <CarouselNext className="hidden sm:flex" />
                          </Carousel>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </SubscriptionGuard>

                {/* --- Reviews Section --- */}
                {showAdvancedFeatures && (
                  <SubscriptionGuard allowedTiers={["pro", "business"]} tierOverride={subjectTier}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Customer Reviews</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {reviewsWithCustomer.length ? (
                          <div className="relative">
                            <Carousel opts={{ align: "start", loop: true }} className="w-full">
                              <CarouselContent>
                                {reviewsWithCustomer.map(({ review, customer }) => (
                                  <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                                    <Card className="h-full">
                                      <CardContent className="flex h-full flex-col gap-4 p-6">
                                        <div className="flex items-center gap-1">
                                          {Array.from({ length: 5 }, (_, index) => index + 1).map(star => (
                                            <Star
                                              key={star}
                                              className={
                                                "h-4 w-4 " +
                                                (star <= review.rating
                                                  ? "fill-amber-400 text-amber-400"
                                                  : "text-muted-foreground")
                                              }
                                            />
                                          ))}
                                        </div>
                                        {review.comment ? (
                                          <blockquote className="text-sm text-muted-foreground italic">
                                            &ldquo;{review.comment}&rdquo;
                                          </blockquote>
                                        ) : (
                                          <p className="text-sm text-muted-foreground italic">No comment provided.</p>
                                        )}
                                        <div className="mt-auto text-xs text-muted-foreground">
                                          <p className="text-sm text-muted-foreground">
                                            {formatReviewerName(customer?.name)}
                                          </p>

                                          {customer && (
                                            <p className="text-xs text-muted-foreground">
                                              {formatReviewerLocation(customer)}
                                            </p>
                                          )}

                                          <p className="text-xs text-muted-foreground">
                                            {formatDateShortGB(review.createdAt)}
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              <CarouselPrevious />
                              <CarouselNext />
                            </Carousel>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No reviews yet.</p>
                        )}
                      </CardContent>
                    </Card>
                  </SubscriptionGuard>
                )}
              </div>

              <div className="space-y-8">
                {/* --- Trust & verification Section --- */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      Trust & verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                        <span>
                          {tradesperson.businessName
                            ? "Registered trading name provided"
                            : "Trading as an individual professional"}
                        </span>
                      </li>

                      <li className="flex items-start gap-2">
                        {tradesperson.phone ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                            <span>Contact phone number provided</span>
                          </>
                        ) : (
                          <>
                            <CircleHelp className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>Phone number not listed</span>
                          </>
                        )}
                      </li>

                      <li className="flex items-start gap-2">
                        {hasVerifiedCerts ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                            <span>
                              {verifiedCertifications.length} verified certification
                              {verifiedCertifications.length !== 1 ? "s" : ""} on file
                            </span>
                          </>
                        ) : (
                          <>
                            <CircleHelp className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>No verified certifications on file yet</span>
                          </>
                        )}
                      </li>

                      <li className="flex items-start gap-2">
                        {hasReviews ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                            <span>
                              {reviewCount} customer review{reviewCount !== 1 ? "s" : ""} on Plumbers Portal
                            </span>
                          </>
                        ) : (
                          <>
                            <CircleHelp className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>Awaiting first customer review</span>
                          </>
                        )}
                      </li>

                      <li className="flex items-start gap-2">
                        <CircleHelp className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>ID &amp; insurance verification – coming soon</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* --- Details Section --- */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <h3 className="font-semibold mb-1">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {tradesperson.specialties?.length ? (
                          tradesperson.specialties.map(s => (
                            <Badge key={s} variant="secondary" className="px-3 py-1">
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No specialties listed.</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Service Areas</h3>
                      <p className="text-muted-foreground">{tradesperson.serviceAreas || "Not specified"}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Experience</h3>
                      <p className="text-muted-foreground">
                        {tradesperson.experience ? `${tradesperson.experience} years` : "Not specified"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* ✅ Structured data to help search engines understand this profile */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
