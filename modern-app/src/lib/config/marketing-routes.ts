// src/lib/config/marketing-routes.ts
/**
 * A single source of truth for all static marketing pages.
 * Used by:
 * 1. src/app/sitemap.ts (to generate sitemap.xml)
 * 2. src/app/footer-routes.test.ts (to integration-test all static pages)
 * 3. src/components/layout/footer.tsx (to dynamically build footer links)
 */
export const staticMarketingRoutes = [
  "/",
  "/about",
  "/contact",
  "/cookies",
  "/emergency",
  "/find-plumber",
  "/how-it-works",
  "/join-our-network",
  "/pricing",
  "/privacy",
  "/resources",
  "/resources/customer-job-posting-checklist",
  "/resources/payments-and-disputes",
  "/resources/photo-guide",
  "/resources/quote-template",
  "/services",
  "/website-map",
  "/terms-of-service"
];
