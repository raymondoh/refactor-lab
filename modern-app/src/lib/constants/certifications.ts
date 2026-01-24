/**
 * Standardised plumbing certification definitions used across the portal.
 * Each identifier represents a recognised industry body. The accompanying
 * {@link CERTIFICATIONS} map provides human labels, descriptions and the
 * fields required to verify a professional's credentials.
 */

/** City & Guilds qualification identifier */
export const CITY_AND_GUILDS = "city-and-guilds" as const;
/** Chartered Institute of Plumbing and Heating Engineering identifier */
export const CIPHE = "ciphe" as const;
/** Gas Safe register identifier */
export const GAS_SAFE = "gas-safe" as const;
/** WaterSafe approved plumbers scheme identifier */
export const WATER_SAFE = "watersafe" as const;
/** Association of Plumbing & Heating Contractors identifier */
export const APHC = "aphc" as const;
/** Scottish & Northern Ireland Plumbing Employers' Federation identifier */
export const SNIPEF = "snipef" as const;

export type CertificationId =
  | typeof CITY_AND_GUILDS
  | typeof CIPHE
  | typeof GAS_SAFE
  | typeof WATER_SAFE
  | typeof APHC
  | typeof SNIPEF;

export interface CertificationField {
  id: string;
  label: string;
}

export interface Certification {
  id: CertificationId;
  label: string;
  description: string;
  qualifications: string[];
  requiredFields?: CertificationField[];
  /** Optional link to the official verification portal for this body. */
  verificationUrl?: string;
}

export const CERTIFICATIONS: Record<CertificationId, Certification> = {
  [CITY_AND_GUILDS]: {
    id: CITY_AND_GUILDS,
    label: "City & Guilds",
    description: "City & Guilds plumbing and heating trade qualifications.",
    qualifications: ["Level 2 Diploma in Plumbing", "Level 3 Diploma in Plumbing and Heating"],
    requiredFields: [
      { id: "certificateNumber", label: "Certificate number" },
      { id: "issueDate", label: "Issue date" }
    ]
  },
  [CIPHE]: {
    id: CIPHE,
    label: "CIPHE",
    description: "Chartered Institute of Plumbing and Heating Engineering membership.",
    qualifications: ["Approved Plumber", "Registered Heating Engineer"],
    requiredFields: [
      { id: "membershipNumber", label: "Membership number" },
      { id: "expiryDate", label: "Expiry date" }
    ],
    verificationUrl: "https://www.ciphe.org.uk/find-a-plumber/"
  },
  [GAS_SAFE]: {
    id: GAS_SAFE,
    label: "Gas Safe",
    description: "UK legal register for gas engineers.",
    qualifications: ["Gas Safe Registered Engineer"],
    requiredFields: [
      { id: "registrationNumber", label: "Registration number" },
      { id: "expiryDate", label: "Expiry date" }
    ],
    verificationUrl: "https://www.gassaferegister.co.uk/find-an-engineer/"
  },
  [WATER_SAFE]: {
    id: WATER_SAFE,
    label: "WaterSafe",
    description: "UK approved plumber scheme for water supply regulations compliance.",
    qualifications: ["Approved Contractor", "Water Regulations Certificate"],
    requiredFields: [
      { id: "membershipNumber", label: "Membership number" },
      { id: "expiryDate", label: "Expiry date" }
    ],
    verificationUrl: "https://www.watersafe.org.uk/search/"
  },
  [APHC]: {
    id: APHC,
    label: "APHC",
    description: "Association of Plumbing & Heating Contractors certification and schemes.",
    qualifications: ["Licensed Plumber", "Competent Person Scheme"],
    requiredFields: [
      { id: "registrationNumber", label: "Registration number" },
      { id: "expiryDate", label: "Expiry date" }
    ],
    verificationUrl: "https://www.aphc.co.uk/find-a-member/"
  },
  [SNIPEF]: {
    id: SNIPEF,
    label: "SNIPEF",
    description: "Scottish and Northern Ireland Plumbing Employers' Federation licensing.",
    qualifications: ["Licensed Plumber", "Approved Plumbing Contractor"],
    requiredFields: [
      { id: "registrationNumber", label: "Registration number" },
      { id: "expiryDate", label: "Expiry date" }
    ],
    verificationUrl: "https://www.needaplumber.org/"
  }
};

export const CERTIFICATION_IDS = [CITY_AND_GUILDS, CIPHE, GAS_SAFE, WATER_SAFE, APHC, SNIPEF] as const;
