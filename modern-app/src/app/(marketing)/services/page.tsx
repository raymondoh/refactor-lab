// src/app/(marketing)/services/page.tsx
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/json-ld";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { PageHeader } from "@/components/marketing/page-header";
import { Container } from "@/components/marketing/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { CITIES } from "@/lib/config/locations";
import { toSlug } from "@/lib/utils/slugify";

export const metadata: Metadata = {
  title: "Plumbing Services — Emergency, Boilers, Leaks, Drains & More",
  description:
    "Explore plumbing services available on Plumbers Portal: emergency callouts, boiler repair & installation, leak detection, blocked drains, bathrooms & kitchens, and compliance checks.",
  alternates: { canonical: `${siteConfig.url}/services` },
  openGraph: {
    title: "Plumbing Services — Emergency, Boilers, Leaks, Drains & More",
    description: "Find the right professional for any job. Post your job, compare quotes, and hire with confidence.",
    url: `${siteConfig.url}/services`
  },
  twitter: {
    title: "Plumbing Services — Emergency, Boilers, Leaks, Drains & More",
    description: "Post a job, compare quotes, and hire a trusted plumber."
  }
};

type ServiceLink = { name: string; slug: string };
type ServiceCategory = {
  title: string;
  description: string;
  services: ServiceLink[];
};

// Choose a primary city for links (first configured city, fallback to London)
const PRIMARY_CITY_SLUG = CITIES.length ? toSlug(CITIES[0]) : "london";

// Keep sections aligned with your marketplace & common homeowner intent
const serviceCategories: ServiceCategory[] = [
  {
    title: "Emergency Plumbing",
    description: "Rapid response for urgent issues that can’t wait: burst pipes, no heating, dangerous leaks.",
    services: [
      { name: "Emergency Plumber", slug: "emergency-plumber" },
      { name: "Burst Pipe Repairs", slug: "burst-pipe-repairs" },
      { name: "No Heating / No Hot Water", slug: "no-heating-no-hot-water" },
      { name: "Water Leak Diagnostics", slug: "leak-detection" }
    ]
  },
  {
    title: "Repairs & Diagnostics",
    description: "Troubleshoot and fix common plumbing faults quickly and safely.",
    services: [
      { name: "Leak Detection & Repair", slug: "leak-detection" },
      { name: "Tap & Toilet Repairs", slug: "toilet-repairs" },
      { name: "Radiator Repair & Balancing", slug: "radiator-repair" },
      { name: "General Plumbing", slug: "general-plumbing" }
    ]
  },
  {
    title: "Heating & Boilers",
    description:
      "Installations, servicing, and repairs for boilers and central heating systems (Gas Safe where required).",
    services: [
      { name: "Boiler Repair", slug: "boiler-repair" },
      { name: "Boiler Installation", slug: "boiler-installation" },
      { name: "Central Heating Systems", slug: "central-heating-systems" },
      { name: "Annual Boiler Service", slug: "boiler-service" }
    ]
  },
  {
    title: "Bathrooms & Kitchens",
    description: "From full refits to smaller fixture upgrades and improvements.",
    services: [
      { name: "Bathroom Plumbing", slug: "bathroom-plumbing" },
      { name: "Kitchen Plumbing", slug: "kitchen-plumbing" },
      { name: "Shower & Bath Installation", slug: "shower-and-bath-installation" },
      { name: "Water Softener Installation", slug: "water-softener-installation" }
    ]
  },
  {
    title: "Drainage",
    description: "Unblocking and repairing internal and external drainage systems.",
    services: [
      { name: "Blocked Drains", slug: "drain-cleaning" },
      { name: "CCTV Drain Surveys", slug: "cctv-drain-survey" },
      { name: "Drain Repairs", slug: "drain-repairs" }
    ]
  },
  {
    title: "Compliance & Safety",
    description: "Keep properties safe and compliant with certificates and routine checks.",
    services: [
      { name: "Landlord Gas Safety Certificates", slug: "gas-safety-certificates" },
      { name: "Power Flushing", slug: "power-flushing" },
      { name: "Preventative Maintenance Plans", slug: "preventative-maintenance" }
    ]
  }
];

// Build JSON-LD with per-service URLs that point to your dynamic routes
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Plumbing services offered through Plumbers Portal",
  areaServed: "United Kingdom",
  provider: { "@type": "Organization", name: "Plumbers Portal", url: siteConfig.url },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Plumbing services",
    itemListElement: serviceCategories.map(category => ({
      "@type": "OfferCatalog",
      name: category.title,
      itemListElement: category.services.map(service => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          areaServed: "United Kingdom",
          provider: { "@type": "Organization", name: "Plumbers Portal" },
          url: `${siteConfig.url}/plumbers/${PRIMARY_CITY_SLUG}/${service.slug}`
        }
      }))
    }))
  }
};

export default function ServicesPage() {
  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />
      <PageHeader
        title="Plumbing Services Made Simple"
        subtitle="Post a job, compare quotes, and hire a trusted professional across emergency repairs, boilers, bathrooms, drainage, and more."
        cta={[
          { href: "/find-plumber", label: "Find a plumber" },
          { href: "/join-our-network", label: "Join as a plumber" }
        ]}
      />

      {/* SERVICES GRID */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            {serviceCategories.map(category => (
              <Card key={category.title} className="h-full border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-card-foreground">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {category.services.map(service => (
                      <li key={service.slug} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden />
                        <Link
                          href={`/plumbers/${PRIMARY_CITY_SLUG}/${service.slug}`}
                          className="hover:text-foreground underline-offset-4 hover:underline">
                          {service.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA BAND */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="rounded-2xl border bg-muted/40 p-10 text-center shadow-sm">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Need something more bespoke?</h2>
            <p className="mt-3 text-base text-muted-foreground">
              Tell us about your project and we’ll match you with experienced plumbers who specialise in your exact
              requirements.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90">
                Contact our team
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-md border border-input px-6 py-2 text-sm font-semibold text-foreground hover:bg-accent/60">
                See how it works
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* WHY CHOOSE */}
      <section className="pb-16 lg:pb-24">
        <Container>
          <div className="space-y-4 rounded-2xl border bg-card p-8 text-card-foreground shadow-sm">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Why homeowners choose Plumbers Portal</h2>
            <Separator className="bg-border" />
            <ul className="grid gap-4 md:grid-cols-3">
              <li>
                <h3 className="text-lg font-medium">Verified professionals</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every tradesperson is identity checked, insured, and reviewed by recent customers.
                </p>
              </li>
              <li>
                <h3 className="text-lg font-medium">Transparent quotes</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Compare detailed quotes side by side and choose the option that fits your budget.
                </p>
              </li>
              <li>
                <h3 className="text-lg font-medium">Secure payments</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pay a deposit via checkout and the final on completion—funds handled securely.
                </p>
              </li>
            </ul>
          </div>
        </Container>
      </section>

      <JsonLd data={jsonLd} />
    </div>
  );
}
