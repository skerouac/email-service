import nodemailer, { createTransport, Transporter } from "nodemailer";
import { SMTPConfig } from "../types";
import {
  BaseEmailTransport,
  EmailTransport,
  MailOptions,
  TransportConfig,
} from "./emailTransport";
import {
  SMTPConfigurationError,
  SMTPConnectionError,
  SMTPAuthenticationError,
  EmailSendError,
  wrapError,
} from "../utils/errors";
import { withRetry, RetryConfigs } from "../utils/retry";
import { getLogger, EmailLogger } from "../utils/logger";

export class NodemailerTransport
  extends BaseEmailTransport
  implements EmailTransport
{
  private transporter!: Transporter;
  private smtpConfig: SMTPConfig;
  private logger = getLogger();

  constructor(smtpConfig: SMTPConfig, config: TransportConfig = {}) {
    super(config);
    this.smtpConfig = smtpConfig;
    this.validateConfig();
    this.createTransporter();
  }

  private validateConfig(): void {
    try {
      if (!this.smtpConfig.host) {
        throw new SMTPConfigurationError("SMTP host is required");
      }

      if (
        !this.smtpConfig.port ||
        this.smtpConfig.port < 1 ||
        this.smtpConfig.port > 65535
      ) {
        throw new SMTPConfigurationError(
          "Valid SMTP port (1-65535) is required"
        );
      }

      if (!this.smtpConfig.auth?.user || !this.smtpConfig.auth?.pass) {
        throw new SMTPConfigurationError(
          "SMTP authentication credentials are required"
        );
      }
    } catch (error) {
      this.logger.error(
        "SMTP configuration validation failed",
        {
          host: this.smtpConfig.host,
          port: this.smtpConfig.port,
          hasAuth: !!this.smtpConfig.auth,
        },
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  private createTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.smtpConfig.host,
        port: this.smtpConfig.port,
        secure: this.smtpConfig.secure || false,
        auth: this.smtpConfig.auth,
        tls: this.smtpConfig.tls || { rejectUnauthorized: false },
      });

      EmailLogger.configLoaded(this.smtpConfig);
    } catch (error) {
      const wrappedError = wrapError(error, {
        host: this.smtpConfig.host,
        port: this.smtpConfig.port,
      });
      this.logger.error(
        "Failed to create SMTP transporter",
        undefined,
        wrappedError
      );
      throw wrappedError;
    }
  }

  async sendMail(options: MailOptions): Promise<void> {
    return withRetry(
      async () => {
        try {
          this.logger.debug("Sending email via SMTP", {
            to: Array.isArray(options.to) ? options.to : [options.to],
            subject: options.subject,
            hasAttachments: !!options.attachments?.length,
          });

          await this.transporter.sendMail({
            from: options.from,
            to: options.to,
            cc: options.cc,
            bcc: options.bcc,
            subject: options.subject,
            html: options.html,
            replyTo: options.replyTo,
            attachments: options.attachments,
          });

          EmailLogger.emailSent(options.to);
        } catch (error) {
          const context = {
            to: Array.isArray(options.to) ? options.to : [options.to],
            subject: options.subject,
          };

          const wrappedError = this.categorizeSmtpError(error, context);
          this.logger.error("SMTP send failed", context, wrappedError);
          throw wrappedError;
        }
      },
      this.config.retryConfig || RetryConfigs.smtp,
      {
        operation: "sendMail",
        transport: "nodemailer",
        to: Array.isArray(options.to) ? options.to.length : 1,
      }
    );
  }

  async verify(): Promise<boolean> {
    return withRetry(
      async () => {
        try {
          this.logger.debug("Verifying SMTP connection", {
            host: this.smtpConfig.host,
            port: this.smtpConfig.port,
          });

          const result = await this.transporter.verify();

          if (result) {
            EmailLogger.smtpConnection(
              this.smtpConfig.host,
              this.smtpConfig.port,
              this.smtpConfig.secure || false
            );
          }

          return result;
        } catch (error) {
          const context = {
            host: this.smtpConfig.host,
            port: this.smtpConfig.port,
          };

          const wrappedError = this.categorizeSmtpError(error, context);
          this.logger.error("SMTP verification failed", context, wrappedError);
          throw wrappedError;
        }
      },
      this.config.retryConfig || RetryConfigs.connection,
      {
        operation: "verify",
        transport: "nodemailer",
      }
    );
  }

  async close(): Promise<void> {
    try {
      this.logger.debug("Closing SMTP connection");
      this.transporter.close();
    } catch (error) {
      this.logger.warn(
        "Error closing SMTP connection",
        undefined,
        error instanceof Error ? error : undefined
      );
      // Don't throw on close errors
    }
  }

  getInfo() {
    return {
      type: "nodemailer",
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      secure: this.smtpConfig.secure || false,
      user: this.smtpConfig.auth.user,
    };
  }

  private categorizeSmtpError(
    error: unknown,
    context?: Record<string, any>
  ): EmailSendError | SMTPConnectionError | SMTPAuthenticationError {
    if (!(error instanceof Error)) {
      return new EmailSendError(
        `Unknown SMTP error: ${String(error)}`,
        undefined,
        context
      );
    }

    const message = error.message.toLowerCase();

    // Authentication errors
    if (
      message.includes("auth") ||
      message.includes("login") ||
      message.includes("password")
    ) {
      return new SMTPAuthenticationError(
        `SMTP authentication failed: ${error.message}`,
        error,
        context
      );
    }

    // Connection errors
    if (
      message.includes("connect") ||
      message.includes("timeout") ||
      message.includes("enotfound")
    ) {
      return new SMTPConnectionError(
        `SMTP connection failed: ${error.message}`,
        error,
        context
      );
    }

    // Default to send error
    return new EmailSendError(
      `SMTP send failed: ${error.message}`,
      error,
      context
    );
  }
}
