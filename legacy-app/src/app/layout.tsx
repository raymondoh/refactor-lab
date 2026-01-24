// src/app/layout.tsx
import type React from "react";
//import type { Metadata } from "next";
//import { siteConfig } from "@/config/siteConfig";

import { ClientLayout } from "./client-layout";
import "./globals.css";

// export const metadata: Metadata = {
//   // Basic metadata with templates
//   title: {
//     default: siteConfig.name,
//     template: `%s | ${siteConfig.name}`
//   },
//   description: siteConfig.description,
//   keywords: siteConfig.keywords,

//   // Creator info
//   authors: [{ name: siteConfig.name, url: siteConfig.url }],
//   creator: siteConfig.name,
//   publisher: siteConfig.name,

//   // Open Graph defaults
//   openGraph: {
//     type: "website",
//     locale: "en_US",
//     url: siteConfig.url,
//     siteName: siteConfig.name,
//     title: {
//       default: siteConfig.name,
//       template: `%s | ${siteConfig.name}`
//     },
//     description: siteConfig.description,
//     images: [
//       {
//         url: `${siteConfig.url}/og.jpg`,
//         width: 1200,
//         height: 630,
//         alt: `${siteConfig.name} - Premium Custom Stickers`
//       }
//     ]
//   },

//   // Twitter defaults
//   twitter: {
//     card: "summary_large_image",
//     title: {
//       default: siteConfig.name,
//       template: `%s | ${siteConfig.name}`
//     },
//     description: siteConfig.description,
//     creator: "@motostix", // Replace with your actual handle
//     images: [`${siteConfig.url}/og.jpg`]
//   },

//   // Icons and manifest
//   icons: {
//     icon: "/favicon.ico",
//     shortcut: "/favicon-16x16.png",
//     apple: "/apple-touch-icon.png"
//   },

//   // SEO verification (add your actual codes)
//   verification: {
//     google: "your-google-verification-code"
//     // yandex: 'your-yandex-verification-code',
//     // yahoo: 'your-yahoo-verification-code',
//   },

//   // Default robots policy
//   robots: {
//     index: true,
//     follow: true,
//     googleBot: {
//       index: true,
//       follow: true,
//       "max-video-preview": -1,
//       "max-image-preview": "large",
//       "max-snippet": -1
//     }
//   },

//   // PWA manifest
//   manifest: `${siteConfig.url}/site.webmanifest`,

//   // Additional metadata
//   category: "e-commerce",
//   classification: "Business"
// };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative ">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
