import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import {
  EmailService,
  createEmailServiceWithTransport,
  EmailServiceConfig,
} from "../../src/emailService";
import { MockEmailTransport } from "../../src/transport/emailTransport";
import { SMTPConfig } from "../../src/types";
import { expect, jest } from "@jest/globals";

// Extended render function for email templates
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, options);

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { customRender as render };

// Email service testing utilities
export class TestEmailService {
  private mockTransport: MockEmailTransport;
  private emailService: EmailService;

  constructor(config?: EmailServiceConfig) {
    this.mockTransport = new MockEmailTransport();
    this.emailService = createEmailServiceWithTransport(this.mockTransport, {
      defaultFrom: "test@example.com",
      autoInitializeTemplates: false,
      ...config,
    });
  }

  // Get the email service instance
  getService(): EmailService {
    return this.emailService;
  }

  // Get the mock transport for assertions
  getTransport(): MockEmailTransport {
    return this.mockTransport;
  }

  // Helper methods for common assertions
  getSentEmails() {
    return this.mockTransport.getSentEmails();
  }

  getLastSentEmail() {
    return this.mockTransport.getLastSentEmail();
  }

  getSentEmailCount(): number {
    return this.mockTransport.getSentEmails().length;
  }

  // Reset for clean test state
  reset(): void {
    this.mockTransport.reset();
  }

  // Configure transport behavior
  setShouldFail(shouldFail: boolean): void {
    this.mockTransport.setShouldFail(shouldFail);
  }

  setVerifyResult(result: boolean): void {
    this.mockTransport.setVerifyResult(result);
  }

  // Assertion helpers
  expectEmailSent(expectedCount: number = 1): void {
    expect(this.getSentEmailCount()).toBe(expectedCount);
  }

  expectEmailSentTo(email: string): void {
    const sentEmails = this.getSentEmails();
    const emailSent = sentEmails.some((sentEmail) => {
      const recipients = Array.isArray(sentEmail.to)
        ? sentEmail.to
        : [sentEmail.to];
      return recipients.includes(email);
    });
    expect(emailSent).toBe(true);
  }

  expectEmailWithSubject(subject: string): void {
    const sentEmails = this.getSentEmails();
    const emailFound = sentEmails.some((email) => email.subject === subject);
    expect(emailFound).toBe(true);
  }

  expectEmailContainsText(text: string): void {
    const lastEmail = this.getLastSentEmail();
    expect(lastEmail).toBeDefined();
    expect(lastEmail!.html).toContain(text);
  }
}

// Factory function for creating test email service
export const createTestEmailService = (
  config?: EmailServiceConfig
): TestEmailService => {
  return new TestEmailService(config);
};

// Mock data generators
export const generateValidSMTPConfig = (
  overrides?: Partial<SMTPConfig>
): SMTPConfig => ({
  host: "smtp.test.com",
  port: 587,
  secure: false,
  auth: {
    user: "testuser",
    pass: "testpass123",
  },
  tls: {
    rejectUnauthorized: false,
  },
  ...overrides,
});

export const generateInvalidSMTPConfig = (
  type: "missing-host" | "invalid-port" | "missing-auth" = "missing-host"
): Partial<SMTPConfig> => {
  switch (type) {
    case "missing-host":
      return {
        port: 587,
        auth: { user: "test", pass: "pass" },
      };
    case "invalid-port":
      return {
        host: "smtp.test.com",
        port: 99999,
        auth: { user: "test", pass: "pass" },
      };
    case "missing-auth":
      return {
        host: "smtp.test.com",
        port: 587,
      };
    default:
      return {};
  }
};

export const generateValidEmailOptions = (overrides?: any) => ({
  from: "sender@test.com",
  to: "recipient@test.com",
  subject: "Test Email",
  ...overrides,
});

export const generateTemplateEmailOptions = (overrides?: any) => ({
  from: "sender@test.com",
  to: "recipient@test.com",
  templateName: "welcome",
  templateProps: {
    name: "John Doe",
    email: "john@test.com",
    companyName: "Test Company",
  },
  ...overrides,
});

// Test data for templates
export const getValidWelcomeProps = (overrides?: any) => ({
  name: "John Doe",
  email: "john@example.com",
  actionUrl: "https://app.example.com/welcome",
  actionText: "Get Started",
  companyName: "Test Company",
  companyUrl: "https://test-company.com",
  ...overrides,
});

export const getValidNotificationProps = (overrides?: any) => ({
  title: "Important Notification",
  message: "This is a test notification message.",
  actionUrl: "https://app.example.com/action",
  actionText: "Take Action",
  priority: "normal" as const,
  companyName: "Test Company",
  companyUrl: "https://test-company.com",
  ...overrides,
});

// Async test helpers
export const waitForEmailSending = async (
  testService: TestEmailService,
  expectedCount: number = 1
): Promise<void> => {
  return new Promise((resolve) => {
    const checkEmails = () => {
      if (testService.getSentEmailCount() >= expectedCount) {
        resolve();
      } else {
        setTimeout(checkEmails, 10);
      }
    };
    checkEmails();
  });
};

// Error simulation helpers
export const simulateNetworkError = (): Error => {
  const error = new Error("Network error occurred");
  (error as any).code = "ENOTFOUND";
  return error;
};

export const simulateAuthError = (): Error => {
  const error = new Error("Authentication failed");
  (error as any).code = "EAUTH";
  return error;
};

export const simulateTimeoutError = (): Error => {
  const error = new Error("Connection timeout");
  (error as any).code = "ETIMEDOUT";
  return error;
};

// Template testing helpers
export const expectTemplateToRender = async (
  Component: React.ComponentType<any>,
  props: any
): Promise<string> => {
  const { container } = render(React.createElement(Component, props));
  const html = container.innerHTML;

  // Basic checks that the template rendered
  expect(html).toBeTruthy();
  expect(html.length).toBeGreaterThan(0);

  return html;
};

export const expectTemplateToContainText = async (
  Component: React.ComponentType<any>,
  props: any,
  expectedText: string
): Promise<void> => {
  const html = await expectTemplateToRender(Component, props);
  expect(html).toContain(expectedText);
};

// Validation helpers
export const expectValidationError = (
  fn: () => void,
  expectedMessage?: string
): void => {
  expect(fn).toThrow();
  if (expectedMessage) {
    expect(fn).toThrow(expectedMessage);
  }
};

export const expectValidationSuccess = (fn: () => void): void => {
  expect(fn).not.toThrow();
};

// Time-related test helpers
export const mockCurrentTime = (timestamp: number): any => {
  return jest.spyOn(Date, "now").mockReturnValue(timestamp);
};

export const restoreTime = (spy: any): void => {
  spy.mockRestore();
};
