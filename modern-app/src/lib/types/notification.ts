export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}
