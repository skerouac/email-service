import { isRetryableError, EmailError } from "./errors";
import { getLogger } from "./logger";

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitter: true,
};

export interface RetryState {
  attempt: number;
  totalDelay: number;
  errors: Error[];
}

export class RetryableOperation<T> {
  private config: RetryConfig;
  private logger = getLogger();

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  async execute<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const state: RetryState = {
      attempt: 0,
      totalDelay: 0,
      errors: [],
    };

    while (state.attempt < this.config.maxAttempts) {
      state.attempt++;

      try {
        this.logger.debug("Executing operation", {
          attempt: state.attempt,
          maxAttempts: this.config.maxAttempts,
          ...context,
        });

        const result = await operation();

        if (state.attempt > 1) {
          this.logger.info("Operation succeeded after retry", {
            attempt: state.attempt,
            totalDelay: state.totalDelay,
            ...context,
          });
        }

        return result;
      } catch (error) {
        const wrappedError =
          error instanceof Error ? error : new Error(String(error));
        state.errors.push(wrappedError);

        const isLastAttempt = state.attempt >= this.config.maxAttempts;
        const shouldRetry = !isLastAttempt && isRetryableError(wrappedError);

        this.logger.warn(
          "Operation failed",
          {
            attempt: state.attempt,
            maxAttempts: this.config.maxAttempts,
            willRetry: shouldRetry,
            error: wrappedError.message,
            ...context,
          },
          wrappedError
        );

        if (!shouldRetry) {
          // Throw the most recent error with context about all attempts
          if (error instanceof EmailError) {
            // Create a new error of the same type with retry context
            const ErrorClass = error.constructor as new (
              message: string,
              cause?: Error,
              context?: Record<string, any>
            ) => EmailError;

            throw new ErrorClass(
              `Operation failed after ${state.attempt} attempts: ${error.message}`,
              error,
              {
                attempts: state.attempt,
                allErrors: state.errors.map((e) => e.message),
                ...context,
                ...error.context,
              }
            );
          }
          throw wrappedError;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(state.attempt);
        state.totalDelay += delay;

        this.logger.debug("Waiting before retry", {
          delay: `${delay}ms`,
          nextAttempt: state.attempt + 1,
          ...context,
        });

        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw state.errors[state.errors.length - 1];
  }

  private calculateDelay(attempt: number): number {
    // Exponential backoff: initialDelay * (backoffMultiplier ^ (attempt - 1))
    let delay =
      this.config.initialDelay *
      Math.pow(this.config.backoffMultiplier, attempt - 1);

    // Cap at maxDelay
    delay = Math.min(delay, this.config.maxDelay);

    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      const jitterRange = delay * 0.1; // 10% jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }

    return Math.max(0, Math.round(delay));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Convenience function for simple retry operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>,
  context?: Record<string, any>
): Promise<T> {
  const retryable = new RetryableOperation(config);
  return retryable.execute(operation, context);
}

// Specific retry configurations for different operations
export const RetryConfigs = {
  smtp: {
    maxAttempts: 3,
    initialDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
  },

  template: {
    maxAttempts: 2,
    initialDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 2,
    jitter: false,
  },

  connection: {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 1.5,
    jitter: true,
  },
} as const;
