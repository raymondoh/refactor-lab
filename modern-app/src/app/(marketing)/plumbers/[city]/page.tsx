// src/app/(marketing)/plumbers/[city]/page.tsx

import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { userService } from "@/lib/services/user-service";
import { toSlug } from "@/lib/utils/slugify";
import { formatCitySlug } from "@/lib/utils/format-city-slug";
import { CITIES, POPULAR_SERVICES } from "@/lib/config/locations";
import { TradespersonCard } from "@/components/cards/tradesperson-card";
import { Pagination } from "@/components/ui/pagination";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Container } from "@/components/marketing/container";

export async function generateStaticParams() {
  return CITIES.map(city => ({ city: toSlug(city) }));
}

// ---- Types for dynamic route ----

type CityPageParams = {
  city: string;
};

type CityPageSearchParams = {
  page?: string;
  [key: string]: string | string[] | undefined;
};

interface CityPageProps {
  params: Promise<CityPageParams>;
  // ✅ Promise-only to satisfy Next's PageProps constraint in your build
  searchParams?: Promise<CityPageSearchParams>;
}

const ITEMS_PER_PAGE = 4;

/**
 * SEO: dynamic <head> based on city and page number
 */
export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<CityPageParams>;
  // ✅ Promise-only here too
  searchParams?: Promise<CityPageSearchParams>;
}): Promise<Metadata> {
  const { city } = await params;

  const resolvedSearchParams: CityPageSearchParams = (await searchParams) ?? {};

  const citySlug = city;
  const cityName = formatCitySlug(citySlug);
  const pageNum = Number(resolvedSearchParams.page || 1);

  const basePath = `${siteConfig.url}/plumbers/${encodeURIComponent(citySlug)}`;
  const canonical = pageNum > 1 ? `${basePath}?page=${pageNum}` : basePath;

  const title = `Plumbers in ${cityName} | Hire Local Plumbers`;
  const description = `Find qualified plumbers in ${cityName}. Compare free quotes for boiler repair, leak detection, blocked drains, bathrooms, and 24/7 emergency plumbing.`;

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

export default async function CityPlumbersPage({ params, searchParams }: CityPageProps) {
  const { city } = await params;

  const resolvedSearchParams: CityPageSearchParams = (await searchParams) ?? {};

  const currentPage = Number(resolvedSearchParams.page || 1);

  const { users: tradespeople, total } = await userService.findTradespeopleByCity({
    citySlug: city,
    page: currentPage,
    limit: ITEMS_PER_PAGE
  });

  const displayName = formatCitySlug(city);
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const canonical =
    currentPage > 1
      ? `${siteConfig.url}/plumbers/${encodeURIComponent(city)}?page=${currentPage}`
      : `${siteConfig.url}/plumbers/${encodeURIComponent(city)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Plumbers in ${displayName}`,
    url: canonical,
    description: "Browse local plumbing services and request free quotes from qualified tradespeople.",
    hasPart: POPULAR_SERVICES.slice(0, 3).map(svc => ({
      "@type": "Service",
      name: svc,
      areaServed: displayName,
      provider: { "@type": "Organization", name: "Plumbers Portal", url: siteConfig.url }
    }))
  };

  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />

      <Container className="py-8">
        <h1 className="mb-2 text-3xl font-bold">Plumbers in {displayName}</h1>
        <p className="mb-6 text-muted-foreground">{total} plumbers found.</p>

        {tradespeople.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tradespeople.map(tp => (
              <TradespersonCard key={tp.id} tradesperson={tp} />
            ))}
          </div>
        ) : (
          <p>No tradespeople found for this area.</p>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </Container>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
