import { jest } from "@jest/globals";

// Mock logger FIRST, before any imports
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock the logger module
jest.mock("../../../src/utils/logger", () => ({
  getLogger: jest.fn(() => mockLogger),
}));

// Mock the isRetryableError function
const mockIsRetryableError = jest.fn();
jest.mock("../../../src/utils/errors", () => ({
  isRetryableError: mockIsRetryableError,
  EmailError: class MockEmailError extends Error {
    public code = "";
    public retryable = false;
    public context?: Record<string, any>;

    constructor(message: string, cause?: Error, context?: Record<string, any>) {
      super(message);
      this.cause = cause;
      this.context = context;
    }
  },
}));

// Now import the modules after mocking
import {
  RetryableOperation,
  withRetry,
  DEFAULT_RETRY_CONFIG,
  RetryConfigs,
  type RetryConfig,
} from "../../../src/utils/retry";

import { EmailError } from "../../../src/utils/errors";

// Mock setTimeout to make tests run faster
const originalSetTimeout = global.setTimeout;
let mockSetTimeout: jest.MockedFunction<any>;

describe("RetryableOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset setTimeout mock - execute callback synchronously for fast tests
    mockSetTimeout = jest
      .fn<any>()
      .mockImplementation((callback: () => void, delay?: number) => {
        // For sleep() method: execute the callback (which is resolve function) synchronously
        if (typeof callback === "function") {
          callback();
        }
        return 123 as any; // Return a mock timer ID
      }) as any;
    global.setTimeout = mockSetTimeout as any;
  });

  afterEach(() => {
    global.setTimeout = originalSetTimeout;
  });

  describe("constructor", () => {
    it("should use default config when no config provided", () => {
      const retryable = new RetryableOperation();
      expect(retryable).toBeInstanceOf(RetryableOperation);
    });

    it("should merge provided config with defaults", () => {
      const customConfig: Partial<RetryConfig> = {
        maxAttempts: 5,
        initialDelay: 2000,
      };

      const retryable = new RetryableOperation(customConfig);
      expect(retryable).toBeInstanceOf(RetryableOperation);
    });
  });

  describe("execute - successful operations", () => {
    it("should execute operation successfully on first attempt", async () => {
      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockResolvedValue("success");
      const retryable = new RetryableOperation();

      const result = await retryable.execute(mockOperation);

      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledWith("Executing operation", {
        attempt: 1,
        maxAttempts: 3,
      });
      expect(mockLogger.info).not.toHaveBeenCalled(); // No retry info for first attempt
    });

    it("should execute operation successfully on second attempt", async () => {
      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error("Temporary failure"))
        .mockResolvedValue("success");

      mockIsRetryableError.mockReturnValueOnce(true);

      const retryable = new RetryableOperation();
      const result = await retryable.execute(mockOperation, {
        context: "test",
      });

      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Operation succeeded after retry",
        {
          attempt: 2,
          totalDelay: expect.any(Number),
          context: "test",
        }
      );
    });

    it("should pass context to all log messages", async () => {
      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockResolvedValue("success");
      const retryable = new RetryableOperation();
      const context = { operation: "test-op", id: "123" };

      await retryable.execute(mockOperation, context);

      expect(mockLogger.debug).toHaveBeenCalledWith("Executing operation", {
        attempt: 1,
        maxAttempts: 3,
        operation: "test-op",
        id: "123",
      });
    });
  });

  describe("execute - failed operations", () => {
    it("should fail immediately on non-retryable error", async () => {
      const error = new Error("Non-retryable error");
      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockRejectedValue(error);
      mockIsRetryableError.mockReturnValue(false);

      const retryable = new RetryableOperation();

      await expect(retryable.execute(mockOperation)).rejects.toThrow(
        "Non-retryable error"
      );
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Operation failed",
        {
          attempt: 1,
          maxAttempts: 3,
          willRetry: false,
          error: "Non-retryable error",
        },
        error
      );
    });

    it("should fail after max attempts with retryable errors", async () => {
      const error = new Error("Retryable error");
      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockRejectedValue(error);
      mockIsRetryableError.mockReturnValue(true);

      const retryable = new RetryableOperation({ maxAttempts: 2 });

      await expect(retryable.execute(mockOperation)).rejects.toThrow(
        "Retryable error"
      );
      expect(mockOperation).toHaveBeenCalledTimes(2);

      // Should log failure for each attempt
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
      expect(mockLogger.warn).toHaveBeenNthCalledWith(
        1,
        "Operation failed",
        {
          attempt: 1,
          maxAttempts: 2,
          willRetry: true,
          error: "Retryable error",
        },
        error
      );
      expect(mockLogger.warn).toHaveBeenNthCalledWith(
        2,
        "Operation failed",
        {
          attempt: 2,
          maxAttempts: 2,
          willRetry: false,
          error: "Retryable error",
        },
        error
      );
    });

    it("should wrap non-Error objects in Error instances", async () => {
      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockRejectedValue("string error");
      mockIsRetryableError.mockReturnValue(false);

      const retryable = new RetryableOperation();

      await expect(retryable.execute(mockOperation)).rejects.toThrow(
        "string error"
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Operation failed",
        expect.objectContaining({
          error: "string error",
        }),
        expect.any(Error)
      );
    });
  });

  describe("execute - EmailError handling", () => {
    it("should create new EmailError with retry context", async () => {
      class TestEmailError extends EmailError {
        public code = "SMTP001";
        public retryable = true;

        constructor(
          message: string,
          cause?: Error,
          context?: Record<string, any>
        ) {
          super(message, cause, context);
        }
      }

      const originalError = new TestEmailError("SMTP error", undefined, {
        code: "SMTP001",
      });
      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockRejectedValue(originalError);
      mockIsRetryableError.mockReturnValue(false);

      const retryable = new RetryableOperation();

      try {
        await retryable.execute(mockOperation, { operation: "send-email" });
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(TestEmailError);
        expect((error as TestEmailError).message).toBe(
          "Operation failed after 1 attempts: SMTP error"
        );
        expect((error as TestEmailError).context).toEqual({
          attempts: 1,
          allErrors: ["SMTP error"],
          operation: "send-email",
          code: "SMTP001",
        });
      }
    });
  });

  describe("delay calculation", () => {
    it("should calculate exponential backoff correctly", async () => {
      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error("Error 1"))
        .mockRejectedValueOnce(new Error("Error 2"))
        .mockResolvedValue("success");

      mockIsRetryableError.mockReturnValue(true);

      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: false, // Disable jitter for predictable testing
      };

      const retryable = new RetryableOperation(config);
      await retryable.execute(mockOperation);

      // First retry: 1000ms, second retry: 2000ms
      expect(mockSetTimeout).toHaveBeenCalledTimes(2);
      expect(mockSetTimeout).toHaveBeenNthCalledWith(
        1,
        expect.any(Function),
        1000
      );
      expect(mockSetTimeout).toHaveBeenNthCalledWith(
        2,
        expect.any(Function),
        2000
      );
    });

    it("should respect maximum delay", async () => {
      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error("Error 1"))
        .mockRejectedValueOnce(new Error("Error 2"))
        .mockResolvedValue("success");

      mockIsRetryableError.mockReturnValue(true);

      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelay: 5000,
        maxDelay: 8000, // Lower than calculated second delay (10000)
        backoffMultiplier: 2,
        jitter: false,
      };

      const retryable = new RetryableOperation(config);
      await retryable.execute(mockOperation);

      expect(mockSetTimeout).toHaveBeenNthCalledWith(
        1,
        expect.any(Function),
        5000
      );
      expect(mockSetTimeout).toHaveBeenNthCalledWith(
        2,
        expect.any(Function),
        8000
      ); // Capped at maxDelay
    });

    it("should apply jitter when enabled", async () => {
      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error("Error 1"))
        .mockResolvedValue("success");

      mockIsRetryableError.mockReturnValue(true);

      // Mock Math.random to return predictable values
      const originalRandom = Math.random;
      Math.random = jest.fn<() => number>().mockReturnValue(0.5); // This should result in no jitter change

      const config: RetryConfig = {
        maxAttempts: 2,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: true,
      };

      const retryable = new RetryableOperation(config);
      await retryable.execute(mockOperation);

      // With jitter enabled, delay should be calculated
      expect(mockSetTimeout).toHaveBeenCalledTimes(1);
      expect(mockSetTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Number)
      );

      Math.random = originalRandom;
    });

    it("should never return negative delay", async () => {
      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error("Error 1"))
        .mockResolvedValue("success");

      mockIsRetryableError.mockReturnValue(true);

      // Mock Math.random to return value that would create negative jitter
      const originalRandom = Math.random;
      Math.random = jest.fn<() => number>().mockReturnValue(0); // This creates maximum negative jitter

      const config: RetryConfig = {
        maxAttempts: 2,
        initialDelay: 100,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: true,
      };

      const retryable = new RetryableOperation(config);
      await retryable.execute(mockOperation);

      // Delay should be at least 0
      const [, delay] = mockSetTimeout.mock.calls[0];
      expect(delay).toBeGreaterThanOrEqual(0);

      Math.random = originalRandom;
    });
  });

  describe("logging behavior", () => {
    it("should log debug message for each attempt", async () => {
      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error("Retryable error"))
        .mockResolvedValue("success");

      mockIsRetryableError.mockReturnValue(true);

      const retryable = new RetryableOperation();
      await retryable.execute(mockOperation, { context: "test" });

      expect(mockLogger.debug).toHaveBeenCalledTimes(3); // 2 operation attempts + 1 wait message
      expect(mockLogger.debug).toHaveBeenNthCalledWith(
        1,
        "Executing operation",
        {
          attempt: 1,
          maxAttempts: 3,
          context: "test",
        }
      );
      expect(mockLogger.debug).toHaveBeenNthCalledWith(
        2,
        "Waiting before retry",
        {
          delay: expect.stringMatching(/^\d+ms$/),
          nextAttempt: 2,
          context: "test",
        }
      );
      expect(mockLogger.debug).toHaveBeenNthCalledWith(
        3,
        "Executing operation",
        {
          attempt: 2,
          maxAttempts: 3,
          context: "test",
        }
      );
    });
  });
});

describe("withRetry convenience function", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock setTimeout for convenience function tests too
    mockSetTimeout = jest
      .fn<any>()
      .mockImplementation((callback: () => void) => {
        if (typeof callback === "function") {
          callback();
        }
        return 123 as any;
      }) as any;
    global.setTimeout = mockSetTimeout as any;
  });

  afterEach(() => {
    global.setTimeout = originalSetTimeout;
  });

  it("should execute operation with default config", async () => {
    const mockOperation = jest
      .fn<() => Promise<string>>()
      .mockResolvedValue("success");

    const result = await withRetry(mockOperation);

    expect(result).toBe("success");
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it("should execute operation with custom config", async () => {
    const mockOperation = jest
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("Error"))
      .mockResolvedValue("success");

    mockIsRetryableError.mockReturnValue(true);

    const result = await withRetry(
      mockOperation,
      { maxAttempts: 2, initialDelay: 500 },
      { operation: "test" }
    );

    expect(result).toBe("success");
    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it("should pass context correctly", async () => {
    const mockOperation = jest
      .fn<() => Promise<string>>()
      .mockResolvedValue("success");

    await withRetry(mockOperation, undefined, { context: "test" });

    expect(mockLogger.debug).toHaveBeenCalledWith("Executing operation", {
      attempt: 1,
      maxAttempts: 3,
      context: "test",
    });
  });
});

describe("RetryConfigs", () => {
  it("should have predefined configurations", () => {
    expect(RetryConfigs.smtp).toEqual({
      maxAttempts: 3,
      initialDelay: 2000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true,
    });

    expect(RetryConfigs.template).toEqual({
      maxAttempts: 2,
      initialDelay: 500,
      maxDelay: 2000,
      backoffMultiplier: 2,
      jitter: false,
    });

    expect(RetryConfigs.connection).toEqual({
      maxAttempts: 5,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 1.5,
      jitter: true,
    });
  });

  it("should work with RetryableOperation", async () => {
    const mockOperation = jest
      .fn<() => Promise<string>>()
      .mockResolvedValue("success");
    const retryable = new RetryableOperation(RetryConfigs.smtp);

    const result = await retryable.execute(mockOperation);

    expect(result).toBe("success");
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });
});

describe("DEFAULT_RETRY_CONFIG", () => {
  it("should have correct default values", () => {
    expect(DEFAULT_RETRY_CONFIG).toEqual({
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
    });
  });
});

describe("edge cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSetTimeout = jest
      .fn<any>()
      .mockImplementation((callback: () => void) => {
        if (typeof callback === "function") {
          callback();
        }
        return 123 as any;
      }) as any;
    global.setTimeout = mockSetTimeout as any;
  });

  afterEach(() => {
    global.setTimeout = originalSetTimeout;
  });

  it("should handle maxAttempts of 1 (no retries)", async () => {
    const error = new Error("Single attempt error");
    const mockOperation = jest
      .fn<() => Promise<string>>()
      .mockRejectedValue(error);
    mockIsRetryableError.mockReturnValue(true);

    const retryable = new RetryableOperation({ maxAttempts: 1 });

    await expect(retryable.execute(mockOperation)).rejects.toThrow(
      "Single attempt error"
    );
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockSetTimeout).not.toHaveBeenCalled(); // No retries
  });

  it("should handle very small delays", async () => {
    const mockOperation = jest
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("Error"))
      .mockResolvedValue("success");

    mockIsRetryableError.mockReturnValue(true);

    const retryable = new RetryableOperation({
      initialDelay: 1,
      maxDelay: 2,
      jitter: false,
    });

    await retryable.execute(mockOperation);

    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1);
  });

  it("should handle undefined/null context gracefully", async () => {
    const mockOperation = jest
      .fn<() => Promise<string>>()
      .mockResolvedValue("success");
    const retryable = new RetryableOperation();

    const result = await retryable.execute(mockOperation, undefined);

    expect(result).toBe("success");
    expect(mockLogger.debug).toHaveBeenCalledWith("Executing operation", {
      attempt: 1,
      maxAttempts: 3,
    });
  });
});
