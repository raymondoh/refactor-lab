import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

export function PromoSection() {
  return (
    <section className="py-16 w-full bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Limited Time Offer</h2>
              <div className="w-12 h-0.5 bg-primary mb-6"></div>
              <p className="text-muted-foreground text-lg">
                Get 15% off your first order when you sign up for our newsletter. Plus, receive exclusive access to new
                designs and promotions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button className="bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90">
                  SHOP NOW
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" className="border-primary/20 hover:border-primary/40">
                  LEARN MORE <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden lg:block border border-border/40 p-6 rounded-xl max-w-sm w-full bg-background shadow-sm">
            <h3 className="text-xl font-bold mb-3">Join Our Community</h3>
            <div className="w-8 h-0.5 bg-primary mb-4"></div>
            <p className="text-muted-foreground mb-4">Sign up to receive updates, exclusive offers, and more!</p>

            <NewsletterForm />
          </div>
        </div>
      </div>
    </section>
  );
}
