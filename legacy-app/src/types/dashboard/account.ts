import type { User } from "../user/common";

/**
 * Props for the AccountSummary component
 */
export interface AccountSummaryProps {
  user: User;
  profileUrl?: string;
  className?: string;
}
