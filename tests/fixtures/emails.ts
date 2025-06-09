import {
  EmailOptions,
  TemplateEmailOptions,
  CustomEmailOptions,
} from "../../src/types";

// Valid email addresses for testing
export const validEmails = {
  single: "test@example.com",
  user: "user@test.com",
  admin: "admin@company.com",
  support: "support@help.com",
  noreply: "noreply@service.com",
  international: "teste@empresa.com.br",
  subdomain: "user@mail.test.com",
  withPlus: "user+tag@example.com",
  withDashes: "test-user@my-company.com",
  longDomain: "user@very-long-domain-name.example.com",
};

// Invalid email addresses for testing validation
export const invalidEmails = {
  missing: "",
  noAt: "invalid-email",
  noTld: "test@domain",
  doubleDot: "test..user@example.com",
  startingDot: ".test@example.com",
  endingDot: "test.@example.com",
  missingLocal: "@example.com",
  missingDomain: "test@",
  specialChars: "test@domain.c#m",
  spaces: "test user@example.com",
  tooLong: `${"a".repeat(250)}@example.com`,
  localTooLong: `${"a".repeat(70)}@example.com`,
};

// Arrays of recipients for testing multiple recipients
export const recipientArrays = {
  single: [validEmails.single],
  multiple: [validEmails.user, validEmails.admin, validEmails.support],
  many: Object.values(validEmails),
  mixed: [validEmails.user, validEmails.admin],
  withInvalid: [validEmails.user, invalidEmails.noAt, validEmails.admin],
};

// Basic email options for testing
export const basicEmailOptions: EmailOptions = {
  from: validEmails.noreply,
  to: validEmails.user,
  subject: "Test Email Subject",
};

// Email options with all fields
export const completeEmailOptions: EmailOptions = {
  from: validEmails.noreply,
  to: [validEmails.user, validEmails.admin],
  cc: validEmails.support,
  bcc: validEmails.noreply,
  subject: "Complete Test Email with All Fields",
  replyTo: validEmails.support,
  attachments: [
    {
      fileName: "test-document.pdf",
      content: Buffer.from("Mock PDF content"),
      contentType: "application/pdf",
    },
    {
      fileName: "test-image.jpg",
      content: "Mock image content as string",
      contentType: "image/jpeg",
    },
  ],
};

// Template email options for testing
export const templateEmailOptions: TemplateEmailOptions = {
  from: validEmails.noreply,
  to: validEmails.user,
  templateName: "welcome",
  templateProps: {
    name: "John Doe",
    email: validEmails.user,
    companyName: "Test Company",
  },
};

// Template email with custom subject
export const templateEmailWithSubject: TemplateEmailOptions = {
  ...templateEmailOptions,
  subject: "Custom Welcome Subject",
};

// Template email for notification
export const notificationEmailOptions: TemplateEmailOptions = {
  from: validEmails.noreply,
  to: validEmails.user,
  templateName: "notification",
  templateProps: {
    title: "Important System Notification",
    message: "Your account has been updated successfully.",
    priority: "high" as const,
    actionUrl: "https://app.example.com/notifications",
    actionText: "View Details",
    companyName: "Test Company",
  },
};

// Custom email options for testing
export const customEmailOptions: CustomEmailOptions = {
  from: validEmails.noreply,
  to: validEmails.user,
  component: () => null, // Will be replaced in actual tests
  props: {
    title: "Custom Email Test",
    content: "This is a custom email component test.",
  },
  subject: "Custom Component Email",
};

// Email options for testing validation errors
export const invalidEmailOptions = {
  missingFrom: {
    to: validEmails.user,
    subject: "Test Subject",
  },
  missingTo: {
    from: validEmails.noreply,
    subject: "Test Subject",
  },
  missingSubject: {
    from: validEmails.noreply,
    to: validEmails.user,
  },
  invalidFromEmail: {
    from: invalidEmails.noAt,
    to: validEmails.user,
    subject: "Test Subject",
  },
  invalidToEmail: {
    from: validEmails.noreply,
    to: invalidEmails.missingDomain,
    subject: "Test Subject",
  },
  invalidCcEmail: {
    from: validEmails.noreply,
    to: validEmails.user,
    cc: invalidEmails.doubleDot,
    subject: "Test Subject",
  },
  emptyRecipientArray: {
    from: validEmails.noreply,
    to: [],
    subject: "Test Subject",
  },
};

// Template email validation errors
export const invalidTemplateEmailOptions = {
  missingTemplateName: {
    from: validEmails.noreply,
    to: validEmails.user,
    templateProps: {},
  },
  missingTemplateProps: {
    from: validEmails.noreply,
    to: validEmails.user,
    templateName: "welcome",
  },
  invalidTemplateProps: {
    from: validEmails.noreply,
    to: validEmails.user,
    templateName: "welcome",
    templateProps: null,
  },
};

// Custom email validation errors
export const invalidCustomEmailOptions = {
  missingComponent: {
    from: validEmails.noreply,
    to: validEmails.user,
    props: {},
    subject: "Test Subject",
  },
  missingSubject: {
    from: validEmails.noreply,
    to: validEmails.user,
    component: () => null,
    props: {},
  },
  missingProps: {
    from: validEmails.noreply,
    to: validEmails.user,
    component: () => null,
    subject: "Test Subject",
  },
};

// Large attachment for testing size limits
export const largeAttachment = {
  fileName: "large-file.pdf",
  content: Buffer.alloc(30 * 1024 * 1024), // 30MB
  contentType: "application/pdf",
};

// Multiple attachments for testing
export const multipleAttachments = [
  {
    fileName: "document1.pdf",
    content: Buffer.from("PDF content 1"),
    contentType: "application/pdf",
  },
  {
    fileName: "document2.docx",
    content: Buffer.from("Word document content"),
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    fileName: "image.png",
    content: Buffer.from("PNG image content"),
    contentType: "image/png",
  },
  {
    fileName: "text-file.txt",
    content: "Plain text content",
    contentType: "text/plain",
  },
];

// Email options with large attachments
export const emailWithLargeAttachment: EmailOptions = {
  ...basicEmailOptions,
  subject: "Email with Large Attachment",
  attachments: [largeAttachment],
};

// Email options with multiple attachments
export const emailWithMultipleAttachments: EmailOptions = {
  ...basicEmailOptions,
  subject: "Email with Multiple Attachments",
  attachments: multipleAttachments,
};

// Stress test data
export const stressTestData = {
  manyRecipients: Array.from({ length: 50 }, (_, i) => `user${i}@test.com`),
  longSubject:
    "This is a very long email subject that might cause issues with some email providers due to length limitations and should be tested thoroughly",
  veryLongSubject: "A".repeat(998), // Near the RFC limit
  unicodeSubject:
    "🚀 Email with emojis and unicode characters: Тест, 测试, العربية",
  complexHtmlContent: `
    <html>
      <head><title>Complex Email</title></head>
      <body>
        <div style="color: red;">
          <h1>Complex HTML Email</h1>
          <p>This email contains <strong>bold</strong> and <em>italic</em> text.</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
          <a href="https://example.com">Link to website</a>
        </div>
      </body>
    </html>
  `,
};

// Helper function to create email options with overrides
export const createEmailOptions = (
  overrides: Partial<EmailOptions> = {}
): EmailOptions => ({
  ...basicEmailOptions,
  ...overrides,
});

// Helper function to create template email options with overrides
export const createTemplateEmailOptions = (
  overrides: Partial<TemplateEmailOptions> = {}
): TemplateEmailOptions => ({
  ...templateEmailOptions,
  ...overrides,
});

// Helper function to create custom email options with overrides
export const createCustomEmailOptions = (
  overrides: Partial<CustomEmailOptions> = {}
): CustomEmailOptions => ({
  ...customEmailOptions,
  ...overrides,
});

// Common test scenarios
export const testScenarios = {
  basic: basicEmailOptions,
  complete: completeEmailOptions,
  template: templateEmailOptions,
  notification: notificationEmailOptions,
  custom: customEmailOptions,
  withAttachments: emailWithMultipleAttachments,
  largeAttachment: emailWithLargeAttachment,
};

// Export collections for easy access
export const allValidEmails = Object.values(validEmails);
export const allInvalidEmails = Object.values(invalidEmails);
export const allTestScenarios = Object.values(testScenarios);
