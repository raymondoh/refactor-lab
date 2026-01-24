// src/lib/test-utils.tsx
import { render, type RenderOptions } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

// Mock session for testing
const mockSession: Session = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "customer",
    emailVerified: new Date()
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
};

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  session?: Session | null;
}

function AllTheProviders({ children, session = mockSession }: { children: React.ReactNode; session?: Session | null }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}

const customRender = (ui: React.ReactElement, { session, ...options }: CustomRenderOptions = {}) =>
  render(ui, {
    wrapper: props => <AllTheProviders {...props} session={session} />,
    ...options
  });

export * from "@testing-library/react";
export { customRender as render };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  emailVerified: null,
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockTask = (overrides = {}) => ({
  id: "test-task-id",
  title: "Test Task",
  description: "Test task description",
  completed: false,
  priority: "medium" as const,
  userId: "test-user-id",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// API response mocks
export const mockApiResponse = (data: Record<string, unknown>, ok = true) => ({
  ok,
  json: () => Promise.resolve(data),
  status: ok ? 200 : 400
});

// Error simulation utilities
export const simulateNetworkError = () => {
  throw new Error("Network error");
};

export const simulateServerError = () => ({
  ok: false,
  status: 500,
  json: () => Promise.resolve({ error: "Internal server error" })
});
