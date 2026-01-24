jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({
      ...body,
      status: init?.status ?? 200,
      json: async () => body
    })
  }
}));

jest.mock("@/lib/auth/require-session", () => ({ requireSession: jest.fn() }));
jest.mock("@/lib/services/notification-service", () => ({
  notificationService: { markNotificationsAsRead: jest.fn() }
}));

import { POST } from "./route";
import { requireSession } from "@/lib/auth/require-session";
import { notificationService } from "@/lib/services/notification-service";

describe("notifications route", () => {
  beforeEach(() => {
    (requireSession as jest.Mock).mockReset();
    (notificationService.markNotificationsAsRead as jest.Mock).mockReset();
  });

  it("marks notifications as read", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "user1" } });
    const req: any = { json: async () => ({ notificationIds: ["1", "2"] }) };
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(notificationService.markNotificationsAsRead).toHaveBeenCalledWith("user1", ["1", "2"]);
  });

  it("returns 400 for malformed payload", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "user1" } });
    const req: any = { json: async () => ({ notificationIds: [] }) };
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when notificationIds missing", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "user1" } });
    const req: any = { json: async () => ({}) };
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

