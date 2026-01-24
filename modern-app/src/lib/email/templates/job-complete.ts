// src/lib/email/templates/job-complete.ts
import { getURL } from "@/lib/url";
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, getRecipientName } from "./layout/email-style";

/**
 * Notifies a customer that their job is complete and invites them to leave a review.
 */
export function jobCompleteEmail(jobId: string, name?: string | null) {
  const jobUrl = getURL(`/dashboard/customer/jobs/${jobId}`);
  const reviewUrl = getURL(`/dashboard/customer/jobs/${jobId}/review`);

  const subject = "Thank you — please review your recently completed job";
  const preheader = "Your job is complete—share your feedback with the community.";
  const recipientName = getRecipientName(name);

  const body = `
    ${greetingHtml(recipientName)}
    <h1>Your job is complete</h1>
    <p>
      We hope everything went smoothly with your recent job.
      Your feedback is valuable and helps other customers choose the right plumber for their job.
    </p>
    <p>Please take a moment to leave a review for the plumber who completed your job.</p>
    <p style="text-align: center; margin-bottom: 20px;">
      <a href="${reviewUrl}" class="button-link">Leave a review</a>
    </p>
    <p>You can also view the completed job details below:</p>
    <p style="text-align: center;">
      <a href="${jobUrl}" class="button-link" style="background-color: #e5e7eb; color: #1f2933;">
        View job details
      </a>
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
