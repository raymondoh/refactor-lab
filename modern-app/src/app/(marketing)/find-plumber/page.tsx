// src/app/(marketing)/find-plumber/page.tsx
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { Benefits, FaqAccordion, LandingHero, HowItWorksSection, Testimonials } from "@/components/marketing";
import { siteConfig } from "@/config/site";
import { Headset, Receipt, ShieldCheck, Star } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import CtaSection from "@/components/marketing/cta-section";
import type { CtaButton } from "@/components/marketing/cta-section";
import { auth } from "@/auth";

const pageSlug = "find-plumber";

export const metadata: Metadata = {
  title: "Find Local Plumbers & Compare Free Quotes",
  description:
    "Post your job for free and get fast, competitive quotes from trusted local plumbers. Boiler repair, leak detection, blocked drains, emergencies and more.",
  alternates: { canonical: `${siteConfig.url}/find-plumber` },
  openGraph: {
    title: "Find Local Plumbers & Compare Free Quotes",
    description: "Get quotes from qualified local plumbers for boiler repairs, leaks, and emergencies.",
    url: `${siteConfig.url}/find-plumber`
  },
  twitter: {
    title: "Find Local Plumbers & Compare Free Quotes",
    description: "Post your job and get quotes from trusted local plumbers."
  }
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Service", "LocalBusiness"],
  name: "Plumbers Portal — Find a Plumber",
  image: siteConfig.ogImage,
  url: `${siteConfig.url}/find-plumber`,
  description:
    "Plumbers Portal connects homeowners with vetted local plumbers who provide transparent quotes and quick service.",
  areaServed: {
    "@type": "Country",
    name: "United Kingdom"
  },
  serviceType: "Residential and commercial plumbing",
  provider: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    sameAs: [siteConfig.links.twitter]
  },
  potentialAction: {
    "@type": "Action",
    name: "Request plumbing quotes",
    target: `${siteConfig.url}/register?role=customer`
  }
};

export default async function FindPlumberPage() {
  const session = await auth();
  const isLoggedInCustomer = session?.user?.role === "customer";

  // --- Conditionally set the correct href ---
  const registerOrPostJobHref = isLoggedInCustomer ? "/dashboard/customer/jobs/create" : "/register?role=customer";

  const customerCta: { title: string; subtitle: string; buttons: CtaButton[] } = {
    title: "Find a Trusted Plumber Today",
    subtitle: "Post your job for free and receive quotes from verified professionals in your area.",
    buttons: [
      {
        label: "Post Your Job Now",
        href: registerOrPostJobHref
      },
      {
        label: "Browse Plumbers",
        href: "/search",
        tone: "outline"
      }
    ]
  };

  // --- Conditionally set the primary CTA href ---
  const primaryCtaHref = isLoggedInCustomer ? "/dashboard/customer/jobs/create" : "/register?role=customer";

  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />
      <LandingHero
        eyebrow="For homeowners"
        headline="Hire Trusted Local Plumbers — Fast"
        subheadline="Share the job once and we’ll match you with vetted plumbers ready to quote within minutes."
        primaryCta={{ href: primaryCtaHref, label: "Get quotes now" }}
        page={pageSlug}
        footnote={<span>Posting a job takes under two minutes and is completely free.</span>}
      />

      <HowItWorksSection
        eyebrow="How it works"
        title="Three Quick Steps To Your Perfect Plumber"
        description="We simplify the process from first request to final invoice."
        steps={[
          {
            title: "Tell us about the job",
            description: "Describe the issue and share photos if you have them. We instantly alert plumbers nearby.",
            icon: "clipboard"
          },
          {
            title: "Compare transparent quotes",
            description: "Receive multiple responses with pricing and availability, then chat directly in the portal.",
            icon: "message"
          },
          {
            title: "Hire with confidence",
            description:
              "Book the pro you prefer, pay securely through Plumbers Portal, and track progress in one place.",
            icon: "wrench"
          }
        ]}
      />

      <Benefits
        eyebrow="Why Customers Choose Us"
        title="Plumbing Help Without The Guesswork"
        description="We vet every plumber so you get reliable work, upfront pricing, and real reviews."
        items={[
          {
            title: "Vetted professionals",
            description:
              "All plumbers pass ID, insurance, and qualification checks before they go live on the marketplace.",
            icon: <ShieldCheck className="size-6" aria-hidden="true" />
          },
          {
            title: "Clear, comparable quotes",
            description:
              "Side-by-side pricing breakdowns, job scope, and timelines so you always know what you’re paying for.",
            icon: <Receipt className="size-6" aria-hidden="true" />
          },
          {
            title: "Ratings you can trust",
            description:
              "See verified reviews, response times, and repeat hire rates from real Plumbers Portal customers.",
            icon: <Star className="size-6" aria-hidden="true" />
          },
          {
            title: "Emergency ready",
            description:
              "Need urgent help? Flag it as an emergency and we’ll prioritise rapid responders in your area.",
            icon: <Headset className="size-6" aria-hidden="true" />
          }
        ]}
      />

      <Testimonials
        eyebrow="Social proof"
        title="Real Stories from Repeat Customers"
        description="From leaky taps to full bathroom renovations, we make hiring the right plumber simple."
        testimonials={[
          {
            quote:
              "We posted on a Sunday night and had three quotes by Monday morning. The job was finished that afternoon.",
            name: "Priya S.",
            role: "Homeowner in Manchester"
          },
          {
            quote:
              "Loved how transparent the pricing was. No surprise fees and the plumber we chose was brilliant to work with.",
            name: "Alex R.",
            role: "Landlord in Bristol"
          },
          {
            quote:
              "The emergency badge meant we had someone on-site within the hour. Saved us from a burst pipe disaster!",
            name: "Karen L.",
            role: "Homeowner in Glasgow"
          }
        ]}
      />

      <FaqAccordion
        eyebrow="FAQs"
        description="Have another question? Our support team is available every day from 7am–10pm."
        faqs={[
          {
            question: "Is it free to post a plumbing job?",
            answer:
              "Yes. Posting your job, receiving quotes, and chatting with plumbers are all free. You only pay when you book a pro."
          },
          {
            question: "How quickly will plumbers respond?",
            answer:
              "Most requests receive the first quote within 15 minutes and at least three options within the hour, depending on your location."
          },
          {
            question: "Are the plumbers insured and qualified?",
            answer:
              "Every tradesperson is verified for insurance, certifications, and ID before they can quote. We regularly review ratings and feedback, too."
          },
          {
            question: "Can I manage everything online?",
            answer:
              "Absolutely. Approve quotes, schedule visits, and pay securely inside Plumbers Portal from any device."
          }
        ]}
      />

      <section className="py-16 lg:py-24">
        <CtaSection title={customerCta.title} subtitle={customerCta.subtitle} buttons={customerCta.buttons} />
      </section>

      <JsonLd data={serviceJsonLd} />
    </div>
  );
}
