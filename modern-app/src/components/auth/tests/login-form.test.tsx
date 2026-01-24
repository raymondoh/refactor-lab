import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../login-form";
import { loginAction } from "@/actions/auth/login";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ""} />;
  }
}));
jest.mock("@/actions/auth/login", () => ({ loginAction: jest.fn() }));

const mockLoginAction = loginAction as jest.Mock;
const originalLocation = window.location;

beforeEach(() => {
  mockLoginAction.mockReset();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { href: "" } as unknown as Location
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation
  });
});

describe("LoginForm", () => {
  it("renders login form correctly", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
  });

  it("shows verification success message when verified prop is true", () => {
    render(<LoginForm verified="true" />);
    expect(screen.getByText(/email verified successfully/i)).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i, { selector: "input" });

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it("handles successful login", async () => {
    const user = userEvent.setup();
    mockLoginAction.mockResolvedValue({ success: true });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i, { selector: "input" }), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLoginAction).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(window.location.href).toBe("/dashboard");
    });
  });

  it("handles login error", async () => {
    const user = userEvent.setup();
    mockLoginAction.mockResolvedValue({ errors: { _form: ["Invalid email or password"] } });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i, { selector: "input" }), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    mockLoginAction.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i, { selector: "input" }), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
  });
});
