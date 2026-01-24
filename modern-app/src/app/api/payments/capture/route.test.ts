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
  stripe: { paymentIntents: { capture: jest.fn() } }
}));

jest.mock("@/lib/firebase/admin", () => ({ JobsCollection: jest.fn() }));

import { requireSession } from "@/lib/auth/require-session";
import { stripe } from "@/lib/stripe/server";
import { JobsCollection } from "@/lib/firebase/admin";
import { POST } from "./route";

describe("payments capture route", () => {
  beforeEach(() => {
    (requireSession as jest.Mock).mockReset();
    (stripe.paymentIntents.capture as jest.Mock).mockReset();
    (JobsCollection as jest.Mock).mockReset();
  });

  it("forbids capture by non-owner", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "customer" } });
    const jobGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ customerId: "other", depositPaymentIntentId: "pi_1" })
    });
    (JobsCollection as jest.Mock).mockReturnValue({ doc: () => ({ get: jobGet }) });
    const req: any = { json: async () => ({ jobId: "j1", type: "deposit" }) };
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(stripe.paymentIntents.capture).not.toHaveBeenCalled();
  });

  it("captures when authorized", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "customer" } });
    const jobGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ customerId: "u1", depositPaymentIntentId: "pi_1" })
    });
    (JobsCollection as jest.Mock).mockReturnValue({ doc: () => ({ get: jobGet }) });
    (stripe.paymentIntents.capture as jest.Mock).mockResolvedValue({ id: "pi_1" });

    const req: any = { json: async () => ({ jobId: "j1", type: "deposit" }) };
    const res = await POST(req);
    expect(stripe.paymentIntents.capture).toHaveBeenCalledWith("pi_1");
    expect(res.status).toBe(200);
  });
});
