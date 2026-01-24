import { getURL } from "@/lib/url";
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, getRecipientName } from "./layout/email-style";

/**
 * Notifies a tradesperson that their quote has been accepted by the customer.
 */
export function quoteAcceptedEmail(jobId: string, name?: string | null) {
  const jobUrl = getURL(`/dashboard/tradesperson/job-board/${jobId}`);
  const recipientName = getRecipientName(name);

  const subject = "Congratulations — your quote has been accepted";
  const preheader = "Connect with the customer to schedule the job.";

  const body = `
    ${greetingHtml(recipientName)}
    <h1>Your quote has been accepted</h1>
    <p>
      A customer has accepted your quote for a job. You can now view the full job details
      and the customer's contact information to arrange a start date.
    </p>
    <p>
      We recommend contacting the customer as soon as possible to confirm the details.
    </p>
    <p style="text-align: center;">
      <a href="${jobUrl}" class="button-link">View job & contact customer</a>
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
