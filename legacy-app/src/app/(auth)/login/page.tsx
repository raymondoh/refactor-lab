import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginRedirect } from "@/components/auth/LoginRedirect";
import { AuthHeader } from "@/components/auth/AuthHeader";

export const metadata: Metadata = {
  title: `Sign In to Your Account | ${siteConfig.name}`,
  description:
    "Sign in to your MotoStix account to access your orders, track shipments, manage your custom sticker designs, and enjoy a personalized shopping experience.",
  keywords: [
    "login",
    "sign in",
    "account access",
    "user login",
    "motostix login",
    "customer portal",
    "account dashboard",
    "secure login",
    "member access"
  ],

  openGraph: {
    title: `Sign In to Your Account | ${siteConfig.name}`,
    description: "Access your MotoStix account to manage orders, track shipments, and enjoy personalized shopping.",
    type: "website",
    url: `${siteConfig.url}/login`,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og-auth.jpg`, // Same auth image as forgot password
        width: 1200,
        height: 630,
        alt: "Sign in to your MotoStix account"
      }
    ]
  },

  twitter: {
    card: "summary_large_image",
    title: `Sign In to Your Account | ${siteConfig.name}`,
    description: "Access your MotoStix account to manage orders, track shipments, and enjoy personalized shopping.",
    images: [`${siteConfig.url}/og-auth.jpg`],
    creator: "@motostix" // Replace with your actual Twitter handle
  },

  alternates: {
    canonical: `${siteConfig.url}/login`
  },

  robots: {
    index: true, // Allow indexing - login pages are commonly searched
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },

  // Security headers for auth pages
  other: {
    referrer: "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY", // Prevent clickjacking attacks
    "X-Content-Type-Options": "nosniff",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()" // Restrict permissions
  }
};

export default function LoginPage() {
  return (
    <>
      <LoginRedirect />
      <div className="space-y-8">
        <AuthHeader
          title="Welcome Back"
          subtitle="Sign in to your account to access your dashboard, orders, and more"
        />
        <LoginForm />
      </div>
    </>
  );
}
