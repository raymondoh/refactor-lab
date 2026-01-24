// src/lib/email/templates/final-payment-request.ts
import { getURL } from "@/lib/url";
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, getRecipientName } from "./layout/email-style";

/**
 * Generates the HTML for an email requesting final payment from a customer.
 */
export function finalPaymentRequestEmail(jobId: string, name?: string | null) {
  const jobUrl = getURL(`/dashboard/customer/jobs/${jobId}`);

  const subject = "Action required: final payment for your completed job";
  const preheader = "Your plumber marked the job complete—pay the final balance.";
  const recipientName = getRecipientName(name);

  const body = `
    ${greetingHtml(recipientName)}
    <h1>Your job has been marked as complete</h1>
    <p>
      Your plumber has marked the job as complete. Please make the final payment to close out the job.
    </p>
    <p>
      You can view the job details and make the final payment from your dashboard.
    </p>
    <p style="text-align: center;">
      <a href="${jobUrl}" class="button-link">Pay final balance</a>
    </p>
    <p>
      Once the final payment is made, you will be able to leave a review for the tradesperson.
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
