// src/firebase/client/next-auth.test.ts

import { signIn } from "next-auth/react";
import { signInWithNextAuth } from "./next-auth";

// Mock the 'next-auth/react' module
jest.mock("next-auth/react");

// Create a typed mock function for signIn for easier use in tests
const mockedSignIn = signIn as jest.Mock;

describe("signInWithNextAuth", () => {
  const mockIdToken = "test-id-token";

  // Before each test, reset the mock to ensure a clean state
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test Case 1: Successful Sign-In
  it("should return success: true when NextAuth signIn is successful", async () => {
    // Arrange: Configure the mock signIn to return a successful result
    mockedSignIn.mockResolvedValue({
      ok: true,
      error: null,
      status: 200,
      url: "/"
    });

    // Act: Call our wrapper function
    const result = await signInWithNextAuth({ idToken: mockIdToken });

    // Assert: Check that our function behaved as expected
    expect(mockedSignIn).toHaveBeenCalledTimes(1);
    expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
      idToken: mockIdToken,
      redirect: false
    });
    expect(result).toEqual({ success: true });
  });

  // Test Case 2: Failed Sign-In (NextAuth returns a controlled error)
  it("should return success: false with an error message if NextAuth signIn fails", async () => {
    // Arrange: Configure the mock signIn to return a failure result
    const nextAuthError = "CredentialsSignin";
    mockedSignIn.mockResolvedValue({
      ok: false,
      error: nextAuthError,
      status: 401,
      url: null
    });

    // Act
    const result = await signInWithNextAuth({ idToken: mockIdToken });

    // Assert
    expect(mockedSignIn).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Failed to sign in with credentials");
    expect(result.error).toBe(nextAuthError);
  });

  // Test Case 3: Unexpected Error (e.g., network failure)
  it("should return success: false if the signIn call throws an unexpected error", async () => {
    // Arrange: Configure the mock signIn to throw an exception
    const unexpectedError = new Error("Network request failed");
    mockedSignIn.mockRejectedValue(unexpectedError);

    // Act
    const result = await signInWithNextAuth({ idToken: mockIdToken });

    // Assert: Check that our try...catch block handled the error gracefully
    expect(mockedSignIn).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.message).toBe("An unexpected error occurred during client sign-in");
    expect(result.error).toBe("Network request failed");
  });
});
