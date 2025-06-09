// tests/helpers/transport-helpers.ts

import { SMTPConfig } from "../../src/types";

// Re-export mock functions for convenience
export {
  mockNodemailerReset,
  mockNodemailerGetSentEmails,
  mockNodemailerSimulateError,
  getCurrentMockTransporter,
} from "../__mocks__/nodemailer";

/**
 * Creates a valid SMTP configuration for testing
 */
export function createTestSmtpConfig(
  overrides?: Partial<SMTPConfig>
): SMTPConfig {
  return {
    host: "smtp.test.com",
    port: 587,
    secure: false,
    auth: {
      user: "test@test.com",
      pass: "testpass123",
    },
    tls: {
      rejectUnauthorized: false,
    },
    ...overrides,
  };
}

/**
 * Creates various invalid SMTP configurations for testing validation
 */
export const invalidSmtpConfigs = {
  missingHost: () => {
    const config = createTestSmtpConfig();
    delete (config as any).host;
    return config;
  },

  emptyHost: () => createTestSmtpConfig({ host: "" }),

  invalidPort: () => createTestSmtpConfig({ port: 70000 }),

  zeroPort: () => createTestSmtpConfig({ port: 0 }),

  negativePort: () => createTestSmtpConfig({ port: -1 }),

  missingAuth: () => {
    const config = createTestSmtpConfig();
    delete (config as any).auth;
    return config;
  },

  emptyAuthUser: () =>
    createTestSmtpConfig({
      auth: { user: "", pass: "password" },
    }),

  emptyAuthPass: () =>
    createTestSmtpConfig({
      auth: { user: "user", pass: "" },
    }),
};

/**
 * Mock transporter object for nodemailer
 */
export function createMockTransporter() {
  return {
    sendMail: jest.fn(),
    verify: jest.fn(),
    close: jest.fn(),
  };
}

/**
 * Common SMTP error messages for testing
 */
export const smtpErrors = {
  // Authentication errors
  authFailed: "Invalid login: 535 Authentication failed",
  invalidCredentials: "Invalid username or password",
  loginFailed: "Login failed: user not found",
  passwordIncorrect: "Invalid password provided",

  // Connection errors
  connectionRefused: "connect ECONNREFUSED",
  connectionTimeout: "connect ETIMEDOUT",
  hostNotFound: "getaddrinfo ENOTFOUND smtp.example.com",
  networkTimeout: "Timeout awaiting connection",
  operationTimeout: "Operation timeout after 30 seconds",

  // Send errors
  messageRejected: "Message rejected",
  recipientRejected: "Recipient address rejected",
  quotaExceeded: "Quota exceeded",
  messageTooLarge: "Message size exceeds limit",
};

/**
 * Test email options factory
 */
export function createTestEmailOptions(overrides?: any) {
  return {
    from: "sender@test.com",
    to: "recipient@test.com",
    subject: "Test Email",
    html: "<p>Test content</p>",
    ...overrides,
  };
}

/**
 * Helper to simulate progressive failures before success
 */
export function setupProgressiveFailure(
  mockFn: jest.Mock,
  errors: Error[],
  finalResult: any
) {
  errors.forEach((error) => {
    mockFn.mockRejectedValueOnce(error);
  });
  mockFn.mockResolvedValueOnce(finalResult);
}

/**
 * Helper to assert retry behavior
 */
export function expectRetryBehavior(
  mockFn: jest.Mock,
  expectedCalls: number,
  expectSuccess: boolean = true
) {
  expect(mockFn).toHaveBeenCalledTimes(expectedCalls);

  if (expectSuccess) {
    expect(mockFn).toHaveLastReturnedWith(expect.any(Promise));
  }
}

/**
 * Creates a delay tracker for testing retry delays
 */
export function createDelayTracker() {
  const delays: number[] = [];
  const originalSetTimeout = global.setTimeout;

  const mockSetTimeout = jest.fn((callback: Function, delay?: number) => {
    delays.push(delay || 0);
    callback();
    return {} as NodeJS.Timeout;
  }) as any;

  return {
    install: () => {
      global.setTimeout = mockSetTimeout;
    },
    restore: () => {
      global.setTimeout = originalSetTimeout;
    },
    getDelays: () => delays,
    reset: () => {
      delays.length = 0;
    },
  };
}

/**
 * Creates a test retry config with the new interface
 */
export function createTestRetryConfig(overrides?: any) {
  return {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    ...overrides,
  };
}
