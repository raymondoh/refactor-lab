// jest.setup.ts
import "@testing-library/jest-dom";
import "whatwg-fetch";

import { TextEncoder, TextDecoder } from "util";

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  (console.log as any).mockRestore?.();
  (console.error as any).mockRestore?.();
});

global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;
