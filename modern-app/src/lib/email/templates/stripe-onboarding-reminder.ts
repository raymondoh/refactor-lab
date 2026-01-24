import { getURL } from "@/lib/url";
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, getRecipientName } from "./layout/email-style";

export function stripeOnboardingReminderEmail(name?: string | null) {
  const dashboardUrl = getURL("/dashboard/tradesperson");
  const recipientName = getRecipientName(name);

  const subject = "Action required: set up your payouts";
  const preheader = "Connect Stripe today to receive secure payouts.";

  const body = `
    ${greetingHtml(recipientName)}
    <h1>Let’s finish getting you paid</h1>
    <p>
      You still need to connect your Stripe account so we can send secure, direct payouts
      for the jobs you complete on Plumbers Portal.
    </p>
    <p>
      This quick step keeps your earnings safe and ensures there's no delay when it's
      time to pay you.
    </p>
    <p style="text-align: center;">
      <a href="${dashboardUrl}" class="button-link">Set up payouts</a>
    </p>
    <p style="font-size: 14px; color: #52606d; margin-top: 24px;">
      Need a hand? Reply to this email and we'll guide you through the setup.
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
