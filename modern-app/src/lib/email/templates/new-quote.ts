// src/lib/email/templates/new-quote.ts
import { getURL } from "@/lib/url";
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, getRecipientName } from "./layout/email-style";

/**
 * Notifies a customer that they have received a new quote.
 */
export function newQuoteEmail(jobId: string, name?: string | null) {
  const quotesUrl = getURL(`/dashboard/customer/jobs/${jobId}/quotes`);

  const subject = "You’ve received a new quote";
  const preheader = "A plumber has submitted a new quote—review it now.";
  const recipientName = getRecipientName(name);

  const body = `
    ${greetingHtml(recipientName)}
    <h1>You’ve received a new quote</h1>
    <p>
      A plumber has submitted a new quote for one of your jobs.
      You can view the details, compare it with other quotes, and accept it directly on our platform.
    </p>
    <p style="text-align: center; margin-top: 20px;">
      <a href="${quotesUrl}" class="button-link">View new quote</a>
    </p>
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
