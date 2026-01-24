// src/app/(marketing)/resources/photo-guide/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/marketing/container";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { PageHeader } from "@/components/marketing/page-header";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Photo Guide: Before/After Shots | Plumbers Portal",
  description: "How to capture job photos that build trust and help win more work.",
  alternates: {
    canonical: "/resources/photo-guide"
  },
  keywords: ["plumbing photo guide", "before and after plumbing photos", "plumbing portfolio tips"]
};

const tips = [
  {
    t: "Show context + close-ups",
    d: "One wide shot for location, one close shot of the issue."
  },
  {
    t: "Good lighting",
    d: "Turn on lights or use natural light. Avoid harsh shadows."
  },
  { t: "Keep it steady", d: "Use both hands; tap to focus on the subject." },
  {
    t: "Show progress",
    d: "Before, during, and after shots tell a story customers trust."
  },
  {
    t: "Privacy first",
    d: "Avoid faces, personal documents, or house numbers."
  }
];

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Photo Guide: Before/After Shots",
    description: "Practical guidance for capturing plumbing job photos that improve quoting and conversions.",
    articleSection: ["Photography", "Trust", "Quoting"]
  };

  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />
      <PageHeader
        title="Photo Guide: Before/After Shots"
        subtitle="Photos help you get clearer quotes and prove quality to future customers."
      />
      <section className="py-16 lg:py-24">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {tips.map(x => (
              <div key={x.t} className="rounded-2xl border bg-card p-6 shadow-sm">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">{x.t}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border bg-muted/40 p-6 text-sm text-muted-foreground">
            <p>
              Turn those photos into booked work by showcasing them on your{" "}
              <Link href="/features" className="font-medium text-primary underline">
                Plumbers Portal profile
              </Link>{" "}
              and reminding customers about your guarantees on the{" "}
              <Link href="/pricing" className="font-medium text-primary underline">
                plans &amp; pricing page
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
