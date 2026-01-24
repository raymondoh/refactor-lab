// jest.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./"
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Point to the single setup file containing all env vars and globals
  setupFiles: ["<rootDir>/jest.setup.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.after-env.js"],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  // FIX: Added next-auth and @auth to the ignore patterns so they get transformed
  transformIgnorePatterns: ["node_modules/(?!((jose|jwks-rsa|next-auth|@auth)(/|$)))"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/layout.tsx",
    "!src/app/globals.css",
    "!src/lib/firebase/admin.ts"
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};

module.exports = createJestConfig(customJestConfig);
