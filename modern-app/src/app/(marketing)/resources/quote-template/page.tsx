// src/app/(marketing)/resources/quote-template/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/marketing/container";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { PageHeader } from "@/components/marketing/page-header";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Tradesperson Quote Template | Plumbers Portal",
  description: "A clean, professional plumbing quote template covering scope, exclusions, and payment terms.",
  alternates: {
    canonical: "/resources/quote-template"
  },
  keywords: ["plumbing quote template", "plumbing estimate format", "plumber proposal outline"]
};

const sections = [
  {
    heading: "Overview",
    content: "Briefly describe the job and intended outcome. Reference the customer’s job post ID if applicable."
  },
  {
    heading: "Scope of work",
    content: "List each task you will perform. Mention materials, fixtures, and any responsible parties."
  },
  {
    heading: "Exclusions & assumptions",
    content: "Clarify what is NOT included (e.g., making good, decorating) and assumptions (e.g., access provided)."
  },
  {
    heading: "Price & breakdown",
    content: "Provide line items if possible. State whether it’s fixed price or estimate, including VAT where relevant."
  },
  {
    heading: "Payment terms",
    content: "Typical: deposit upon booking via the portal; final payment upon completion through the portal."
  },
  {
    heading: "Timeline & availability",
    content: "Proposed start date, expected duration, and any dependencies (e.g., parts lead times)."
  },
  {
    heading: "Guarantee & aftercare",
    content: "State workmanship warranty period and manufacturer warranty details for parts."
  }
];

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Tradesperson Quote Template",
    description: "A professional quote template for plumbing jobs with clear scope, price, and terms.",
    about: ["Plumbing", "Quoting", "Small business"],
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock"
    }
  };

  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />
      <PageHeader
        title="Tradesperson Quote Template"
        subtitle="Use this structure to submit clear, professional quotes that win work."
        cta={[{ href: "/join-our-network", label: "Join our network" }]}
      />

      <section className="py-16 lg:py-24">
        <Container>
          <div className="space-y-6">
            {sections.map(s => (
              <div key={s.heading} className="rounded-2xl border bg-card p-6 shadow-sm">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">{s.heading}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{s.content}</p>
              </div>
            ))}

            <div className="rounded-2xl border bg-card p-6">
              <h3 className="text-lg font-semibold">Copy-paste starter</h3>
              <pre className="mt-3 overflow-x-auto rounded-xl border bg-muted/40 p-4 text-sm">
                {`Overview:
[Brief job summary]

Scope of Work:
- Task 1
- Task 2
- Materials: [list]

Exclusions & Assumptions:
- Exclusion 1
- Assumption 1

Price & Breakdown:
- Labour: £
- Materials: £
- Total (incl VAT): £

Payment Terms:
- Deposit via portal on booking
- Final via portal on completion

Timeline & Availability:
- Start date:
- Duration:

Guarantee & Aftercare:
- Workmanship warranty:
- Manufacturer warranty (parts):`}
              </pre>
            </div>

            <div className="rounded-2xl border bg-muted/40 p-6 text-sm text-muted-foreground">
              <p>
                Ready to send this to customers? Highlight what’s included with your quote on our{" "}
                <Link href="/features" className="font-medium text-primary underline">
                  platform features
                </Link>{" "}
                page and choose the right plan on the{" "}
                <Link href="/pricing" className="font-medium text-primary underline">
                  pricing overview
                </Link>
                .
              </p>
            </div>
          </div>
        </Container>
      </section>
      <JsonLd data={jsonLd} />
    </div>
  );
}
