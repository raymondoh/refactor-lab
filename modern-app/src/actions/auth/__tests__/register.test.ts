import { registerAction } from "@/actions/auth/register";
import { userService } from "@/lib/services/user-service";
import { tokenService } from "@/lib/auth/tokens";
import { emailService } from "@/lib/email/email-service";

// MOCK next/headers
jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue("127.0.0.1")
  })
}));

// ADD THIS MOCK
jest.mock("@/lib/rate-limiter", () => ({
  rateLimitKeys: {
    ipOnly: (ip: string) => ip,
    ipEmail: (ip: string, email: string) => `${ip}:${email}`
  },
  registerRateLimiter: {
    limit: jest.fn().mockResolvedValue({
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      pending: Promise.resolve()
    })
  },
  registerIpBackstopRateLimiter: {
    limit: jest.fn().mockResolvedValue({
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      pending: Promise.resolve()
    })
  }
}));

// ADD THIS MOCK (for reCAPTCHA)
jest.mock("@/lib/recaptcha-service", () => ({
  verifyRecaptcha: jest.fn().mockResolvedValue({ ok: true, score: 0.9 })
}));

// ADD THIS MOCK (for feature flag)
jest.mock("@/lib/featured-flags", () => ({
  isRegistrationEnabled: jest.fn().mockReturnValue(true)
}));
jest.mock("@/lib/logger", () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
jest.mock("@/lib/services/user-service", () => ({ userService: { getUserByEmail: jest.fn(), createUser: jest.fn() } }));
jest.mock("@/lib/auth/tokens", () => ({ tokenService: { createEmailVerificationToken: jest.fn() } }));
jest.mock("@/lib/email/email-service", () => ({ emailService: { sendVerificationEmail: jest.fn() } }));

describe("registerAction", () => {
  const buildFormData = () => {
    const form = new FormData();
    form.append("name", "John");
    form.append("email", "test@example.com");
    form.append("password", "secret123");
    form.append("confirmPassword", "secret123");
    form.append("role", "customer");
    form.append("terms", "on");
    return form;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers a new user successfully", async () => {
    (userService.getUserByEmail as jest.Mock).mockResolvedValue(null);
    (userService.createUser as jest.Mock).mockResolvedValue({ id: "1" });
    (tokenService.createEmailVerificationToken as jest.Mock).mockResolvedValue("token");

    const result = await registerAction({}, buildFormData());

    expect(userService.createUser).toHaveBeenCalled();
    expect(tokenService.createEmailVerificationToken).toHaveBeenCalledWith("test@example.com");

    expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    expect(result).toEqual({ success: true, message: expect.any(String) });
  });

  it("returns error when email already exists", async () => {
    (userService.getUserByEmail as jest.Mock).mockResolvedValue({ id: "1" });

    const result = await registerAction({}, buildFormData());

    expect(result.errors?.email).toEqual(["An account with this email already exists"]);
    expect(userService.createUser).not.toHaveBeenCalled();
  });
});
