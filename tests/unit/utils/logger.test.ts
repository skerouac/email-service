import {
  LogLevel,
  LogContext,
  LogEntry,
  Logger,
  setLogger,
  getLogger,
  createContextLogger,
  createConsoleLogger,
  createSilentLogger,
  EmailLogger,
} from "../../../src/utils/logger";

// Mock console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

describe("Logger Utils", () => {
  let mockConsole: {
    log: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
  };

  beforeEach(() => {
    // Create fresh mocks for each test
    mockConsole = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    // Replace console methods
    console.log = mockConsole.log;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;

    // Reset to default logger
    setLogger(createConsoleLogger("info"));
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;

    jest.clearAllMocks();
  });

  describe("ConsoleLogger", () => {
    describe("constructor and log level filtering", () => {
      it("should create logger with default info level", () => {
        const logger = createConsoleLogger();

        logger.debug("debug message");
        logger.info("info message");
        logger.warn("warn message");
        logger.error("error message");

        expect(mockConsole.log).toHaveBeenCalledTimes(1); // Only info
        expect(mockConsole.warn).toHaveBeenCalledTimes(1);
        expect(mockConsole.error).toHaveBeenCalledTimes(1);
      });

      it("should respect custom minimum log level", () => {
        const logger = createConsoleLogger("warn");

        logger.debug("debug message");
        logger.info("info message");
        logger.warn("warn message");
        logger.error("error message");

        expect(mockConsole.log).not.toHaveBeenCalled();
        expect(mockConsole.warn).toHaveBeenCalledTimes(1);
        expect(mockConsole.error).toHaveBeenCalledTimes(1);
      });

      it("should log all levels when set to debug", () => {
        const logger = createConsoleLogger("debug");

        logger.debug("debug message");
        logger.info("info message");
        logger.warn("warn message");
        logger.error("error message");

        expect(mockConsole.log).toHaveBeenCalledTimes(2); // debug + info
        expect(mockConsole.warn).toHaveBeenCalledTimes(1);
        expect(mockConsole.error).toHaveBeenCalledTimes(1);
      });
    });

    describe("message formatting", () => {
      it("should format basic log message correctly", () => {
        const logger = createConsoleLogger("debug");
        const testMessage = "Test message";

        logger.info(testMessage);

        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.stringMatching(
            /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO  Test message/
          )
        );
      });

      it("should include context in formatted message", () => {
        const logger = createConsoleLogger("debug");
        const context = { userId: "123", action: "login" };

        logger.info("User action", context);

        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.stringContaining('Context: {"userId":"123","action":"login"}')
        );
      });

      it("should include error information in formatted message", () => {
        const logger = createConsoleLogger("debug");
        const error = new Error("Test error");
        error.stack = "Error: Test error\n    at test";

        logger.error("Something failed", undefined, error);

        const loggedMessage = mockConsole.error.mock.calls[0][0];
        expect(loggedMessage).toContain("Error: Test error");
        expect(loggedMessage).toContain(
          "Stack: Error: Test error\n    at test"
        );
      });

      it("should handle context and error together", () => {
        const logger = createConsoleLogger("debug");
        const context = { operation: "database" };
        const error = new Error("Connection failed");

        logger.error("Database operation failed", context, error);

        const loggedMessage = mockConsole.error.mock.calls[0][0];
        expect(loggedMessage).toContain('Context: {"operation":"database"}');
        expect(loggedMessage).toContain("Error: Connection failed");
      });

      it("should handle empty context gracefully", () => {
        const logger = createConsoleLogger("debug");

        logger.info("Test message", {});

        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.not.stringContaining("Context:")
        );
      });

      it("should handle error without stack trace", () => {
        const logger = createConsoleLogger("debug");
        const error = new Error("Simple error");
        delete error.stack;

        logger.error("Error occurred", undefined, error);

        const loggedMessage = mockConsole.error.mock.calls[0][0];
        expect(loggedMessage).toContain("Error: Simple error");
        expect(loggedMessage).not.toContain("Stack:");
      });
    });

    describe("log level methods", () => {
      it("should call appropriate console method for each level", () => {
        const logger = createConsoleLogger("debug");

        logger.debug("debug message");
        logger.info("info message");
        logger.warn("warn message");
        logger.error("error message");

        expect(mockConsole.log).toHaveBeenCalledTimes(2);
        expect(mockConsole.warn).toHaveBeenCalledTimes(1);
        expect(mockConsole.error).toHaveBeenCalledTimes(1);
      });

      it("should pass context to warn method", () => {
        const logger = createConsoleLogger("debug");
        const context = { component: "auth" };
        const error = new Error("Auth failed");

        logger.warn("Authentication warning", context, error);

        expect(mockConsole.warn).toHaveBeenCalledWith(
          expect.stringMatching(/WARN.*Authentication warning.*Context.*Error/)
        );
      });
    });
  });

  describe("SilentLogger", () => {
    it("should not call any console methods", () => {
      const logger = createSilentLogger();

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message", {}, new Error("test"));
      logger.error("error message", {}, new Error("test"));

      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });

    it("should implement Logger interface correctly", () => {
      const logger = createSilentLogger();

      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
    });

    it("should accept all expected parameters without throwing", () => {
      const logger = createSilentLogger();

      expect(() => {
        logger.debug("message", { key: "value" });
        logger.info("message", { key: "value" });
        logger.warn("message", { key: "value" }, new Error("test"));
        logger.error("message", { key: "value" }, new Error("test"));
      }).not.toThrow();
    });
  });

  describe("Logger management functions", () => {
    describe("setLogger and getLogger", () => {
      it("should set and get custom logger", () => {
        const customLogger = createSilentLogger();

        setLogger(customLogger);
        const retrievedLogger = getLogger();

        expect(retrievedLogger).toBe(customLogger);
      });

      it("should use custom logger for logging", () => {
        const customLogger = createSilentLogger();
        setLogger(customLogger);

        // Use getLogger to log something
        getLogger().info("test message");

        // Console should not be called since we're using silent logger
        expect(mockConsole.log).not.toHaveBeenCalled();
      });
    });

    describe("createContextLogger", () => {
      it("should create logger with base context", () => {
        const baseContext = { service: "email", version: "1.0" };
        const contextLogger = createContextLogger(baseContext);

        contextLogger.info("Test message", { userId: "123" });

        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.stringContaining(
            'Context: {"service":"email","version":"1.0","userId":"123"}'
          )
        );
      });

      it("should merge contexts correctly with priority to method context", () => {
        const baseContext = { service: "email", environment: "dev" };
        const contextLogger = createContextLogger(baseContext);

        contextLogger.info("Test message", {
          environment: "prod", // Should override base context
          userId: "123",
        });

        const loggedMessage = mockConsole.log.mock.calls[0][0];
        expect(loggedMessage).toContain('"environment":"prod"');
        expect(loggedMessage).toContain('"service":"email"');
        expect(loggedMessage).toContain('"userId":"123"');
      });

      it("should handle all log levels with context", () => {
        setLogger(createConsoleLogger("debug"));
        const baseContext = { component: "test" };
        const contextLogger = createContextLogger(baseContext);

        contextLogger.debug("debug message");
        contextLogger.info("info message");
        contextLogger.warn("warn message", {}, new Error("test"));
        contextLogger.error("error message", {}, new Error("test"));

        expect(mockConsole.log).toHaveBeenCalledTimes(2);
        expect(mockConsole.warn).toHaveBeenCalledTimes(1);
        expect(mockConsole.error).toHaveBeenCalledTimes(1);

        // Check that all calls include the base context
        const allCalls = [
          ...mockConsole.log.mock.calls,
          ...mockConsole.warn.mock.calls,
          ...mockConsole.error.mock.calls,
        ];

        allCalls.forEach((call) => {
          expect(call[0]).toContain('"component":"test"');
        });
      });
    });
  });

  describe("EmailLogger utilities", () => {
    beforeEach(() => {
      setLogger(createConsoleLogger("debug"));
    });

    describe("templateRender", () => {
      it("should log template render information", () => {
        EmailLogger.templateRender("welcome-email", 150);

        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.stringMatching(
            /DEBUG.*Template rendered.*templateName.*welcome-email.*duration.*150ms/
          )
        );
      });
    });

    describe("emailSent", () => {
      it("should log successful email send with single recipient", () => {
        EmailLogger.emailSent("user@example.com", "welcome-email");

        const loggedMessage = mockConsole.log.mock.calls[0][0];
        expect(loggedMessage).toContain("Email sent successfully");
        expect(loggedMessage).toContain('"recipients":1');
        expect(loggedMessage).toContain('"to":["user@example.com"]');
        expect(loggedMessage).toContain('"templateName":"welcome-email"');
      });

      it("should log successful email send with multiple recipients", () => {
        const recipients = ["user1@example.com", "user2@example.com"];
        EmailLogger.emailSent(recipients, "notification");

        const loggedMessage = mockConsole.log.mock.calls[0][0];
        expect(loggedMessage).toContain("Email sent successfully");
        expect(loggedMessage).toContain('"recipients":2');
        expect(loggedMessage).toContain(
          '"to":["user1@example.com","user2@example.com"]'
        );
        expect(loggedMessage).toContain('"templateName":"notification"');
      });

      it("should handle email send without template name", () => {
        EmailLogger.emailSent("user@example.com");

        const loggedMessage = mockConsole.log.mock.calls[0][0];
        expect(loggedMessage).toContain("Email sent successfully");
        expect(loggedMessage).not.toContain("templateName");
      });
    });

    describe("smtpConnection", () => {
      it("should log SMTP connection details", () => {
        EmailLogger.smtpConnection("smtp.gmail.com", 587, true);

        const loggedMessage = mockConsole.log.mock.calls[0][0];
        expect(loggedMessage).toContain("SMTP connection established");
        expect(loggedMessage).toContain('"host":"smtp.gmail.com"');
        expect(loggedMessage).toContain('"port":587');
        expect(loggedMessage).toContain('"secure":true');
      });
    });

    describe("retryAttempt", () => {
      it("should log retry attempt with error details", () => {
        const error = new Error("Connection timeout");
        EmailLogger.retryAttempt(2, 3, error);

        const loggedMessage = mockConsole.warn.mock.calls[0][0];
        expect(loggedMessage).toContain("Email send failed, retrying");
        expect(loggedMessage).toContain('"attempt":2');
        expect(loggedMessage).toContain('"maxAttempts":3');
        expect(loggedMessage).toContain("Error: Connection timeout");
      });
    });

    describe("configLoaded", () => {
      it("should log email service configuration", () => {
        const config = {
          host: "smtp.gmail.com",
          port: 587,
          secure: true,
          auth: {
            user: "user@gmail.com",
            pass: "password",
          },
        };

        EmailLogger.configLoaded(config);

        const loggedMessage = mockConsole.log.mock.calls[0][0];
        expect(loggedMessage).toContain("Email service configured");
        expect(loggedMessage).toContain('"host":"smtp.gmail.com"');
        expect(loggedMessage).toContain('"port":587');
        expect(loggedMessage).toContain('"secure":true');
        // Should not log sensitive auth information
        expect(loggedMessage).not.toContain("password");
        expect(loggedMessage).not.toContain("auth");
      });
    });
  });

  describe("Type definitions", () => {
    it("should have correct LogLevel type", () => {
      const levels: LogLevel[] = ["debug", "info", "warn", "error"];
      expect(levels).toHaveLength(4);
    });

    it("should have correct LogContext interface", () => {
      const context: LogContext = {
        userId: "123",
        timestamp: new Date(),
        nested: { key: "value" },
      };
      expect(typeof context).toBe("object");
    });

    it("should have correct LogEntry interface", () => {
      const entry: LogEntry = {
        level: "info",
        message: "Test message",
        timestamp: new Date(),
        context: { key: "value" },
        error: new Error("Test error"),
      };

      expect(entry.level).toBe("info");
      expect(entry.message).toBe("Test message");
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.context).toEqual({ key: "value" });
      expect(entry.error).toBeInstanceOf(Error);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle null/undefined context gracefully", () => {
      const logger = createConsoleLogger("debug");

      // These should not throw errors
      expect(() => {
        logger.info("Test message", null as any);
        logger.info("Test message", undefined);
      }).not.toThrow();
    });

    it("should handle very long messages", () => {
      const logger = createConsoleLogger("debug");
      const longMessage = "x".repeat(10000);

      expect(() => {
        logger.info(longMessage);
      }).not.toThrow();

      expect(mockConsole.log).toHaveBeenCalled();
    });

    it("should handle circular references in context gracefully", () => {
      const logger = createConsoleLogger("debug");
      const circularContext: any = { key: "value" };
      circularContext.self = circularContext;

      expect(() => {
        logger.info("Test message", circularContext);
      }).not.toThrow();

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(
          /Context:.*(\[Circular\]|\[Circular Reference Detected\])/
        )
      );
    });

    it("should handle special characters in messages", () => {
      const logger = createConsoleLogger("debug");
      const specialMessage = "Message with 🚀 emojis and \n newlines \t tabs";

      expect(() => {
        logger.info(specialMessage);
      }).not.toThrow();

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining(specialMessage)
      );
    });
  });
});
