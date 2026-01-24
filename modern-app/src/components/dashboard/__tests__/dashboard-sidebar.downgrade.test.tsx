// src/components/dashboard/__tests__/dashboard-sidebar.downgrade.test.tsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import { DashboardSidebar } from "../dashboard-sidebar";
import type { Session } from "next-auth";
import { SidebarProvider } from "@/components/ui/sidebar";

const mockUsePathname = jest.fn(() => "/dashboard/tradesperson/my-quotes");

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname()
}));

describe("DashboardSidebar downgrade experience", () => {
  const session: Session = {
    user: {
      id: "user-basic",
      role: "tradesperson",
      subscriptionTier: "basic",
      email: "trade@example.com",
      name: "Alex Trade"
    }
  } as Session;

  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }))
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/dashboard/tradesperson/my-quotes");
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ count: 0 }) }) as any;
  });

  it("removes business-owner only links but keeps tradesperson tools after downgrade", async () => {
    render(
      <SidebarProvider>
        <DashboardSidebar session={session} />
      </SidebarProvider>
    );

    // Tradesperson experience remains available
    expect(screen.getByText("Job Board")).toBeInTheDocument();
    expect(screen.getByText("Quotes Submitted")).toBeInTheDocument();

    // Business-owner navigation should disappear once the role drops to tradesperson/basic
    expect(screen.queryByText("Team Management")).not.toBeInTheDocument();
    expect(screen.queryByText("Inventory")).not.toBeInTheDocument();
    expect(screen.queryByText("Customers")).not.toBeInTheDocument();

    // Basic-tier upsell remains visible for downgraded tradespeople
    await waitFor(() => {
      expect(screen.getByText("Upgrade Plan")).toBeInTheDocument();
    });
  });
});

