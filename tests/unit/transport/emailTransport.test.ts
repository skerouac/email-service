/**
 * @jest-environment jsdom
 */

import {
  BaseEmailTransport,
  MockEmailTransport,
  MailOptions,
  TransportConfig,
  EmailTransport,
} from "../../../src/transport/emailTransport";

describe("BaseEmailTransport", () => {
  // Create a concrete implementation for testing the abstract class
  class TestEmailTransport extends BaseEmailTransport {
    private mockSendResult = Promise.resolve();
    private mockVerifyResult = Promise.resolve(true);
    private mockCloseResult = Promise.resolve();
    private mockInfo = { type: "test" };

    sendMail(options: MailOptions): Promise<void> {
      return this.mockSendResult;
    }

    verify(): Promise<boolean> {
      return this.mockVerifyResult;
    }

    close(): Promise<void> {
      return this.mockCloseResult;
    }

    getInfo(): { type: string; [key: string]: any } {
      return this.mockInfo;
    }

    // Test helpers
    setMockSendResult(result: Promise<void>) {
      this.mockSendResult = result;
    }

    setMockVerifyResult(result: Promise<boolean>) {
      this.mockVerifyResult = result;
    }

    setMockCloseResult(result: Promise<void>) {
      this.mockCloseResult = result;
    }

    setMockInfo(info: { type: string; [key: string]: any }) {
      this.mockInfo = info;
    }

    getConfig(): TransportConfig {
      return this.config;
    }
  }

  describe("Constructor", () => {
    it("should initialize with default empty config", () => {
      const transport = new TestEmailTransport();
      expect(transport.getConfig()).toEqual({});
    });

    it("should initialize with provided config", () => {
      const config: TransportConfig = {
        retryConfig: {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
          jitter: true,
        },
      };

      const transport = new TestEmailTransport(config);
      expect(transport.getConfig()).toEqual(config);
    });

    it("should handle partial retry config", () => {
      const config: TransportConfig = {
        retryConfig: {
          maxAttempts: 5,
          initialDelay: 500,
          maxDelay: 10000,
          backoffMultiplier: 1.5,
          jitter: false,
        },
      };

      const transport = new TestEmailTransport(config);
      expect(transport.getConfig()).toEqual(config);
    });
  });

  describe("Abstract Methods Implementation", () => {
    let transport: TestEmailTransport;

    beforeEach(() => {
      transport = new TestEmailTransport();
    });

    it("should call sendMail implementation", async () => {
      const mailOptions: MailOptions = {
        from: "test@example.com",
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      };

      await expect(transport.sendMail(mailOptions)).resolves.toBeUndefined();
    });

    it("should call verify implementation", async () => {
      await expect(transport.verify()).resolves.toBe(true);
    });

    it("should call close implementation", async () => {
      await expect(transport.close()).resolves.toBeUndefined();
    });

    it("should call getInfo implementation", () => {
      const info = transport.getInfo();
      expect(info).toEqual({ type: "test" });
    });
  });

  describe("Error Handling", () => {
    let transport: TestEmailTransport;

    beforeEach(() => {
      transport = new TestEmailTransport();
    });

    it("should propagate sendMail errors", async () => {
      const error = new Error("Send failed");
      transport.setMockSendResult(Promise.reject(error));

      const mailOptions: MailOptions = {
        from: "test@example.com",
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      };

      await expect(transport.sendMail(mailOptions)).rejects.toThrow(
        "Send failed"
      );
    });

    it("should propagate verify errors", async () => {
      const error = new Error("Verify failed");
      transport.setMockVerifyResult(Promise.reject(error));

      await expect(transport.verify()).rejects.toThrow("Verify failed");
    });

    it("should propagate close errors", async () => {
      const error = new Error("Close failed");
      transport.setMockCloseResult(Promise.reject(error));

      await expect(transport.close()).rejects.toThrow("Close failed");
    });
  });
});

describe("MockEmailTransport", () => {
  let mockTransport: MockEmailTransport;

  beforeEach(() => {
    mockTransport = new MockEmailTransport();
  });

  describe("Constructor", () => {
    it("should initialize with default config", () => {
      const transport = new MockEmailTransport();
      expect(transport).toBeInstanceOf(BaseEmailTransport);
      expect(transport).toBeInstanceOf(MockEmailTransport);
    });

    it("should initialize with provided config", () => {
      const config: TransportConfig = {
        retryConfig: {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
          jitter: true,
        },
      };

      const transport = new MockEmailTransport(config);
      expect(transport).toBeInstanceOf(MockEmailTransport);
    });
  });

  describe("sendMail", () => {
    it("should store sent email and resolve successfully", async () => {
      const mailOptions: MailOptions = {
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test HTML content</p>",
      };

      await expect(
        mockTransport.sendMail(mailOptions)
      ).resolves.toBeUndefined();

      const sentEmails = mockTransport.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]).toEqual(mailOptions);
    });

    it("should handle multiple recipients as array", async () => {
      const mailOptions: MailOptions = {
        from: "sender@example.com",
        to: ["recipient1@example.com", "recipient2@example.com"],
        cc: ["cc@example.com"],
        bcc: ["bcc@example.com"],
        subject: "Test Subject",
        html: "<p>Test HTML content</p>",
        replyTo: "reply@example.com",
      };

      await mockTransport.sendMail(mailOptions);

      const lastEmail = mockTransport.getLastSentEmail();
      expect(lastEmail).toEqual(mailOptions);
      expect(lastEmail?.to).toEqual([
        "recipient1@example.com",
        "recipient2@example.com",
      ]);
      expect(lastEmail?.cc).toEqual(["cc@example.com"]);
      expect(lastEmail?.bcc).toEqual(["bcc@example.com"]);
      expect(lastEmail?.replyTo).toBe("reply@example.com");
    });

    it("should handle email with attachments", async () => {
      const mailOptions: MailOptions = {
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test with Attachments",
        html: "<p>Email with attachments</p>",
        attachments: [
          {
            fileName: "test.txt",
            content: Buffer.from("test content"),
            contentType: "text/plain",
          },
          {
            fileName: "test2.pdf",
            content: "string content",
            contentType: "application/pdf",
          },
        ],
      };

      await mockTransport.sendMail(mailOptions);

      const lastEmail = mockTransport.getLastSentEmail();
      expect(lastEmail?.attachments).toHaveLength(2);
      expect(lastEmail?.attachments?.[0]).toEqual({
        fileName: "test.txt",
        content: Buffer.from("test content"),
        contentType: "text/plain",
      });
      expect(lastEmail?.attachments?.[1]).toEqual({
        fileName: "test2.pdf",
        content: "string content",
        contentType: "application/pdf",
      });
    });

    it("should create a copy of mail options to prevent mutation", async () => {
      const mailOptions: MailOptions = {
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test HTML content</p>",
      };

      await mockTransport.sendMail(mailOptions);

      // Mutate original object
      mailOptions.subject = "Modified Subject";

      const storedEmail = mockTransport.getLastSentEmail();
      expect(storedEmail?.subject).toBe("Test Subject");
      expect(storedEmail?.subject).not.toBe(mailOptions.subject);
    });

    it("should throw error when configured to fail", async () => {
      mockTransport.setShouldFail(true);

      const mailOptions: MailOptions = {
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test HTML content</p>",
      };

      expect(() => mockTransport.sendMail(mailOptions)).toThrow(
        "Mock transport configured to fail"
      );

      // Email should not be stored when failing
      expect(mockTransport.getSentEmails()).toHaveLength(0);
    });

    it("should handle multiple emails sequentially", async () => {
      const emails: MailOptions[] = [
        {
          from: "sender@example.com",
          to: "recipient1@example.com",
          subject: "Email 1",
          html: "<p>Content 1</p>",
        },
        {
          from: "sender@example.com",
          to: "recipient2@example.com",
          subject: "Email 2",
          html: "<p>Content 2</p>",
        },
        {
          from: "sender@example.com",
          to: "recipient3@example.com",
          subject: "Email 3",
          html: "<p>Content 3</p>",
        },
      ];

      for (const email of emails) {
        await mockTransport.sendMail(email);
      }

      const sentEmails = mockTransport.getSentEmails();
      expect(sentEmails).toHaveLength(3);
      expect(sentEmails[0].subject).toBe("Email 1");
      expect(sentEmails[1].subject).toBe("Email 2");
      expect(sentEmails[2].subject).toBe("Email 3");
    });
  });

  describe("verify", () => {
    it("should return true by default", async () => {
      await expect(mockTransport.verify()).resolves.toBe(true);
    });

    it("should return configured verify result", async () => {
      mockTransport.setVerifyResult(false);
      await expect(mockTransport.verify()).resolves.toBe(false);

      mockTransport.setVerifyResult(true);
      await expect(mockTransport.verify()).resolves.toBe(true);
    });
  });

  describe("close", () => {
    it("should resolve successfully", async () => {
      await expect(mockTransport.close()).resolves.toBeUndefined();
    });
  });

  describe("getInfo", () => {
    it("should return mock transport info with sent count", () => {
      const info = mockTransport.getInfo();
      expect(info).toEqual({
        type: "mock",
        sentCount: 0,
      });
    });

    it("should update sent count after sending emails", async () => {
      const mailOptions: MailOptions = {
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      };

      await mockTransport.sendMail(mailOptions);
      await mockTransport.sendMail(mailOptions);

      const info = mockTransport.getInfo();
      expect(info.sentCount).toBe(2);
    });
  });

  describe("Test Helper Methods", () => {
    beforeEach(async () => {
      // Send some test emails
      await mockTransport.sendMail({
        from: "sender@example.com",
        to: "recipient1@example.com",
        subject: "Email 1",
        html: "<p>Content 1</p>",
      });
      await mockTransport.sendMail({
        from: "sender@example.com",
        to: "recipient2@example.com",
        subject: "Email 2",
        html: "<p>Content 2</p>",
      });
    });

    describe("getSentEmails", () => {
      it("should return copy of all sent emails", () => {
        const sentEmails = mockTransport.getSentEmails();
        expect(sentEmails).toHaveLength(2);
        expect(sentEmails[0].subject).toBe("Email 1");
        expect(sentEmails[1].subject).toBe("Email 2");

        // Should return a copy, not the original array
        sentEmails.push({
          from: "test@example.com",
          to: "test@example.com",
          subject: "Fake",
          html: "Fake",
        });
        expect(mockTransport.getSentEmails()).toHaveLength(2);
      });
    });

    describe("getLastSentEmail", () => {
      it("should return the most recently sent email", () => {
        const lastEmail = mockTransport.getLastSentEmail();
        expect(lastEmail?.subject).toBe("Email 2");
        expect(lastEmail?.to).toBe("recipient2@example.com");
      });

      it("should return undefined when no emails sent", () => {
        const emptyTransport = new MockEmailTransport();
        expect(emptyTransport.getLastSentEmail()).toBeUndefined();
      });
    });

    describe("clearSentEmails", () => {
      it("should remove all sent emails from history", () => {
        expect(mockTransport.getSentEmails()).toHaveLength(2);

        mockTransport.clearSentEmails();

        expect(mockTransport.getSentEmails()).toHaveLength(0);
        expect(mockTransport.getLastSentEmail()).toBeUndefined();
        expect(mockTransport.getInfo().sentCount).toBe(0);
      });
    });

    describe("setShouldFail", () => {
      it("should control failure behavior", async () => {
        const mailOptions: MailOptions = {
          from: "sender@example.com",
          to: "recipient@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        };

        // Should succeed by default
        await expect(
          mockTransport.sendMail(mailOptions)
        ).resolves.toBeUndefined();

        // Should fail when configured to fail
        mockTransport.setShouldFail(true);
        expect(() => mockTransport.sendMail(mailOptions)).toThrow(
          "Mock transport configured to fail"
        );

        // Should succeed again when failure is disabled
        mockTransport.setShouldFail(false);
        await expect(
          mockTransport.sendMail(mailOptions)
        ).resolves.toBeUndefined();
      });
    });

    describe("setVerifyResult", () => {
      it("should control verify result", async () => {
        await expect(mockTransport.verify()).resolves.toBe(true);

        mockTransport.setVerifyResult(false);
        await expect(mockTransport.verify()).resolves.toBe(false);

        mockTransport.setVerifyResult(true);
        await expect(mockTransport.verify()).resolves.toBe(true);
      });
    });

    describe("reset", () => {
      it("should reset all state to initial values", async () => {
        // Set non-default state
        mockTransport.setShouldFail(true);
        mockTransport.setVerifyResult(false);

        expect(mockTransport.getSentEmails()).toHaveLength(2);

        // Reset
        mockTransport.reset();

        // Verify everything is back to defaults
        expect(mockTransport.getSentEmails()).toHaveLength(0);
        expect(mockTransport.getLastSentEmail()).toBeUndefined();
        expect(mockTransport.getInfo().sentCount).toBe(0);
        await expect(mockTransport.verify()).resolves.toBe(true);

        const mailOptions: MailOptions = {
          from: "sender@example.com",
          to: "recipient@example.com",
          subject: "Test after reset",
          html: "<p>Test</p>",
        };

        await expect(
          mockTransport.sendMail(mailOptions)
        ).resolves.toBeUndefined();
      });
    });
  });

  describe("Interface Compliance", () => {
    it("should implement EmailTransport interface", () => {
      const transport: EmailTransport = new MockEmailTransport();
      expect(typeof transport.sendMail).toBe("function");
      expect(typeof transport.verify).toBe("function");
      expect(typeof transport.close).toBe("function");
      expect(typeof transport.getInfo).toBe("function");
    });

    it("should extend BaseEmailTransport", () => {
      expect(mockTransport).toBeInstanceOf(BaseEmailTransport);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty recipient arrays", async () => {
      const mailOptions: MailOptions = {
        from: "sender@example.com",
        to: [],
        cc: [],
        bcc: [],
        subject: "Empty Recipients",
        html: "<p>Test</p>",
      };

      await mockTransport.sendMail(mailOptions);
      const lastEmail = mockTransport.getLastSentEmail();
      expect(lastEmail?.to).toEqual([]);
      expect(lastEmail?.cc).toEqual([]);
      expect(lastEmail?.bcc).toEqual([]);
    });

    it("should handle minimal mail options", async () => {
      const mailOptions: MailOptions = {
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Minimal",
        html: "<p>Minimal content</p>",
      };

      await mockTransport.sendMail(mailOptions);
      const lastEmail = mockTransport.getLastSentEmail();
      expect(lastEmail).toEqual(mailOptions);
      expect(lastEmail?.cc).toBeUndefined();
      expect(lastEmail?.bcc).toBeUndefined();
      expect(lastEmail?.replyTo).toBeUndefined();
      expect(lastEmail?.attachments).toBeUndefined();
    });

    it("should handle empty attachments array", async () => {
      const mailOptions: MailOptions = {
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Empty Attachments",
        html: "<p>No attachments</p>",
        attachments: [],
      };

      await mockTransport.sendMail(mailOptions);
      const lastEmail = mockTransport.getLastSentEmail();
      expect(lastEmail?.attachments).toEqual([]);
    });
  });
});
