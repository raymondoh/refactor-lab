import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { StripeProvider } from "@/providers/StripeProvider";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PageHeader } from "@/components/shared/PageHeader";
export const metadata: Metadata = {
  title: `Checkout | ${siteConfig.name}`,
  description: "Complete your purchase securely with Stripe.",
  robots: { index: false, follow: false }
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen">
      <section className="py-16 w-full bg-background">
        <div className="container mx-auto px-4">
          <PageHeader
            title="Checkout"
            subtitle="Driven by passion, crafted with precision. Discover the story behind your favorite stickers."
          />
        </div>
        <StripeProvider>
          <CheckoutForm />
        </StripeProvider>
      </section>
    </main>
  );
}
