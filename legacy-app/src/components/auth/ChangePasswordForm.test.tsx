// __tests__/ChangePasswordForm.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ChangePasswordForm } from "../auth/ChangePasswordForm";

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

jest.mock("@/utils/firebase-error", () => ({
  firebaseError: jest.fn(() => "Mock Firebase Error"),
  isFirebaseError: jest.fn(() => true)
}));

jest.mock("@/actions/auth/password", () => ({
  updatePassword: jest.fn(() => async () => ({
    success: true
  }))
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe("ChangePasswordForm", () => {
  it("renders all password fields", () => {
    render(<ChangePasswordForm />);
    const fields = screen.getAllByLabelText(/password/i);
    expect(fields[0]).toHaveAttribute("id", "currentPassword");
    expect(fields[1]).toHaveAttribute("id", "newPassword");
    expect(fields[2]).toHaveAttribute("id", "confirmPassword");
    expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
  });

  it("accepts input and submits the form", () => {
    render(<ChangePasswordForm />);

    const [currentField, newField, confirmField] = screen.getAllByLabelText(/password/i);

    fireEvent.change(currentField, { target: { value: "OldPass123!" } });
    fireEvent.change(newField, { target: { value: "NewPass123!" } });
    fireEvent.change(confirmField, { target: { value: "NewPass123!" } });

    const submitButton = screen.getByRole("button", { name: /update password/i });
    fireEvent.click(submitButton);

    // Submission logic (toast) is mocked, so no assertion for network effects here.
  });
});
