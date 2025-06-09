import { NodemailerTransport } from "../../../src/transport/nodemailerTransport";
import { SMTPConfig, EmailOptions } from "../../../src/types";
import {
  SMTPConfigurationError,
  SMTPConnectionError,
  SMTPAuthenticationError,
  EmailSendError,
} from "../../../src/utils/errors";
import { RetryConfigs } from "../../../src/utils/retry";
import nodemailer from "nodemailer";
import {
  mockNodemailerReset,
  mockNodemailerGetSentEmails,
  mockNodemailerSimulateError,
  getCurrentMockTransporter,
} from "../../__mocks__/nodemailer";

// Mock dependencies
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

// Mock retry wrapper to execute immediately without retries in tests
jest.mock("../../../src/utils/retry", () => ({
  ...jest.requireActual("../../../src/utils/retry"),
  withRetry: async (fn: Function) => fn(),
}));

describe("NodemailerTransport", () => {
  let validSmtpConfig: SMTPConfig;

  beforeEach(() => {
    // Reset nodemailer mock
    mockNodemailerReset();

    // Valid SMTP config
    validSmtpConfig = {
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: {
        user: "test@example.com",
        pass: "password123",
      },
      tls: {
        rejectUnauthorized: false,
      },
    };
  });

  describe("constructor", () => {
    it("should create transport with valid config", () => {
      const transport = new NodemailerTransport(validSmtpConfig);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: validSmtpConfig.host,
        port: validSmtpConfig.port,
        secure: validSmtpConfig.secure,
        auth: validSmtpConfig.auth,
        tls: validSmtpConfig.tls,
      });

      expect(transport).toBeInstanceOf(NodemailerTransport);
    });

    it("should throw error for missing host", () => {
      const invalidConfig = { ...validSmtpConfig, host: "" };

      expect(() => new NodemailerTransport(invalidConfig)).toThrow(
        SMTPConfigurationError
      );
      expect(() => new NodemailerTransport(invalidConfig)).toThrow(
        "SMTP host is required"
      );
    });

    it("should throw error for invalid port", () => {
      const testCases = [
        { port: 0, desc: "port too low" },
        { port: -1, desc: "negative port" },
        { port: 65536, desc: "port too high" },
        { port: undefined as any, desc: "undefined port" },
      ];

      testCases.forEach(({ port, desc }) => {
        const invalidConfig = { ...validSmtpConfig, port };

        expect(() => new NodemailerTransport(invalidConfig)).toThrow(
          SMTPConfigurationError
        );
        expect(() => new NodemailerTransport(invalidConfig)).toThrow(
          "Valid SMTP port (1-65535) is required"
        );
      });
    });

    it("should throw error for missing auth credentials", () => {
      const testCases = [
        { auth: { user: "", pass: "password" }, desc: "empty user" },
        { auth: { user: "user", pass: "" }, desc: "empty password" },
        { auth: undefined as any, desc: "undefined auth" },
      ];

      testCases.forEach(({ auth, desc }) => {
        const invalidConfig = { ...validSmtpConfig, auth };

        expect(() => new NodemailerTransport(invalidConfig)).toThrow(
          SMTPConfigurationError
        );
        expect(() => new NodemailerTransport(invalidConfig)).toThrow(
          "SMTP authentication credentials are required"
        );
      });
    });

    it("should use default values for optional config", () => {
      const minimalConfig: SMTPConfig = {
        host: "smtp.example.com",
        port: 587,
        auth: {
          user: "test@example.com",
          pass: "password123",
        },
      };

      const transport = new NodemailerTransport(minimalConfig);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: minimalConfig.host,
        port: minimalConfig.port,
        secure: false,
        auth: minimalConfig.auth,
        tls: { rejectUnauthorized: false },
      });
    });

    it("should accept custom transport config", () => {
      const customRetryConfig = {
        maxAttempts: 5,
        initialDelay: 2000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true,
      };

      const transport = new NodemailerTransport(validSmtpConfig, {
        retryConfig: customRetryConfig,
      });

      expect(transport).toBeInstanceOf(NodemailerTransport);
    });
  });

  describe("sendMail", () => {
    let transport: NodemailerTransport;
    let mailOptions: EmailOptions;

    beforeEach(() => {
      transport = new NodemailerTransport(validSmtpConfig);
      mailOptions = {
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test Email",
      };
    });

    it("should send email successfully", async () => {
      await transport.sendMail({
        ...mailOptions,
        html: "<p>Test email content</p>",
      });

      const sentEmails = mockNodemailerGetSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]).toMatchObject({
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: "<p>Test email content</p>",
      });
      expect(sentEmails[0].messageId).toBeDefined();
    });

    it("should handle multiple recipients", async () => {
      const multipleRecipients = ["user1@example.com", "user2@example.com"];

      await transport.sendMail({
        ...mailOptions,
        to: multipleRecipients,
        html: "<p>Test</p>",
      });

      const sentEmails = mockNodemailerGetSentEmails();
      expect(sentEmails[0].to).toEqual(multipleRecipients);
    });

    it("should handle cc and bcc recipients", async () => {
      await transport.sendMail({
        ...mailOptions,
        cc: "cc@example.com",
        bcc: ["bcc1@example.com", "bcc2@example.com"],
        html: "<p>Test</p>",
      });

      const sentEmails = mockNodemailerGetSentEmails();
      expect(sentEmails[0]).toMatchObject({
        cc: "cc@example.com",
        bcc: ["bcc1@example.com", "bcc2@example.com"],
      });
    });

    it("should handle attachments", async () => {
      const attachments = [
        {
          fileName: "test.pdf",
          content: Buffer.from("test content"),
          contentType: "application/pdf",
        },
      ];

      await transport.sendMail({
        ...mailOptions,
        html: "<p>Test</p>",
        attachments,
      });

      const sentEmails = mockNodemailerGetSentEmails();
      expect(sentEmails[0].attachments).toEqual(attachments);
    });

    it("should handle replyTo", async () => {
      await transport.sendMail({
        ...mailOptions,
        html: "<p>Test</p>",
        replyTo: "reply@example.com",
      });

      const sentEmails = mockNodemailerGetSentEmails();
      expect(sentEmails[0].replyTo).toBe("reply@example.com");
    });

    it("should categorize authentication errors", async () => {
      mockNodemailerSimulateError("auth");

      await expect(
        transport.sendMail({
          ...mailOptions,
          html: "<p>Test</p>",
        })
      ).rejects.toThrow(SMTPAuthenticationError);
    });

    it("should categorize connection errors", async () => {
      mockNodemailerSimulateError("connection");

      await expect(
        transport.sendMail({
          ...mailOptions,
          html: "<p>Test</p>",
        })
      ).rejects.toThrow(SMTPConnectionError);
    });

    it("should categorize timeout errors", async () => {
      mockNodemailerSimulateError("timeout");

      await expect(
        transport.sendMail({
          ...mailOptions,
          html: "<p>Test</p>",
        })
      ).rejects.toThrow(SMTPConnectionError);
    });

    it("should categorize generic send errors", async () => {
      mockNodemailerSimulateError("send");

      await expect(
        transport.sendMail({
          ...mailOptions,
          html: "<p>Test</p>",
        })
      ).rejects.toThrow(EmailSendError);
    });

    it("should handle non-Error objects", async () => {
      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        (mockTransporter.sendMail as jest.Mock).mockRejectedValueOnce(
          "String error"
        );
      }

      await expect(
        transport.sendMail({
          ...mailOptions,
          html: "<p>Test</p>",
        })
      ).rejects.toThrow(EmailSendError);
    });
  });

  describe("verify", () => {
    let transport: NodemailerTransport;

    beforeEach(() => {
      transport = new NodemailerTransport(validSmtpConfig);
    });

    it("should verify connection successfully", async () => {
      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        mockTransporter._setVerifyResult(true);
      }

      const result = await transport.verify();

      expect(result).toBe(true);
      expect(mockTransporter?.verify).toHaveBeenCalled();
    });

    it("should return false for failed verification", async () => {
      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        mockTransporter._setVerifyResult(false);
      }

      const result = await transport.verify();

      expect(result).toBe(false);
    });

    it("should categorize authentication errors during verify", async () => {
      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        (mockTransporter.verify as jest.Mock).mockRejectedValueOnce(
          new Error("Authentication failed")
        );
      }

      await expect(transport.verify()).rejects.toThrow(SMTPAuthenticationError);
    });

    it("should categorize connection errors during verify", async () => {
      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        (mockTransporter.verify as jest.Mock).mockRejectedValueOnce(
          new Error("connect ETIMEDOUT")
        );
      }

      await expect(transport.verify()).rejects.toThrow(SMTPConnectionError);
    });
  });

  describe("close", () => {
    let transport: NodemailerTransport;

    beforeEach(() => {
      transport = new NodemailerTransport(validSmtpConfig);
    });

    it("should close connection successfully", async () => {
      const mockTransporter = getCurrentMockTransporter();

      await transport.close();

      expect(mockTransporter?.close).toHaveBeenCalled();
    });

    it("should not throw on close errors", async () => {
      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        (mockTransporter.close as jest.Mock).mockImplementation(() => {
          throw new Error("Close failed");
        });
      }

      await expect(transport.close()).resolves.not.toThrow();
    });
  });

  describe("getInfo", () => {
    it("should return transport information", () => {
      const transport = new NodemailerTransport(validSmtpConfig);
      const info = transport.getInfo();

      expect(info).toEqual({
        type: "nodemailer",
        host: validSmtpConfig.host,
        port: validSmtpConfig.port,
        secure: validSmtpConfig.secure || false,
        user: validSmtpConfig.auth.user,
      });
    });

    it("should return secure as true when specified", () => {
      const secureConfig = { ...validSmtpConfig, secure: true };
      const transport = new NodemailerTransport(secureConfig);
      const info = transport.getInfo();

      expect(info.secure).toBe(true);
    });
  });

  describe("error handling edge cases", () => {
    let transport: NodemailerTransport;

    beforeEach(() => {
      transport = new NodemailerTransport(validSmtpConfig);
    });

    it("should handle password-related auth errors", async () => {
      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        (mockTransporter.sendMail as jest.Mock).mockRejectedValueOnce(
          new Error("Invalid password provided")
        );
      }

      await expect(
        transport.sendMail({
          from: "test@example.com",
          to: "recipient@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow(SMTPAuthenticationError);
    });

    it("should handle login-related auth errors", async () => {
      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        (mockTransporter.sendMail as jest.Mock).mockRejectedValueOnce(
          new Error("Login failed: user not found")
        );
      }

      await expect(
        transport.sendMail({
          from: "test@example.com",
          to: "recipient@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow(SMTPAuthenticationError);
    });

    it("should handle timeout errors", async () => {
      const mockTransporter = getCurrentMockTransporter();
      if (mockTransporter) {
        (mockTransporter.verify as jest.Mock).mockRejectedValueOnce(
          new Error("Operation timeout after 30 seconds")
        );
      }

      await expect(transport.verify()).rejects.toThrow(SMTPConnectionError);
    });

    it("should track multiple sent emails", async () => {
      const emailOptions = [
        {
          from: "test@example.com",
          to: "user1@example.com",
          subject: "Email 1",
          html: "<p>1</p>",
        },
        {
          from: "test@example.com",
          to: "user2@example.com",
          subject: "Email 2",
          html: "<p>2</p>",
        },
        {
          from: "test@example.com",
          to: "user3@example.com",
          subject: "Email 3",
          html: "<p>3</p>",
        },
      ];

      for (const options of emailOptions) {
        await transport.sendMail(options);
      }

      const sentEmails = mockNodemailerGetSentEmails();
      expect(sentEmails).toHaveLength(3);
      expect(sentEmails[0].to).toBe("user1@example.com");
      expect(sentEmails[1].to).toBe("user2@example.com");
      expect(sentEmails[2].to).toBe("user3@example.com");
    });
  });
});
