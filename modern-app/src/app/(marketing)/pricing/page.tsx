// src/app/(marketing)/pricing/page.tsx
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import PricingClient from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing — Plumbers Portal",
  description: "Choose a plan that fits your business. Start free, upgrade for more leads and features.",
  alternates: { canonical: `${siteConfig.url}/pricing` }
};

export default function PricingPage() {
  return <PricingClient />;
}
