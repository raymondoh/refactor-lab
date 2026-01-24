import { getURL } from "@/lib/url";
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, getRecipientName } from "./layout/email-style";

/**
 * Notifies a user of a new message.
 */
export function getNewMessageEmailTemplate(jobId: string, message: string, senderName: string, name?: string | null) {
  const conversationUrl = getURL(`/dashboard/messages/${jobId}`);

  const subject = `New message from ${senderName}`;
  const preheader = `${senderName} sent you an update about your job.`;
  const recipientName = getRecipientName(name);

  const body = `
    ${greetingHtml(recipientName)}
    <h1>You have a new message</h1>
    <p><strong>From:</strong> ${senderName}</p>
    <p><strong>Message:</strong></p>
    <blockquote style="border-left: 4px solid #ccc; padding-left: 1rem; margin-left: 0; font-style: italic;">
      ${message}
    </blockquote>
    <p style="text-align: center; margin-top: 20px;">
      <a href="${conversationUrl}" class="button-link">Reply to message</a>
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
