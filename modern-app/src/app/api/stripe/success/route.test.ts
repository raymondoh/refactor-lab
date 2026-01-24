jest.mock("next/server", () => ({
  NextResponse: { redirect: jest.fn() }
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn()
}));

jest.mock("@/lib/stripe/server", () => ({
  stripe: { checkout: { sessions: { retrieve: jest.fn() } } }
}));

jest.mock("@/lib/auth/require-session", () => ({
  requireSession: jest.fn()
}));

jest.mock("@/lib/services/user-service", () => ({
  userService: { updateUser: jest.fn() }
}));

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { GET } from "./route";

describe("stripe success route", () => {
  beforeEach(() => {
    (NextResponse.redirect as jest.Mock).mockReset();
    (stripe.checkout.sessions.retrieve as jest.Mock).mockReset();
    // FIX: Add role to the mock session data so userRoleDash is not undefined and revalidation fires.
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u-default", role: "tradesperson" } });
    (userService.updateUser as jest.Mock).mockReset();
    (revalidatePath as jest.Mock).mockReset();
  });

  it("sets upgrade cookie when tier allowed and user matches", async () => {
    const set = jest.fn();
    (NextResponse.redirect as jest.Mock).mockImplementation(url => ({ url, cookies: { set } }));
    // FIX: Ensure this mock also has the role set.
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "tradesperson" } });
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      status: "complete", // <-- ADDED
      payment_status: "paid", // <-- ADDED
      metadata: { tier: "pro", userId: "u1" },
      customer: "cus_123",
      subscription: "sub_123"
    });

    const req: any = { url: "http://localhost/api/stripe/success?session_id=sess_1" };
    await GET(req);

    expect(userService.updateUser).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ subscriptionTier: "pro", subscriptionStatus: "active", stripeCustomerId: "cus_123" })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/tradesperson");
    expect(set).toHaveBeenCalled();
    const value = set.mock.calls[0][1];
    expect(decodeURIComponent(value)).toBe(JSON.stringify({ tier: "pro" }));
    expect(set.mock.calls[0][2]).toMatchObject({ maxAge: 60, httpOnly: false });
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ href: "http://localhost/dashboard/tradesperson?payment_success=true&plan=pro" })
    );
  });

  it("skips cookie if session user doesn't match metadata", async () => {
    const set = jest.fn();
    (NextResponse.redirect as jest.Mock).mockImplementation(url => ({ url, cookies: { set } }));
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "tradesperson" } });
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({ metadata: { tier: "pro", userId: "u2" } });

    const req: any = { url: "http://localhost/api/stripe/success?session_id=sess_1" };
    await GET(req);
    expect(set).not.toHaveBeenCalled();
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it("does not set cookie without session id", async () => {
    const set = jest.fn();
    (NextResponse.redirect as jest.Mock).mockImplementation(url => ({ url, cookies: { set } }));

    const req: any = { url: "http://localhost/api/stripe/success" };
    await GET(req);
    expect(set).not.toHaveBeenCalled();
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it("redirects to job details when checkout metadata contains jobId", async () => {
    const set = jest.fn();
    (NextResponse.redirect as jest.Mock).mockImplementation(url => ({ url, cookies: { set } }));
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      status: "complete",
      payment_status: "paid",
      metadata: { jobId: "job_123" }
    });

    const req: any = { url: "http://localhost/api/stripe/success?session_id=sess_1" };
    await GET(req);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "http://localhost/dashboard/customer/jobs/job_123?deposit_paid=true"
      })
    );
    expect(set).not.toHaveBeenCalled();
  });
});
