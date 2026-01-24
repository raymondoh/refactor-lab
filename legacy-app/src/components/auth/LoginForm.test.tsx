// __tests__/LoginForm.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { LoginForm } from "../auth/LoginForm";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Polyfill global Request for next/cache
global.Request = class {};

// Mock server-related modules
jest.mock("firebase-admin/app", () => ({
  getApps: jest.fn(() => []),
  initializeApp: jest.fn()
}));

jest.mock("firebase-admin/auth", () => ({}));
jest.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: jest.fn()
  }
}));
jest.mock("firebase-admin/storage", () => ({}));

jest.mock("@/firebase/client/firebase-client-init", () => ({
  auth: {}
}));

jest.mock("@/firebase/client/next-auth", () => ({
  signInWithNextAuth: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock("@/actions/auth", () => ({
  loginUser: jest.fn(() => async () => ({
    success: true,
    message: "Login successful!",
    data: { customToken: "mock-token" }
  }))
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({ update: jest.fn() }))
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() }))
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn()
}));

describe("LoginForm", () => {
  it("renders the login form", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();

    const buttons = screen.getAllByRole("button", { name: /sign in/i });
    const submitButton = buttons.find(btn => btn.getAttribute("type") === "submit");
    expect(submitButton).toBeInTheDocument();
  });

  it("accepts input and submits", async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "password123" } });

    const buttons = screen.getAllByRole("button", { name: /sign in/i });
    const submitButton = buttons.find(btn => btn.getAttribute("type") === "submit");
    fireEvent.click(submitButton!);

    expect(await screen.findByText(/or continue with/i)).toBeInTheDocument();
  });
});
