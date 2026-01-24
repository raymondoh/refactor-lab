// src/app/debug/page.test.tsx
import React from "react";
import DebugPage from "@/app/debug/page";
import type { Session } from "next-auth";

jest.mock("@/lib/auth/require-session", () => ({
  requireSession: jest.fn<Promise<Session>, []>()
}));
import { requireSession } from "@/lib/auth/require-session";

// Mock next/navigation.notFound to throw
jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    notFound: jest.fn(() => {
      throw new Error("notFound");
    })
  };
});
import { notFound } from "next/navigation";

// Mock the client page used by DebugPage
jest.mock(
  "@/app/debug/client-page",
  () =>
    function ClientPage() {
      return <div>client</div>;
    }
);

const mockedRequire = requireSession as unknown as jest.Mock<Promise<Session>, []>;
const mockedNotFound = notFound as unknown as jest.Mock<never, []>;

// Helper to build a minimal Session with your augmented types
function sessionWithRole(role: "customer" | "tradesperson" | "admin" | "business_owner" | "manager"): Session {
  return {
    user: {
      id: "test-user-id",
      name: "Test User",
      email: "test@example.com",
      image: null,
      role,
      emailVerified: new Date()
    },
    expires: ""
  };
}

describe("debug page", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockedRequire.mockReset();
    mockedNotFound.mockClear();
    // default test env unless a test overrides it
    Object.defineProperty(process.env, "NODE_ENV", { value: "test" });
  });

  afterAll(() => {
    // restore original NODE_ENV
    Object.defineProperty(process.env, "NODE_ENV", { value: originalEnv });
  });

  it("blocks non-admin users", async () => {
    mockedRequire.mockResolvedValue(sessionWithRole("customer"));
    await expect(DebugPage()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("blocks access in production", async () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "production" });
    mockedRequire.mockResolvedValue(sessionWithRole("admin"));
    await expect(DebugPage()).rejects.toThrow("notFound");
  });

  it("allows admin in non-production", async () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "test" });
    mockedRequire.mockResolvedValue(sessionWithRole("admin"));
    const res = await DebugPage();
    expect(res).toBeTruthy();
  });
});
