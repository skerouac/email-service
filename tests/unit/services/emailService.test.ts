import React from "react";
import { render } from "@react-email/render";
import {
  EmailServiceImplementation,
  createEmailService,
  createEmailServiceWithTransport,
  EmailServiceConfig,
} from "../../../src/emailService";
import {
  EmailTransport,
  MailOptions,
} from "../../../src/transport/emailTransport";
import { NodemailerTransport } from "../../../src/transport/nodemailerTransport";
import { validateEmailOptionsStrict } from "../../../src/utils/validation";
import {
  getTemplate,
  getTemplateSubject,
  TemplateDefinition,
} from "../../../src/templateResolver";
import { initializeTemplates } from "../../../src/autoRegistration";
import {
  TemplateRenderError,
  EmailSendError,
  wrapError,
  EmailError,
} from "../../../src/utils/errors";
import { withRetry, RetryConfigs } from "../../../src/utils/retry";
import { createContextLogger, EmailLogger } from "../../../src/utils/logger";
import {
  EmailTemplate,
  TemplateEmailOptions,
  CustomEmailOptions,
  SMTPConfig,
} from "../../../src/types";

// Mock all dependencies
jest.mock("@react-email/render");
jest.mock("../../../src/transport/nodemailerTransport");
jest.mock("../../../src/utils/validation");
jest.mock("../../../src/templateResolver");
jest.mock("../../../src/autoRegistration");
jest.mock("../../../src/utils/errors", () => ({
  ...jest.requireActual("../../../src/utils/errors"),
  EmailSendError: class extends Error {
    code: string;
    retryable: boolean;
    context?: Record<string, any>;

    constructor(message: string, cause?: Error, context?: Record<string, any>) {
      super(message);
      this.name = "EmailSendError";
      this.code = "EMAIL_SEND_ERROR";
      this.retryable = false;
      this.context = context;
      this.cause = cause;
    }
  },
  wrapError: jest.fn(),
}));
jest.mock("../../../src/utils/retry");
jest.mock("../../../src/utils/logger");

const mockRender = render as jest.MockedFunction<typeof render>;
const mockValidateEmailOptionsStrict =
  validateEmailOptionsStrict as jest.MockedFunction<
    typeof validateEmailOptionsStrict
  >;
const mockGetTemplate = getTemplate as jest.MockedFunction<typeof getTemplate>;
const mockGetTemplateSubject = getTemplateSubject as jest.MockedFunction<
  typeof getTemplateSubject
>;
const mockInitializeTemplates = initializeTemplates as jest.MockedFunction<
  typeof initializeTemplates
>;
const mockWrapError = wrapError as jest.MockedFunction<typeof wrapError>;
const mockWithRetry = withRetry as jest.MockedFunction<typeof withRetry>;
const mockCreateContextLogger = createContextLogger as jest.MockedFunction<
  typeof createContextLogger
>;
const MockedNodemailerTransport = NodemailerTransport as jest.MockedClass<
  typeof NodemailerTransport
>;

// Create mock transport
const createMockTransport = (): jest.Mocked<EmailTransport> => ({
  sendMail: jest.fn(),
  verify: jest.fn(),
  close: jest.fn(),
  getInfo: jest.fn(),
});

// Create mock logger
const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

// Mock EmailLogger
const mockEmailLogger = {
  templateRender: jest.fn(),
};

// Test fixture data
const mockSMTPConfig: SMTPConfig = {
  host: "smtp.test.com",
  port: 587,
  secure: false,
  auth: {
    user: "test@test.com",
    pass: "password",
  },
};

const mockTemplateEmailOptions: TemplateEmailOptions = {
  templateName: "welcome" as EmailTemplate,
  from: "sender@test.com",
  to: "recipient@test.com",
  templateProps: { name: "John", welcomeLink: "https://example.com" },
};

const mockCustomEmailOptions: CustomEmailOptions = {
  component: () => React.createElement("div", null, "Test Email"),
  from: "sender@test.com",
  to: "recipient@test.com",
  subject: "Test Subject",
  props: { name: "John" },
};

describe("EmailServiceImplementation", () => {
  let mockTransport: jest.Mocked<EmailTransport>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let emailService: EmailServiceImplementation;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransport = createMockTransport();
    mockLogger = createMockLogger();

    // Setup mocks
    mockCreateContextLogger.mockReturnValue(mockLogger);
    (EmailLogger as any) = mockEmailLogger;
    mockTransport.getInfo.mockReturnValue({ type: "test-transport" });
    mockWithRetry.mockImplementation(async (fn) => await fn());
    mockWrapError.mockImplementation((error, context) => {
      const baseError =
        error instanceof Error ? error : new Error(String(error));
      // Create an actual Error instance that also has EmailError properties
      const emailError = Object.assign(baseError, {
        code: "UNKNOWN_ERROR",
        retryable: false,
        context,
        cause: error instanceof Error ? error : undefined,
      }) as EmailError;
      return emailError;
    });
    mockRender.mockResolvedValue("<html>Test HTML</html>");
    mockInitializeTemplates.mockResolvedValue();
    mockGetTemplate.mockReturnValue(() =>
      React.createElement("div", null, "Template")
    );
    mockGetTemplateSubject.mockReturnValue("Test Subject");
    // Reset validation mock to NOT throw by default
    mockValidateEmailOptionsStrict.mockImplementation(() => {});
  });

  describe("Constructor and Initialization", () => {
    it("should initialize with default config", () => {
      emailService = new EmailServiceImplementation(mockTransport);

      expect(mockCreateContextLogger).toHaveBeenCalledWith({
        service: "EmailService",
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Email service initialized",
        {
          transportType: "test-transport",
          hasDefaultFrom: false,
          autoInitializeTemplates: true,
        }
      );
    });

    it("should initialize with custom config", () => {
      const config: EmailServiceConfig = {
        defaultFrom: "sender@test.com",
        autoInitializeTemplates: false,
        customTemplates: [
          { name: "custom" as EmailTemplate, component: () => null },
        ],
      };

      emailService = new EmailServiceImplementation(mockTransport, config);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Email service initialized",
        {
          transportType: "test-transport",
          hasDefaultFrom: true,
          autoInitializeTemplates: false,
        }
      );
    });

    it("should auto-initialize templates by default", () => {
      emailService = new EmailServiceImplementation(mockTransport);

      expect(mockInitializeTemplates).toHaveBeenCalledWith({
        autoRegisterBuiltIn: true,
        customTemplates: [],
      });
    });

    it("should not auto-initialize templates when disabled", () => {
      emailService = new EmailServiceImplementation(mockTransport, {
        autoInitializeTemplates: false,
      });

      expect(mockInitializeTemplates).not.toHaveBeenCalled();
    });

    it("should handle template initialization failure gracefully", async () => {
      const initError = new Error("Init failed");
      mockInitializeTemplates.mockRejectedValueOnce(initError);

      emailService = new EmailServiceImplementation(mockTransport);

      await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for async init

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Template auto-initialization failed",
        undefined,
        initError
      );
    });
  });

  describe("testConnection", () => {
    beforeEach(() => {
      emailService = new EmailServiceImplementation(mockTransport);
    });

    it("should return true when connection verification succeeds", async () => {
      mockTransport.verify.mockResolvedValue(true);

      const result = await emailService.testConnection();

      expect(result).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Testing email service connection"
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Email service connection verified"
      );
    });

    it("should return false when connection verification fails", async () => {
      mockTransport.verify.mockResolvedValue(false);

      const result = await emailService.testConnection();

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Email service connection verification failed"
      );
    });

    it("should throw and log errors during connection test", async () => {
      const testError = new Error("Connection failed");
      const wrappedError = Object.assign(testError, {
        code: "CONNECTION_ERROR",
        retryable: false,
        cause: testError,
      }) as EmailError;

      mockTransport.verify.mockRejectedValueOnce(testError);
      mockWrapError.mockReturnValueOnce(wrappedError);

      await expect(emailService.testConnection()).rejects.toThrow(
        "Connection failed"
      );

      expect(mockWrapError).toHaveBeenCalledWith(testError, {
        operation: "testConnection",
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Connection test failed",
        undefined,
        wrappedError
      );
    });
  });

  describe("sendTemplateEmail", () => {
    beforeEach(() => {
      emailService = new EmailServiceImplementation(mockTransport);
    });

    it("should send template email successfully", async () => {
      mockTransport.sendMail.mockResolvedValue();

      await emailService.sendTemplateEmail(mockTemplateEmailOptions);

      expect(mockValidateEmailOptionsStrict).toHaveBeenCalledWith(
        mockTemplateEmailOptions
      );
      expect(mockGetTemplate).toHaveBeenCalledWith("welcome");
      expect(mockRender).toHaveBeenCalled();
      expect(mockTransport.sendMail).toHaveBeenCalledWith({
        from: "sender@test.com",
        to: "recipient@test.com",
        cc: undefined,
        bcc: undefined,
        subject: "Test Subject",
        html: "<html>Test HTML</html>",
        replyTo: undefined,
        attachments: undefined,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Template email sent successfully",
        expect.objectContaining({
          templateName: "welcome",
          recipients: 1,
        })
      );
    });

    it("should use default from address when not provided", async () => {
      emailService = new EmailServiceImplementation(mockTransport, {
        defaultFrom: "default@test.com",
      });
      mockTransport.sendMail.mockResolvedValue();

      const optionsWithoutFrom: Omit<TemplateEmailOptions, "from"> = {
        templateName: "welcome" as EmailTemplate,
        to: "recipient@test.com",
        templateProps: { name: "John", welcomeLink: "https://example.com" },
      };

      await emailService.sendTemplateEmail(
        optionsWithoutFrom as TemplateEmailOptions
      );

      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "default@test.com",
        })
      );
    });

    it("should use provided from address over default", async () => {
      emailService = new EmailServiceImplementation(mockTransport, {
        defaultFrom: "default@test.com",
      });
      mockTransport.sendMail.mockResolvedValue();

      const options = {
        ...mockTemplateEmailOptions,
        from: "specific@test.com",
      };
      await emailService.sendTemplateEmail(options);

      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "specific@test.com",
        })
      );
    });

    it("should use provided subject over template subject", async () => {
      mockTransport.sendMail.mockResolvedValue();

      const options: TemplateEmailOptions = {
        ...mockTemplateEmailOptions,
        subject: "Custom Subject",
      };
      await emailService.sendTemplateEmail(options);

      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Custom Subject",
        })
      );
    });

    it("should handle multiple recipients", async () => {
      mockTransport.sendMail.mockResolvedValue();

      const options: TemplateEmailOptions = {
        ...mockTemplateEmailOptions,
        to: ["user1@test.com", "user2@test.com"],
      };
      await emailService.sendTemplateEmail(options);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Template email sent successfully",
        expect.objectContaining({
          recipients: 2,
        })
      );
    });

    it("should initialize templates if not already initialized", async () => {
      emailService = new EmailServiceImplementation(mockTransport, {
        autoInitializeTemplates: false,
      });
      mockTransport.sendMail.mockResolvedValue();

      const optionsWithFrom: TemplateEmailOptions = {
        templateName: "welcome" as EmailTemplate,
        from: "sender@test.com",
        to: "recipient@test.com",
        templateProps: { name: "John", welcomeLink: "https://example.com" },
      };

      await emailService.sendTemplateEmail(optionsWithFrom);

      expect(mockInitializeTemplates).toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Invalid email options");
      mockValidateEmailOptionsStrict.mockImplementationOnce(() => {
        throw validationError;
      });

      await expect(
        emailService.sendTemplateEmail(mockTemplateEmailOptions)
      ).rejects.toThrow("Invalid email options");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to send template email",
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should handle template rendering errors", async () => {
      const renderError = new TemplateRenderError(
        "Render failed",
        new Error("Base error")
      );

      // Override wrapError for this test to return the error as-is
      mockWrapError.mockImplementationOnce((error) => error as EmailError);

      // Make withRetry throw the specific error
      mockWithRetry.mockImplementationOnce(async (fn) => {
        throw renderError;
      });

      await expect(
        emailService.sendTemplateEmail(mockTemplateEmailOptions)
      ).rejects.toThrow("Render failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to send template email",
        expect.any(Object),
        renderError
      );
    });

    it("should handle transport send errors", async () => {
      const sendError = new Error("Send failed");
      mockTransport.sendMail.mockRejectedValueOnce(sendError);

      await expect(
        emailService.sendTemplateEmail(mockTemplateEmailOptions)
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to send template email",
        expect.any(Object),
        expect.any(Error)
      );
    });

    it("should use retry configuration for template rendering and SMTP", async () => {
      const retryConfig = {
        template: RetryConfigs.template,
        smtp: RetryConfigs.smtp,
      };
      emailService = new EmailServiceImplementation(mockTransport, {
        retryConfig,
      });
      mockTransport.sendMail.mockResolvedValue();

      const optionsWithFrom: TemplateEmailOptions = {
        templateName: "welcome" as EmailTemplate,
        from: "sender@test.com",
        to: "recipient@test.com",
        templateProps: { name: "John", welcomeLink: "https://example.com" },
      };

      await emailService.sendTemplateEmail(optionsWithFrom);

      expect(mockWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        retryConfig.template,
        expect.any(Object)
      );
      expect(mockWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        retryConfig.smtp,
        expect.any(Object)
      );
    });
  });

  describe("sendCustomEmail", () => {
    beforeEach(() => {
      emailService = new EmailServiceImplementation(mockTransport);
    });

    it("should send custom email successfully", async () => {
      mockTransport.sendMail.mockResolvedValue();

      await emailService.sendCustomEmail(mockCustomEmailOptions);

      expect(mockValidateEmailOptionsStrict).toHaveBeenCalledWith(
        mockCustomEmailOptions
      );
      expect(mockRender).toHaveBeenCalled();
      expect(mockTransport.sendMail).toHaveBeenCalledWith({
        from: "sender@test.com",
        to: "recipient@test.com",
        cc: undefined,
        bcc: undefined,
        subject: "Test Subject",
        html: "<html>Test HTML</html>",
        replyTo: undefined,
        attachments: undefined,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Custom email sent successfully",
        expect.any(Object)
      );
    });

    it("should throw error when subject is missing", async () => {
      // Reset the validation mock for this specific test
      mockValidateEmailOptionsStrict.mockImplementationOnce(() => {});

      // Override wrapError for this test to return the error as-is
      mockWrapError.mockImplementationOnce((error) => error as EmailError);

      const optionsWithoutSubject = {
        component: () => React.createElement("div", null, "Test Email"),
        from: "sender@test.com",
        to: "recipient@test.com",
        subject: "", // Empty subject should trigger the error
        props: { name: "John" },
      } as CustomEmailOptions;

      await expect(
        emailService.sendCustomEmail(optionsWithoutSubject)
      ).rejects.toThrow("Subject is required for custom emails");
    });

    it("should handle anonymous components", async () => {
      mockTransport.sendMail.mockResolvedValue();
      const anonymousComponent = () => React.createElement("div");
      const options: CustomEmailOptions = {
        ...mockCustomEmailOptions,
        component: anonymousComponent,
      };

      await emailService.sendCustomEmail(options);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Custom email sent successfully",
        expect.objectContaining({
          componentName: expect.stringMatching(
            /^(anonymousComponent|AnonymousComponent)$/
          ),
        })
      );
    });

    it("should handle named components", async () => {
      mockTransport.sendMail.mockResolvedValue();
      const namedComponent = function TestComponent() {
        return React.createElement("div");
      };
      const options: CustomEmailOptions = {
        ...mockCustomEmailOptions,
        component: namedComponent,
      };

      await emailService.sendCustomEmail(options);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Custom email sent successfully",
        expect.objectContaining({
          componentName: "TestComponent",
        })
      );
    });

    it("should handle custom component rendering errors", async () => {
      const renderError = new TemplateRenderError("Component render failed");

      // Override wrapError for this test to return the error as-is
      mockWrapError.mockImplementationOnce((error) => error as EmailError);

      // Make withRetry throw the specific error
      mockWithRetry.mockImplementationOnce(async (fn) => {
        throw renderError;
      });

      await expect(
        emailService.sendCustomEmail(mockCustomEmailOptions)
      ).rejects.toThrow("Component render failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to send custom email",
        expect.any(Object),
        renderError
      );
    });
  });

  describe("previewTemplate", () => {
    beforeEach(() => {
      emailService = new EmailServiceImplementation(mockTransport);
    });

    it("should generate template preview successfully", async () => {
      const result = await emailService.previewTemplate(
        "welcome" as EmailTemplate,
        { name: "John" }
      );

      expect(result).toBe("<html>Test HTML</html>");
      expect(mockGetTemplate).toHaveBeenCalledWith("welcome");
      expect(mockRender).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Generating template preview",
        { templateName: "welcome" }
      );
    });

    it("should initialize templates if not already initialized", async () => {
      emailService = new EmailServiceImplementation(mockTransport, {
        autoInitializeTemplates: false,
      });

      await emailService.previewTemplate("welcome" as EmailTemplate, {
        name: "John",
      });

      expect(mockInitializeTemplates).toHaveBeenCalled();
    });

    it("should handle template preview errors", async () => {
      const previewError = new Error("Preview failed");
      mockWithRetry.mockImplementation(async (fn) => {
        throw previewError;
      });

      await expect(
        emailService.previewTemplate("welcome" as EmailTemplate, {
          name: "John",
        })
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to generate template preview",
        { templateName: "welcome" },
        expect.any(Error)
      );
    });
  });

  describe("previewCustomComponent", () => {
    beforeEach(() => {
      emailService = new EmailServiceImplementation(mockTransport);
    });

    it("should generate custom component preview successfully", async () => {
      const testComponent = () => React.createElement("div", null, "Test");

      const result = await emailService.previewCustomComponent(testComponent, {
        name: "John",
      });

      expect(result).toBe("<html>Test HTML</html>");
      expect(mockRender).toHaveBeenCalled();
    });

    it("should handle anonymous components in preview", async () => {
      const anonymousComponent = () => React.createElement("div");

      await emailService.previewCustomComponent(anonymousComponent, {});

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Generating custom component preview",
        {
          componentName: expect.stringMatching(
            /^(anonymousComponent|AnonymousComponent)$/
          ),
        }
      );
    });

    it("should handle named components in preview", async () => {
      const namedComponent = function TestComponent() {
        return React.createElement("div");
      };

      await emailService.previewCustomComponent(namedComponent, {});

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Generating custom component preview",
        {
          componentName: "TestComponent",
        }
      );
    });

    it("should handle component preview errors", async () => {
      const previewError = new Error("Component preview failed");
      mockWithRetry.mockImplementationOnce(async (fn) => {
        throw previewError;
      });

      const testComponent = () => React.createElement("div");

      await expect(
        emailService.previewCustomComponent(testComponent, {})
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to generate component preview",
        expect.any(Object),
        expect.any(Error)
      );
    });
  });

  describe("close", () => {
    beforeEach(() => {
      emailService = new EmailServiceImplementation(mockTransport);
    });

    it("should close transport successfully", async () => {
      mockTransport.close.mockResolvedValue();

      await emailService.close();

      expect(mockTransport.close).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith("Closing email service");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Email service closed successfully"
      );
    });

    it("should handle close errors gracefully", async () => {
      const closeError = new Error("Close failed");
      mockTransport.close.mockRejectedValue(closeError);

      await emailService.close(); // Should not throw

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Error closing email service",
        undefined,
        closeError
      );
    });
  });

  describe("getTransportInfo", () => {
    beforeEach(() => {
      emailService = new EmailServiceImplementation(mockTransport);
    });

    it("should return transport info", () => {
      const transportInfo = { type: "test-transport", config: "test" };
      mockTransport.getInfo.mockReturnValue(transportInfo);

      const result = emailService.getTransportInfo();

      expect(result).toEqual(transportInfo);
      expect(mockTransport.getInfo).toHaveBeenCalled();
    });
  });
});

describe("Factory Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockedNodemailerTransport.mockImplementation(() => {
      const mockTransport = createMockTransport();
      mockTransport.getInfo.mockReturnValue({ type: "nodemailer" });
      return mockTransport as any;
    });
  });

  describe("createEmailService", () => {
    it("should create email service with NodemailerTransport", () => {
      const service = createEmailService(mockSMTPConfig);

      expect(MockedNodemailerTransport).toHaveBeenCalledWith(mockSMTPConfig);
      expect(service).toBeInstanceOf(EmailServiceImplementation);
    });

    it("should create email service with custom service config", () => {
      const serviceConfig: EmailServiceConfig = {
        defaultFrom: "test@example.com",
        autoInitializeTemplates: false,
      };

      const service = createEmailService(mockSMTPConfig, serviceConfig);

      expect(MockedNodemailerTransport).toHaveBeenCalledWith(mockSMTPConfig);
      expect(service).toBeInstanceOf(EmailServiceImplementation);
    });
  });

  describe("createEmailServiceWithTransport", () => {
    it("should create email service with provided transport", () => {
      const mockTransport = createMockTransport();
      mockTransport.getInfo.mockReturnValue({ type: "custom-transport" });

      const service = createEmailServiceWithTransport(mockTransport);

      expect(service).toBeInstanceOf(EmailServiceImplementation);
    });

    it("should create email service with transport and config", () => {
      const mockTransport = createMockTransport();
      mockTransport.getInfo.mockReturnValue({ type: "custom-transport" });
      const serviceConfig: EmailServiceConfig = {
        defaultFrom: "test@example.com",
      };

      const service = createEmailServiceWithTransport(
        mockTransport,
        serviceConfig
      );

      expect(service).toBeInstanceOf(EmailServiceImplementation);
    });
  });
});

describe("Private Methods Integration", () => {
  let mockTransport: jest.Mocked<EmailTransport>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let emailService: EmailServiceImplementation;

  beforeEach(() => {
    mockTransport = createMockTransport();
    mockLogger = createMockLogger();
    mockTransport.getInfo.mockReturnValue({ type: "test-transport" });
    mockCreateContextLogger.mockReturnValue(mockLogger);
    emailService = new EmailServiceImplementation(mockTransport);
  });

  it("should log template render performance", async () => {
    mockTransport.sendMail.mockResolvedValue();

    const optionsWithFrom: TemplateEmailOptions = {
      templateName: "welcome" as EmailTemplate,
      from: "sender@test.com",
      to: "recipient@test.com",
      templateProps: { name: "John", welcomeLink: "https://example.com" },
    };

    await emailService.sendTemplateEmail(optionsWithFrom);

    expect(mockEmailLogger.templateRender).toHaveBeenCalledWith(
      "welcome",
      expect.any(Number)
    );
  });

  it("should include duration in success logs", async () => {
    mockTransport.sendMail.mockResolvedValue();

    const optionsWithFrom: TemplateEmailOptions = {
      templateName: "welcome" as EmailTemplate,
      from: "sender@test.com",
      to: "recipient@test.com",
      templateProps: { name: "John", welcomeLink: "https://example.com" },
    };

    await emailService.sendTemplateEmail(optionsWithFrom);

    expect(mockLogger.info).toHaveBeenCalledWith(
      "Template email sent successfully",
      expect.objectContaining({
        duration: expect.stringMatching(/\d+ms/),
      })
    );
  });

  it("should include duration in error logs", async () => {
    const sendError = new Error("Send failed");
    mockTransport.sendMail.mockRejectedValueOnce(sendError);

    const optionsWithFrom: TemplateEmailOptions = {
      templateName: "welcome" as EmailTemplate,
      from: "sender@test.com",
      to: "recipient@test.com",
      templateProps: { name: "John", welcomeLink: "https://example.com" },
    };

    await expect(
      emailService.sendTemplateEmail(optionsWithFrom)
    ).rejects.toThrow();

    expect(mockLogger.error).toHaveBeenCalledWith(
      "Failed to send template email",
      expect.objectContaining({
        duration: expect.stringMatching(/\d+ms/),
      }),
      expect.any(Error)
    );
  });
});
