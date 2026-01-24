"use server";

import { logger } from "@/lib/logger";

export async function testAction(formData: FormData) {
  logger.info("🧪 [TEST ACTION] Test action called!");
  logger.info("🧪 [TEST ACTION] Form data:", Object.fromEntries(formData.entries()));
  return { message: "Test action works!" };
}
