// src/actions/contact.ts
"use server";

import { contactFormSchema } from "@/lib/schemas/contact-schema";
import { emailService } from "@/lib/email/email-service";
import { logger } from "@/lib/logger";
import { getEnv } from "@/lib/env";
import type { ContactFormState } from "@/lib/contact-form-state";
import { verifyRecaptcha } from "@/lib/recaptcha-service"; // your existing helper

const env = getEnv();

export async function submitContactForm(
  _previousState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  logger.info("[contact] submitContactForm triggered");

  // 1) Extract fields
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message")
  };

  // 2) Validate fields
  const validatedFields = contactFormSchema.safeParse(raw);

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    logger.warn("[contact] Validation failed", fieldErrors);

    return {
      success: false,
      message: "Validation failed. Please check your entries."
    };
  }

  const data = validatedFields.data;

  // 3) reCAPTCHA Validation
  const recaptchaToken = formData.get("recaptchaToken") as string | null;

  const recaptchaResult = await verifyRecaptcha(recaptchaToken, "contact_form");

  if (!recaptchaResult.ok) {
    logger.warn("[contact] reCAPTCHA failed", {
      email: data.email,
      reason: recaptchaResult.reason,
      score: recaptchaResult.score
    });

    return {
      success: false,
      message: "reCAPTCHA verification failed. Please try again."
    };
  }

  logger.info("[contact] reCAPTCHA verification passed", {
    score: recaptchaResult.score
  });

  // 4) Ensure receiver email configured
  if (!env.CONTACT_FORM_RECEIVER_EMAIL) {
    logger.error("[contact] CONTACT_FORM_RECEIVER_EMAIL missing from env");
    return {
      success: false,
      message: "Something went wrong. Please try again later."
    };
  }

  // 5) Attempt email send
  try {
    logger.info("[contact] Sending contact form email...", {
      to: env.CONTACT_FORM_RECEIVER_EMAIL,
      from: data.email,
      subject: data.subject
    });

    const ok = await emailService.sendContactFormEmail(data);

    if (!ok) {
      logger.error("[contact] Email service failed");
      throw new Error("Email service failed.");
    }

    logger.info("[contact] Email sent successfully");
    return {
      success: true,
      message: "Thank you! Your message has been sent."
    };
  } catch (error) {
    logger.error("[contact] Failed to send contact form email", {
      error
    });

    return {
      success: false,
      message: "Something went wrong. Please try again later."
    };
  }
}
