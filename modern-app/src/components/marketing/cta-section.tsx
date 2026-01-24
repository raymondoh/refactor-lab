// src/components/marketing/cta-section.tsx
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Container } from "./container";

const marketingButtonVariants = cva("w-full sm:w-auto", {
  variants: {
    tone: {
      solid: "bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90",
      outline:
        "border border-secondary-foreground/80 text-secondary-foreground bg-transparent hover:bg-secondary-foreground/10 focus-visible:border-secondary-foreground"
    }
  },
  defaultVariants: {
    tone: "solid"
  }
});

// Corrected: Define MarketingButtonTone once using Exclude
type MarketingButtonTone = Exclude<VariantProps<typeof marketingButtonVariants>["tone"], null | undefined>;

const toneByVariant: Record<string, MarketingButtonTone> = {
  primary: "solid",
  secondary: "solid",
  danger: "solid",
  subtle: "outline",
  default: "solid",
  outline: "outline",
  ghost: "outline",
  destructive: "solid"
};

// Define a type with only the string variants for the buttonVariants' variant prop
type ButtonVariantStrings = Exclude<VariantProps<typeof buttonVariants>["variant"], null | undefined>;

// Use the corrected MarketingButtonTone for the key and ButtonVariantStrings for the value
const toneToButtonVariant: Record<MarketingButtonTone, ButtonVariantStrings> = {
  solid: "secondary",
  outline: "subtle"
};

export interface CtaButton {
  label: string;
  href: string;
  tone?: MarketingButtonTone;
  /**
   * @deprecated Use `tone` instead. This exists for backwards compatibility while marketing CTAs are updated.
   */
  variant?: VariantProps<typeof buttonVariants>["variant"] | keyof typeof toneByVariant;
  className?: string;
}

interface CtaSectionProps {
  title: string;
  subtitle: string;
  buttons: CtaButton[];
}

export default function CtaSection({ title, subtitle, buttons }: CtaSectionProps) {
  return (
    <div className="bg-secondary text-secondary-foreground py-16 lg:py-24">
      <Container>
        <div className="rounded-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="text-xl opacity-80 mb-8">{subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {buttons.map((button, index) => {
              // Ensure tone calculation correctly uses the possibly undefined button.variant
              const tone = button.tone ?? (button.variant ? (toneByVariant[button.variant] ?? "solid") : "solid");
              // Ensure buttonVariant uses the defined mapping with the derived tone
              const buttonVariant = toneToButtonVariant[tone];

              return (
                <Button
                  key={index}
                  asChild
                  size="lg"
                  variant={buttonVariant} // Use the derived buttonVariant
                  className={cn(marketingButtonVariants({ tone, className: button.className }))}>
                  <Link href={button.href}>{button.label}</Link>
                </Button>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
}
