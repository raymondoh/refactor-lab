// __tests__/RegisterForm.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { RegisterForm } from "../auth/RegisterForm";

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

jest.mock("@/firebase/client/auth", () => ({
  getVerificationSettings: jest.fn(() => ({}))
}));

jest.mock("@/components/auth/GoogleAuthButton", () => ({
  GoogleAuthButton: () => <button>Mock Google Button</button>
}));

jest.mock("@/actions/auth", () => ({
  loginUser: jest.fn(() => async () => ({
    success: true,
    message: "Login successful!",
    data: { customToken: "mock-token" }
  })),
  registerUser: jest.fn(() => async () => ({
    success: true,
    message: "Registered successfully",
    data: {}
  }))
}));

jest.mock("firebase/auth", () => ({
  signInWithCustomToken: jest.fn(() =>
    Promise.resolve({
      user: { uid: "mock-user-id" }
    })
  ),
  sendEmailVerification: jest.fn(() => Promise.resolve())
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() }))
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn()
}));

describe("RegisterForm", () => {
  it("renders the register form", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    const passwordFields = screen.getAllByLabelText(/password/i);
    expect(passwordFields[0]).toBeInTheDocument(); // Password
    expect(passwordFields[1]).toBeInTheDocument(); // Confirm Password
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("accepts input and submits", async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    const passwordFields = screen.getAllByLabelText(/password/i);
    fireEvent.change(passwordFields[0], { target: { value: "Password123" } });
    fireEvent.change(passwordFields[1], { target: { value: "Password123" } });

    const submitButton = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/or continue with/i)).toBeInTheDocument();
  });
});
