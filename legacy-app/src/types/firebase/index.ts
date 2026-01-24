/**
 * Firebase Types Index
 *
 * This file explicitly exports all Firebase-related types.
 * Using this index file makes imports clearer and helps with IDE auto-imports.
 */

// Activity logging types (keep only the used ones)
export type {
  // Core activity types
  ActivityType,
  ActivityLogData,
  SerializedActivity
} from "./activity";

// All other Firebase types removed as they are not used anywhere in the codebase
