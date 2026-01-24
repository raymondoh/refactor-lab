// src/components/landing/hero-lp.tsx
import type { ReactNode } from "react";

import { CtaButton, type CtaButtonProps } from "@/components/marketing/cta-button-main";
import { Badge } from "@/components/ui/badge";

interface HeroLPProps {
  eyebrow?: string;
  headline: string;
  subheadline: string;
  primaryCta: Omit<CtaButtonProps, "eventName" | "page">;
  secondaryCta?: Omit<CtaButtonProps, "eventName" | "page">;
  page: string;
  footnote?: ReactNode;
}

export function LandingHero({ eyebrow, headline, subheadline, primaryCta, secondaryCta, page, footnote }: HeroLPProps) {
  return (
    <section className="relative overflow-hidden px-6 py-12 text-center">
      <div className="relative mx-auto flex max-w-4xl flex-col items-center">
        {eyebrow && (
          <Badge className="mb-4 text-sm font-medium" variant="secondary">
            {" "}
            {/* Use Badge with margin */}
            {eyebrow}
          </Badge>
        )}

        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{headline}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{subheadline}</p>
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <CtaButton
            {...primaryCta}
            page={page}
            eventName="landing_click_primary_cta"
            className="w-full sm:w-auto"
            size="lg"
          />
          {secondaryCta ? (
            <CtaButton
              {...secondaryCta}
              page={page}
              eventName="landing_click_secondary_cta"
              variant={secondaryCta.variant ?? "subtle"}
              className="w-full sm:w-auto"
              size="lg"
            />
          ) : null}
        </div>
        {footnote ? <div className="mt-6 text-sm text-muted-foreground">{footnote}</div> : null}
      </div>
    </section>
  );
}
