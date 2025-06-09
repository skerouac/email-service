// tests/unit/transport/nodemailer-transport-mock-features.test.ts

import { NodemailerTransport } from "../../../src/transport/nodemailerTransport";
import { SMTPConfig } from "../../../src/types";
import nodemailer from "nodemailer";
import {
  mockNodemailerReset,
  mockNodemailerGetSentEmails,
  mockNodemailerSimulateError,
  getCurrentMockTransporter,
  createTestAccount,
  getTestMessageUrl,
} from "../../__mocks__/nodemailer";

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

jest.mock("../../../src/utils/retry", () => ({
  ...jest.requireActual("../../../src/utils/retry"),
  withRetry: async (fn: Function) => fn(),
}));

describe("NodemailerTransport - Mock Features", () => {
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

  describe("Mock-specific features", () => {
    it("should track email details with timestamps and messageIds", async () => {
      const transport = new NodemailerTransport(validSmtpConfig);

      await transport.sendMail({
        from: "sender@test.com",
        to: ["user1@test.com", "user2@test.com"],
        cc: "cc@test.com",
        subject: "Test with details",
        html: "<p>Test content</p>",
        attachments: [
          {
            fileName: "test.txt",
            content: "Hello world",
            contentType: "text/plain",
          },
        ],
      });

      const sentEmails = mockNodemailerGetSentEmails();
      expect(sentEmails).toHaveLength(1);

      const email = sentEmails[0];
      expect(email.messageId).toMatch(/^mock-\d+-[a-z0-9]+@mock\.test$/);
      expect(email.timestamp).toBeDefined();
      expect(new Date(email.timestamp)).toBeInstanceOf(Date);
    });

    it("should clear sent emails between tests", async () => {
      const transport = new NodemailerTransport(validSmtpConfig);

      // Send first email
      await transport.sendMail({
        from: "test@test.com",
        to: "user@test.com",
        subject: "First",
        html: "<p>First</p>",
      });

      expect(mockNodemailerGetSentEmails()).toHaveLength(1);

      // Clear emails
      const mockTransporter = getCurrentMockTransporter();
      mockTransporter?._clearSentEmails();

      expect(mockNodemailerGetSentEmails()).toHaveLength(0);

      // Send another email
      await transport.sendMail({
        from: "test@test.com",
        to: "user@test.com",
        subject: "Second",
        html: "<p>Second</p>",
      });

      expect(mockNodemailerGetSentEmails()).toHaveLength(1);
      expect(mockNodemailerGetSentEmails()[0].subject).toBe("Second");
    });

    it("should get last sent email", async () => {
      const transport = new NodemailerTransport(validSmtpConfig);
      const mockTransporter = getCurrentMockTransporter();

      const emails = [
        { to: "first@test.com", subject: "First" },
        { to: "second@test.com", subject: "Second" },
        { to: "third@test.com", subject: "Third" },
      ];

      for (const email of emails) {
        await transport.sendMail({
          from: "sender@test.com",
          ...email,
          html: "<p>Test</p>",
        });
      }

      const lastEmail = mockTransporter?._getLastSentEmail();
      expect(lastEmail?.subject).toBe("Third");
      expect(lastEmail?.to).toBe("third@test.com");
    });

    it("should simulate different error types", async () => {
      const transport = new NodemailerTransport(validSmtpConfig);

      const errorTypes: Array<"auth" | "connection" | "timeout" | "send"> = [
        "auth",
        "connection",
        "timeout",
        "send",
      ];

      for (const errorType of errorTypes) {
        mockNodemailerReset();
        const newTransport = new NodemailerTransport(validSmtpConfig);

        mockNodemailerSimulateError(errorType);

        await expect(
          newTransport.sendMail({
            from: "test@test.com",
            to: "user@test.com",
            subject: "Test",
            html: "<p>Test</p>",
          })
        ).rejects.toThrow();
      }
    });

    it("should toggle failure state", async () => {
      const transport = new NodemailerTransport(validSmtpConfig);
      const mockTransporter = getCurrentMockTransporter();

      // Initially should work
      await expect(
        transport.sendMail({
          from: "test@test.com",
          to: "user@test.com",
          subject: "Success",
          html: "<p>Test</p>",
        })
      ).resolves.not.toThrow();

      // Enable failure
      mockTransporter?._setShouldFail(true);

      await expect(
        transport.sendMail({
          from: "test@test.com",
          to: "user@test.com",
          subject: "Fail",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow();

      // Disable failure
      mockTransporter?._setShouldFail(false);

      await expect(
        transport.sendMail({
          from: "test@test.com",
          to: "user@test.com",
          subject: "Success again",
          html: "<p>Test</p>",
        })
      ).resolves.not.toThrow();
    });

    it("should toggle verify result", async () => {
      const transport = new NodemailerTransport(validSmtpConfig);
      const mockTransporter = getCurrentMockTransporter();

      // Default should be true
      expect(await transport.verify()).toBe(true);

      // Set to false
      mockTransporter?._setVerifyResult(false);
      expect(await transport.verify()).toBe(false);

      // Set back to true
      mockTransporter?._setVerifyResult(true);
      expect(await transport.verify()).toBe(true);
    });
  });

  describe("Test account features", () => {
    it("should create test account", async () => {
      const account = await createTestAccount();

      expect(account).toEqual({
        user: "mock.test@ethereal.email",
        pass: "mockpassword123",
        smtp: {
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
        },
        imap: {
          host: "imap.ethereal.email",
          port: 993,
          secure: true,
        },
        pop3: {
          host: "pop3.ethereal.email",
          port: 995,
          secure: true,
        },
        web: "https://ethereal.email",
      });

      expect(createTestAccount).toHaveBeenCalled();
    });

    it("should get test message URL", async () => {
      const messageInfo = {
        messageId: "test-123@example.com",
        envelope: { from: "test@test.com", to: ["user@test.com"] },
      };

      const url = getTestMessageUrl(messageInfo);

      expect(url).toBe("https://ethereal.email/message/test-123@example.com");
      expect(getTestMessageUrl).toHaveBeenCalledWith(messageInfo);
    });
  });

  describe("Mock transporter info", () => {
    it("should preserve connection info in mock", async () => {
      const customConfig: SMTPConfig = {
        host: "custom.smtp.com",
        port: 465,
        secure: true,
        auth: {
          user: "custom@user.com",
          pass: "custompass",
        },
      };

      const transport = new NodemailerTransport(customConfig);
      const info = transport.getInfo();

      expect(info).toEqual({
        type: "nodemailer",
        host: "custom.smtp.com",
        port: 465,
        secure: true,
        user: "custom@user.com",
      });
    });
  });

  describe("Complex scenarios", () => {
    it("should handle batch email sending with tracking", async () => {
      const transport = new NodemailerTransport(validSmtpConfig);
      const recipients = Array.from(
        { length: 10 },
        (_, i) => `user${i}@test.com`
      );

      // Send emails in parallel
      await Promise.all(
        recipients.map((to, index) =>
          transport.sendMail({
            from: "batch@test.com",
            to,
            subject: `Batch email ${index}`,
            html: `<p>Email ${index}</p>`,
          })
        )
      );

      const sentEmails = mockNodemailerGetSentEmails();
      expect(sentEmails).toHaveLength(10);

      // Verify all emails have unique messageIds
      const messageIds = sentEmails.map((e) => e.messageId);
      const uniqueMessageIds = new Set(messageIds);
      expect(uniqueMessageIds.size).toBe(10);

      // Verify timestamps are in order (allowing for parallel execution)
      const timestamps = sentEmails.map((e) => new Date(e.timestamp).getTime());
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      expect(maxTime - minTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should simulate intermittent failures", async () => {
      const transport = new NodemailerTransport(validSmtpConfig);
      const mockTransporter = getCurrentMockTransporter();

      let callCount = 0;
      if (mockTransporter) {
        (mockTransporter.sendMail as jest.Mock).mockImplementation(
          async (options: any) => {
            callCount++;
            if (callCount % 3 === 0) {
              throw new Error("Intermittent failure");
            }
            return {
              messageId: `success-${callCount}@test.com`,
              response: "250 OK",
            };
          }
        );
      }

      const results: string[] = [];
      for (let i = 0; i < 5; i++) {
        try {
          await transport.sendMail({
            from: "test@test.com",
            to: `user${i}@test.com`,
            subject: `Test ${i}`,
            html: "<p>Test</p>",
          });
          results.push("success");
        } catch (error) {
          results.push("failure");
        }
      }

      expect(results).toEqual([
        "success",
        "success",
        "failure",
        "success",
        "success",
      ]);
    });
  });
});
