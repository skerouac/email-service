export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
  error?: Error;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext, error?: Error): void;
  error(message: string, context?: LogContext, error?: Error): void;
}

class ConsoleLogger implements Logger {
  constructor(private minLevel: LogLevel = "info") {}

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);

    let message = `[${timestamp}] ${level} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      try {
        message += ` | Context: ${JSON.stringify(entry.context)}`;
      } catch (error) {
        // Handle circular references gracefully
        message += ` | Context: [Circular Reference Detected]`;
      }
    }

    if (entry.error) {
      message += ` | Error: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\nStack: ${entry.error.stack}`;
      }
    }

    return message;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
    };

    const formatted = this.formatEntry(entry);

    switch (level) {
      case "debug":
      case "info":
        console.log(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "error":
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log("warn", message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log("error", message, context, error);
  }
}

// Silent logger for testing
class SilentLogger implements Logger {
  debug(message: string, context?: LogContext): void {}
  info(message: string, context?: LogContext): void {}
  warn(message: string, context?: LogContext, error?: Error): void {}
  error(message: string, context?: LogContext, error?: Error): void {}
}

// Default logger instance
let defaultLogger: Logger = new ConsoleLogger();

export function setLogger(logger: Logger): void {
  defaultLogger = logger;
}

export function getLogger(): Logger {
  return defaultLogger;
}

// Convenience function to create a logger with context
export function createContextLogger(baseContext: LogContext): Logger {
  const baseLogger = getLogger();

  return {
    debug: (message: string, context?: LogContext) =>
      baseLogger.debug(message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) =>
      baseLogger.info(message, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext, error?: Error) =>
      baseLogger.warn(message, { ...baseContext, ...context }, error),
    error: (message: string, context?: LogContext, error?: Error) =>
      baseLogger.error(message, { ...baseContext, ...context }, error),
  };
}

// Factory functions
export const createConsoleLogger = (minLevel: LogLevel = "info") =>
  new ConsoleLogger(minLevel);

export const createSilentLogger = () => new SilentLogger();

// Email-specific logging helpers
export const EmailLogger = {
  templateRender: (templateName: string, duration: number) =>
    getLogger().debug("Template rendered", {
      templateName,
      duration: `${duration}ms`,
    }),

  emailSent: (to: string | string[], templateName?: string) =>
    getLogger().info("Email sent successfully", {
      recipients: Array.isArray(to) ? to.length : 1,
      to: Array.isArray(to) ? to : [to],
      templateName,
    }),

  smtpConnection: (host: string, port: number, secure: boolean) =>
    getLogger().debug("SMTP connection established", {
      host,
      port,
      secure,
    }),

  retryAttempt: (attempt: number, maxAttempts: number, error: Error) =>
    getLogger().warn(
      "Email send failed, retrying",
      {
        attempt,
        maxAttempts,
      },
      error
    ),

  configLoaded: (config: Record<string, any>) =>
    getLogger().info("Email service configured", {
      smtp: {
        host: config.host,
        port: config.port,
        secure: config.secure,
      },
    }),
};
