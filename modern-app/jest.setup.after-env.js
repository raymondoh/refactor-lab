// jest.setup.after-env.js
"use client";

import { jest } from "@jest/globals";
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Silence server-side logger in tests
jest.mock("@/lib/logger", () => {
  const fakeLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    // keep apiError behaviour (returning a JSON response) but don't actually log
    apiError: jest.fn((route, err, status = 500) => {
      const { NextResponse } = require("next/server");

      const message = err instanceof Error ? err.message : typeof err === "string" ? err : "Internal server error";

      return NextResponse.json(
        {
          error: "Internal server error",
          message
        },
        { status }
      );
    })
  };

  return { logger: fakeLogger };
});

// Silence client logger in tests
jest.mock("@/lib/utils/logger", () => {
  const clientLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };

  // keep errorLog export compatible
  const errorLog = clientLogger.error;

  return { clientLogger, errorLog };
});

// Polyfills for Node test environment
// @ts-ignore
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn()
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  }
}));

// Mock NextAuth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated"
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children
}));

// Mock Firebase
jest.mock("@/lib/firebase/client", () => ({
  auth: {},
  db: {}
}));

jest.mock("@/lib/firebase/admin", () => {
  const createSubcollection = () => ({
    get: jest.fn().mockResolvedValue({
      forEach: jest.fn(),
      empty: true,
      docs: []
    })
  });
  // 👇 ADD THIS BLOCK to quiet specific noisy env warnings in tests
  const originalWarn = console.warn;

  console.warn = (...args) => {
    const first = args[0];

    if (typeof first === "string" && first.startsWith("[env] Missing or invalid environment variables")) {
      // swallow this specific spammy warning in tests
      return;
    }

    originalWarn(...args);
  };

  const createDoc = () => ({
    collection: jest.fn(() => createSubcollection()),
    get: jest.fn().mockResolvedValue({ exists: false, data: jest.fn(), id: "mock-doc" }),
    delete: jest.fn(),
    set: jest.fn(),
    update: jest.fn()
  });

  const createCollection = () => ({
    doc: jest.fn(() => createDoc()),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      empty: true,
      docs: [],
      forEach: jest.fn()
    })
  });

  const db = {
    collection: jest.fn(() => createCollection()),
    batch: jest.fn(() => ({
      delete: jest.fn(),
      set: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined)
    }))
  };

  return {
    getFirebaseAdminDb: jest.fn(() => db),
    getFirebaseAdminAuth: jest.fn(() => ({})),
    getFirebaseAdminApp: jest.fn(() => ({})),
    getAdminCollection: jest.fn(() => createCollection()),
    COLLECTIONS: {
      USERS: "users",
      ACTIVITY_LOGS: "activity_logs",
      SESSIONS: "sessions",
      JOBS: "jobs",
      NOTIFICATIONS: "notifications",
      SAVED_JOBS: "savedJobs",
      REVIEWS: "reviews",
      CHATS: "chats",
      VERIFICATION_TOKENS: "verificationTokens",
      PASSWORD_RESET_TOKENS: "passwordResetTokens",
      SERVICES: "services"
    },
    UsersCollection: jest.fn(() => createCollection()),
    ActivityLogsCollection: jest.fn(() => createCollection()),
    SessionsCollection: jest.fn(() => createCollection()),
    JobsCollection: jest.fn(() => createCollection()),
    NotificationsCollection: jest.fn(() => createCollection()),
    SavedJobsCollection: jest.fn(() => createCollection()),
    ReviewsCollection: jest.fn(() => createCollection()),
    ChatsCollection: jest.fn(() => createCollection()),
    ServicesCollection: jest.fn(() => createCollection())
  };
});

// Global test utilities
global.fetch = jest.fn();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
