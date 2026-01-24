// src/lib/email/email-service.ts
import { config } from "@/lib/config/app-mode";
import { getEnv } from "@/lib/env";
import { getURL } from "@/lib/url";
import { logger } from "@/lib/logger";
import { Resend } from "resend";
import type { Job } from "@/lib/types/job";
import type { ContactFormData } from "@/lib/schemas/contact-schema";
import {
  newQuoteEmail,
  quoteAcceptedEmail,
  jobCompleteEmail,
  getNewMessageEmailTemplate,
  jobAcceptedEmail,
  reviewLeftEmail,
  newJobAlertEmail,
  getDepositPaidEmailTemplate,
  customerWelcomeEmailTemplate,
  tradespersonWelcomeEmail,
  stripeOnboardingSuccessEmail,
  stripeOnboardingReminderEmail,
  finalPaymentRequestEmail,
  finalPaymentPaidEmail,
  subscriptionUpgradedEmail
} from "./templates";

const env = getEnv();

export interface IEmailService {
  sendVerificationEmail(email: string, token: string, name?: string): Promise<boolean>;
  sendPasswordResetEmail(email: string, token: string, name?: string): Promise<boolean>;
  sendWelcomeEmail(email: string, name?: string): Promise<boolean>;
  sendCustomerWelcomeEmail(to: string, name: string): Promise<boolean>;
  sendTradespersonWelcomeEmail(to: string, name: string): Promise<boolean>;
  sendStripeOnboardingSuccessEmail(to: string, name: string): Promise<boolean>;
  sendStripeOnboardingReminderEmail(to: string, name: string): Promise<boolean>;

  // Updated: accepts optional name
  sendNewQuoteEmail(email: string, jobId: string, quoteId: string, name?: string | null): Promise<boolean>;

  // Updated: accepts optional name (string | null to match usage)
  sendQuoteAcceptedEmail(email: string, jobId: string, quoteId: string, name?: string | null): Promise<boolean>;

  sendJobCompleteEmail(email: string, jobId: string, name?: string | null): Promise<boolean>;
  sendNewMessageEmail(email: string, jobId: string, message: string, senderName: string): Promise<boolean>;

  // Updated: accepts optional name
  sendJobAcceptedEmail(email: string, jobId: string, name?: string | null): Promise<boolean>;

  sendReviewLeftEmail(email: string, tradespersonSlug: string, name?: string): Promise<boolean>;

  sendNewJobAlertEmail(email: string, job: Job, name?: string | null): Promise<boolean>;
  sendDepositPaidEmail(
    to: string,
    userType: "customer" | "tradesperson",
    jobTitle: string,
    depositAmount: number,
    name?: string | null
  ): Promise<boolean>;

  sendFinalPaymentPaidEmail(to: string, jobTitle: string, finalAmount: number, name?: string): Promise<boolean>;

  sendFinalPaymentRequestEmail(to: string, jobId: string, name?: string): Promise<boolean>;

  sendSubscriptionUpgradedEmail(to: string, name: string, tier: string): Promise<boolean>;
  sendContactFormEmail(data: ContactFormData): Promise<boolean>;
  sendAdminReportEmail(reportData: {
    reporterId: string;
    jobId: string;
    reason: string;
    reportId: string;
  }): Promise<boolean>;
}

class MockEmailService implements IEmailService {
  async sendVerificationEmail(email: string, token: string, _name?: string): Promise<boolean> {
    const verifyUrl = getURL(`/verify-email?token=${token}`);
    logger.info(`📧 Mock: Verification email sent to ${email}`);
    logger.info(`🔗 Mock: Verification link: ${verifyUrl}`);
    return true;
  }

  async sendPasswordResetEmail(email: string, token: string, _name?: string): Promise<boolean> {
    const resetUrl = getURL(`/reset-password?token=${token}`);
    logger.info(`📧 Mock: Password reset email sent to ${email}`);
    logger.info(`🔗 Mock: Reset link: ${resetUrl}`);
    return true;
  }

  async sendWelcomeEmail(email: string, _name?: string): Promise<boolean> {
    logger.info(`📧 Mock: Welcome email sent to ${email}`);
    return true;
  }

  async sendCustomerWelcomeEmail(to: string, name: string): Promise<boolean> {
    logger.info(`📧 Mock: Customer welcome email sent to ${to} for ${name}`);
    return true;
  }

  async sendTradespersonWelcomeEmail(to: string, name: string): Promise<boolean> {
    logger.info(`📧 Mock: Tradesperson welcome email sent to ${to} for ${name}`);
    return true;
  }

  async sendStripeOnboardingSuccessEmail(to: string, name: string): Promise<boolean> {
    logger.info(`📧 Mock: Stripe onboarding success email sent to ${to} for ${name}`);
    return true;
  }

  async sendStripeOnboardingReminderEmail(to: string, name: string): Promise<boolean> {
    logger.info(`📧 Mock: Stripe onboarding reminder email sent to ${to} for ${name}`);
    return true;
  }

  async sendNewQuoteEmail(email: string, jobId: string, _quoteId: string, _name?: string | null): Promise<boolean> {
    logger.info(`📧 Mock: New quote email sent to ${email} for job ${jobId}${_name ? ` (recipient: ${_name})` : ""}`);
    return true;
  }

  async sendQuoteAcceptedEmail(
    email: string,
    jobId: string,
    _quoteId: string,
    _name?: string | null
  ): Promise<boolean> {
    logger.info(
      `📧 Mock: Quote accepted email sent to ${email} for job ${jobId}${_name ? ` (recipient: ${_name})` : ""}`
    );
    return true;
  }

  async sendJobCompleteEmail(email: string, jobId: string, name?: string | null): Promise<boolean> {
    const { subject } = jobCompleteEmail(jobId, name);
    logger.info(
      `📧 Mock: Job complete email ("${subject}") sent to ${email}${name ? ` (recipient: ${name})` : ""} for job ${jobId}`
    );
    return true;
  }

  async sendNewMessageEmail(email: string, jobId: string, message: string, senderName: string): Promise<boolean> {
    logger.info(`📧 Mock: New message from ${senderName} sent to ${email} for job ${jobId}`);
    return true;
  }

  async sendJobAcceptedEmail(email: string, jobId: string, _name?: string | null): Promise<boolean> {
    logger.info(
      `📧 Mock: Job accepted email sent to ${email} for job ${jobId}${_name ? ` (recipient: ${_name})` : ""}`
    );
    return true;
  }

  async sendReviewLeftEmail(email: string, tradespersonSlug: string, name?: string): Promise<boolean> {
    const profileUrl = getURL(`/profile/tradesperson/${tradespersonSlug}`);
    logger.info(
      `📧 Mock: Review left email sent to ${email}${name ? ` (recipient: ${name})` : ""} — profile: ${profileUrl}`
    );
    return true;
  }

  async sendNewJobAlertEmail(email: string, job: Job, name?: string | null): Promise<boolean> {
    logger.info(
      `📧 Mock: New job alert email sent to ${email} for job ${job.id}${name ? ` (recipient: ${name})` : ""}`
    );
    return true;
  }

  async sendDepositPaidEmail(
    to: string,
    userType: "customer" | "tradesperson",
    jobTitle: string,
    depositAmount: number,
    name?: string | null
  ): Promise<boolean> {
    const { subject } = getDepositPaidEmailTemplate(userType, jobTitle, depositAmount, name);
    logger.info(`📧 Mock: Deposit paid email ("${subject}") sent to ${to}${name ? ` (recipient: ${name})` : ""}`);
    return true;
  }

  async sendFinalPaymentRequestEmail(email: string, jobId: string, _name?: string | null): Promise<boolean> {
    logger.info(
      `📧 Mock: Final payment request email sent to ${email} for job ${jobId}${_name ? ` (recipient: ${_name})` : ""}`
    );
    return true;
  }

  async sendFinalPaymentPaidEmail(to: string, jobTitle: string, finalAmount: number, name?: string): Promise<boolean> {
    const { subject } = finalPaymentPaidEmail(jobTitle, finalAmount, name);
    logger.info(`📧 Mock: Final payment paid email ("${subject}") sent to ${to}${name ? ` (recipient: ${name})` : ""}`);
    return true;
  }

  async sendSubscriptionUpgradedEmail(to: string, name: string, tier: string): Promise<boolean> {
    logger.info(`📧 Mock: Subscription upgraded email sent to ${to} for ${name} (${tier})`);
    return true;
  }

  async sendContactFormEmail(data: ContactFormData): Promise<boolean> {
    const recipient = env.CONTACT_FORM_RECEIVER_EMAIL || "(unset contact recipient)";
    logger.info("📧 Mock: Contact form email", {
      to: recipient,
      from: data.email,
      name: data.name,
      subject: data.subject,
      message: data.message
    });
    return true;
  }
  async sendAdminReportEmail(data: {
    reporterId: string;
    jobId: string;
    reason: string;
    reportId: string;
  }): Promise<boolean> {
    logger.info(
      `📧 Mock: Admin Report Alert sent. User ${data.reporterId} reported job ${data.jobId} (reportId: ${data.reportId}): "${data.reason}"`
    );
    return true;
  }
}

class ResendEmailService implements IEmailService {
  private resend: Resend | null;

  constructor() {
    if (!config.isMockMode && env.RESEND_API_KEY) {
      try {
        this.resend = new Resend(env.RESEND_API_KEY);
      } catch (error) {
        logger.error(`📧 ResendEmailService: Failed to initialize Resend:`, error);
        this.resend = null;
      }
    } else {
      this.resend = null;
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    options?: { replyTo?: string; from?: string }
  ): Promise<boolean> {
    if (!this.resend) {
      logger.error(`📧 ResendEmailService: No Resend client available to send email to ${to}`);
      return false;
    }
    try {
      await this.resend.emails.send({
        from: options?.from ?? env.EMAIL_FROM ?? "noreply@yourdomain.com",
        to,
        subject,
        html,
        replyTo: options?.replyTo
      });
      logger.info(`📧 Email ("${subject}") sent successfully`, { to });
      return true;
    } catch (error) {
      logger.error(`📧 ResendEmailService: Failed to send email ("${subject}") to ${to}:`, error);
      return false;
    }
  }

  sendVerificationEmail(email: string, token: string, name?: string): Promise<boolean> {
    const html = this.getVerificationEmailHtml(token, name);
    return this.sendEmail(email, "Verify your email address", html);
  }

  sendPasswordResetEmail(email: string, token: string, name?: string): Promise<boolean> {
    const html = this.getPasswordResetEmailHtml(token, name);
    return this.sendEmail(email, "Reset your password", html);
  }

  sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
    const html = this.getWelcomeEmailHtml(name);
    return this.sendEmail(email, "Welcome to Plumbers Portal!", html);
  }

  sendCustomerWelcomeEmail(to: string, name: string): Promise<boolean> {
    const html = customerWelcomeEmailTemplate.html(name);
    return this.sendEmail(to, customerWelcomeEmailTemplate.subject, html);
  }

  sendTradespersonWelcomeEmail(to: string, name: string): Promise<boolean> {
    const { subject, html } = tradespersonWelcomeEmail(name);
    return this.sendEmail(to, subject, html);
  }

  sendStripeOnboardingSuccessEmail(to: string, name: string): Promise<boolean> {
    const { subject, html } = stripeOnboardingSuccessEmail(name);
    return this.sendEmail(to, subject, html);
  }

  sendStripeOnboardingReminderEmail(to: string, name: string): Promise<boolean> {
    const { subject, html } = stripeOnboardingReminderEmail(name);
    return this.sendEmail(to, subject, html);
  }

  sendNewQuoteEmail(email: string, jobId: string, _quoteId: string, name?: string | null): Promise<boolean> {
    const { subject, html } = newQuoteEmail(jobId, name);
    return this.sendEmail(email, subject, html);
  }

  sendQuoteAcceptedEmail(email: string, jobId: string, _quoteId: string, name?: string | null): Promise<boolean> {
    const { subject, html } = quoteAcceptedEmail(jobId, name);
    return this.sendEmail(email, subject, html);
  }

  sendJobCompleteEmail(email: string, jobId: string, name?: string | null): Promise<boolean> {
    const { subject, html } = jobCompleteEmail(jobId, name);
    return this.sendEmail(email, subject, html);
  }

  sendNewMessageEmail(email: string, jobId: string, message: string, senderName: string): Promise<boolean> {
    const { subject, html } = getNewMessageEmailTemplate(jobId, message, senderName);
    return this.sendEmail(email, subject, html);
  }

  sendJobAcceptedEmail(email: string, jobId: string, name?: string | null): Promise<boolean> {
    const { subject, html } = jobAcceptedEmail(jobId, name);
    return this.sendEmail(email, subject, html);
  }

  sendReviewLeftEmail(email: string, tradespersonSlug: string, name?: string): Promise<boolean> {
    const { subject, html } = reviewLeftEmail(tradespersonSlug, name);
    return this.sendEmail(email, subject, html);
  }

  sendNewJobAlertEmail(email: string, job: Job, name?: string | null): Promise<boolean> {
    const { subject, html } = newJobAlertEmail(job, name);
    return this.sendEmail(email, subject, html);
  }

  sendDepositPaidEmail(
    to: string,
    userType: "customer" | "tradesperson",
    jobTitle: string,
    depositAmount: number,
    name?: string | null
  ): Promise<boolean> {
    const { subject, html } = getDepositPaidEmailTemplate(userType, jobTitle, depositAmount, name);
    return this.sendEmail(to, subject, html);
  }

  sendFinalPaymentRequestEmail(email: string, jobId: string, name?: string | null): Promise<boolean> {
    const { subject, html } = finalPaymentRequestEmail(jobId, name);
    return this.sendEmail(email, subject, html);
  }

  sendFinalPaymentPaidEmail(to: string, jobTitle: string, finalAmount: number, name?: string): Promise<boolean> {
    const { subject, html } = finalPaymentPaidEmail(jobTitle, finalAmount, name);
    return this.sendEmail(to, subject, html);
  }

  sendSubscriptionUpgradedEmail(to: string, name: string, tier: string): Promise<boolean> {
    const { subject, html } = subscriptionUpgradedEmail(name, tier);
    return this.sendEmail(to, subject, html);
  }

  sendContactFormEmail(data: ContactFormData): Promise<boolean> {
    if (!env.CONTACT_FORM_RECEIVER_EMAIL) {
      logger.error("📧 ResendEmailService: CONTACT_FORM_RECEIVER_EMAIL is not configured.");
      return Promise.resolve(false);
    }

    const subject = `Contact Form: ${data.subject}`;
    const html = this.getContactFormEmailHtml(data);

    return this.sendEmail(env.CONTACT_FORM_RECEIVER_EMAIL, subject, html, { replyTo: data.email });
  }

  private getVerificationEmailHtml(token: string, name?: string): string {
    const verifyUrl = getURL(`/verify-email?token=${token}`);
    return `
      <p>Hi ${name || "there"},</p>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verifyUrl}">Verify Email Address</a>
      <p>Or copy and paste this link: ${verifyUrl}</p>
    `;
  }

  private getPasswordResetEmailHtml(token: string, name?: string): string {
    const resetUrl = getURL(`/reset-password?token=${token}`);
    return `
      <p>Hi ${name || "there"},</p>
      <p>You requested to reset your password. Click the button below:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>Or copy and paste this link: ${resetUrl}</p>
    `;
  }

  private getWelcomeEmailHtml(name?: string): string {
    const dashboardUrl = getURL("/dashboard");
    return `
      <p>Hi ${name || "there"},</p>
      <p>Welcome to our platform! Your account has been successfully verified.</p>
      <a href="${dashboardUrl}">Go to Dashboard</a>
    `;
  }

  private getContactFormEmailHtml(data: ContactFormData): string {
    const escape = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const escapedMessage = escape(data.message).replace(/\n/g, "<br />");

    return `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${escape(data.name)}</p>
      <p><strong>Email:</strong> ${escape(data.email)}</p>
      <p><strong>Subject:</strong> ${escape(data.subject)}</p>
      <hr />
      <p>${escapedMessage}</p>
    `;
  }
  async sendAdminReportEmail(data: {
    reporterId: string;
    jobId: string;
    reason: string;
    reportId: string;
  }): Promise<boolean> {
    const adminEmail = env.CONTACT_FORM_RECEIVER_EMAIL || "hello@idiomdigital.com";

    const subject = `🚩 New User Report: Job #${data.jobId}`;

    const html = `
      <h2>New User Report Filed</h2>
      <p><strong>Reporter User ID:</strong> ${data.reporterId}</p>
      <p><strong>Job/Chat ID:</strong> ${data.jobId}</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p><strong>Report ID:</strong> ${data.reportId}</p>
      <hr />
      <p><a href="${getURL(`/dashboard/admin/jobs`)}">View in Admin Dashboard</a></p>
    `;

    return this.sendEmail(adminEmail, subject, html);
  }
}

class EmailServiceFactory {
  private static instance: IEmailService | null = null;

  static getInstance(): IEmailService {
    if (!EmailServiceFactory.instance) {
      if (config.isMockMode || !env.RESEND_API_KEY) {
        EmailServiceFactory.instance = new MockEmailService();
      } else {
        EmailServiceFactory.instance = new ResendEmailService();
      }
    }
    return EmailServiceFactory.instance;
  }
}

export const emailService = EmailServiceFactory.getInstance();
