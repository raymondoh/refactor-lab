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

jest.mock("@/lib/auth/require-session", () => ({ requireSession: jest.fn() }));
jest.mock("@/lib/services/user-service", () => ({
  userService: { getUserById: jest.fn(), updateUser: jest.fn() }
}));

jest.mock("@/lib/stripe/server", () => ({
  stripe: {
    accounts: { create: jest.fn(), retrieve: jest.fn(), createLoginLink: jest.fn() },
    accountLinks: { create: jest.fn() }
  }
}));

import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { stripe } from "@/lib/stripe/server";
import { POST } from "./route";

describe("stripe connect link route", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "http://app";
    (requireSession as jest.Mock).mockReset();
    (userService.getUserById as jest.Mock).mockReset();
    (userService.updateUser as jest.Mock).mockReset();
    (stripe.accounts.create as jest.Mock).mockReset();
    (stripe.accounts.retrieve as jest.Mock).mockReset().mockResolvedValue({
      details_submitted: false,
      charges_enabled: false,
      payouts_enabled: false
    });
    (stripe.accounts.createLoginLink as jest.Mock).mockReset();
    (stripe.accountLinks.create as jest.Mock).mockReset();
  });

  it("creates account if missing", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "tradesperson" } });
    (userService.getUserById as jest.Mock).mockResolvedValue({ id: "u1" });
    (stripe.accounts.create as jest.Mock).mockResolvedValue({ id: "acct_1" });
    (stripe.accountLinks.create as jest.Mock).mockResolvedValue({ url: "link" });

    const res = await POST({} as any);
    expect(userService.updateUser).toHaveBeenCalledWith("u1", {
      stripeConnectAccountId: "acct_1",
      stripeOnboardingComplete: false,
      stripeChargesEnabled: false
    });
    expect(stripe.accountLinks.create).toHaveBeenCalledWith(expect.objectContaining({ account: "acct_1" }));
    expect(res.url).toBe("link");
  });

  it("reuses existing account", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "tradesperson" } });
    // Ensure the mock user object includes the Stripe ID correctly
    (userService.getUserById as jest.Mock).mockResolvedValue({ id: "u1", stripeConnectAccountId: "acct_existing" });
    (stripe.accountLinks.create as jest.Mock).mockResolvedValue({ url: "link2" });

    const res = await POST({} as any);
    expect(stripe.accounts.create).not.toHaveBeenCalled();
    expect(userService.updateUser).not.toHaveBeenCalled();
    expect(stripe.accountLinks.create).toHaveBeenCalledWith(expect.objectContaining({ account: "acct_existing" }));
    expect(res.url).toBe("link2");
  });
});
