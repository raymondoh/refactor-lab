import { getURL } from "@/lib/url";
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, getRecipientName } from "./layout/email-style";

export function subscriptionUpgradedEmail(name?: string | null, tier?: string | null) {
  const normalizedTier = tier?.trim() || "";
  const safeTierName = normalizedTier ? normalizedTier.charAt(0).toUpperCase() + normalizedTier.slice(1) : "";

  const recipientName = getRecipientName(name);

  const jobBoardUrl = getURL("/dashboard/tradesperson/job-board");
  const profileUrl = getURL("/dashboard/tradesperson/profile");

  const subject = safeTierName ? `Welcome to the ${safeTierName} plan` : "Your subscription has been upgraded";
  const preheader = safeTierName
    ? `Your ${safeTierName} plan is active—explore your new features today.`
    : "Your plan is active—explore your new features today.";

  const body = `
    ${greetingHtml(recipientName)}
    <h1>You've upgraded${safeTierName ? ` to ${safeTierName}` : ""}</h1>
    <p>
      This email confirms your subscription to the Plumbers Portal${safeTierName ? ` ${safeTierName}` : ""} plan
      has been activated. Thank you for upgrading.
    </p>
    <p style="margin-bottom: 24px;">
      You can now access your new features. Why not start by exploring the advanced job
      filters or saving a job for later?
    </p>
    <p style="text-align: center; margin-bottom: 16px;">
      <a href="${jobBoardUrl}" class="button-link">Find new jobs</a>
    </p>
    <p style="text-align: center;">
      <a href="${profileUrl}" class="button-link" style="background-color: #e5e7eb; color: #1f2933;">
        View my profile
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
