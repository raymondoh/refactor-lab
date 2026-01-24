 
import React from "react";
import { render } from "@testing-library/react";
import { ErrorBoundary as AppErrorBoundary } from "@/components/error/error-boundary";
import { ErrorBoundary as AuthErrorBoundary } from "@/components/error/auth-error-boundary";
import { captureException } from "@/lib/monitoring";

jest.mock("@/lib/monitoring", () => ({ captureException: jest.fn() }));

describe("error boundaries", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    (captureException as jest.Mock).mockClear();
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it("sends errors to monitoring in AppErrorBoundary", () => {
    const Boom = () => {
      throw new Error("boom");
    };
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>
    );
    expect(captureException).toHaveBeenCalled();
  });

  it("sends errors to monitoring in AuthErrorBoundary", () => {
    const Boom = () => {
      throw new Error("auth boom");
    };
    render(
      <AuthErrorBoundary>
        <Boom />
      </AuthErrorBoundary>
    );
    expect(captureException).toHaveBeenCalled();
  });
});
