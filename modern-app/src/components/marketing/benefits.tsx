import type { ReactElement } from "react";

import { Container } from "@/components/marketing/container";
import { cn } from "@/lib/utils";

interface BenefitItem {
  title: string;
  description: string;
  icon: ReactElement;
}

interface BenefitsLPProps {
  title?: string;
  description?: string;
  eyebrow?: string;
  items: BenefitItem[];
}

export function Benefits({ title = "Why homeowners choose us", description, eyebrow, items }: BenefitsLPProps) {
  return (
    <section className="py-16 lg:py-24">
      <Container className="space-y-12">
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow ? (
            <span className="text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</span>
          ) : null}
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          {description ? <p className="mt-3 text-base text-muted-foreground">{description}</p> : null}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {items.map(item => (
            <div key={item.title} className="flex h-full flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm">
              {/* --- Apply dark mode styles to the icon container --- */}
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary",
                  "dark:bg-secondary dark:text-primary-dark-theme" // Added dark mode styles
                )}>
                {item.icon} {/* Icon inherits color */}
              </div>
              {/* --- End of change --- */}
              <div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
