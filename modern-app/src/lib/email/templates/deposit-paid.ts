// src/lib/email/templates/deposit-paid.ts
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, getRecipientName } from "./layout/email-style";

export const getDepositPaidEmailTemplate = (
  userType: "customer" | "tradesperson",
  jobTitle: string,
  depositAmount: number,
  name?: string | null
) => {
  const formattedAmount = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(depositAmount);

  const recipientName = getRecipientName(name);

  if (userType === "customer") {
    const subject = `Receipt for your deposit payment of ${formattedAmount}`;
    const preheader = `Your deposit for "${jobTitle}" was processed successfully.`;

    const body = `
      ${greetingHtml(recipientName)}
      <h1>Deposit payment confirmation</h1>
      <p>
        This email confirms your deposit payment of <strong>${formattedAmount}</strong> for the job
        <strong>"${jobTitle}"</strong> has been successfully processed.
      </p>
      <p>
        The plumber has been notified and the job is now secured. You can view the job details and chat with the plumber
        in your dashboard.
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

  // Tradesperson branch
  const subject = `A deposit of ${formattedAmount} has been paid for your job`;
  const preheader = `The customer secured "${jobTitle}" with a ${formattedAmount} deposit.`;

  const body = `
    ${greetingHtml(recipientName)}
    <h1>Deposit paid notification</h1>
    <p>
      Great news! The customer has paid a deposit of <strong>${formattedAmount}</strong> for the job
      <strong>"${jobTitle}"</strong>.
    </p>
    <p>
      This job is now officially secured. Please coordinate with the customer via the messaging feature in your
      dashboard to arrange a start date.
    </p>
    <p>
      The funds (minus the platform fee) will be available in your Stripe account according to your payout schedule.
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
};
