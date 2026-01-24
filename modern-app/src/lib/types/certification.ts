// src/lib/types/certification.ts

/** Extra info that can help re-check a certification */
export interface VerificationReference {
  registrationNumber?: string | null;
  lookupUrl?: string | null;
}

/** Result payload from a verification attempt */
export interface VerificationResult {
  /** Whether the external/manual check confirmed the certification */
  verified: boolean;
  /** How the verification was performed */
  method: "manual" | "api" | "email" | "web" | "other";
  /** External service or issuing body used for verification */
  provider?: string | null;
  /** When the verification check was performed */
  checkedAt: Date;
  /** Optional reference details for audits or future lookups */
  reference?: VerificationReference | null;
  /** Free-form details/response from the provider */
  details?: Record<string, unknown>;
}

/** A user-uploaded certification that may be verified by an admin */
export interface Certification {
  /** Unique identifier for this certification entry */
  id: string;
  /** Name of the certification */
  name: string;
  /** Organisation or body that issued the certification */
  issuingBody: string;
  /** Additional metadata fields specific to the certification body */
  metadata?: Record<string, string | null>;
  /** Storage URL for the uploaded certificate file */
  fileUrl?: string | null;
  /** Whether an administrator has verified this certification */
  verified?: boolean;
  /** Timestamp when the certification was verified or rejected */
  verifiedAt?: Date | null;
  /** ID of the admin who performed the verification action */
  verifiedBy?: string | null;
  /** Details of how/when the certification was verified (null until verified) */
  verification?: VerificationResult | null;
}
