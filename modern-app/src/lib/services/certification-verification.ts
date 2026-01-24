import { CERTIFICATIONS, GAS_SAFE } from "@/lib/constants/certifications";
import type { Certification, VerificationResult } from "@/lib/types/certification";

type VerificationHandler = (cert: Certification) => Promise<VerificationResult>;

const GAS_SAFE_PROVIDER = "Gas Safe Register";

const buildReference = (
  registrationNumber: string | null,
  lookupUrl: string | null
): VerificationResult["reference"] => {
  if (!registrationNumber && !lookupUrl) {
    return null;
  }

  return {
    registrationNumber,
    lookupUrl,
  };
};

async function verifyGasSafe(cert: Certification): Promise<VerificationResult> {
  const now = new Date();
  const registrationNumber = cert.metadata?.registrationNumber?.trim() || null;
  const lookupUrl = CERTIFICATIONS[GAS_SAFE].verificationUrl
    ? `${CERTIFICATIONS[GAS_SAFE].verificationUrl}`
    : null;

  if (!registrationNumber) {
    return {
      verified: false,
      method: "api",
      provider: GAS_SAFE_PROVIDER,
      checkedAt: now,
      reference: buildReference(registrationNumber, lookupUrl),
      details: { reason: "missing_registration_number" },
    };
  }

  try {
    const res = await fetch(
      `https://api.gassaferegister.co.uk/engineers/${registrationNumber}`
    );

    const verified = res.ok;
    const details = verified
      ? undefined
      : { status: res.status, statusText: res.statusText };

    return {
      verified,
      method: "api",
      provider: GAS_SAFE_PROVIDER,
      checkedAt: now,
      reference: buildReference(registrationNumber, lookupUrl),
      details,
    };
  } catch (error) {
    return {
      verified: false,
      method: "api",
      provider: GAS_SAFE_PROVIDER,
      checkedAt: now,
      reference: buildReference(registrationNumber, lookupUrl),
      details: {
        error: error instanceof Error ? error.message : "unknown_error",
      },
    };
  }
}

async function manualCheck(cert: Certification): Promise<VerificationResult> {
  const now = new Date();
  const registrationNumber =
    cert.metadata?.registrationNumber?.trim() ||
    cert.metadata?.membershipNumber?.trim() ||
    cert.metadata?.certificateNumber?.trim() ||
    null;
  const body = cert.issuingBody as keyof typeof CERTIFICATIONS;
  const lookupUrl = CERTIFICATIONS[body]?.verificationUrl || null;

  return {
    verified: false,
    method: "manual",
    provider: CERTIFICATIONS[body]?.label ?? cert.issuingBody ?? null,
    checkedAt: now,
    reference: buildReference(registrationNumber, lookupUrl),
  };
}

const handlers: Record<string, VerificationHandler> = {
  [GAS_SAFE]: verifyGasSafe,
};

export async function verifyCertification(
  cert: Certification
): Promise<VerificationResult> {
  const handler = handlers[cert.issuingBody] || manualCheck;
  return handler(cert);
}

