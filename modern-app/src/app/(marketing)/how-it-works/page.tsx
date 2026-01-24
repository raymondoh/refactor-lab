// src/app/(marketing)/how-it-works/page.tsx
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/json-ld";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { PageHeader } from "@/components/marketing/page-header";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { CheckCircle } from "lucide-react";
import CtaSection from "@/components/marketing/cta-section";
import { auth } from "@/auth"; // <-- Import auth
import type { CtaButton } from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "How It Works — Hire a Plumber in 3 Steps",
  description:
    "Post your job, compare free quotes, and hire a trusted, local plumber. Here’s how Plumbers Portal works for customers and plumbers.",
  alternates: { canonical: `${siteConfig.url}/how-it-works` }
};

export default async function HowItWorksPage() {
  const session = await auth();
  const isLoggedInCustomer = session?.user?.role === "customer";
  const isLoggedInTradesperson = session?.user?.role === "tradesperson";

  // --- Conditionally set the correct hrefs ---
  const customerHref = isLoggedInCustomer ? "/dashboard/customer/jobs/create" : "/register?role=customer";
  const tradespersonHref = isLoggedInTradesperson ? "/dashboard/tradesperson/job-board" : "/register?role=tradesperson";

  const steps = [
    {
      title: "Post your job (free)",
      body: "Describe the work, add photos/videos, and pick a timeframe. We notify relevant tradespeople nearby."
    },
    {
      title: "Get quotes fast",
      body: "Pros review your job and send quotes with price, availability, and reviews."
    },
    {
      title: "Pick your pro",
      body: "Compare options, chat to confirm details, then book."
    },
    {
      title: "Secure payments",
      body: "Pay a deposit via checkout and the final on completion—funds handled securely."
    },
    {
      title: "Aftercare & reviews",
      body: "Rate your experience and keep records in your account."
    }
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How Plumbers Portal Works",
    description: "From posting a job to paying a verified tradesperson.",
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title
    }))
  };

  const howItWorksCta: { title: string; subtitle: string; buttons: CtaButton[] } = {
    title: "Ready to Get Started?",
    subtitle: "Join thousands of satisfied customers and professional plumbers on our platform.",
    buttons: [
      {
        label: "I Need a Plumber",
        href: customerHref //
      },
      {
        label: "I Am a Plumber",
        href: tradespersonHref,
        tone: "outline"
      }
    ]
  };

  // --- Conditionally set PageHero CTA href ---
  const postJobHref = isLoggedInCustomer ? "/dashboard/customer/jobs/create" : "/register?role=customer";

  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />
      <PageHeader
        title="How It Works"
        subtitle="A clear path from posting a job to paying a verified plumber — built for speed, safety, and transparency."
        cta={[
          { href: postJobHref, label: "Post a Job" }, // <-- Use conditional href
          { href: "/join-our-network", label: "Join as a Plumber" }
        ]}
      />
      {/* Steps Section */}
      <section className="py-16 lg:py-24">
        <Container>
          <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((s, i) => (
              <li key={i} className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="mb-2 text-sm font-medium text-muted-foreground">Step {i + 1}</div>
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
      {/* Why Choose Section */}
      <section className="py-16 lg:py-24">
        {" "}
        <Container>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            {" "}
            <SectionHeader title="Why choose Plumbers Portal?" align="center" />
            <ul className="grid gap-3 text-sm md:grid-cols-2">
              {" "}
              {[
                "Verified plumbers with profile checks",
                "Clear quotes and timelines—no surprises",
                "Secure, trackable payments (deposit & final)",
                "Messaging, attachments, and audit trail"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <span className="text-card-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-24">
        <CtaSection title={howItWorksCta.title} subtitle={howItWorksCta.subtitle} buttons={howItWorksCta.buttons} />
      </section>

      <JsonLd data={jsonLd} />
    </div>
  );
}
