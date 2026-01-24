import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

// Import the new link configurations
import { footerShopLinks, footerPolicyLinks, socialLinks } from "@/config/footerLinks";

export function Footer() {
  return (
    <footer className="main-footer py-8 md:py-12 lg:py-16 w-full bg-secondary/10 border-t border-border/40">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Logo and About (Static content remains) */}
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-2xl font-bold tracking-tight">
                MOTO<span className="text-primary">STIX</span>
              </span>
            </div>
            <p className="text-muted-foreground">
              Premium motorcycle decals and stickers for riders who demand the best. Quality, durability, and style for
              your bike.
            </p>
            {/* Social Links are now dynamic */}
            <div className="flex space-x-4">
              {socialLinks.map(social => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="text-muted-foreground hover:text-primary transition-colors">
                  {social.name === "Facebook" && <Facebook className="h-5 w-5" />}
                  {social.name === "Instagram" && <Instagram className="h-5 w-5" />}
                  {social.name === "Twitter" && <Twitter className="h-5 w-5" />}
                  {social.name === "Youtube" && <Youtube className="h-5 w-5" />}
                  <span className="sr-only">{social.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links (Now Dynamic) */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Shop</h3>
            <ul className="space-y-2">
              {footerShopLinks.map(item => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <span className="text-primary text-xs">›</span> {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Info (Static content remains) */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">123 Motorcycle Lane, Speed City, SC 12345</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span className="text-muted-foreground">(555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span className="text-muted-foreground">info@motostix.com</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter (Static content remains) */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Newsletter</h3>
            <p className="text-muted-foreground">
              !!Subscribe to our newsletter for the latest designs, promotions, and exclusive offers.
            </p>
            {/* <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="Your email"
                className="bg-background border-border focus:border-primary"
              />
              <Button className="bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90">
                Subscribe <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div> */}
            <NewsletterForm />
          </div>
        </div>

        {/* Payment Methods & Security */}
        <div className="border-t border-border/40 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-muted-foreground text-sm font-medium">We Accept:</div>
            <div className="flex items-center gap-4">
              <Image src="/images/visa-logo.svg" alt="Visa" width={38} height={24} />
              <Image src="/images/mastercard-logo.svg" alt="Mastercard" width={38} height={24} />
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <span className="text-xs">Secure payments powered by</span>
              <Image
                src="/images/stripe-logo-light-mode.svg"
                alt="Stripe"
                width={50}
                height={20}
                className="block dark:hidden"
              />
              <Image
                src="/images/stripe-logo-dark.svg"
                alt="Stripe"
                width={50}
                height={20}
                className="hidden dark:block"
              />
            </a>
          </div>
        </div>

        {/* Bottom Footer (Now Dynamic) */}
        <div className="border-t border-border/40 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-muted-foreground text-sm text-center md:text-left">
              © {new Date().getFullYear()} MotoStix. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {footerPolicyLinks.map((item, index) => (
                <div key={item.name} className="flex items-center gap-4">
                  <Link href={item.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {item.name}
                  </Link>
                  {/* Show separator if it's not the last item */}
                  {index < footerPolicyLinks.length - 1 && (
                    <Separator orientation="vertical" className="hidden md:block h-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
