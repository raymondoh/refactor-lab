// Types for account deletion functionality

export type DeletionRequestStatus = "pending" | "processing" | "completed" | "failed";

export type DeletionRequest = {
  id: string;
  userId: string;
  status: DeletionRequestStatus;
  requestedAt: string;
  processedAt?: string;
  reason?: string;
};

export interface ProcessDeletionsResult {
  success: boolean;
  processed: number;
  errors: number;
  error?: string;
}

export interface DeleteAccountState {
  success: boolean;
  message?: string;
  error?: string;
  shouldRedirect?: boolean;
}
