import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number into a localized currency string.
 * This function now directly accepts a currency code (e.g., "GBP", "USD").
 */
export function formatPrice(amount: number, currency: string = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    // You can adjust locale if needed, e.g., "en-US"
    style: "currency",
    // Ensure the currency code is uppercase as expected by Intl.NumberFormat
    currency: currency.toUpperCase()
  }).format(amount);
}

// The getCurrencyCode function is no longer needed for this process,
// but you can keep it if you use it elsewhere.
/*
export function getCurrencyCode(country: string): string {
  switch (country) {
    case "GB":
      return "GBP";
    case "CA":
      return "CAD";
    default:
      return "USD";
  }
}
*/
