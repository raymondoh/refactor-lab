import type { ReactNode } from "react";

import { CtaButton, type CtaButtonProps } from "@/components/marketing/cta-button-main";

interface PageCtaLPProps {
  title: string;
  description: string;
  page: string;
  cta: Omit<CtaButtonProps, "eventName" | "page">;
  eyebrow?: string;
  aside?: ReactNode;
}

export function PageCta({ title, description, page, cta, eyebrow, aside }: PageCtaLPProps) {
  return (
    <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-12 shadow-sm">
      <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? (
            <span className="text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</span>
          ) : null}
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-3 text-base text-muted-foreground">{description}</p>
          <div className="mt-6">
            <CtaButton {...cta} page={page} eventName="landing_click_primary_cta" className="w-full sm:w-auto" />
          </div>
        </div>
        {aside ? <div className="max-w-sm text-sm text-muted-foreground">{aside}</div> : null}
      </div>
    </section>
  );
}
