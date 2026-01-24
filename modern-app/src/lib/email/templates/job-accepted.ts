// src/lib/email/templates/job-accepted.ts
import { getURL } from "@/lib/url";
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, getRecipientName } from "./layout/email-style";

/**
 * Notifies a tradesperson that their quote has been accepted.
 */
export function jobAcceptedEmail(jobId: string, name?: string | null) {
  const jobUrl = getURL(`/dashboard/tradesperson/job-board/${jobId}`);

  const subject = "Your quote has been accepted";
  const preheader = "A customer has accepted your quote. Review the job details and follow up.";
  const recipientName = getRecipientName(name);

  const body = `
    ${greetingHtml(recipientName)}
    <h1>Your quote has been accepted</h1>
    <p>
      Good news! A customer has accepted your quote for one of their jobs.
      They’re expecting you to get in touch to arrange a time to start the work.
    </p>
    <p>
      You can review the job details and continue the conversation from your dashboard.
    </p>
    <p style="text-align: center;">
      <a href="${jobUrl}" class="button-link">View job details</a>
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
