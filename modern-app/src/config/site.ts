// src/config/site.ts

export const siteConfig = {
  name: "Plumbers Portal",
  description:
    "Plumbers Portal — the UK’s trusted platform to find and hire qualified local plumbers. Compare free quotes for boiler repair, leak detection, blocked drains, and 24/7 emergency plumbing near you.",
  url: "https://plumbersportal.com",
  ogImage: "https://plumbersportal.com/og.jpg",

  // Useful brand/social refs for OG/Twitter & schema
  links: {
    twitter: "https://twitter.com/plumbersportal",
    github: "https://github.com/raymondoh/plumbers-portal",
    facebook: "https://facebook.com/plumbersportal",
    linkedin: "https://linkedin.com/company/plumbers-portal"
  },

  // Expanded, intent-focused keyword set (kept concise to avoid stuffing)
  keywords: [
    "UK plumbers",
    "local plumber near me",
    "hire plumber online",
    "find plumber UK",
    "compare plumber quotes",
    "plumbing services",
    "emergency plumber",
    "boiler repair",
    "leak detection",
    "blocked drains",
    "bathroom plumbing",
    "kitchen plumbing",
    "central heating",
    "water heater installation",
    "plumbing quote",
    "Gas Safe registered"
  ],

  authors: [
    {
      name: "Plumbers Portal Team",
      url: "https://plumbersportal.com"
    }
  ],

  creator: "Plumbers Portal",
  publisher: "Plumbers Portal", // used in JSON-LD
  contactEmail: "support@plumbersportal.com",

  // Next.js 13+ will use this for resolving absolute metadata URLs
  metadataBase: new URL("https://plumbersportal.com")
};

export type SiteConfig = typeof siteConfig;
