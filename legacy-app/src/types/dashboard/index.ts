/**
 * Dashboard Types Index
 *
 * This file explicitly exports all dashboard-related types.
 * Using this index file makes imports clearer and helps with IDE auto-imports.
 */

// Account related types
export type { AccountSummaryProps } from "./account";

// Activity log related types
export type {
  ActivityLogProps,
  ActivityLogClientProps,
  AdminActivityLogWrapperProps,
  Activity,
  SystemStats,
  SystemAlert,
  FetchActivityLogsParams,
  FetchActivityLogsResponse
} from "./activity";
