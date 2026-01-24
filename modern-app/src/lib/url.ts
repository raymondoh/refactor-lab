import { getEnv } from "@/lib/env";

const env = getEnv();

const DEFAULT_FALLBACK_URL = "http://localhost:3000";

function normalizeUrl(url?: string | null) {
  if (!url) return undefined;
  return url.replace(/\/+$/, "");
}

function getUrlFromRequest(req?: Request) {
  if (!req) return undefined;
  const proto = req.headers.get("x-forwarded-proto");
  const host = req.headers.get("host");
  return proto && host ? `${proto}://${host}` : undefined;
}

function getVercelUrl() {
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
}

export function getSiteUrl(req?: Request) {
  if (typeof window !== "undefined") {
    return normalizeUrl(window.location.origin) ?? DEFAULT_FALLBACK_URL;
  }

  const candidates = [
    normalizeUrl(getUrlFromRequest(req)),
    normalizeUrl(env.NEXT_PUBLIC_SITE_URL),
    normalizeUrl(env.NEXT_PUBLIC_APP_URL),
    normalizeUrl(getVercelUrl()),
    DEFAULT_FALLBACK_URL
  ];

  const resolved = candidates.find(Boolean);
  return resolved ?? DEFAULT_FALLBACK_URL;
}

export function getApiBaseUrl(req?: Request) {
  return getSiteUrl(req);
}

export function getURL(path = "", req?: Request) {
  const origin = getSiteUrl(req);
  if (!path) {
    return origin.endsWith("/") ? origin : `${origin}/`;
  }

  const normalizedOrigin = origin.endsWith("/") ? origin : `${origin}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedOrigin}${normalizedPath}`;
}

/**
 * Base URL specifically for email assets.
 * This should always resolve to a public, HTTPS URL,
 * never localhost.
 */
export function getEmailBaseUrl() {
  // 1) Explicit email base URL if set
  const emailBase = normalizeUrl(env.NEXT_PUBLIC_EMAIL_BASE_URL) ?? normalizeUrl(env.EMAIL_BASE_URL);

  if (emailBase) {
    return emailBase;
  }

  // 2) Fall back to your public site URLs
  const candidates = [
    normalizeUrl(env.NEXT_PUBLIC_SITE_URL),
    normalizeUrl(env.NEXT_PUBLIC_APP_URL),
    normalizeUrl(getVercelUrl())
  ];

  const resolved = candidates.find(Boolean);
  // FINAL fallback – but in practice you *really* want an env set.
  return resolved ?? DEFAULT_FALLBACK_URL;
}

export function getEmailAsset(path: string) {
  const base = getEmailBaseUrl();
  if (!path.startsWith("/")) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
}
