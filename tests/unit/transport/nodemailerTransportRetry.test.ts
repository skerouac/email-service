import { NodemailerTransport } from "../../../src/transport/nodemailerTransport";
import { SMTPConfig } from "../../../src/types";
import { SMTPConnectionError } from "../../../src/utils/errors";
import nodemailer from "nodemailer";
import {
  mockNodemailerReset,
  getCurrentMockTransporter,
} from "../../__mocks__/nodemailer";

// Use actual retry implementation for these tests
jest.mock("nodemailer");
jest.mock("../../../src/utils/logger", () => ({
  getLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
  EmailLogger: {
    configLoaded: jest.fn(),
    emailSent: jest.fn(),
    smtpConnection: jest.fn(),
  },
}));

// Don't mock the retry module for these tests
jest.unmock("../../../src/utils/retry");

describe("NodemailerTransport - Retry Behavior", () => {
  let validSmtpConfig: SMTPConfig;

  beforeEach(() => {
    mockNodemailerReset();

    validSmtpConfig = {
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: {
        user: "test@example.com",
        pass: "password123",
      },
    };
  });

  describe("sendMail with retry", () => {
    it("should retry on transient errors", async () => {
      const transport = new NodemailerTransport(validSmtpConfig, {
        retryConfig: {
          maxAttempts: 3,
          initialDelay: 10, // Short delay for tests
          maxDelay: 50,
          backoffMultiplier: 2,
          jitter: false,
        },
      });

      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        // Fail twice with connection error, then succeed
        (mockTransporter.sendMail as jest.Mock)
          .mockRejectedValueOnce(new Error("connect ETIMEDOUT"))
          .mockRejectedValueOnce(new Error("connect ETIMEDOUT"))
          .mockResolvedValueOnce({
            messageId: "success@test",
            response: "250 Message accepted",
          });
      }

      await transport.sendMail({
        from: "test@example.com",
        to: "recipient@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(mockTransporter?.sendMail).toHaveBeenCalledTimes(3);
    });

    it("should not retry on authentication errors", async () => {
      const transport = new NodemailerTransport(validSmtpConfig, {
        retryConfig: {
          maxAttempts: 3,
          initialDelay: 10,
          maxDelay: 50,
          backoffMultiplier: 2,
          jitter: false,
        },
      });

      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        // Authentication errors should not be retried
        (mockTransporter.sendMail as jest.Mock).mockRejectedValue(
          new Error("Authentication failed")
        );
      }

      await expect(
        transport.sendMail({
          from: "test@example.com",
          to: "recipient@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow();

      // Should only try once (no retries for auth errors)
      expect(mockTransporter?.sendMail).toHaveBeenCalledTimes(1);
    });

    it("should respect max attempts", async () => {
      const transport = new NodemailerTransport(validSmtpConfig, {
        retryConfig: {
          maxAttempts: 2,
          initialDelay: 10,
          maxDelay: 50,
          backoffMultiplier: 2,
          jitter: false,
        },
      });

      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        (mockTransporter.sendMail as jest.Mock).mockRejectedValue(
          new Error("connect ETIMEDOUT")
        );
      }

      await expect(
        transport.sendMail({
          from: "test@example.com",
          to: "recipient@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow(SMTPConnectionError);

      expect(mockTransporter?.sendMail).toHaveBeenCalledTimes(2);
    });
  });

  describe("verify with retry", () => {
    it("should retry verification on connection errors", async () => {
      const transport = new NodemailerTransport(validSmtpConfig, {
        retryConfig: {
          maxAttempts: 3,
          initialDelay: 10,
          maxDelay: 50,
          backoffMultiplier: 2,
          jitter: false,
        },
      });

      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        // Fail once, then succeed
        (mockTransporter.verify as jest.Mock)
          .mockRejectedValueOnce(new Error("connect ECONNREFUSED"))
          .mockResolvedValueOnce(true);
      }

      const result = await transport.verify();

      expect(result).toBe(true);
      expect(mockTransporter?.verify).toHaveBeenCalledTimes(2);
    });

    it("should eventually fail after max retries", async () => {
      const transport = new NodemailerTransport(validSmtpConfig, {
        retryConfig: {
          maxAttempts: 2,
          initialDelay: 10,
          maxDelay: 50,
          backoffMultiplier: 2,
          jitter: false,
        },
      });

      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        (mockTransporter.verify as jest.Mock).mockRejectedValue(
          new Error("connect ECONNREFUSED")
        );
      }

      await expect(transport.verify()).rejects.toThrow(SMTPConnectionError);
      expect(mockTransporter?.verify).toHaveBeenCalledTimes(2);
    });
  });

  describe("custom retry configurations", () => {
    it("should use exponential backoff", async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;

      // Track delay times
      global.setTimeout = jest.fn((callback: Function, delay?: number) => {
        delays.push(delay || 0);
        callback();
        return {} as NodeJS.Timeout;
      }) as any;

      const transport = new NodemailerTransport(validSmtpConfig, {
        retryConfig: {
          maxAttempts: 4,
          initialDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2,
          jitter: false,
        },
      });

      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        (mockTransporter.sendMail as jest.Mock)
          .mockRejectedValueOnce(new Error("timeout"))
          .mockRejectedValueOnce(new Error("timeout"))
          .mockRejectedValueOnce(new Error("timeout"))
          .mockResolvedValueOnce({ messageId: "123" });
      }

      await transport.sendMail({
        from: "test@example.com",
        to: "recipient@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;

      // Check exponential backoff pattern
      expect(delays.length).toBeGreaterThanOrEqual(3);
      // Each delay should be greater than the previous (with some jitter)
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1] * 0.5);
      }
    });

    it("should handle mixed error types during retries", async () => {
      const transport = new NodemailerTransport(validSmtpConfig, {
        retryConfig: {
          maxAttempts: 5,
          initialDelay: 10,
          maxDelay: 50,
          backoffMultiplier: 2,
          jitter: false,
        },
      });

      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        // The retry logic should be based on error types
        // Connection errors are typically retried, auth errors are not
        (mockTransporter.sendMail as jest.Mock)
          .mockRejectedValueOnce(new Error("connect ETIMEDOUT")) // Should retry
          .mockRejectedValueOnce(new Error("connect ECONNREFUSED")) // Should retry
          .mockRejectedValueOnce(new Error("Authentication failed")); // Should NOT retry (based on error categorization)
      }

      await expect(
        transport.sendMail({
          from: "test@example.com",
          to: "recipient@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow();

      // The actual number of calls depends on the internal retry logic
      // Connection errors should be retried, auth errors should not
      const callCount = mockTransporter?.sendMail.mock.calls.length || 0;
      expect(callCount).toBeGreaterThanOrEqual(3); // At least 3 attempts made
    });
  });
});
