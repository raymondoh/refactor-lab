// src/app/(marketing)/resources/customer-job-posting-checklist/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/marketing/container";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { PageHeader } from "@/components/marketing/page-header";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Customer Job Posting Checklist | Plumbers Portal",
  description: "Everything customers should include when posting a plumbing job to get fast, accurate quotes.",
  alternates: {
    canonical: "/resources/customer-job-posting-checklist"
  },
  keywords: ["plumbing job checklist", "plumbing quote requirements", "prepare plumbing job post"]
};

const checklist = [
  {
    name: "Describe the problem clearly",
    detail: "What happened, when it started, any prior fixes."
  },
  {
    name: "Location & access",
    detail: "Exact area of the property, parking, entry instructions."
  },
  {
    name: "Photos/videos",
    detail: "Close-ups + context shots; short video for noises/leaks."
  },
  {
    name: "Measurements & materials",
    detail: "Pipe sizes, fixtures, model numbers if known."
  },
  {
    name: "Timing",
    detail: "Ideal start date, acceptable windows, urgency level."
  },
  {
    name: "Constraints",
    detail: "Budget range, quiet hours, building rules, pets."
  }
];

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Customer Job Posting Checklist",
    description: "A step-by-step checklist to help customers post plumbing jobs and get accurate quotes.",
    supply: ["Photos", "Measurements"],
    step: checklist.map((item, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: item.name,
      itemListElement: {
        "@type": "HowToDirection",
        text: item.detail
      }
    }))
  };

  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />
      <PageHeader
        title="Customer Job Posting Checklist"
        subtitle="Include these details to help tradespeople quote accurately and quickly."
      />

      <section className="py-16 lg:py-24">
        <Container>
          <ol className="grid gap-4 md:grid-cols-2">
            {checklist.map((c, i) => (
              <li key={c.name} className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="text-sm text-muted-foreground">Step {i + 1}</div>
                <h2 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{c.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{c.detail}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 rounded-2xl border bg-muted/40 p-6 text-sm text-muted-foreground">
            <p>
              Ready to share your job? Compare membership options on our{" "}
              <Link href="/pricing" className="font-medium text-primary underline">
                pricing page
              </Link>{" "}
              or see exactly how booking works in our{" "}
              <Link href="/how-it-works" className="font-medium text-primary underline">
                how it works guide
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>
      <JsonLd data={jsonLd} />
    </div>
  );
}
