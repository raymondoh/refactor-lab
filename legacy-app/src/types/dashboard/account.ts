import type { User } from "../models/user";

/**
 * Props for the AccountSummary component
 */
export interface AccountSummaryProps {
  user: User;
  profileUrl?: string;
  className?: string;
}
