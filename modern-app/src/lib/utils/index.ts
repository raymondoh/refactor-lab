// src/lib/utils/index.ts

// ✅ Safe Client-Side Exports (Keep these)
export * from "./cn";
export * from "./format-city-slug";
export * from "./format-date";
export * from "./get-initials";
export * from "./location";
export * from "./search";
export * from "./slugify";

// 🛑 SERVER-SIDE EXPORTS (COMMENT THESE OUT)
// These are the cause of your "Module not found: fs" errors.
// Since your grep result was empty, it is safe to remove them.

// export * from "./logger";
// export * from "./normalize-private-key";
// export * from "./serialize-firestore";

// 🛑 SERVER-SIDE EXPORTS (COMMENT THESE OUT)
// These are the cause of your "Module not found: fs" errors.
// Since your grep result was empty, it is safe to remove them.

// export * from "./logger";
// export * from "./normalize-private-key";
// export * from "./serialize-firestore";

// ⚠️ DANGEROUS: These likely import 'firebase-admin' or 'fs' (Server-Only).
// Exporting them here causes "Module not found" errors in Client Components.
// --------------------------------------------------------------------------
// Please import these directly from their files in your Server Actions/Components.
// e.g. import { serializeFirestore } from "@/lib/utils/serialize-firestore";
// --------------------------------------------------------------------------

// export * from "./normalize-private-key";
// export * from "./serialize-firestore";
// export * from "./logger"; // Be careful: if logger uses 'winston'/'fs', keep it commented out too.
