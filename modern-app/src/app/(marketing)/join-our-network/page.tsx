// src/app/(marketing)/join-our-network/page.tsx
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { Benefits, FaqAccordion, LandingHero, HowItWorksSection, Testimonials } from "@/components/marketing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { CalendarClock, HandCoins, LineChart, ShieldCheck, Sparkles } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import CtaSection, { type CtaButton as SectionCtaButton } from "@/components/marketing/cta-section";
import { auth } from "@/auth";
import { CtaButtonMain } from "@/components/marketing/cta-button-main";

const pageSlug = "join-our-network";

export const metadata: Metadata = {
  title: "Get Plumbing Leads — Join Plumbers Portal",
  description:
    "Grow your business with quality plumbing leads. Join Plumbers Portal to receive job alerts, quote on local work, and build your profile.",
  alternates: { canonical: `${siteConfig.url}/join-our-network` }
};

const tradesJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "WebSite"],
  name: siteConfig.name,
  url: `${siteConfig.url}/join-our-network`,
  description:
    "Plumbers Portal helps plumbing professionals connect with verified homeowners, send quotes, and get paid securely.",
  potentialAction: {
    "@type": "RegisterAction",
    name: "Create a tradesperson account",
    target: `${siteConfig.url}/register?role=tradesperson`
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Membership plans",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Basic",
        price: 0,
        priceCurrency: "GBP",
        description: "Start quoting jobs with a free profile."
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: 25,
        priceCurrency: "GBP",
        description: "Unlock unlimited quotes and featured placement."
      },
      {
        "@type": "Offer",
        name: "Business",
        price: 49,
        priceCurrency: "GBP",
        description: "Grow your team with analytics and lead routing."
      }
    ]
  }
};

const tiers = [
  {
    name: "Basic",
    price: "Free",
    description: "Perfect for getting started with verified leads.",
    perks: ["5 quotes each month", "Verified profile with reviews", "Standard job alerts"],
    badge: "Included"
  },
  {
    name: "Pro",
    price: "£25/mo",
    description: "Boost your visibility and quote without limits.",
    perks: ["Unlimited quotes", "Featured profile placement", "Priority support"],
    badge: "Most popular"
  },
  {
    name: "Business",
    price: "£49/mo",
    description: "Powerful tools for growing teams and multi-site ops.",
    perks: ["Lead routing for teams", "Insights & analytics dashboard", "Dedicated account manager"],
    badge: "For teams"
  }
] as const;

export default async function JoinOurNetworkPage() {
  const session = await auth();
  const isLoggedInTradesperson = session?.user?.role === "tradesperson";

  // --- Conditionally set the correct hrefs ---
  const tradespersonHref = isLoggedInTradesperson ? "/dashboard/tradesperson/job-board" : "/register?role=tradesperson";

  const joinCta: { title: string; subtitle: string; buttons: SectionCtaButton[] } = {
    title: "Ready to Grow Your Business?",
    subtitle: "Create your free profile today and start receiving verified job leads in your area.",
    buttons: [
      {
        label: "Create Your Account",
        href: tradespersonHref
      },
      {
        label: "View Pricing & Limits",
        href: "/pricing",
        tone: "outline"
      }
    ]
  };
  // --- Conditionally set PageHero CTA hrefs ---
  const joinFreeHref = isLoggedInTradesperson ? "/dashboard/tradesperson/job-board" : "/register?role=tradesperson";
  const seeLeadsHref = isLoggedInTradesperson ? "/dashboard/tradesperson/job-board" : "/register?role=tradesperson"; // Adjust if needed, maybe just /search?
  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />
      <LandingHero
        eyebrow="For tradespeople"
        headline="Grow Your Plumbing Business Here"
        subheadline="Build a standout profile, receive verified leads in your area, and quote jobs on your terms."
        primaryCta={{ href: joinFreeHref, label: "Join for free" }}
        secondaryCta={{ href: seeLeadsHref, label: "See leads in your area", variant: "secondary" }}
        page={pageSlug}
        footnote={<span>No card required. Upgrade only when you’re ready for more jobs.</span>}
      />

      <section className="">
        <Container>
          <HowItWorksSection
            eyebrow="How it works"
            title="Win Jobs in Three Simple Steps"
            description="We streamline the process so you spend more time on site and less time on admin."
            steps={[
              {
                title: "Create your profile",
                description: "Showcase your qualifications, service area, and recent work to stand out to homeowners.",
                icon: "badge"
              },
              {
                title: "Receive verified leads",
                description:
                  "Get notified when jobs match your skills. Review the brief, photos, and requested timing before you quote.",
                icon: "calendar"
              },
              {
                title: "Quote and get hired",
                description:
                  "Send tailored quotes, secure the booking with a deposit, and manage payments in one dashboard.",
                icon: "handshake"
              }
            ]}
          />
        </Container>
      </section>

      <section className="">
        <Container>
          <Benefits
            eyebrow="Why plumbers rely on us"
            title="Stay Busy With The Right Kind Of Work"
            description="We deliver steady, high-intent demand without locking you into long-term contracts."
            items={[
              {
                title: "No hidden fees",
                description: "Keep more of what you earn — pay only for the plan that matches your goals.",
                icon: <HandCoins className="size-6" aria-hidden="true" />
              },
              {
                title: "Control your schedule",
                description: "Accept the jobs that suit your workload and pause leads whenever you’re fully booked.",
                icon: <CalendarClock className="size-6" aria-hidden="true" />
              },
              {
                title: "Verified customers",
                description: "Every job request is screened so you know it’s from a real homeowner ready to hire.",
                icon: <ShieldCheck className="size-6" aria-hidden="true" />
              },
              {
                title: "Tools to grow",
                description: "Access reviews, messaging, invoices, and performance insights to keep clients returning.",
                icon: <LineChart className="size-6" aria-hidden="true" />
              }
            ]}
          />
        </Container>
      </section>

      <section className="">
        <Container>
          <div>
            <div className="mx-auto max-w-3xl">
              <span className="block text-center text-sm font-semibold uppercase tracking-wide text-primary">
                Plans
              </span>
              <SectionHeader
                title="Choose The Plan That Fits Today"
                subtitle="Start on Basic for free. Upgrade when you need more quotes, priority placement, or team support."
                className="mt-2"
              />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {tiers.map(tier => (
                <Card key={tier.name} className="relative flex h-full flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold">{tier.name}</CardTitle>
                      <Badge variant="outline" className="text-xs uppercase tracking-wide">
                        {tier.badge}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold">{tier.price}</div>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {tier.perks.map(perk => (
                        <li key={perk} className="flex items-start gap-2">
                          <Sparkles className="mt-0.5 size-4 text-primary" aria-hidden="true" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="mt-auto">
                    <CtaButtonMain
                      href="/register?role=tradesperson"
                      label={tier.name === "Basic" ? "Create free account" : "Upgrade when ready"}
                      page={pageSlug}
                      eventName="landing_click_secondary_cta"
                      className="w-full"
                      variant={tier.name === "Basic" ? "primary" : "secondary"}
                    />
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Testimonials
        eyebrow="In their words"
        title="Success Stories from Plumbers Portal Pros"
        description="Thousands of UK plumbers trust us to keep their calendars full."
        testimonials={[
          {
            quote:
              "Within my first week I booked two boiler repairs worth £1,200. The leads are legit and the app is easy to use.",
            name: "Gareth M.",
            role: "Heating specialist in Cardiff"
          },
          {
            quote:
              "I can see every enquiry, quote fast, and take deposits before turning up. Cash flow has never been smoother.",
            name: "Simone T.",
            role: "Bathroom fitter in Leeds"
          },
          {
            quote:
              "The Business plan gives my team shared visibility and analytics so we know which jobs are worth our time.",
            name: "Daniel K.",
            role: "Plumbing director in London"
          }
        ]}
      />

      <FaqAccordion
        //eyebrow="FAQs"
        description="Everything you need to know before joining the network."
        faqs={[
          {
            question: "Can I cancel or pause my plan?",
            answer:
              "Yes. Downgrade or pause leads at any time from your dashboard. You’ll keep access to your profile and reviews."
          },
          {
            question: "How do leads work?",
            answer:
              "You receive job alerts that match your services and postcode radius. Review the details and only quote the work you want."
          },
          {
            question: "When do I pay fees?",
            answer:
              "Basic is free forever. Paid tiers charge a flat monthly subscription — no commission on the jobs you win."
          },
          {
            question: "What support do I get?",
            answer:
              "Live chat and phone support are available daily. Business customers receive a dedicated account manager."
          }
        ]}
      />

      <section className="">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-semibold">What you’ll need to get verified</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Company details & proof of address</li>
                <li>• Public liability insurance</li>
                <li>• Trade qualifications/certifications</li>
                <li>• Recent project photos</li>
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-semibold">How jobs and payments work</h3>
              <p className="mt-4 text-sm text-muted-foreground">
                Receive relevant job leads, submit quotes in-app, and collect a deposit via our secure checkout. When
                the job is complete, capture the final payment. We use a Stripe-powered marketplace flow to route funds
                quickly and safely.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-24">
        <CtaSection title={joinCta.title} subtitle={joinCta.subtitle} buttons={joinCta.buttons} />
      </section>

      <JsonLd data={tradesJsonLd} />
    </div>
  );
}
