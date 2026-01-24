// src/app/(marketing)/plumbers/[city]/[service]/page.tsx

import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { userService } from "@/lib/services/user-service";
import { toSlug } from "@/lib/utils/slugify";
import { formatCitySlug } from "@/lib/utils/format-city-slug";
import { CITIES, POPULAR_SERVICES, getServiceName } from "@/lib/config/locations";
import { TradespersonCard } from "@/components/cards/tradesperson-card";
import { Pagination } from "@/components/ui/pagination";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Container } from "@/components/marketing/container";

export async function generateStaticParams() {
  const params: { city: string; service: string }[] = [];
  for (const city of CITIES) {
    for (const service of POPULAR_SERVICES) {
      params.push({ city: toSlug(city), service: toSlug(service) });
    }
  }
  return params;
}

// ---- Types for this dynamic route ----

type CityServiceParams = {
  city: string;
  service: string;
};

type CityServiceSearchParams = {
  page?: string;
  [key: string]: string | string[] | undefined;
};

interface CityServicePageProps {
  params: Promise<CityServiceParams>;
  // ✅ Promise-only to satisfy Next's PageProps constraint in your build
  searchParams?: Promise<CityServiceSearchParams>;
}

const ITEMS_PER_PAGE = 4;

/**
 * SEO: dynamic metadata for service-in-city pages (with pagination-aware canonical)
 */
export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<CityServiceParams>;
  // ✅ Promise-only here too
  searchParams?: Promise<CityServiceSearchParams>;
}): Promise<Metadata> {
  // 🔹 Unwrap params (Promise)
  const { city, service } = await params;

  // 🔹 Unwrap searchParams (Promise) safely
  const resolvedSearchParams: CityServiceSearchParams = (await searchParams) ?? {};

  if (!city || !service) {
    return {
      title: "Plumbers Portal",
      description: "Find local plumbers and tradespeople across the UK.",
      robots: { index: false, follow: false }
    };
  }

  const citySlug = city;
  const serviceSlug = service;

  const serviceName = getServiceName(serviceSlug);
  const cityName = formatCitySlug(citySlug);
  const pageNum = Number(resolvedSearchParams.page || 1);

  const basePath = `${siteConfig.url}/plumbers/${encodeURIComponent(citySlug)}/${encodeURIComponent(serviceSlug)}`;
  const canonical = pageNum > 1 ? `${basePath}?page=${pageNum}` : basePath;

  const title = `${serviceName} in ${cityName} | Plumbers Portal`;
  const description = `Find vetted ${serviceName.toLowerCase()}s in ${cityName}. Compare quotes for boiler repair, leaks, emergencies, and more.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website"
    },
    twitter: {
      title,
      description,
      card: "summary_large_image"
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

export default async function CityServicePage({ params, searchParams }: CityServicePageProps) {
  // 🔹 Unwrap params (Promise)
  const { city, service } = await params;

  // 🔹 Unwrap searchParams (Promise)
  const resolvedSearchParams: CityServiceSearchParams = (await searchParams) ?? {};

  const currentPage = Number(resolvedSearchParams.page || 1);

  // ✅ Use helper with Algolia + Firestore fallback
  const { users: tradespeople, total } = await userService.findTradespeopleByCityAndService({
    citySlug: city,
    serviceSlug: service,
    page: currentPage,
    limit: ITEMS_PER_PAGE
  });

  const displayCity = formatCitySlug(city);
  const displayService = getServiceName(service);
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const canonical =
    currentPage > 1
      ? `${siteConfig.url}/plumbers/${encodeURIComponent(city)}/${encodeURIComponent(service)}?page=${currentPage}`
      : `${siteConfig.url}/plumbers/${encodeURIComponent(city)}/${encodeURIComponent(service)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${displayService} in ${displayCity}`,
    serviceType: displayService,
    areaServed: displayCity,
    provider: {
      "@type": "Organization",
      name: "Plumbers Portal",
      url: siteConfig.url,
      logo: `${siteConfig.url}/logo.png`
    },
    url: canonical,
    description: `Compare free quotes for ${displayService.toLowerCase()} in ${displayCity} from qualified local plumbers.`
  };

  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />

      <Container className="py-8">
        <h1 className="mb-2 text-3xl font-bold">
          {displayService} services in {displayCity}
        </h1>
        <p className="mb-6 text-muted-foreground">{total} plumbers found.</p>

        {tradespeople.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tradespeople.map(tp => (
              <TradespersonCard key={tp.id} tradesperson={tp} />
            ))}
          </div>
        ) : (
          <p>No tradespeople were found for this city and service combination.</p>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </Container>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
