// src/config/siteConfig.ts

const isDev = process.env.NODE_ENV === "development";

const SITE_URL = process.env.SITE_URL || (isDev ? "http://localhost:3000" : "https://motostix.com");
const OG_IMAGE_URL = process.env.OG_IMAGE_URL || (isDev ? `${SITE_URL}/og.jpg` : "https://motostix.com/og.jpg");
const SITE_TWITTER = process.env.SITE_TWITTER || (isDev ? "https://twitter.com/example" : "");

export const siteConfig = {
  name: "MotoStix",
  url: SITE_URL,
  ogImage: OG_IMAGE_URL,
  description: "High-quality custom stickers for any surface or occasion.",
  keywords: ["custom stickers", "vinyl stickers", "waterproof stickers", "decals", "labels"],
  twitter: SITE_TWITTER
};
