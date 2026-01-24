// src/components/layout/footer.tsx

import React from "react";
import Link from "next/link";
import { CITIES, POPULAR_SERVICES } from "@/lib/config/locations";
import { toSlug } from "@/lib/utils/slugify";
import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggleButton } from "./theme-toggle-button";
import { ManageCookiesLink } from "@/components/legal/manage-cookies-link";
import { footerLinkConfig } from "@/lib/config/footer-links";
import { Container } from "@/components/marketing/container";
import { SocialIcon } from "@/components/social/social-icon";
import { IconBrandFacebook, IconBrandInstagram, IconBrandLinkedin } from "@tabler/icons-react";

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms-of-service", label: "Terms" },
  { href: "/cookies", label: "Cookies" }
];

export function Footer() {
  const PRIMARY_CITY_SLUG = CITIES.length ? toSlug(CITIES[0]) : "london";

  const socialLinks = {
    facebook: "https://www.facebook.com/plumbersportal",
    instagram: "https://www.instagram.com/plumbersportal",
    linkedin: "https://www.linkedin.com/company/plumbers-portal"
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Plumbers Portal",
    url: "https://plumbersportal.com",
    logo: "https://plumbersportal.com/logo.png",
    sameAs: Object.values(socialLinks),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@plumbersportal.com",
        areaServed: "GB",
        availableLanguage: ["English"]
      }
    ]
  };

  const siteNavJsonLd = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: ["Find a Plumber", "Services", "How It Works", "Emergency", "Pricing", "About", "Contact"],
    url: [
      "https://plumbersportal.com/find-plumber",
      "https://plumbersportal.com/services",
      "https://plumbersportal.com/how-it-works",
      "https://plumbersportal.com/emergency",
      "https://plumbersportal.com/pricing",
      "https://plumbersportal.com/about",
      "https://plumbersportal.com/contact"
    ]
  };

  return (
    <footer aria-label="Footer" className="border-t bg-background text-foreground">
      <Container className="py-12">
        {/* ===================================================== */}
        {/*                TOP GRID (branding + menus)            */}
        {/* ===================================================== */}
        <nav aria-label="Footer navigation" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Branding */}
          <div className="col-span-2 md:col-span-1 space-y-6">
            <AppLogo />
            <p className="text-sm text-muted-foreground">
              The trusted platform connecting customers with professional plumbers.
            </p>

            {/* Social Icons */}
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Find us on</span>
              <div className="flex items-center gap-3">
                <SocialIcon
                  href={socialLinks.facebook}
                  label="Facebook"
                  icon={<IconBrandFacebook className="h-5 w-5" />}
                  variant="primary"
                />
                <SocialIcon
                  href={socialLinks.instagram}
                  label="Instagram"
                  icon={<IconBrandInstagram className="h-5 w-5" />}
                  variant="primary"
                />
                <SocialIcon
                  href={socialLinks.linkedin}
                  label="LinkedIn"
                  icon={<IconBrandLinkedin className="h-5 w-5" />}
                  variant="primary"
                />
              </div>
            </div>
          </div>

          {/* Footer link groups */}
          {footerLinkConfig.map(column => (
            <nav aria-label={column.title} key={column.title}>
              <h3 className="font-semibold mb-4 text-foreground">{column.title}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {column.links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-foreground"
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noreferrer" : undefined}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </nav>

        {/* ===================================================== */}
        {/*     SEO / DISCOVERY SECTION – SERVICES & CITIES       */}
        {/* ===================================================== */}
        <div className="border-t border-border mt-10 pt-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* ====================== Popular Services ====================== */}
            <nav aria-label="Popular services">
              <h3 className="font-semibold mb-4 text-foreground">Popular Services</h3>

              <div className="flex flex-wrap gap-2">
                {POPULAR_SERVICES.slice(0, 12).map(service => (
                  <Link
                    key={service}
                    href={`/plumbers/${PRIMARY_CITY_SLUG}/${toSlug(service)}`}
                    className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition">
                    {service}
                  </Link>
                ))}
              </div>

              <p className="mt-3 text-xs">
                <Link href="/services" className="hover:underline underline-offset-4">
                  View all services →
                </Link>
              </p>
            </nav>

            {/* ====================== Popular Cities ====================== */}
            <nav aria-label="Popular cities">
              <h3 className="font-semibold mb-4 text-foreground">Popular Cities</h3>
              <div className="flex flex-wrap gap-2">
                {CITIES.slice(0, 12).map(city => (
                  <Link
                    key={city}
                    href={`/plumbers/${toSlug(city)}`}
                    className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition">
                    {city}
                  </Link>
                ))}
              </div>
              <p className="mt-3 text-xs">
                <Link href="/plumbers" className="hover:underline underline-offset-4">
                  View all cities →
                </Link>
              </p>
            </nav>
          </div>
        </div>

        {/* ===================================================== */}
        {/*         COPYRIGHT + LEGAL + THEME TOGGLE ROW          */}
        {/* ===================================================== */}
        <div className="border-t border-border mt-8 pt-8 text-muted-foreground pb-10 xs:pb-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs">&copy; {new Date().getFullYear()} Plumbers Portal. All rights reserved.</p>

            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs ">
              {legalLinks.map(link => (
                <Link key={link.href} href={link.href} className="hover:text-foreground">
                  {link.label}
                </Link>
              ))}
              <ManageCookiesLink variant="link" className="font-light hover:text-foreground" />
              <ThemeToggleButton />
            </div>
          </div>
        </div>
      </Container>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavJsonLd) }} />
    </footer>
  );
}
