import { getURL } from "@/lib/url";
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, getRecipientName } from "./layout/email-style";

export function tradespersonWelcomeEmail(name?: string | null) {
  const profileUrl = getURL("/dashboard/tradesperson/profile/edit");
  const recipientName = getRecipientName(name);

  const subject = "Welcome to Plumbers Portal – let’s get you set up";
  const preheader = "Complete your profile to start winning new jobs.";

  const body = `
    ${greetingHtml(recipientName)}
    <h1>Welcome to Plumbers Portal</h1>
    <p>
      Congratulations on joining the Plumbers Portal network. We're excited to help you
      grow your business with new opportunities.
    </p>
    <p>
      The most important first step is to complete your professional profile. A complete
      profile helps customers feel confident choosing you and ensures you start receiving
      the right jobs.
    </p>
    <p style="text-align: center;">
      <a href="${profileUrl}" class="button-link">Complete your profile</a>
    </p>
    <p style="font-size: 14px; color: #52606d; margin-top: 24px;">
      Need help? Reply to this email and our team will get you on track right away.
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
