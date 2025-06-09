import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  EmailError,
  SMTPConfigurationError,
  SMTPConnectionError,
  SMTPAuthenticationError,
  EmailValidationError,
  TemplateNotFoundError,
  TemplateRenderError,
  EmailSendError,
  RateLimitError,
  AttachmentError,
  isRetryableError,
  wrapError,
} from "../../../src/utils/errors";

describe("EmailError Base Class", () => {
  // Create a concrete implementation for testing the abstract class
  class TestEmailError extends EmailError {
    readonly code = "TEST_ERROR";
    readonly retryable = true;
  }

  describe("Constructor and Properties", () => {
    it("should create error with message", () => {
      const error = new TestEmailError("Test error message");

      expect(error.message).toBe("Test error message");
      expect(error.code).toBe("TEST_ERROR");
      expect(error.retryable).toBe(true);
      expect(error.name).toBe("TestEmailError");
      expect(error.cause).toBeUndefined();
      expect(error.context).toBeUndefined();
    });

    it("should create error with cause", () => {
      const originalError = new Error("Original error");
      const error = new TestEmailError("Wrapped error", originalError);

      expect(error.message).toBe("Wrapped error");
      expect(error.cause).toBe(originalError);
      expect(error.context).toBeUndefined();
    });

    it("should create error with context", () => {
      const context = { userId: "123", operation: "sendEmail" };
      const error = new TestEmailError(
        "Error with context",
        undefined,
        context
      );

      expect(error.message).toBe("Error with context");
      expect(error.cause).toBeUndefined();
      expect(error.context).toEqual(context);
    });

    it("should create error with both cause and context", () => {
      const originalError = new Error("Original error");
      const context = { userId: "123", operation: "sendEmail" };
      const error = new TestEmailError(
        "Complete error",
        originalError,
        context
      );

      expect(error.message).toBe("Complete error");
      expect(error.cause).toBe(originalError);
      expect(error.context).toEqual(context);
    });

    it("should be instance of Error and EmailError", () => {
      const error = new TestEmailError("Test error");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EmailError);
      expect(error).toBeInstanceOf(TestEmailError);
    });

    it("should have proper stack trace", () => {
      const error = new TestEmailError("Test error");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("TestEmailError");
      expect(error.stack).toContain("Test error");
    });
  });

  describe("Error Inheritance", () => {
    it("should maintain prototype chain", () => {
      const error = new TestEmailError("Test error");

      expect(Object.getPrototypeOf(error)).toBe(TestEmailError.prototype);
      expect(Object.getPrototypeOf(Object.getPrototypeOf(error))).toBe(
        EmailError.prototype
      );
      expect(
        Object.getPrototypeOf(
          Object.getPrototypeOf(Object.getPrototypeOf(error))
        )
      ).toBe(Error.prototype);
    });

    it("should handle instanceof checks correctly", () => {
      const error = new TestEmailError("Test error");

      expect(error instanceof TestEmailError).toBe(true);
      expect(error instanceof EmailError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });
});

describe("Specific Error Classes", () => {
  describe("SMTPConfigurationError", () => {
    it("should have correct properties", () => {
      const error = new SMTPConfigurationError("SMTP config error");

      expect(error.code).toBe("SMTP_CONFIG_ERROR");
      expect(error.retryable).toBe(false);
      expect(error.message).toBe("SMTP config error");
      expect(error.name).toBe("SMTPConfigurationError");
    });

    it("should work with cause and context", () => {
      const cause = new Error("Config validation failed");
      const context = { host: "smtp.test.com", port: 587 };
      const error = new SMTPConfigurationError(
        "Invalid SMTP config",
        cause,
        context
      );

      expect(error.cause).toBe(cause);
      expect(error.context).toEqual(context);
    });
  });

  describe("SMTPConnectionError", () => {
    it("should have correct properties", () => {
      const error = new SMTPConnectionError("Connection failed");

      expect(error.code).toBe("SMTP_CONNECTION_ERROR");
      expect(error.retryable).toBe(true);
      expect(error.message).toBe("Connection failed");
      expect(error.name).toBe("SMTPConnectionError");
    });

    it("should be retryable", () => {
      const error = new SMTPConnectionError("Connection timeout");
      expect(error.retryable).toBe(true);
    });
  });

  describe("SMTPAuthenticationError", () => {
    it("should have correct properties", () => {
      const error = new SMTPAuthenticationError("Auth failed");

      expect(error.code).toBe("SMTP_AUTH_ERROR");
      expect(error.retryable).toBe(false);
      expect(error.message).toBe("Auth failed");
      expect(error.name).toBe("SMTPAuthenticationError");
    });

    it("should not be retryable", () => {
      const error = new SMTPAuthenticationError("Invalid credentials");
      expect(error.retryable).toBe(false);
    });
  });

  describe("EmailValidationError", () => {
    it("should have correct properties", () => {
      const error = new EmailValidationError("Validation failed");

      expect(error.code).toBe("EMAIL_VALIDATION_ERROR");
      expect(error.retryable).toBe(false);
      expect(error.message).toBe("Validation failed");
      expect(error.name).toBe("EmailValidationError");
    });

    it("should work with validation context", () => {
      const context = {
        errors: [{ field: "email", message: "Invalid format" }],
        warnings: [],
      };
      const error = new EmailValidationError(
        "Email validation failed",
        undefined,
        context
      );

      expect(error.context).toEqual(context);
    });
  });

  describe("TemplateNotFoundError", () => {
    it("should have correct properties", () => {
      const error = new TemplateNotFoundError("Template not found");

      expect(error.code).toBe("TEMPLATE_NOT_FOUND");
      expect(error.retryable).toBe(false);
      expect(error.message).toBe("Template not found");
      expect(error.name).toBe("TemplateNotFoundError");
    });

    it("should work with template context", () => {
      const context = {
        templateName: "welcome",
        availableTemplates: ["notification", "reset-password"],
      };
      const error = new TemplateNotFoundError(
        'Template "welcome" not found',
        undefined,
        context
      );

      expect(error.context).toEqual(context);
    });
  });

  describe("TemplateRenderError", () => {
    it("should have correct properties", () => {
      const error = new TemplateRenderError("Render failed");

      expect(error.code).toBe("TEMPLATE_RENDER_ERROR");
      expect(error.retryable).toBe(false);
      expect(error.message).toBe("Render failed");
      expect(error.name).toBe("TemplateRenderError");
    });

    it("should work with render context", () => {
      const renderError = new Error("React render failed");
      const context = {
        templateName: "welcome",
        props: ["name", "email"],
      };
      const error = new TemplateRenderError(
        "Template render failed",
        renderError,
        context
      );

      expect(error.cause).toBe(renderError);
      expect(error.context).toEqual(context);
    });
  });

  describe("EmailSendError", () => {
    it("should have correct properties", () => {
      const error = new EmailSendError("Send failed");

      expect(error.code).toBe("EMAIL_SEND_ERROR");
      expect(error.retryable).toBe(true);
      expect(error.message).toBe("Send failed");
      expect(error.name).toBe("EmailSendError");
    });

    it("should be retryable by default", () => {
      const error = new EmailSendError("SMTP server error");
      expect(error.retryable).toBe(true);
    });
  });

  describe("RateLimitError", () => {
    it("should have correct properties", () => {
      const error = new RateLimitError("Rate limit exceeded");

      expect(error.code).toBe("RATE_LIMIT_ERROR");
      expect(error.retryable).toBe(true);
      expect(error.message).toBe("Rate limit exceeded");
      expect(error.name).toBe("RateLimitError");
    });

    it("should work with rate limit context", () => {
      const context = {
        limit: 100,
        remaining: 0,
        resetTime: Date.now() + 3600000,
      };
      const error = new RateLimitError(
        "API rate limit exceeded",
        undefined,
        context
      );

      expect(error.context).toEqual(context);
    });
  });

  describe("AttachmentError", () => {
    it("should have correct properties", () => {
      const error = new AttachmentError("Attachment failed");

      expect(error.code).toBe("ATTACHMENT_ERROR");
      expect(error.retryable).toBe(false);
      expect(error.message).toBe("Attachment failed");
      expect(error.name).toBe("AttachmentError");
    });

    it("should work with attachment context", () => {
      const context = {
        fileName: "document.pdf",
        size: 26214400, // 25MB
        maxSize: 25165824, // 24MB
      };
      const error = new AttachmentError(
        "Attachment too large",
        undefined,
        context
      );

      expect(error.context).toEqual(context);
    });
  });
});

describe("isRetryableError Function", () => {
  describe("EmailError instances", () => {
    it("should return true for retryable EmailErrors", () => {
      const retryableErrors = [
        new SMTPConnectionError("Connection failed"),
        new EmailSendError("Send failed"),
        new RateLimitError("Rate limit exceeded"),
      ];

      retryableErrors.forEach((error) => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it("should return false for non-retryable EmailErrors", () => {
      const nonRetryableErrors = [
        new SMTPConfigurationError("Config error"),
        new SMTPAuthenticationError("Auth failed"),
        new EmailValidationError("Validation failed"),
        new TemplateNotFoundError("Template not found"),
        new TemplateRenderError("Render failed"),
        new AttachmentError("Attachment error"),
      ];

      nonRetryableErrors.forEach((error) => {
        expect(isRetryableError(error)).toBe(false);
      });
    });
  });

  describe("Generic Error instances", () => {
    it("should return true for transient network errors", () => {
      const transientErrors = [
        new Error("ETIMEDOUT"),
        new Error("Connection ECONNRESET"),
        new Error("Host ENOTFOUND"),
        new Error("ECONNREFUSED by server"),
        new Error("Request timeout occurred"),
        new Error("Network error detected"),
        new Error("Something with NETWORK failure"),
      ];

      transientErrors.forEach((error) => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it("should return true for mixed case transient errors", () => {
      const mixedCaseErrors = [
        new Error("ETimeOut occurred"),
        new Error("Connection EConnReset"),
        new Error("Network Error"),
        new Error("TIMEOUT in request"),
      ];

      mixedCaseErrors.forEach((error) => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it("should return false for non-transient errors", () => {
      const nonTransientErrors = [
        new Error("Syntax error"),
        new Error("Invalid argument"),
        new Error("Permission denied"),
        new Error("File not found"),
        new Error("Configuration error"),
        new Error("Authentication failed"),
      ];

      nonTransientErrors.forEach((error) => {
        expect(isRetryableError(error)).toBe(false);
      });
    });

    it("should handle empty error messages", () => {
      const emptyError = new Error("");
      expect(isRetryableError(emptyError)).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle error-like objects without message", () => {
      const errorLikeObject = { name: "CustomError" } as any;
      expect(isRetryableError(errorLikeObject)).toBe(false);
    });

    it("should handle non-Error objects safely", () => {
      // These should not throw, just return false
      expect(() => isRetryableError("string error" as any)).not.toThrow();
      expect(() => isRetryableError(123 as any)).not.toThrow();
      expect(() => isRetryableError({} as any)).not.toThrow();

      expect(isRetryableError("string error" as any)).toBe(false);
      expect(isRetryableError(123 as any)).toBe(false);
      expect(isRetryableError({} as any)).toBe(false);
    });

    it("should handle undefined and null safely", () => {
      // These should not throw, just return false
      expect(() => isRetryableError(undefined as any)).not.toThrow();
      expect(() => isRetryableError(null as any)).not.toThrow();

      expect(isRetryableError(undefined as any)).toBe(false);
      expect(isRetryableError(null as any)).toBe(false);
    });
  });

  describe("wrapError Function", () => {
    describe("EmailError instances", () => {
      it("should return EmailError instances unchanged", () => {
        const originalError = new SMTPConnectionError("Connection failed");
        const wrappedError = wrapError(originalError);

        expect(wrappedError).toBe(originalError);
        expect(wrappedError).toBeInstanceOf(SMTPConnectionError);
      });

      it("should preserve context when returning EmailError", () => {
        const context = { host: "smtp.test.com", port: 587 };
        const originalError = new SMTPAuthenticationError(
          "Auth failed",
          undefined,
          context
        );
        const wrappedError = wrapError(originalError);

        expect(wrappedError).toBe(originalError);
        expect(wrappedError.context).toEqual(context);
      });
    });

    describe("Generic Error instances", () => {
      it("should wrap authentication errors as SMTPAuthenticationError", () => {
        const authErrors = [
          new Error("auth failed"),
          new Error("Invalid auth credentials"),
          new Error("SMTP auth error occurred"),
          new Error("Login failed with auth timeout"),
        ];

        authErrors.forEach((error) => {
          const wrapped = wrapError(error);
          expect(wrapped).toBeInstanceOf(SMTPAuthenticationError);
          expect(wrapped.message).toContain("Authentication failed");
          expect(wrapped.message).toContain(error.message);
          expect(wrapped.cause).toBe(error);
        });
      });

      it("should wrap connection errors as SMTPConnectionError", () => {
        const connectionErrors = [
          new Error("connect failed"),
          new Error("Cannot connect to server"),
          new Error("SMTP connect timeout"),
          new Error("Failed to connect to host"),
        ];

        connectionErrors.forEach((error) => {
          const wrapped = wrapError(error);
          expect(wrapped).toBeInstanceOf(SMTPConnectionError);
          expect(wrapped.message).toContain("Connection failed");
          expect(wrapped.message).toContain(error.message);
          expect(wrapped.cause).toBe(error);
        });
      });

      it("should wrap unknown errors as EmailSendError", () => {
        const unknownErrors = [
          new Error("Some random error"),
          new Error("Unexpected failure"),
          new Error("Server internal error"),
          new Error("Processing failed"),
        ];

        unknownErrors.forEach((error) => {
          const wrapped = wrapError(error);
          expect(wrapped).toBeInstanceOf(EmailSendError);
          expect(wrapped.message).toContain("Email operation failed");
          expect(wrapped.message).toContain(error.message);
          expect(wrapped.cause).toBe(error);
        });
      });

      it("should handle case-insensitive error message matching", () => {
        const authError = new Error("auth FAILED");
        const connectionError = new Error("connect TIMEOUT");

        const wrappedAuth = wrapError(authError);
        const wrappedConnection = wrapError(connectionError);

        expect(wrappedAuth).toBeInstanceOf(SMTPAuthenticationError);
        expect(wrappedConnection).toBeInstanceOf(SMTPConnectionError);
      });
    });

    describe("Context preservation", () => {
      it("should preserve provided context", () => {
        const error = new Error("Some error");
        const context = { operation: "sendEmail", userId: "123" };
        const wrapped = wrapError(error, context);

        expect(wrapped.context).toEqual(context);
      });

      it("should work without context", () => {
        const error = new Error("Some error");
        const wrapped = wrapError(error);

        expect(wrapped.context).toBeUndefined();
      });

      it("should handle empty context object", () => {
        const error = new Error("Some error");
        const context = {};
        const wrapped = wrapError(error, context);

        expect(wrapped.context).toEqual(context);
      });
    });

    describe("Non-Error values", () => {
      it("should wrap string values as EmailSendError", () => {
        const stringError = "Something went wrong";
        const wrapped = wrapError(stringError);

        expect(wrapped).toBeInstanceOf(EmailSendError);
        expect(wrapped.message).toBe(
          "Unknown error occurred: Something went wrong"
        );
        expect(wrapped.cause).toBeUndefined();
      });

      it("should wrap number values as EmailSendError", () => {
        const numberError = 500;
        const wrapped = wrapError(numberError);

        expect(wrapped).toBeInstanceOf(EmailSendError);
        expect(wrapped.message).toBe("Unknown error occurred: 500");
        expect(wrapped.cause).toBeUndefined();
      });

      it("should wrap object values as EmailSendError", () => {
        const objectError = { code: "UNKNOWN", message: "Something failed" };
        const wrapped = wrapError(objectError);

        expect(wrapped).toBeInstanceOf(EmailSendError);
        expect(wrapped.message).toContain("Unknown error occurred:");
        expect(wrapped.message).toContain("[object Object]");
        expect(wrapped.cause).toBeUndefined();
      });

      it("should handle null and undefined", () => {
        const nullWrapped = wrapError(null);
        const undefinedWrapped = wrapError(undefined);

        expect(nullWrapped).toBeInstanceOf(EmailSendError);
        expect(undefinedWrapped).toBeInstanceOf(EmailSendError);
        expect(nullWrapped.message).toBe("Unknown error occurred: null");
        expect(undefinedWrapped.message).toBe(
          "Unknown error occurred: undefined"
        );
      });

      it("should preserve context for non-Error values", () => {
        const context = { source: "wrapError test" };
        const wrapped = wrapError("string error", context);

        expect(wrapped.context).toEqual(context);
      });
    });
  });

  describe("Error Integration Tests", () => {
    describe("Error chaining", () => {
      it("should handle nested error wrapping", () => {
        const originalError = new Error("Network failure");
        const firstWrap = wrapError(originalError);
        const secondWrap = wrapError(firstWrap);

        // Second wrap should return the first wrap unchanged (EmailError)
        expect(secondWrap).toBe(firstWrap);
        expect(secondWrap.cause).toBe(originalError);
      });

      it("should maintain error chain information", () => {
        const rootCause = new Error("connect refused");
        const context = { host: "smtp.example.com", attempt: 3 };
        const wrapped = wrapError(rootCause, context);

        expect(wrapped).toBeInstanceOf(SMTPConnectionError);
        expect(wrapped.cause).toBe(rootCause);
        expect(wrapped.context).toEqual(context);
        expect(wrapped.message).toContain(rootCause.message);
      });
    });

    describe("Stack trace preservation", () => {
      it("should preserve original stack trace in cause", () => {
        const originalError = new Error("Original error");
        const originalStack = originalError.stack;
        const wrapped = wrapError(originalError);

        expect(wrapped.cause).toBe(originalError);
        expect(wrapped.cause?.stack).toBe(originalStack);
        expect(wrapped.stack).toBeDefined();
        expect(wrapped.stack).not.toBe(originalStack);
      });
    });

    describe("Serialization compatibility", () => {
      it("should handle JSON serialization gracefully", () => {
        const context = { userId: "123", operation: "sendEmail" };
        const error = new EmailSendError("Send failed", undefined, context);

        // Should not throw during serialization attempt
        expect(() => {
          JSON.stringify({
            name: error.name,
            message: error.message,
            code: error.code,
            retryable: error.retryable,
            context: error.context,
          });
        }).not.toThrow();
      });

      it("should preserve error properties in serializable format", () => {
        const originalError = new Error("connect failed");
        const context = { host: "smtp.test.com", port: 587 };
        const wrapped = wrapError(originalError, context);

        const serializable = {
          name: wrapped.name,
          message: wrapped.message,
          code: wrapped.code,
          retryable: wrapped.retryable,
          context: wrapped.context,
          causeName: wrapped.cause?.name,
          causeMessage: wrapped.cause?.message,
        };

        expect(serializable.name).toBe("SMTPConnectionError");
        expect(serializable.code).toBe("SMTP_CONNECTION_ERROR");
        expect(serializable.retryable).toBe(true);
        expect(serializable.context).toEqual(context);
        expect(serializable.causeName).toBe("Error");
        expect(serializable.causeMessage).toBe("connect failed");
      });
    });
  });
});
