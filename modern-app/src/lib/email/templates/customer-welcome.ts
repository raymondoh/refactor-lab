// src/lib/email/templates/customer-welcome.ts
import { getURL } from "@/lib/url";
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, primaryButton, getRecipientName } from "./layout/email-style";

const postJobUrl = getURL("/dashboard/customer/jobs/create");

export const customerWelcomeEmailTemplate = {
  subject: "Welcome to Plumbers Portal – find your perfect plumber",
  html: (name?: string | null) => {
    const recipientName = getRecipientName(name);
    const preheader = "Discover trusted plumbers and post your first job in minutes.";

    const body = `
      ${greetingHtml(recipientName)}
      <h1>Welcome to Plumbers Portal</h1>
      <p>
        We're pleased to have you join the Plumbers Portal community. You're only a few steps
        away from solving your home maintenance needs with trusted, qualified professionals.
      </p>
      <p>
        Our platform makes it simple and safe to find reliable plumbers for any job,
        big or small.
      </p>
      <p><strong>Ready to get started?</strong></p>
      <p style="text-align: center; margin-bottom: 24px;">
        ${primaryButton("Post your first job", postJobUrl)}
      </p>
      <p>
        If you have any questions, you can visit our help centre or contact our support team
        at any time.
      </p>
    `;

    return EmailLayout({
      title: customerWelcomeEmailTemplate.subject,
      preheader,
      children: body
    });
  }
};
