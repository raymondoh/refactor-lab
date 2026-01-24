// next.config.ts
import type { NextConfig } from "next";

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

// ✅ Only allow emulator endpoints when the explicit flag is enabled
const USE_EMULATORS = (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS || "false") === "true";

// ✅ Dev-only CSP relaxations (e.g. unsafe-eval)
const IS_PROD = process.env.NODE_ENV === "production";

// Allow emulator endpoints ONLY in emulator mode
const EMULATOR_CONNECT_SRC = USE_EMULATORS
  ? [
      "http://127.0.0.1:8080",
      "http://localhost:8080",
      "http://127.0.0.1:9099",
      "http://localhost:9099",
      // Firestore streaming/listen can use websockets in some environments
      "ws://127.0.0.1:8080",
      "ws://localhost:8080"
    ].join(" ")
  : "";

// ✅ script-src: keep unsafe-eval out of production
const SCRIPT_SRC = IS_PROD
  ? "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google.com https://www.gstatic.com"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google.com https://www.gstatic.com";

// Build the CSP as a single header string (no duplicate directives)
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",

  // Scripts
  SCRIPT_SRC,

  // Styles
  "style-src 'self' 'unsafe-inline'",

  // Images
  "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://*.firebasestorage.app https://storage.googleapis.com https://lh3.googleusercontent.com https://www.google.com https://www.gstatic.com",

  // Fonts & media
  "font-src 'self' data:",
  "media-src 'self' blob:",

  // Frames (Stripe + reCAPTCHA)
  "frame-src https://js.stripe.com https://hooks.stripe.com https://www.google.com https://www.gstatic.com",

  // Form posts
  "form-action 'self' https://hooks.stripe.com",

  // Workers
  "worker-src 'self' blob:",

  // Manifest
  "manifest-src 'self'",

  // Connections (XHR/fetch/WebSocket)
  // ✅ Add emulator endpoints ONLY when USE_EMULATORS=true
  `connect-src 'self'
    https://connect-js.stripe.com
    https://api.stripe.com
    https://region1.google-analytics.com
    https://www.google-analytics.com
    https://stats.g.doubleclick.net
    https://identitytoolkit.googleapis.com
    https://securetoken.googleapis.com
    https://firestore.googleapis.com
    https://firebasestorage.googleapis.com
    https://*.firebasestorage.app
    https://storage.googleapis.com
    https://*.algolia.net
    https://*.algolianet.com
    https://www.google.com
    https://www.gstatic.com
    ws:
    wss:
    ${EMULATOR_CONNECT_SRC}`
    .replace(/\s+/g, " ")
    .trim()
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: "/v0/b/**/o/**" },
      ...(BUCKET
        ? [
            {
              protocol: "https" as const,
              hostname: "firebasestorage.googleapis.com",
              pathname: `/v0/b/${BUCKET}/o/**`
            }
          ]
        : []),
      { protocol: "https", hostname: "*.firebasestorage.app", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "storage.googleapis.com", pathname: "/**" }
    ],
    formats: ["image/avif", "image/webp"]
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY }]
      }
    ];
  },

  reactStrictMode: true,

  // ✅ Don’t hide type errors in production builds
  // If you *must* keep fast deploys, keep this false and rely on `npm run type-check` locally/CI.
  typescript: { ignoreBuildErrors: false },

  serverExternalPackages: ["firebase-admin"],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = { ...config.resolve.alias, "firebase-admin": false };
    }
    return config;
  }
};

export default nextConfig;
