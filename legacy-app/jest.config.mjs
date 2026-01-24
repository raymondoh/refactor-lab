/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  globals: {
    "ts-jest": {
      tsconfig: "./tsconfig.jest.json"
    }
  },

  // Transform TypeScript and JavaScript files using ts-jest
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "ts-jest"
  },

  // File extensions Jest will handle
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],

  // Setup file for extending Jest (e.g., React Testing Library setup)
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Alias resolution for imports and CSS modules
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^server-only$": "<rootDir>/__mocks__/emptyModule.js" // ✅ moved here
  },

  // Include specific node_modules for transformation (ESM packages)
  transformIgnorePatterns: ["node_modules/(?!lucide-react|next-auth|@auth/core)"]
};

export default config;
