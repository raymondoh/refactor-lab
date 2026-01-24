// src/firebase/client/firebase-client-init.test.ts

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => "mockApp"),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => "mockApp")
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => "mockAuth"),
  GoogleAuthProvider: jest.fn(() => "mockProvider")
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => "mockFirestore")
}));

describe("firebase-client-init", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      NEXT_PUBLIC_FIREBASE_API_KEY: "key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "domain",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "project",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "bucket",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "sender",
      NEXT_PUBLIC_FIREBASE_APP_ID: "appId"
    };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should initialize Firebase if no apps exist", () => {
    const { initializeApp } = require("firebase/app");
    const { auth, db } = require("./firebase-client-init");

    expect(initializeApp).toHaveBeenCalled();
    expect(auth).toBe("mockAuth");
    expect(db).toBe("mockFirestore");
  });

  it("should throw if required env vars are missing", () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "";

    expect(() => {
      require("./firebase-client-init");
    }).toThrow(/Missing Firebase environment variables/);
  });
});
