import { getURL } from "@/lib/url";
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, getRecipientName } from "./layout/email-style";

export function stripeOnboardingSuccessEmail(name?: string | null) {
  const jobBoardUrl = getURL("/dashboard/tradesperson/job-board");
  const recipientName = getRecipientName(name);

  const subject = "You're all set to get paid";
  const preheader = "Your Stripe account is connected—start quoting on new jobs.";

  const body = `
    ${greetingHtml(recipientName)}
    <h1>Your payouts are ready to go</h1>
    <p>
      Your Stripe account is now connected and ready. You can receive payments directly
      to your bank account for every job you complete on Plumbers Portal.
    </p>
    <p>
      Keep the momentum going by checking out the latest jobs waiting for you.
    </p>
    <p style="text-align: center;">
      <a href="${jobBoardUrl}" class="button-link">View job board</a>
    </p>
    <p style="font-size: 14px; color: #52606d; margin-top: 24px;">
      If you have any questions, just reply to this email and our team will be happy to help.
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
