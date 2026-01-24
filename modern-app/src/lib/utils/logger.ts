// src/lib/utils/logger.ts
export const isProd = process.env.NODE_ENV === "production";

export const clientLogger = {
  info: (...args: unknown[]) => {
    if (!isProd) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (!isProd) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // keep errors in prod, they’re useful
    console.error(...args);
  }
};

// Optional: keep this if anything still calls errorLog
export function errorLog(...args: unknown[]) {
  console.error(...args);
}
