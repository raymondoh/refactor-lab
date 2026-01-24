// src/app/dashboard/business-owner/layout.test.tsx
import React from "react";

import BusinessOwnerLayout from "./layout";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";

const mockRequireSession = jest.fn() as jest.MockedFunction<() => Promise<Session>>;

jest.mock("@/lib/auth/require-session", () => ({
  requireSession: () => mockRequireSession()
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn()
}));

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

const baseSession = {
  user: {
    id: "user-123",
    role: "business_owner",
    subscriptionTier: "business"
  }
} as const;

describe("BusinessOwnerLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children for business owners on the business tier", async () => {
    mockRequireSession.mockResolvedValue(baseSession as any);

    const children = <div>allowed</div>;
    const result = await BusinessOwnerLayout({ children });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toEqual(<>{children}</>);
  });

  it("redirects non-business users to the dashboard", async () => {
    mockRequireSession.mockResolvedValue({
      ...baseSession,
      user: { ...baseSession.user, role: "tradesperson" }
    } as any);

    await BusinessOwnerLayout({ children: <div>blocked</div> });

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("allows access for business owners who drop below the business tier (so they see page-level upsells)", async () => {
    mockRequireSession.mockResolvedValue({
      ...baseSession,
      user: { ...baseSession.user, subscriptionTier: "basic" }
    } as any);

    const children = <div>dashboard content</div>;
    const result = await BusinessOwnerLayout({ children });

    // EXPECTATION CHANGED: We now want them to stay on the page
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toEqual(<>{children}</>);
  });
});
