import { render, screen } from "@testing-library/react";
import { Navbar } from "../navbar";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import "@testing-library/jest-dom";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn()
  })),
  usePathname: jest.fn(() => "/mock-path"), // Return a mock pathname
  useSearchParams: jest.fn(() => new URLSearchParams()) // Return a mock search params object
}));

jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
  useSession: () => ({ data: { user: { id: "user1" } } })
}));

jest.mock("@/lib/firebase/client", () => ({
  getFirebaseDb: jest.fn(() => ({})),
  ensureFirebaseAuth: jest.fn(() => Promise.resolve())
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn())
}));

describe("Navbar", () => {
  it("shows user avatar for authenticated users", () => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard");
    const session = {
      user: { name: "Trades", email: "trade@example.com", role: "tradesperson" }
    } as any;

    render(<Navbar session={session} />);
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("shows sign in link for unauthenticated users", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    render(<Navbar session={null} />);
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  it("displays base navigation when auth buttons are visible", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    render(<Navbar session={null} />);
    const baseNav = screen.getByTestId("base-nav");
    expect(baseNav).toHaveClass("hidden");
    expect(baseNav).toHaveClass("lg:flex");
  });
});
