// src/lib/email/templates/email-style.ts

/**
 * Normalises a raw name string – trims and returns null if empty.
 */
export function normalizeName(raw?: string | null): string | null {
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

/**
 * Returns a safe recipient name fallback ("there").
 */
export function getRecipientName(raw?: string | null): string {
  return normalizeName(raw) ?? "there";
}

/**
 * Standard greeting line for all transactional emails.
 *
 * Usage:
 *   ${greetingHtml(name)}
 */
export function greetingHtml(rawName?: string | null): string {
  const name = normalizeName(rawName);
  return name ? `<p>Hello ${name}</p>` : `<p>Hello,</p>`;
}

/**
 * Standardised GBP currency formatting for emails.
 */
export function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(amount);
}

/**
 * Primary CTA button – matches the .button-link styles in EmailLayout.
 */
export function primaryButton(label: string, url: string): string {
  return `<a href="${url}" class="button-link">${label}</a>`;
}

/**
 * Secondary / neutral button – same base class but with inline overrides.
 * Good for "View details" / less-primary actions.
 */
export function secondaryButton(label: string, url: string): string {
  return `<a href="${url}" class="button-link" style="background-color: #e5e7eb; color: #1f2933;">${label}</a>`;
}
