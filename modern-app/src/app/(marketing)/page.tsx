// src/app/marketing/page.tsx
import type { Metadata } from "next";
import { auth } from "@/auth";
import { unstable_cache } from "next/cache";
import { siteConfig } from "@/config/site";
import { jobService } from "@/lib/services/job-service";
import { userService } from "@/lib/services/user-service";
import HomepageHero from "@/components/marketing/homepage-hero";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import WhyChooseUsSection from "@/components/marketing/why-choose-us-section";

import { TradespersonResults } from "@/components/search/tradesperson-results";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

import { Container } from "@/components/marketing/container";
import { FaqAccordion, Testimonials } from "@/components/marketing";
import CtaSection from "@/components/marketing/cta-section";
import type { CtaButton } from "@/components/marketing/cta-section";
import { FeaturedTradespeopleCarousel } from "@/components/marketing/featured-tradespeople-carousel";
import { FeaturedTradespeopleHero } from "@/components/marketing/featured-tradespeople-hero";
import { JobCard } from "@/components/cards/job-card";
import { FeaturedJobsHero } from "@/components/marketing/featured-jobs-hero";

export const metadata: Metadata = {
  title: "Find Local Plumbers & Get Free Quotes",
  description:
    "Find trusted local plumbers on Plumbers Portal. Post your job for free to compare quotes for boiler repair, leak detection, emergency plumbing, and more.",
  keywords: siteConfig.keywords,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Find Local Plumbers & Get Free Quotes | Plumbers Portal",
    description:
      "Find trusted local plumbers on Plumbers Portal. Post your job for free to compare quotes for boiler repair, leak detection, emergency plumbing, and more.",
    url: siteConfig.url,
    images: [siteConfig.ogImage]
  },
  twitter: {
    title: "Find Local Plumbers & Get Free Quotes | Plumbers Portal",
    description:
      "Find trusted local plumbers on Plumbers Portal. Post your job for free to compare quotes for boiler repair, leak detection, emergency plumbing, and more.",
    images: [siteConfig.ogImage]
  }
};

const getCachedHomepageData = unstable_cache(
  async () => {
    const [featuredTradespeople, recentJobsResult] = await Promise.all([
      userService.getFeaturedTradespeople(),
      jobService.getRecentOpenJobs(9)
    ]);

    return {
      featuredTradespeople,
      recentJobs: recentJobsResult ?? []
    };
  },
  ["marketing-homepage-data"],
  {
    revalidate: 600
  }
);

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}
// ⬇️ 2. Define the steps (you can cut/paste this from your old file)
const homeHowItWorksSteps = [
  {
    icon: "pencil", // <-- Use string
    title: "1. Post Your Job",
    description: "Describe the work you need done. It's free and takes just a few minutes."
  },
  {
    icon: "message", // <-- Use string
    title: "2. Get Quotes",
    description: "Receive competitive quotes from local, verified plumbers."
  },
  {
    icon: "check", // <-- Use string
    title: "3. Hire the Best",
    description: "Compare profiles and reviews to choose the right professional for your job."
  }
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const sessionPromise = auth();
  const { q = "" } = await searchParams;
  const query = q;
  const isSearchMode = Boolean(query);
  const session = await sessionPromise;

  let featuredTradespeople: Awaited<ReturnType<typeof userService.getFeaturedTradespeople>> = [];
  let recentJobs: Awaited<ReturnType<typeof jobService.getRecentOpenJobs>> = [];
  let searchResults: Awaited<ReturnType<typeof userService.searchTradespeople>>["users"] = [];

  if (isSearchMode) {
    const [featuredTradespeopleResult, recentJobsResult, searchResult] = await Promise.all([
      userService.getFeaturedTradespeople(),
      jobService.getRecentOpenJobs(9),
      userService.searchTradespeople({ query, limit: 12 })
    ]);

    featuredTradespeople = featuredTradespeopleResult;
    recentJobs = recentJobsResult ?? [];
    searchResults = searchResult.users;
  } else {
    const cachedData = await getCachedHomepageData();
    featuredTradespeople = cachedData.featuredTradespeople;
    recentJobs = cachedData.recentJobs;
  }
  // --- Rank recent jobs to pick featured ones ---
  const getUrgencyWeight = (urgency: (typeof recentJobs)[number]["urgency"] | undefined) => {
    switch (urgency) {
      case "emergency":
        return 3;
      case "urgent":
        return 2;
      case "soon":
        return 1;
      default:
        return 0;
    }
  };

  const rankedRecentJobs = [...recentJobs].sort((a, b) => {
    // 1) Urgency (emergency > urgent > soon > other)
    const aUrgency = getUrgencyWeight(a.urgency);
    const bUrgency = getUrgencyWeight(b.urgency);
    if (aUrgency !== bUrgency) {
      return bUrgency - aUrgency;
    }

    // 2) Higher budgets first
    const aBudget = a.budget ?? 0;
    const bBudget = b.budget ?? 0;
    if (aBudget !== bBudget) {
      return bBudget - aBudget;
    }

    // 3) Fewer quotes first (more attractive to tradespeople)
    const aQuotes = a.quoteCount ?? 0;
    const bQuotes = b.quoteCount ?? 0;
    if (aQuotes !== bQuotes) {
      return aQuotes - bQuotes;
    }

    // 4) Newer jobs first
    const aCreated = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
    const bCreated = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
    return bCreated - aCreated;
  });

  const heroJobs = rankedRecentJobs.slice(0, 2);
  const carouselJobs = rankedRecentJobs.slice(2);

  // Rank featured tradespeople: Business > Pro > Basic, then rating, then review count
  const tierWeight = {
    business: 3,
    pro: 2,
    basic: 1
  } as const;

  const rankedFeaturedTradespeople = [...featuredTradespeople].sort((a, b) => {
    const aTier = (a.subscriptionTier ?? "basic") as "basic" | "pro" | "business";
    const bTier = (b.subscriptionTier ?? "basic") as "basic" | "pro" | "business";

    const aIsFeatured = a.isFeatured ? 1 : 0;
    const bIsFeatured = b.isFeatured ? 1 : 0;

    // 1) Prioritize explicit "isFeatured" flag
    if (aIsFeatured !== bIsFeatured) {
      return bIsFeatured - aIsFeatured;
    }

    // 2) Then by subscription tier weight
    if (tierWeight[aTier] !== tierWeight[bTier]) {
      return tierWeight[bTier] - tierWeight[aTier];
    }

    // 3) Then by average rating
    const aRating = a.avgRating ?? 0;
    const bRating = b.avgRating ?? 0;
    if (aRating !== bRating) {
      return bRating - aRating;
    }

    // 4) Then by number of reviews
    const aReviews = a.reviewsCount ?? 0;
    const bReviews = b.reviewsCount ?? 0;
    if (aReviews !== bReviews) {
      return bReviews - aReviews;
    }

    return 0;
  });

  // Use ranked list for hero + carousel
  const heroTradespeople = rankedFeaturedTradespeople.slice(0, 2);
  const carouselTradespeople = rankedFeaturedTradespeople.slice(2);

  const isLoggedInCustomer = session?.user?.role === "customer";
  const isLoggedInTradesperson = session?.user?.role === "tradesperson";
  const registerOrPostJobHref = isLoggedInCustomer ? "/dashboard/customer/jobs/create" : "/register?role=customer";
  const registerOrFindJobHref = isLoggedInTradesperson
    ? "/dashboard/tradesperson/job-board"
    : "/register?role=tradesperson";

  const homeCta: { title: string; subtitle: string; buttons: CtaButton[] } = {
    title: "Ready to Get Started?",
    subtitle: "Join thousands of satisfied customers and professional plumbers on our platform.",
    buttons: [
      {
        label: "I Need a Plumber",
        href: registerOrPostJobHref
      },
      {
        label: "I Am a Plumber",
        href: registerOrFindJobHref,
        tone: "outline"
      }
    ]
  };
  console.log("RECENT JOBS", recentJobs);

  return (
    <div>
      <HomepageHero />
      {isSearchMode ? (
        <section className="py-16 lg:py-24">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Search results for "{query}"</h2>
            </div>
            <div className="mt-12">
              <TradespersonResults tradespeople={searchResults} />
            </div>
          </Container>
        </section>
      ) : (
        <>
          {/* ⬇️ 3. Pass the props into your component */}
          <HowItWorksSection
            title="How It Works"
            description="Get your plumbing sorted in three simple steps."
            steps={homeHowItWorksSteps}
          />

          {rankedFeaturedTradespeople.length > 0 && (
            <section className="py-16 lg:py-24">
              <Container>
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">Featured Plumbers</h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                    Top-rated and verified professionals in your area.
                  </p>
                </div>

                {/* 2x image-forward hero cards */}
                <FeaturedTradespeopleHero tradespeople={heroTradespeople} />

                {/* Only show carousel if there are more beyond the hero cards */}
                {carouselTradespeople.length > 0 && (
                  <div className="mx-auto mt-12 max-w-5xl">
                    <FeaturedTradespeopleCarousel tradespeople={carouselTradespeople} />
                  </div>
                )}

                <div className="mt-12 text-center">
                  <Button asChild>
                    <Link href="/search">Browse All Plumbers</Link>
                  </Button>
                </div>
              </Container>
            </section>
          )}

          {/* Only shows OPEN JOBS */}
          {rankedRecentJobs.length > 0 && (
            <section className="py-16 lg:py-24">
              <Container>
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">Recently Posted Jobs</h2>
                  <p className="mt-4 text-lg text-muted-foreground">Opportunities available for quoting right now.</p>
                </div>

                {/* 2x featured jobs hero cards */}
                {heroJobs.length > 0 && <FeaturedJobsHero jobs={heroJobs} />}

                {/* Carousel for the remaining jobs */}
                {carouselJobs.length > 0 && (
                  <div className="mx-auto mt-12 max-w-5xl">
                    <Carousel opts={{ align: "start", loop: true }} className="w-full">
                      <CarouselContent>
                        {carouselJobs.map(job => (
                          <CarouselItem key={job.id} className="basis-4/5 md:basis-1/3 lg:basis-1/3">
                            <div className="h-full p-0">
                              <JobCard job={job} showDescription={false} showNewBadge />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="hidden sm:flex" />
                      <CarouselNext className="hidden sm:flex" />
                    </Carousel>
                  </div>
                )}

                <div className="mt-12 text-center">
                  <Button asChild>
                    <Link href="/dashboard/tradesperson/job-board">View Job Board</Link>
                  </Button>
                </div>
              </Container>
            </section>
          )}

          <WhyChooseUsSection />
          <Testimonials
            //eyebrow="Social proof"
            title="Real Stories from Happy Customers"
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
            //eyebrow="FAQs"
            description="Quick answers to common questions about using Plumbers Portal"
            faqs={[
              {
                question: "Is it free for customers to post jobs?",
                answer:
                  "Yes! Customers can post jobs, receive quotes, and communicate with plumbers completely free of charge."
              },
              {
                question: "How are plumbers verified?",
                answer:
                  "We check qualifications, insurance details, and proof of address. Look for the verification badges on plumbers' profiles."
              },
              {
                question: "How do payments work?",
                answer:
                  "Customers pay a deposit securely through our platform when accepting a quote. The final balance is paid upon job completion, also via the platform. Funds are securely handled by Stripe."
              },
              {
                question: "Can I get help in an emergency?",
                answer:
                  "Yes, you can mark your job post as an 'Emergency'. We prioritize notifying plumbers who offer 24/7 services in your area."
              }
            ]}
          />

          <section className="py-12 lg:py-24">
            <CtaSection title={homeCta.title} subtitle={homeCta.subtitle} buttons={homeCta.buttons} />
          </section>
        </>
      )}
    </div>
  );
}
