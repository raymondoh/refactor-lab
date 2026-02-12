import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

export function PromoSection() {
  return (
    <section className="w-full py-16">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-10 md:grid-cols-[2fr_1fr]">
          {/* Left */}
          <div className="min-w-0">
            <div className="mb-8">
              <h2 className="text-3xl font-bold md:text-4xl">Limited Time Offer</h2>
              <div className="mt-4 mb-6 h-0.5 w-12 bg-primary" />
              <p className="text-lg text-muted-foreground">
                Get 15% off your first order when you sign up for our newsletter. Plus, receive exclusive access to new
                designs and promotions.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href="/products" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">SHOP NOW</Button>
              </Link>

              <Link href="/about" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto border-border/60 hover:border-primary/40">
                  LEARN MORE <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right */}
          <div className="hidden md:block">
            <div className="w-full rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <h3 className="text-xl font-bold">Join Our Community</h3>
              <div className="mt-3 mb-4 h-0.5 w-8 bg-primary" />
              <p className="mb-4 text-muted-foreground">Sign up to receive updates, exclusive offers, and more!</p>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
