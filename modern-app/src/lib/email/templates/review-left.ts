// src/lib/email/templates/review-left.ts
import { getURL } from "@/lib/url";
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, getRecipientName } from "./layout/email-style";

/**
 * Notifies a tradesperson that a new review has been left on their profile.
 */
export function reviewLeftEmail(tradespersonSlug: string, name?: string | null) {
  const profileUrl = getURL(`/profile/tradesperson/${tradespersonSlug}`);
  const recipientName = getRecipientName(name);

  const subject = "You’ve received a new customer review";
  const preheader = "See what your customer had to say about their experience.";

  const body = `
    ${greetingHtml(recipientName)}
    <h1>New customer review received</h1>
    <p>
      A customer has left feedback on a completed job. New reviews help build your
      reputation and attract more customers.
    </p>
    <p>You can view the new review on your public profile page.</p>
    <p style="text-align: center;">
      <a href="${profileUrl}" class="button-link">View my public profile</a>
    </p>
    <p>Thank you for your hard work and dedication.</p>
  `;

  return {
    subject,
    html: EmailLayout({
      title: subject,
      preheader,
      children: body
    })
  };
}
