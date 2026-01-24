// src/app/(marketing)/resources/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { PageHeader } from "@/components/marketing/page-header";
import { Container } from "@/components/marketing/container";
import CtaSection from "@/components/marketing/cta-section";
import type { CtaButton } from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "Resources | Plumbers Portal",
  description: "Guides, checklists, and templates to help customers and tradespeople succeed.",
  alternates: {
    canonical: "/resources"
  },
  keywords: ["plumbing resources", "plumbing guides", "plumbing templates", "homeowner plumbing checklist"]
};

type Resource = {
  title: string;
  href: string;
  kind: "Guide" | "Template" | "Checklist" | "Policy";
  blurb: string;
};

const resources: Resource[] = [
  {
    title: "Customer Job Posting Checklist",
    href: "/resources/customer-job-posting-checklist",
    kind: "Checklist",
    blurb: "Everything to include for clear quotes: photos, measurements, access, timing."
  },
  {
    title: "Plumber Quote Template",
    href: "/resources/quote-template",
    kind: "Template",
    blurb: "A clean, professional quote format with scope, exclusions, and payment terms."
  },
  {
    title: "Photo Guide: Before/After Shots",
    href: "/resources/photo-guide",
    kind: "Guide",
    blurb: "How to capture job photos that build trust and win more work."
  },
  {
    title: "Payments & Disputes Overview",
    href: "/resources/payments-and-disputes",
    kind: "Guide",
    blurb: "How deposits and final payments work, and what to do if something goes wrong."
  }
];

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Resources | Plumbers Portal",
    hasPart: resources.map(r => ({
      "@type": "CreativeWork",
      name: r.title,
      url: r.href
    }))
  };

  const resourcesCta: { title: string; subtitle: string; buttons: CtaButton[] } = {
    title: "Looking for something specific?",
    subtitle: "Tell us what you’d like to see next and we’ll add it to the roadmap.",
    buttons: [
      {
        label: "Suggest a resource",
        href: "/contact"
      }
    ]
  };

  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />
      <PageHeader title="Resources" subtitle="Practical help for customers and plumbers — free and always growing." />

      <section className="py-16 lg:py-24">
        <Container>
          <ul className="grid gap-4 md:grid-cols-2">
            {resources.map(r => (
              <li key={r.title} className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{r.kind}</div>
                <h2 className="mt-1 text-lg font-semibold">
                  <Link href={r.href} className="hover:underline">
                    {r.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{r.blurb}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-16 lg:py-24">
        <CtaSection title={resourcesCta.title} subtitle={resourcesCta.subtitle} buttons={resourcesCta.buttons} />
      </section>

      <JsonLd data={jsonLd} />
    </div>
  );
}
