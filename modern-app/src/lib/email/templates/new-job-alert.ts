// src/lib/email/templates/new-job-alert.ts
import { getURL } from "@/lib/url";
import type { Job } from "@/lib/types/job";
import { EmailLayout } from "./layout/email-layout";
import { greetingHtml, getRecipientName } from "./layout/email-style";

export function newJobAlertEmail(job: Job, name?: string | null) {
  const jobUrl = getURL(`/dashboard/tradesperson/job-board/${job.id}`);

  const subject = `New job available: ${job.title}`;
  const preheader = `A new job in ${job.location.postcode} matches your services.`;
  const recipientName = getRecipientName(name);

  const body = `
    ${greetingHtml(recipientName)}
    <h1>New job matching your profile</h1>
    <p>
      A new job that matches your skills and service area is now available for quoting.
    </p>
    <p><strong>Job title:</strong> ${job.title}</p>
    <p><strong>Location:</strong> ${job.location.postcode}</p>
    <p style="text-align: center; margin-top: 20px;">
      <a href="${jobUrl}" class="button-link">View job details</a>
    </p>
    <p>
      This is a good opportunity to win new business. Be sure to submit your quote soon.
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
