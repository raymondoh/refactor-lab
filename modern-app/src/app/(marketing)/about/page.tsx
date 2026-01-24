// src/app/(marketing)/about/page.tsx
import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, Shield, Wrench, Smartphone, Star, Building, Heart } from "lucide-react";
import Image from "next/image";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { PageHeader } from "@/components/marketing/page-header";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import CtaSection from "@/components/marketing/cta-section";
import type { CtaButton } from "@/components/marketing/cta-section";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "About Plumbers Portal",
  description:
    "Plumbers Portal connects homeowners with trusted local plumbers across the UK. Our mission is to make hiring a reliable tradesperson simple and transparent.",
  alternates: { canonical: `${siteConfig.url}/about` }
};

export default async function AboutPage() {
  const session = await auth();
  const isLoggedInCustomer = session?.user?.role === "customer";
  const isLoggedInTradesperson = session?.user?.role === "tradesperson";
  // --- Conditionally set the correct hrefs ---
  const customerHref = isLoggedInCustomer ? "/dashboard/customer/jobs/create" : "/register?role=customer";
  const tradespersonHref = isLoggedInTradesperson ? "/dashboard/tradesperson/job-board" : "/register?role=tradesperson";

  const aboutCta: { title: string; subtitle: string; buttons: CtaButton[] } = {
    title: "Ready to Get Started?",
    subtitle: "Join thousands of satisfied customers and professional plumbers on our platform.",
    buttons: [
      {
        label: "I Need a Plumber",
        href: customerHref
      },
      {
        label: "I Am a Plumber",
        href: tradespersonHref,
        tone: "outline"
      }
    ]
  };
  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />
      <PageHeader
        title="About Plumbers Portal"
        subtitle="The leading SaaS platform revolutionizing how customers find and connect with professional plumbers across the UK. We don't fix pipes - we connect people."
      />

      <section className="py-16 lg:py-24">
        <Container>
          <Card className="border-border bg-card shadow-lg transition-transform hover:-translate-y-1">
            <CardHeader className="pb-8 text-center">
              <CardTitle className="mb-4 text-3xl text-card-foreground">Our Mission</CardTitle>
              <CardDescription className="mx-auto max-w-2xl text-lg">
                To create the most trusted and efficient marketplace where customers can easily find qualified plumbers,
                and where plumbing professionals can grow their businesses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  {/* --- Apply dark mode text color here --- */}
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-secondary dark:text-primary-dark-theme">
                    <Smartphone className="h-8 w-8" /> {/* Icon inherits color */}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-card-foreground">Technology</h3>
                  <p className="text-muted-foreground">
                    A cutting-edge platform that makes finding and hiring plumbers simple and secure.
                  </p>
                </div>
                <div className="text-center">
                  {/* --- Apply dark mode text color here --- */}
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-secondary dark:text-primary-dark-theme">
                    <Shield className="h-8 w-8" /> {/* Icon inherits color */}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-card-foreground">Trust</h3>
                  <p className="text-muted-foreground">
                    Verified plumber profiles, secure payments, and a transparent review system.
                  </p>
                </div>
                <div className="text-center">
                  {/* --- Apply dark mode text color here --- */}
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-secondary dark:text-primary-dark-theme">
                    <Users className="h-8 w-8" /> {/* Icon inherits color */}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-card-foreground">Community</h3>
                  <p className="text-muted-foreground">
                    Building lasting relationships between customers and professional tradespeople.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      <section className="py-16 lg:py-24">
        <Container>
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <SectionHeader title="Our Story" align="left" />
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Plumbers Portal was founded by a team of homeowners and tech enthusiasts who were frustrated with the
                hassle of finding reliable tradespeople. We knew there had to be a better way than endless phone calls
                and uncertain quotes.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                Our vision was simple: create a single, trustworthy platform where quality meets convenience. Today,
                we're proud to be the UK's fastest-growing network connecting thousands of customers with skilled,
                vetted plumbers every day.
              </p>
            </div>
            <div className="order-1 md:order-2">
              <Image
                src="/images/hero-bathtub.webp"
                alt="Plumbers Portal Team"
                width={800}
                height={450}
                className="h-auto w-full rounded-lg object-cover shadow-xl"
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-24">
        <Container>
          <SectionHeader title="How Our Platform Works" />
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Users className="h-6 w-6 text-primary" />
                  For Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Search and browse verified plumber profiles",
                    "Post job requirements and receive multiple quotes",
                    "Read genuine reviews and ratings",
                    "Secure messaging and booking system",
                    "Protected payments and dispute resolution"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-card-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Wrench className="h-6 w-6 text-secondary" />
                  For Plumbers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Create a professional profile to showcase expertise",
                    "Access to local customers actively seeking services",
                    "Job management tools and scheduling system",
                    "Secure payment processing and invoicing tools",
                    "Build your reputation with customer feedback"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-card-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      <section className=" py-16 lg:py-24">
        <Container>
          <Card className="border-0">
            <CardContent className="py-12">
              <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
                <div className="flex flex-col items-center">
                  <Heart className="mb-2 h-8 w-8" />
                  <div className="text-4xl font-bold">10,000+</div>
                  <div className="text-muted-foreground">Happy Customers</div>
                </div>
                <div className="flex flex-col items-center">
                  <Wrench className="mb-2 h-8 w-8" />
                  <div className="text-4xl font-bold">500+</div>
                  <div className="text-muted-foreground">Verified Plumbers</div>
                </div>
                <div className="flex flex-col items-center">
                  <Star className="mb-2 h-8 w-8" />
                  <div className="text-4xl font-bold">4.8/5</div>
                  <div className="text-muted-foreground">Average Rating</div>
                </div>
                <div className="flex flex-col items-center">
                  <Building className="mb-2 h-8 w-8" />
                  <div className="text-4xl font-bold">50+</div>
                  <div className="text-muted-foreground">UK Cities Covered</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      <section className=" py-16 lg:py-24">
        <CtaSection title={aboutCta.title} subtitle={aboutCta.subtitle} buttons={aboutCta.buttons} />
      </section>
    </div>
  );
}
