import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { ResendVerificationForm } from "@/components";
import { AuthHeader } from "@/components/auth/AuthHeader";

export const metadata: Metadata = {
  title: `Resend Email Verification | ${siteConfig.name}`,
  description:
    "Didn't receive your verification email? We'll send you a new verification link to activate your MotoStix account and get you started with custom stickers.",
  keywords: [
    "resend verification",
    "email verification",
    "account activation",
    "verify email",
    "resend email",
    "account confirmation",
    "email not received",
    "activate account",
    "motostix verification"
  ],

  openGraph: {
    title: `Resend Email Verification | ${siteConfig.name}`,
    description: "Didn't receive your verification email? We'll send you a new link to activate your account.",
    type: "website",
    url: `${siteConfig.url}/resend-verification`,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-auth.jpg",
        width: 1200,
        height: 630,
        alt: "Resend your email verification - MotoStix"
      }
    ]
  },

  twitter: {
    card: "summary_large_image",
    title: `Resend Email Verification | ${siteConfig.name}`,
    description: "Didn't receive your verification email? We'll send you a new link to activate your account.",
    images: ["/og-auth.jpg"],
    creator: "@motostix"
  },

  alternates: {
    canonical: `${siteConfig.url}/resend-verification`
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },

  other: {
    referrer: "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  }
};

export default function ResendVerificationPage() {
  return (
    <>
      <AuthHeader
        title="Verify Your Email"
        subtitle="Didn't receive a verification email? Enter your email address below and we'll send a new link."
      />
      <div className="mt-8">
        <ResendVerificationForm />
      </div>
    </>
  );
}
