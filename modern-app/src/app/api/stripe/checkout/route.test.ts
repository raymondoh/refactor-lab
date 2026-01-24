jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({
      ...body,
      status: init?.status ?? 200,
      json: async () => body
    })
  }
}));

jest.mock("@/lib/stripe/server", () => ({
  stripe: {
    checkout: { sessions: { create: jest.fn() } }
  }
}));

jest.mock("@/lib/auth/require-session", () => ({ requireSession: jest.fn() }));

import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/require-session";
import { POST } from "./route";

describe("stripe checkout route", () => {
  beforeEach(() => {
    process.env.STRIPE_PRO_PRICE_MONTHLY = "pro_month";
    process.env.STRIPE_PRO_PRICE_YEARLY = "pro_year";
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "user1", role: "tradesperson" } });
    (stripe.checkout.sessions.create as jest.Mock).mockReset();
  });

  it("rejects non-tradesperson users", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "user1", role: "customer" } });
    const req: any = { json: async () => ({ tier: "pro" }), headers: new Headers() };
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("returns 400 when price id is missing", async () => {
    delete process.env.STRIPE_PRO_PRICE_MONTHLY;
    const req: any = { json: async () => ({ tier: "pro" }), headers: new Headers() };
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates a checkout session with correct price", async () => {
    (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({ id: "sess_123" });
    const req: any = {
      json: async () => ({ tier: "pro", isYearly: true }),
      headers: new Headers({ origin: "http://example.com" }),
      nextUrl: new URL("http://example.com/api/stripe/checkout")
    };
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: "pro_year", quantity: 1 }],
        metadata: expect.objectContaining({ tier: "pro", billingInterval: "yearly", userId: "user1" })
      }),
      expect.objectContaining({ idempotencyKey: expect.any(String) })
    );
    expect(await res.json()).toEqual({ sessionId: "sess_123" });
  });
});
