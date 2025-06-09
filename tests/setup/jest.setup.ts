import "@testing-library/jest-dom";
import { jest, beforeAll, afterAll, afterEach, expect } from "@jest/globals";

// Reference our type declarations
/// <reference path="./jest-dom.d.ts" />

// Global test timeout (useful for async operations)
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests unless explicitly needed
const originalConsole = global.console;
beforeAll(() => {
  global.console = {
    ...originalConsole,
    // Filter out specific React warnings about HTML structure in tests
    error: jest.fn((message, ...args) => {
      // Filter out React warnings about HTML structure
      if (
        typeof message === "string" &&
        (message.includes("In HTML, <html> cannot be a child of <div>") ||
          message.includes("You are mounting a new html component") ||
          message.includes("You are mounting a new head component") ||
          message.includes("You are mounting a new body component") ||
          message.includes("Warning: ReactDOM.render is no longer supported"))
      ) {
        return; // Skip these warnings
      }
      originalConsole.error(message, ...args);
    }),
    warn: originalConsole.warn,
    // Mock info, log, debug to reduce test output noise
    info: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
  };
});

afterAll(() => {
  global.console = originalConsole;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock environment variables that might be needed
process.env.NODE_ENV = "test";

// Custom Jest matchers for email testing
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },
  toContainEmailHeaders(received: string) {
    const hasSubject =
      received.includes("<title>") || received.includes("subject");
    const hasHtml = received.includes("<html>") && received.includes("</html>");
    const hasBody = received.includes("<body>") || received.includes("<div");
    const pass = hasSubject && hasHtml && hasBody;
    if (pass) {
      return {
        message: () => `expected ${received} not to contain email headers`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to contain proper email headers (title, html, body)`,
        pass: false,
      };
    }
  },
});

// Setup for React Email testing
// Mock performance API if not available
if (typeof global.performance === "undefined") {
  (global as any).performance = {
    now: () => Date.now(),
  };
}

// Mock TextEncoder/TextDecoder for Node.js compatibility
if (typeof global.TextEncoder === "undefined") {
  const util = require("util");
  (global as any).TextEncoder = util.TextEncoder;
  (global as any).TextDecoder = util.TextDecoder;
}
