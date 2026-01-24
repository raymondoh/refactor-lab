import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { MarketingSearchForm } from "@/components/marketing/marketing-search-form";
import { Container } from "./container";

export default function HomepageHero() {
  return (
    <section className="relative overflow-hidden py-16 lg:py-24">
      {/* === Background image and effects === */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero-bathtub.webp"
          alt="Bath tap with blurred bathtub background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_20%] lg:object-[50%_12%]"
        />

        {/* Overlay: slightly darker for better contrast */}
        <div className="absolute inset-0 bg-black/25 dark:bg-black/40" />

        {/* Gradient fade: draws focus toward content & page body */}
        {/* Gradient fade */}
        <div
          className="
pointer-events-none absolute inset-x-0 bottom-0 h-60 
bg-gradient-to-t
from-background/90 via-background/40 to-transparent
dark:from-background/95 dark:via-background/40 dark:to-transparent
backdrop-blur-xs 
"
        />
      </div>

      {/* === Hero content === */}
      <Container className="relative z-10">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <Badge className="inline-block">🚰 Professional Plumbing Services</Badge>

          {/* Heading: white over image (light), off-white in dark */}
          <h1 className="text-4xl font-bold text-white dark:text-foreground sm:text-6xl drop-shadow-md">
            Connect With <span className="">Trusted Plumbers</span>
          </h1>

          {/* Paragraph: brighter in both, esp. dark mode */}
          <p className="text-lg sm:text-xl text-white/90 dark:text-white/90 drop-shadow-sm">
            Post your job for free and receive competitive quotes from qualified professionals in your area.
          </p>

          <div className="mx-auto max-w-2xl">
            <MarketingSearchForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
