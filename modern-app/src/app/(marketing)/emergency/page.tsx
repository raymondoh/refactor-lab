// src/app/(marketing)/emergency/page.tsx
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/marketing/page-header";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Container } from "@/components/marketing/container";

export const metadata: Metadata = {
  title: "Emergency Plumbers — 24/7 Callouts Near You",
  description:
    "Burst pipe? No heating? Find 24/7 emergency plumbers near you. Post your job and get rapid quotes from available engineers.",
  alternates: { canonical: `${siteConfig.url}/emergency` }
};

export default function EmergencyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Emergency Plumbing",
    provider: {
      "@type": "Organization",
      name: "Plumbers Portal"
    },
    areaServed: {
      "@type": "Country",
      name: "UK"
    },
    description:
      "24/7 emergency plumbing services for urgent issues. Post a job to get immediate responses from available local plumbers."
  };

  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />
      <PageHeader
        title="Emergency Plumbing Service"
        subtitle="Burst pipe? Boiler breakdown? Get immediate help from available 24/7 plumbers in your area."
      />

      <section className="py-16 lg:py-24">
        <Container>
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                  What to Do in an Emergency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>
                    <strong>Turn off your water supply.</strong> Your main stopcock is usually under the kitchen sink or
                    in a downstairs cupboard.
                  </li>
                  <li>
                    <strong>Switch off heating systems.</strong> Turn off your boiler and any other water heating
                    appliances.
                  </li>
                  <li>
                    <strong>Turn on your taps</strong> to drain the system and reduce pressure on the burst pipe.
                  </li>
                  <li>
                    <strong>Post your job here.</strong> Mark it as an "Emergency" to notify available plumbers
                    immediately.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  Why Use Us for Emergencies?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <strong className="text-primary">•</strong>
                    <span>
                      <strong>Fast Response:</strong> We instantly notify all available emergency plumbers in your area.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <strong className="text-primary">•</strong>
                    <span>
                      <strong>Verified Professionals:</strong> All tradespeople on our platform are vetted for your
                      safety and peace of mind.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <strong className="text-primary">•</strong>
                    <span>
                      <strong>Clear Communication:</strong> Use our built-in messaging to confirm details and get
                      updates quickly.
                    </span>
                  </li>
                </ul>
                <div className="border-t pt-4">
                  <Button asChild className="w-full">
                    <Link href="/register?role=customer&urgency=emergency">Post Your Emergency Job Now</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      <JsonLd data={jsonLd} />
    </div>
  );
}
