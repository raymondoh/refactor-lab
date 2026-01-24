// jest.setup.js

// --- Environment Variables (Required for all tests) ---
// Note: Vercel reads these directly from its configuration dashboard for the build environment.
// Defining them here ensures they are available during local 'npm run test'.
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.APP_MODE = "mock";
process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.STRIPE_SUCCESS_URL = "http://localhost:3000/success";
process.env.STRIPE_CANCEL_URL = "http://localhost:3000/cancel";
process.env.NEXT_PUBLIC_ALGOLIA_APP_ID = "test_app_id";
process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY = "test_search_key";
process.env.ALGOLIA_ADMIN_API_KEY = "test_admin_key";
process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test_recaptcha_site_key";
process.env.RECAPTCHA_SECRET_KEY = "test_recaptcha_secret";
process.env.ALGOLIA_APPID = "test_algolia_app_id";

// --- FIX: Mocking Web API Globals for Node/Jest environment ---
// These globals are required for Next.js App Router API routes (NextRequest, NextResponse).

// Use Node's built-in utility module for TextEncoder/Decoder
const util = require("util");

// 1. Mock Request, Response, and Headers
// Checking for existence prevents Jest/JSDOM conflicts
if (typeof global.Request === "undefined") {
  global.Request = class MockRequest {};
}
if (typeof global.Response === "undefined") {
  global.Response = class MockResponse {};
}
if (typeof global.Headers === "undefined") {
  global.Headers = class MockHeaders extends Map {};
}

// 2. Mock fetch (Required for Stripe webhook and other API calls)
// NOTE: Must use clean JS syntax (no 'as any')
if (typeof global.fetch === "undefined") {
  global.fetch = async () => ({
    ok: true,
    json: async () => ({}),
    text: async () => ""
  });
}

// 3. Mock Text Encoding APIs (Required by Next.js/Node Streams)
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = util.TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = util.TextDecoder;
}

// 4. Mock URL APIs (Required by Next.js URL parsing utilities)
if (typeof global.URL === "undefined") {
  global.URL = require("url").URL;
}
if (typeof global.URLSearchParams === "undefined") {
  global.URLSearchParams = require("url").URLSearchParams;
}
