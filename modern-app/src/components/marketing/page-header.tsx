// src/components/marketing/page-hero.tsx
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { Container } from "./container";

type ButtonVariant = Exclude<VariantProps<typeof buttonVariants>["variant"], null | undefined>;

interface PageHeroCta {
  href: string;
  label: string;
  variant?: ButtonVariant; // optional override
}

interface PageHeroProps {
  title: string;
  subtitle: string;
  cta?: PageHeroCta[];
}

export function PageHeader({ title, subtitle, cta }: PageHeroProps) {
  return (
    <section className="my-12">
      <Container className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{title}</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-4xl mx-auto">{subtitle}</p>
        {cta && cta.length > 0 && (
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-x-4">
            {cta.map((item, index) => {
              const variant: ButtonVariant =
                item.variant ??
                (index === 0
                  ? "primary" // first CTA = main action
                  : "secondary"); // second+ = secondary by default

              return (
                <Button key={item.href} asChild size="lg" variant={variant}>
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
