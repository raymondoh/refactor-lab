// src/app/layout.tsx
import "@/lib/bootstrap/env.server";
import "./globals.css";
import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { siteConfig } from "@/config/site";
import SessionProvider from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import ModalProvider from "@/components/providers/modal-provider";
import FavoritesProvider from "@/components/providers/favorites-provider";
import FirebaseAuthProvider from "@/components/providers/firebase-auth-provider";
import { getOptionalFreshSession } from "@/lib/auth/require-session";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { getSiteUrl } from "@/lib/url";
import { userService } from "@/lib/services/user-service";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { AnalyticsGate } from "@/components/legal/analytics-gate";
import { RecaptchaProvider } from "@/components/providers/recaptcha-provider";
import { logger } from "@/lib/logger";
import { validateEnv, getEnv } from "@/lib/env";

if (process.env.NODE_ENV === "production") {
  validateEnv();
}

const inter = Inter({ subsets: ["latin"] });
const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  // Set light/dark theme colors for the browser UI
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" }, // your blue
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" } // dark header color (adjust if you like)
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1
};

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`
  },
  description: siteConfig.description,
  metadataBase: new URL(siteUrl), // ✅ here
  alternates: {
    canonical: siteUrl
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage]
  },
  robots: {
    index: false,
    follow: false,
    nocache: true
  },
  manifest: "/manifest.json"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getOptionalFreshSession();

  const recaptchaSiteKey = getEnv().NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  let initialFavoriteIds: string[] = [];
  if (session?.user?.id && session.user.role === "customer") {
    try {
      const favorites = await userService.getFavoriteTradespeople(session.user.id);
      initialFavoriteIds = favorites
        .map(favorite => favorite.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
    } catch (error) {
      logger.error("RootLayout: Failed to load initial favorites", error);
    }
  }

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: siteConfig.publisher,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/find-plumber?query={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <RecaptchaProvider siteKey={recaptchaSiteKey}>
          <ErrorBoundary>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <SessionProvider session={session}>
                <FirebaseAuthProvider>
                  <FavoritesProvider initialFavorites={initialFavoriteIds}>
                    <div className="flex flex-col min-h-screen">
                      <main className="flex-1">{children}</main>
                      <AnalyticsGate />
                      <CookieBanner />
                    </div>
                    <Toaster />
                    <ModalProvider />
                  </FavoritesProvider>
                </FirebaseAuthProvider>
              </SessionProvider>
            </ThemeProvider>
          </ErrorBoundary>

          {/* ✅ Global WebSite JSON-LD */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        </RecaptchaProvider>
      </body>
    </html>
  );
}
