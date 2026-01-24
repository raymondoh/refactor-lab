// utils/index.ts

// If you're using `date.ts` (client-side Day.js utils)
export { formatDate as formatDateClient } from "./date";

// If you're using `date-server.ts` (server-safe formatting)
export { formatDate as formatDateServer, toDate } from "./date-server";

// Other utilities
export * from "./dayjs";
export * from "./date-server";
export * from "./firebase-error";
export * from "./get-initials";
export * from "./getDisplayName";
export * from "./hashPassword";
export * from "./serializeData";
export * from "./serializeProduct";
export * from "./serializeUser";
export * from "./uploadFile";
export * from "./validateFileSize";
export * from "./logger";
