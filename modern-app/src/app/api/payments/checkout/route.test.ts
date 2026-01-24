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
jest.mock("@/lib/stripe/server", () => ({
  stripe: { checkout: { sessions: { create: jest.fn() } } }
}));

jest.mock("@/lib/firebase/admin", () => ({ JobsCollection: jest.fn() }));
jest.mock("@/lib/services/user-service", () => ({ userService: { getUserById: jest.fn() } }));

import { requireSession } from "@/lib/auth/require-session";
import { stripe } from "@/lib/stripe/server";
import { JobsCollection } from "@/lib/firebase/admin";
import { POST } from "./route";

describe("payments checkout route", () => {
  beforeEach(() => {
    (requireSession as jest.Mock).mockReset();
    (stripe.checkout.sessions.create as jest.Mock).mockReset();
    (JobsCollection as jest.Mock).mockReset();
  });

  it("rejects non-customer roles", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "tradesperson" } });
    const req: any = { json: async () => ({ jobId: "j1", quoteId: "q1" }) };
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("rejects non-owners", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "customer" } });
    const jobGet = jest.fn().mockResolvedValue({ exists: true, data: () => ({ customerId: "other" }) });
    (JobsCollection as jest.Mock).mockReturnValue({ doc: () => ({ get: jobGet }) });
    const req: any = { json: async () => ({ jobId: "j1", quoteId: "q1" }) };
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
});
