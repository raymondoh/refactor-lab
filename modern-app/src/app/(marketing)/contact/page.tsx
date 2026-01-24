// src/app/(marketing)/contact/page.tsx
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import ContactClient from "./contact-client";

export const metadata: Metadata = {
  title: "Contact Plumbers Portal",
  description: "Need help or have a question? Contact the Plumbers Portal team.",
  alternates: { canonical: `${siteConfig.url}/contact` }
};

export default function ContactPage() {
  // This is a Server Component wrapper that renders your Client Component
  return <ContactClient />;
}
