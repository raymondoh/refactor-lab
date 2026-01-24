// src/lib/email/templates/final-payment-paid.ts
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, getRecipientName } from "./layout/email-style";

/**
 * Generates the HTML for an email notifying a tradesperson of a final payment.
 */
export function finalPaymentPaidEmail(jobTitle: string, finalAmount: number, name?: string | null) {
  const formattedAmount = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(finalAmount);

  const recipientName = getRecipientName(name);

  const subject = `Final payment of ${formattedAmount} received for "${jobTitle}"`;
  const preheader = `The customer has paid the remaining balance for "${jobTitle}".`;

  const body = `
    ${greetingHtml(recipientName)}
    <h1>Final payment received</h1>
    <p>
      Good news! The customer has made the final payment of <strong>${formattedAmount}</strong> for the job
      <strong>"${jobTitle}"</strong>.
    </p>
    <p>
      This job is now fully paid. The funds (minus the platform fee) will be available in your Stripe account according
      to your payout schedule.
    </p>
    <p>
      The customer has been asked to leave a review for your service.
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
