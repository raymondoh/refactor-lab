// src/components/error/error-boundary.tsx
"use client";

import React from "react";
import { captureException } from "@/lib/monitoring";

export type RetryFn = () => void;

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  // Matches usage in the app: FallbackComponent receives { error, retry }
  FallbackComponent?: React.ComponentType<{ error: Error; retry: RetryFn }>;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Default: report to monitoring
    try {
      captureException?.(error);
    } catch {
      // ignore monitoring failures
    }
    // Also forward to consumer if provided
    this.props.onError?.(error, errorInfo);
  }

  private retry: RetryFn = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.FallbackComponent;
      if (Fallback) return <Fallback error={this.state.error} retry={this.retry} />;

      return (
        <div role="alert" style={{ padding: 16 }}>
          <p>Something went wrong.</p>
          <pre>{this.state.error.message}</pre>
          <button onClick={this.retry}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
