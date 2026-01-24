// src/components/marketing/how-it-works-section.tsx

"use client";

import { Container } from "@/components/marketing/container";
// 1. Import the icons you need *inside* this client component
import {
  Pencil,
  MessageSquare,
  CheckCircle,
  ClipboardList,
  Calendar,
  Handshake,
  Wrench,
  Badge,
  type LucideIcon
} from "lucide-react";

// 2. Create a map to look up icons based on a string
const iconMap: Record<string, LucideIcon> = {
  pencil: Pencil,
  message: MessageSquare,
  check: CheckCircle,
  clipboard: ClipboardList,
  wrench: Wrench,
  badge: Badge,
  calendar: Calendar,
  handshake: Handshake

  // Add any other icons you might need here
};

interface Step {
  icon: string;
  title: string;
  description: string;
}

interface HowItWorksProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  steps: Step[];
}

// I've also renamed the function to match the new filename
export function HowItWorksSection({
  eyebrow,
  title = "How It Works",
  description = "Get your plumbing sorted in three simple steps.",
  steps
}: HowItWorksProps) {
  return (
    <section className="py-16 lg:py-24">
      <Container>
        <div className="mx-auto mb-12 max-w-3xl text-center">
          {eyebrow && <p className="mb-4 text-sm font-semibold text-primary">{eyebrow}</p>}
          <h2 className="text-3xl font-bold text-foreground">{title}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{description}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map(step => {
            // 4. Look up the icon component from the map
            const IconComponent = iconMap[step.icon];

            return (
              <div key={step.title} className="rounded-2xl border bg-card p-6 text-left shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-secondary dark:text-primary">
                  {/* 5. Render the looked-up component */}
                  {IconComponent ? <IconComponent className="h-6 w-6" aria-hidden="true" /> : null}
                </div>
                <h3 className="mt-6 text-xl font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
