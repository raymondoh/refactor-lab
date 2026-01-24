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
        // This is the key part: make json() return the body
        json: async () => body
      };
    }
  }
}));

jest.mock("@/lib/auth/require-session", () => ({ requireSession: jest.fn() }));
jest.mock("@/lib/services/user-service", () => ({
  userService: {
    getUserById: jest.fn(),
    updateUser: jest.fn()
  }
}));

jest.mock("@/lib/stripe/server", () => ({
  stripe: {
    accounts: { retrieve: jest.fn() }
  }
}));

import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { stripe } from "@/lib/stripe/server";
import { GET } from "./route";

describe("stripe connect status route", () => {
  beforeEach(() => {
    (requireSession as jest.Mock).mockReset();
    (userService.getUserById as jest.Mock).mockReset();
    (userService.updateUser as jest.Mock).mockReset();
    (stripe.accounts.retrieve as jest.Mock).mockReset();
  });

  it("short-circuits when no connect account", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "tradesperson" } });
    (userService.getUserById as jest.Mock).mockResolvedValue({ id: "u1", stripeConnectAccountId: null });

    const res = await GET();
    // --- FIX: Await res.json() to get the body ---
    const body = await res.json();

    expect(stripe.accounts.retrieve).not.toHaveBeenCalled();
    expect(body.stripeOnboardingComplete).toBe(false);
    expect(body.stripeChargesEnabled).toBe(false);
    expect(res.status).toBe(200);
  });

  it("updates user when Stripe reports onboarding complete", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u2", role: "tradesperson" } });
    (userService.getUserById as jest.Mock).mockResolvedValue({
      id: "u2",
      stripeConnectAccountId: "acct_1",
      stripeOnboardingComplete: false,
      stripeChargesEnabled: false
    });
    (stripe.accounts.retrieve as jest.Mock).mockResolvedValue({
      details_submitted: true,
      payouts_enabled: true,
      charges_enabled: true
    });

    const res = await GET();
    // --- FIX: Await res.json() to get the body ---
    const body = await res.json();

    expect(userService.updateUser).toHaveBeenCalledWith("u2", {
      stripeOnboardingComplete: true,
      stripeChargesEnabled: true
    });
    expect(body.stripeOnboardingComplete).toBe(true);
    expect(body.stripeChargesEnabled).toBe(true);
  });
});
