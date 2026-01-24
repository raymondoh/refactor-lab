// src/app/(marketing)/plumbers/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { PageHeader } from "@/components/marketing/page-header";
import { Container } from "@/components/marketing/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { CITIES, POPULAR_SERVICES } from "@/lib/config/locations";
import { toSlug } from "@/lib/utils/slugify";

export const metadata: Metadata = {
  title: "Find Local Plumbers Near You | Plumbers Portal",
  description:
    "Browse vetted local plumbers across the UK. Explore professionals by city and discover popular services like emergency repairs, boilers, bathrooms, drainage and more.",
  alternates: { canonical: `${siteConfig.url}/plumbers` },
  openGraph: {
    title: "Find Local Plumbers Near You | Plumbers Portal",
    description:
      "Compare quotes from trusted plumbers in cities across the UK. Explore emergency, boiler, bathroom and drainage specialists.",
    url: `${siteConfig.url}/plumbers`
  },
  twitter: {
    title: "Find Local Plumbers Near You | Plumbers Portal",
    description: "Browse trusted local plumbers and popular services nationwide."
  },
  robots: { index: true, follow: true }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Plumbers near you across the UK",
  description:
    "Directory of trusted local plumbers across major UK cities offering emergency repairs, boiler servicing, bathroom installations and more.",
  url: `${siteConfig.url}/plumbers`,
  mainEntity: {
    "@type": "ItemList",
    itemListElement: CITIES.map((city, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `Plumbers in ${city}`,
      item: {
        "@type": "Service",
        name: `Plumbing services in ${city}`,
        areaServed: city,
        provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
        url: `${siteConfig.url}/plumbers/${toSlug(city)}`
      }
    }))
  }
};

const FEATURED_SERVICES = POPULAR_SERVICES.slice(0, 3);
const primaryCitySlug = CITIES.length ? toSlug(CITIES[0]) : "london";

export default function PlumbersLandingPage() {
  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />
      <PageHeader
        title="Hire Trusted Local Plumbers"
        subtitle="Browse vetted professionals in every major UK city, compare transparent quotes, and book specialists for emergency callouts, boilers, bathrooms, drainage and more."
        cta={[
          { href: "/find-plumber", label: "Request quotes" },
          { href: "/join-our-network", label: "Join as a plumber" }
        ]}
      />

      <section className="py-16 lg:py-24">
        <Container className="space-y-12">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Browse plumbers by city
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              Select your city to see qualified plumbers, read verified reviews, and explore services tailored to your
              home or business.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CITIES.map(city => {
              const citySlug = toSlug(city);

              return (
                <Card key={city} className="h-full border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-card-foreground">{city}</CardTitle>
                    <CardDescription>
                      Discover local specialists for emergency repairs, boilers, bathrooms, drainage and more in {city}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <ul className="space-y-2 text-muted-foreground">
                      {FEATURED_SERVICES.map(service => {
                        const serviceSlug = toSlug(service);

                        return (
                          <li key={service}>
                            <Link
                              href={`/plumbers/${citySlug}/${serviceSlug}`}
                              className="hover:text-foreground underline-offset-4 hover:underline">
                              {service} in {city}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                    <Separator />
                    <Link
                      href={`/plumbers/${citySlug}`}
                      className="font-medium text-primary underline-offset-4 hover:text-primary/80 hover:underline">
                      Browse plumbers in {city}
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="pb-16">
        <Container className="space-y-6">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Popular plumbing services nationwide
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              Explore high-demand plumbing services and jump straight into city pages to compare quotes from vetted
              professionals.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {POPULAR_SERVICES.map(service => {
              const serviceSlug = toSlug(service);

              return (
                <Card key={service} className="border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-card-foreground">{service}</CardTitle>
                    <CardDescription>
                      Find trusted specialists ready to help with {service.toLowerCase()} in minutes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href={`/plumbers/${primaryCitySlug}/${serviceSlug}`}
                      className="text-sm font-medium text-primary underline-offset-4 hover:text-primary/80 hover:underline">
                      View providers near you
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      <JsonLd data={jsonLd} />
    </div>
  );
}
