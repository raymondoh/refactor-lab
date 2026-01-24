// src/components/error/auth-error-boundary.tsx
"use client";

import React from "react";
import { captureException } from "@/lib/monitoring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { clientLogger } from "@/lib/utils/logger";

export type RetryFn = () => void;
export type AuthErrorFallbackProps = { error: Error; retry: RetryFn };

// ✅ Exported fallback with the correct prop names/signature
export function AuthErrorFallback({ error, retry }: AuthErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>We&apos;re sorry, but an unexpected error occurred.</p>
            {process.env.NODE_ENV === "development" && (
              <pre className="mt-2 whitespace-pre-wrap text-xs bg-accent p-2 rounded">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            )}
          </div>
          <div className="flex flex-col space-y-2">
            <Button onClick={retry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button variant="subtle" onClick={() => window.location.assign("/")} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// (Optional) Keep your local error boundary + default fallback below if you still use them elsewhere.

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    clientLogger.warn("ErrorBoundary caught an error:", error, errorInfo);
    captureException(error, errorInfo);
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  private retry = () => this.setState({ hasError: false, error: undefined, errorInfo: undefined });

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback: Fallback } = this.props;
      if (Fallback) return <Fallback error={this.state.error} retry={this.retry} />;
      return <AuthErrorFallback error={this.state.error} retry={this.retry} />;
    }
    return this.props.children;
  }
}

export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    clientLogger.error("Error caught by useErrorHandler:", error, errorInfo);
    captureException(error, errorInfo);
  };
}
