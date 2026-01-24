// src/app/marketing/website-map/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { CITIES, POPULAR_SERVICES } from "@/lib/config/locations";
import { toSlug } from "@/lib/utils/slugify";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Container } from "@/components/marketing/container";
import { staticMarketingRoutes } from "@/lib/config/marketing-routes";
import { userService } from "@/lib/services/user-service";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "A complete list of key pages on Plumbers Portal.",
  alternates: { canonical: `${siteConfig.url}/website-map` }
};

function formatLabel(route: string): string {
  if (route === "/") return "Home";
  const parts = route.split("/").filter(Boolean);
  const label = parts[parts.length - 1] || "";
  return label
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function HtmlSitemapPage() {
  const coreLinks = staticMarketingRoutes.map(route => ({
    label: formatLabel(route),
    href: route
  }));

  const plumbers = await userService.getActiveServiceProviders();

  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />
      <section className="py-10">
        <Container>
          <h1 className="mb-6 text-3xl font-bold">Sitemap</h1>

          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <h2 className="text-xl font-semibold mb-3">Core Pages</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {coreLinks.map(l => (
                  <li key={l.href}>
                    <Link className="hover:text-foreground hover:underline" href={l.href}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Cities</h2>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {CITIES.map(city => (
                  <li key={city}>
                    <Link className="hover:text-foreground hover:underline" href={`/plumbers/${toSlug(city)}`}>
                      Plumbers in {city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Popular Services</h2>
              <ul className="grid grid-cols-1 gap-y-2 text-sm text-muted-foreground">
                {POPULAR_SERVICES.map(svc => (
                  <li key={svc}>
                    <Link className="hover:text-foreground hover:underline" href={`/services/${toSlug(svc)}`}>
                      {svc}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {plumbers.length > 0 && (
              <div className="md:col-span-2 lg:col-span-3">
                <h2 className="text-xl font-semibold mb-3">Plumber Profiles</h2>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground md:grid-cols-3 lg:grid-cols-4">
                  {plumbers.map(plumber => (
                    <li key={plumber.id}>
                      <Link
                        className="hover:text-foreground hover:underline"
                        href={`/profile/tradesperson/${plumber.slug}`}>
                        {plumber.businessName || plumber.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}
