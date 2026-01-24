// types/auth/email-verification.ts
import { ActionResponse } from "../common/response";

export interface UpdateEmailVerificationInput {
  userId: string;
  verified: boolean;
}

export type UpdateEmailVerificationResponse = ActionResponse;
