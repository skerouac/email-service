export abstract class EmailError extends Error {
  abstract readonly code: string;
  abstract readonly retryable: boolean;

  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class SMTPConfigurationError extends EmailError {
  readonly code = "SMTP_CONFIG_ERROR";
  readonly retryable = false;
}

export class SMTPConnectionError extends EmailError {
  readonly code = "SMTP_CONNECTION_ERROR";
  readonly retryable = true;
}

export class SMTPAuthenticationError extends EmailError {
  readonly code = "SMTP_AUTH_ERROR";
  readonly retryable = false;
}

export class EmailValidationError extends EmailError {
  readonly code = "EMAIL_VALIDATION_ERROR";
  readonly retryable = false;
}

export class TemplateNotFoundError extends EmailError {
  readonly code = "TEMPLATE_NOT_FOUND";
  readonly retryable = false;
}

export class TemplateRenderError extends EmailError {
  readonly code = "TEMPLATE_RENDER_ERROR";
  readonly retryable = false;
}

export class EmailSendError extends EmailError {
  readonly code = "EMAIL_SEND_ERROR";
  readonly retryable = true;
}

export class RateLimitError extends EmailError {
  readonly code = "RATE_LIMIT_ERROR";
  readonly retryable = true;
}

export class AttachmentError extends EmailError {
  readonly code = "ATTACHMENT_ERROR";
  readonly retryable = false;
}

export function isRetryableError(error: unknown): boolean {
  // Handle EmailError instances first
  if (error instanceof EmailError) {
    return error.retryable;
  }

  // Safely check if error is an Error-like object with a message
  if (!error || typeof error !== "object" || !("message" in error)) {
    return false;
  }

  // Type guard to ensure message is a string
  const errorWithMessage = error as { message: unknown };
  if (typeof errorWithMessage.message !== "string") {
    return false;
  }

  // At this point, TypeScript knows message is a string
  const message = errorWithMessage.message;

  // Known transient nodemailer errors
  const transientMessages = [
    "ETIMEDOUT",
    "ECONNRESET",
    "ENOTFOUND",
    "ECONNREFUSED",
    "timeout",
    "network",
  ];

  return transientMessages.some((msg) =>
    message.toLowerCase().includes(msg.toLowerCase())
  );
}

export function wrapError(
  error: unknown,
  context?: Record<string, any>
): EmailError {
  if (error instanceof EmailError) {
    return error;
  }

  if (error instanceof Error) {
    // Try to categorize based on message - use case-insensitive matching
    const message = error.message.toLowerCase();

    if (message.includes("auth")) {
      return new SMTPAuthenticationError(
        `Authentication failed: ${error.message}`,
        error,
        context
      );
    }

    if (message.includes("connect")) {
      return new SMTPConnectionError(
        `Connection failed: ${error.message}`,
        error,
        context
      );
    }

    // Default to send error for unknown errors
    return new EmailSendError(
      `Email operation failed: ${error.message}`,
      error,
      context
    );
  }

  // Handle non-Error values (strings, numbers, objects, null, undefined)
  return new EmailSendError(
    `Unknown error occurred: ${String(error)}`,
    undefined,
    context
  );
}
