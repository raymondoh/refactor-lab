jest.mock("@/lib/firebase/admin", () => ({
  getAdminCollection: jest.fn(),
  COLLECTIONS: {}
}));

import { notificationService } from "../notification-service";

describe("NotificationService", () => {
  beforeEach(() => {
    (notificationService as any).notifications = [];
  });

  it("creates and fetches notifications", async () => {
    await notificationService.createNotification("u1", "test", "hello");
    const list = await notificationService.getNotificationsForUser("u1");
    expect(list).toHaveLength(1);
    expect(list[0].message).toBe("hello");
  });

  it("marks notifications as read", async () => {
    const n = await notificationService.createNotification("u1", "test", "hello");
    await notificationService.markAsRead("u1", n.id);
    const list = await notificationService.getNotificationsForUser("u1");
    expect(list[0].read).toBe(true);
  });
});
