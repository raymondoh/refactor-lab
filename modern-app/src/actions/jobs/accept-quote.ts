// src/actions/jobs/accept-quote.ts

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";
import { canAccess, CUSTOMER_ROLES } from "@/lib/auth/roles";
import { logger } from "@/lib/logger";

export async function acceptQuote(formData: FormData) {
  logger.info("\n--- [ACTION] acceptQuote: Initiated ---");
  const session = await requireSession();

  const role = session.user.role;

  if (!canAccess(role, CUSTOMER_ROLES)) {
    throw new Error("Forbidden: Only customers can accept quotes.");
  }

  const jobId = formData.get("jobId") as string;
  const quoteId = formData.get("quoteId") as string;
  logger.info(`[ACTION] acceptQuote: Processing Job ID: ${jobId}, Quote ID: ${quoteId}`);

  await jobService.acceptQuote(jobId, quoteId, session.user.id);
  logger.info(`[ACTION] acceptQuote: jobService.acceptQuote completed successfully.`);

  const quotesPagePath = `/dashboard/customer/jobs/${jobId}/quotes`;
  revalidatePath(quotesPagePath);
  logger.info(`[ACTION] acceptQuote: Revalidated path: ${quotesPagePath}`);

  const redirectUrl = `${quotesPagePath}?quote_accepted=true`;
  logger.info(`[ACTION] acceptQuote: Redirecting to: ${redirectUrl}`);
  redirect(redirectUrl);
}
