import { z } from "zod";

export const accountDeletionSchema = z.object({
  immediateDelete: z.boolean().default(false),
  reason: z.string().optional()
});

export type AccountDeletionInput = z.infer<typeof accountDeletionSchema>;
