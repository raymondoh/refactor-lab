import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { ForgotPasswordForm } from "@/components";
import { AuthHeader } from "@/components/auth/AuthHeader";

export const metadata: Metadata = {
  title: `Reset Your Password | ${siteConfig.name}`,
  description:
    "Forgot your password? Enter your email address and we'll send you a secure link to reset your password and regain access to your account.",
  keywords: [
    "forgot password",
    "reset password",
    "password recovery",
    "account recovery",
    "login help",
    "password reset",
    "account access",
    "motostix login"
  ],

  openGraph: {
    title: `Reset Your Password | ${siteConfig.name}`,
    description: "Forgot your password? We'll help you reset it securely and get back to your account.",
    type: "website",
    url: `${siteConfig.url}/forgot-password`,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-auth.jpg", // You might want to create a generic auth image
        width: 1200,
        height: 630,
        alt: "Reset your password securely with MotoStix"
      }
    ]
  },

  twitter: {
    card: "summary_large_image",
    title: `Reset Your Password | ${siteConfig.name}`,
    description: "Forgot your password? We'll help you reset it securely and get back to your account.",
    images: ["/og-auth.jpg"],
    creator: "@motostix" // Replace with your actual Twitter handle
  },

  alternates: {
    canonical: `${siteConfig.url}/forgot-password`
  },

  robots: {
    index: true, // Allow indexing - people search for "forgot password [site name]"
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },

  // Additional security headers for auth pages
  other: {
    referrer: "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY", // Prevent clickjacking
    "X-Content-Type-Options": "nosniff"
  }
};

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeader
        title="Forgot Your Password?"
        subtitle="Enter your email address and we'll send you a link to reset your password"
      />
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </>
  );
}
