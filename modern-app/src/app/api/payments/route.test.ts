// src/app/api/payments/route.test.ts
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
  stripe: { paymentIntents: { create: jest.fn() } }
}));

jest.mock("@/lib/auth/require-session", () => ({ requireSession: jest.fn() }));

import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/require-session";
import { POST } from "./route";

describe("payments route", () => {
  const validMetadata = {
    jobId: "job_123",
    quoteId: "quote_456",
    paymentType: "deposit"
  };

  beforeEach(() => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "user1" } });
    (stripe.paymentIntents.create as jest.Mock).mockReset();
  });

  it("creates a payment intent", async () => {
    (stripe.paymentIntents.create as jest.Mock).mockResolvedValue({ client_secret: "test_secret" });

    const req: any = {
      json: async () => ({
        amount: 1000,
        currency: "usd",
        metadata: validMetadata
      })
    };

    const res = await POST(req);

    expect(requireSession).toHaveBeenCalled();
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 1000,
      currency: "usd",
      metadata: validMetadata
    });
    expect(await res.json()).toEqual({ clientSecret: "test_secret" });
  });

  it("returns 400 for invalid input", async () => {
    // Still send metadata, but invalid amount to trigger 400 on amount validation
    const req: any = {
      json: async () => ({
        amount: -1,
        currency: "usd",
        metadata: validMetadata
      })
    };
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles stripe errors", async () => {
    (stripe.paymentIntents.create as jest.Mock).mockRejectedValue(new Error("fail"));

    // Must provide valid input so it passes Zod validation and reaches the Stripe call
    const req: any = {
      json: async () => ({
        amount: 1000,
        currency: "usd",
        metadata: validMetadata
      })
    };

    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to create payment intent" });
  });
});
