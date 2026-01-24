import { loginAction } from "@/actions/auth/login";
import { signIn } from "@/auth";
import { userService } from "@/lib/services/user-service";
import { AuthError } from "next-auth";

// MOCK next/headers
jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue("127.0.0.1")
  })
}));

jest.mock("@/lib/rate-limiter", () => ({
  rateLimitKeys: {
    ipOnly: (ip: string) => ip,
    ipEmail: (ip: string, email: string) => `${ip}:${email}`
  },
  loginRateLimiter: {
    limit: jest.fn().mockResolvedValue({
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      pending: Promise.resolve()
    })
  },
  loginIpBackstopRateLimiter: {
    limit: jest.fn().mockResolvedValue({
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      pending: Promise.resolve()
    })
  }
}));

// MOCK reCAPTCHA
jest.mock("@/lib/recaptcha-service", () => ({
  verifyRecaptcha: jest.fn().mockResolvedValue({ ok: true, score: 0.9 })
}));

jest.mock("@/lib/logger", () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));

jest.mock("@/auth", () => ({ signIn: jest.fn() }));
jest.mock("@/lib/services/user-service", () => ({ userService: { getUserByEmail: jest.fn() } }));

jest.mock("next-auth", () => {
  class AuthError extends Error {
    type: string;
    cause?: any;
    constructor(type: string, options?: { cause?: any }) {
      super(type);
      this.type = type;
      this.cause = options?.cause;
    }
  }
  return { AuthError };
});

describe("loginAction", () => {
  const buildFormData = (email?: string, password?: string) => {
    const form = new FormData();
    if (email) form.append("email", email);
    if (password !== undefined) form.append("password", password);
    return form;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs in and returns redirect url", async () => {
    (signIn as jest.Mock).mockResolvedValue(undefined);
    (userService.getUserByEmail as jest.Mock).mockResolvedValue({ role: "customer" });

    const result = await loginAction({}, buildFormData("test@example.com", "secret"));

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "test@example.com",
      password: "secret",
      redirect: false
    });
    expect(userService.getUserByEmail).toHaveBeenCalledWith("test@example.com");
    expect(result).toEqual({ success: true, redirectUrl: "/dashboard/customer" });
  });

  it("returns error for invalid credentials", async () => {
    (signIn as jest.Mock).mockRejectedValue(new AuthError("CredentialsSignin"));

    const result = await loginAction({}, buildFormData("a@a.com", "bad"));

    expect(result.errors?._form).toEqual(["Invalid email or password."]);
  });

  it("handles unverified email", async () => {
    const err = new AuthError("CredentialsSignin", { cause: { err: new Error("unverified") } });
    (signIn as jest.Mock).mockRejectedValue(err);

    const result = await loginAction({}, buildFormData("u@e.com", "pass"));

    expect(result).toEqual({
      unverifiedEmail: true,
      resendHintEmail: "u@e.com",
      errors: { _form: ["Email not verified."] }
    });
  });

  it("returns a validation error if the email is invalid", async () => {
    const result = await loginAction({}, buildFormData("not-an-email", "password"));
    expect(result.errors?.email).toEqual(["Please enter a valid email address."]);
  });

  it("returns a validation error if the password is not provided", async () => {
    const result = await loginAction({}, buildFormData("test@example.com", ""));
    expect(result.errors?.password).toEqual(["Password is required."]);
  });
});
