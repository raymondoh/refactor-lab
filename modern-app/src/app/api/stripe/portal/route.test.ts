// src/app/api/stripe/portal/route.test.ts
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => {
      const headerStore = new Map<string, string>();
      return {
        ...body,
        status: init?.status ?? 200,
        headers: {
          set: (key: string, value: string) => {
            headerStore.set(key.toLowerCase(), value);
          },
          get: (key: string) => headerStore.get(key.toLowerCase())
        },
        json: async () => body
      };
    }
  }
}));

jest.mock("@/lib/stripe/server", () => ({
  stripe: { billingPortal: { sessions: { create: jest.fn() } } }
}));

jest.mock("@/lib/auth/require-session", () => ({ requireSession: jest.fn() }));
jest.mock("@/lib/firebase/admin", () => ({ UsersCollection: jest.fn() }));

import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/require-session";
import { UsersCollection } from "@/lib/firebase/admin";
import { POST } from "./route";

// Define a mock request object for testing the handler
const mockRequest = {
  headers: new Headers({ host: "localhost" })
} as any;

describe("stripe portal route", () => {
  beforeEach(() => {
    (requireSession as jest.Mock).mockReset();
    (stripe.billingPortal.sessions.create as jest.Mock).mockReset();
    (UsersCollection as jest.Mock).mockReset();
  });

  it("rejects non-tradesperson users", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "customer" } });
    // FIX: Pass the mock request
    const res = await POST(mockRequest);
    expect(res.status).toBe(403);
    expect(stripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it("returns 400 when customer id missing", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "tradesperson" } });
    const get = jest.fn().mockResolvedValue({ exists: true, data: () => ({}) });
    (UsersCollection as jest.Mock).mockReturnValue({ doc: () => ({ get }) });
    // FIX: Pass the mock request
    const res = await POST(mockRequest);
    expect(res.status).toBe(400);
    expect(stripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });
});
