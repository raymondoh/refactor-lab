// src/app/(marketing)/resources/payments-and-disputes/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/marketing/container";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { PageHeader } from "@/components/marketing/page-header";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Payments & Disputes | Plumbers Portal",
  description: "How deposits and final payments work, plus what to do if something goes wrong.",
  alternates: {
    canonical: "/resources/payments-and-disputes"
  },
  keywords: ["plumbing payments", "plumbing disputes", "secure plumbing deposit"]
};

const faqs = [
  {
    q: "How do payments work?",
    a: "You pay a deposit when booking via our checkout and the final payment on completion. Funds are routed securely with our payment partner."
  },
  {
    q: "Where is my money held?",
    a: "Payments are processed by our partner (Stripe). We store only IDs and metadata to reconcile your order—never full card numbers."
  },
  {
    q: "What if I need a refund?",
    a: "Contact your tradesperson first to resolve. If unresolved, open a dispute through your dashboard; we’ll review and coordinate next steps."
  },
  {
    q: "How are disputes handled?",
    a: "We review evidence from both sides (messages, photos, agreed scope). Outcomes can include partial refunds, rework, or mediation."
  }
];

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    })),
    potentialAction: {
      "@type": "PayAction",
      target: "/checkout",
      name: "Secure deposit and final payment",
      instrument: "Credit/Debit card via payment processor"
    }
  };

  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />
      <PageHeader
        title="Payments & Disputes"
        subtitle="Secure, trackable payments with a clear path when things go wrong."
        cta={[{ href: "/contact", label: "Contact support" }]}
      />

      <section className="py-16 lg:py-24">
        <Container className="space-y-12">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">How payments flow</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Accept a quote and pay a deposit via the portal.</li>
              <li>Work is completed.</li>
              <li>Pay the final balance via the portal.</li>
              <li>Receipt and records are saved to your account.</li>
            </ol>
            <p className="mt-4 text-sm">
              Need help?{" "}
              <Link className="underline" href="/contact">
                Contact support
              </Link>
              .
            </p>
          </div>

          <div className="rounded-2xl border bg-muted/40 p-6 text-sm text-muted-foreground">
            <p>
              Want to know what you get with every booking? Review the protections on our{" "}
              <Link href="/pricing" className="font-medium text-primary underline">
                plans &amp; pricing
              </Link>{" "}
              page and explore the tools we give trades on the{" "}
              <Link href="/features" className="font-medium text-primary underline">
                features overview
              </Link>
              .
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map(f => (
              <div key={f.q} className="rounded-2xl border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-semibold">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <JsonLd data={jsonLd} />
    </div>
  );
}
