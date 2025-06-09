import React from "react";
import { render } from "@react-email/render";
import {
  CustomEmailOptions,
  EmailTemplate,
  SMTPConfig,
  TemplateEmailOptions,
} from "./types";
import { validateEmailOptionsStrict } from "./utils/validation";
import {
  getTemplate,
  getTemplateSubject,
  TemplateDefinition,
} from "./templateResolver";
import { initializeTemplates } from "./autoRegistration";
import { EmailTransport, MailOptions } from "./transport/emailTransport";
import { NodemailerTransport } from "./transport/nodemailerTransport";
import { TemplateRenderError, EmailSendError, wrapError } from "./utils/errors";
import { withRetry, RetryConfigs } from "./utils/retry";
import { getLogger, createContextLogger, EmailLogger } from "./utils/logger";

export interface EmailServiceConfig {
  defaultFrom?: string;
  autoInitializeTemplates?: boolean;
  customTemplates?: TemplateDefinition[];
  retryConfig?: {
    template: typeof RetryConfigs.template;
    smtp: typeof RetryConfigs.smtp;
  };
}

export interface EmailService {
  sendTemplateEmail(options: TemplateEmailOptions): Promise<void>;
  sendCustomEmail(options: CustomEmailOptions): Promise<void>;
  previewTemplate(
    templateName: EmailTemplate,
    props: Record<string, any>
  ): Promise<string>;
  previewCustomComponent(
    component: React.ComponentType,
    props: Record<string, any>
  ): Promise<string>;
  testConnection(): Promise<boolean>;
  close(): Promise<void>;
  getTransportInfo(): { type: string; [key: string]: any };
}

export class EmailServiceImplementation implements EmailService {
  private transport: EmailTransport;
  private config: EmailServiceConfig;
  private logger = createContextLogger({ service: "EmailService" });
  private initialized = false;

  constructor(transport: EmailTransport, config: EmailServiceConfig = {}) {
    this.transport = transport;
    this.config = config;

    this.logger.info("Email service initialized", {
      transportType: transport.getInfo().type,
      hasDefaultFrom: !!config.defaultFrom,
      autoInitializeTemplates: config.autoInitializeTemplates !== false,
    });

    // Auto-initialize templates if not disabled
    if (config.autoInitializeTemplates !== false) {
      this.initializeTemplates();
    }
  }

  private async initializeTemplates(): Promise<void> {
    if (this.initialized) return;

    try {
      await initializeTemplates({
        autoRegisterBuiltIn: true,
        customTemplates: this.config.customTemplates || [],
      });
      this.initialized = true;
      this.logger.info("Templates auto-initialized");
    } catch (error) {
      this.logger.warn(
        "Template auto-initialization failed",
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      this.logger.debug("Testing email service connection");
      const result = await this.transport.verify();

      if (result) {
        this.logger.info("Email service connection verified");
      } else {
        this.logger.warn("Email service connection verification failed");
      }

      return result;
    } catch (error) {
      const wrappedError = wrapError(error, { operation: "testConnection" });
      this.logger.error("Connection test failed", undefined, wrappedError);
      throw wrappedError;
    }
  }

  async sendTemplateEmail(options: TemplateEmailOptions): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.debug("Starting template email send", {
        templateName: options.templateName,
        recipients: Array.isArray(options.to) ? options.to.length : 1,
      });

      validateEmailOptionsStrict(options);

      // Ensure templates are initialized
      if (!this.initialized) {
        await this.initializeTemplates();
      }

      const html = await this.renderTemplate(
        options.templateName,
        options.templateProps
      );

      const subject =
        options.subject ||
        getTemplateSubject(options.templateName, options.templateProps);

      const mailOptions: MailOptions = {
        from: options.from || this.config.defaultFrom || "",
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject,
        html,
        replyTo: options.replyTo,
        attachments: options.attachments,
      };

      await withRetry(
        () => this.transport.sendMail(mailOptions),
        this.config.retryConfig?.smtp || RetryConfigs.smtp,
        {
          operation: "sendTemplateEmail",
          templateName: options.templateName,
          recipients: Array.isArray(options.to) ? options.to.length : 1,
        }
      );

      const duration = Date.now() - startTime;
      this.logger.info("Template email sent successfully", {
        templateName: options.templateName,
        recipients: Array.isArray(options.to) ? options.to.length : 1,
        duration: `${duration}ms`,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const context = {
        templateName: options.templateName,
        recipients: Array.isArray(options.to) ? options.to.length : 1,
        duration: `${duration}ms`,
      };

      const wrappedError = wrapError(error, context);
      this.logger.error("Failed to send template email", context, wrappedError);
      throw wrappedError;
    }
  }

  async sendCustomEmail(options: CustomEmailOptions): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.debug("Starting custom email send", {
        componentName: options.component.name || "AnonymousComponent",
        recipients: Array.isArray(options.to) ? options.to.length : 1,
      });

      validateEmailOptionsStrict(options);

      if (!options.subject) {
        throw new EmailSendError(
          "Subject is required for custom emails",
          undefined,
          { componentName: options.component.name }
        );
      }

      const html = await this.renderCustomComponent(
        options.component,
        options.props
      );

      const mailOptions: MailOptions = {
        from: options.from || this.config.defaultFrom || "",
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html,
        replyTo: options.replyTo,
        attachments: options.attachments,
      };

      await withRetry(
        () => this.transport.sendMail(mailOptions),
        this.config.retryConfig?.smtp || RetryConfigs.smtp,
        {
          operation: "sendCustomEmail",
          componentName: options.component.name || "AnonymousComponent",
          recipients: Array.isArray(options.to) ? options.to.length : 1,
        }
      );

      const duration = Date.now() - startTime;
      this.logger.info("Custom email sent successfully", {
        componentName: options.component.name || "AnonymousComponent",
        recipients: Array.isArray(options.to) ? options.to.length : 1,
        duration: `${duration}ms`,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const context = {
        componentName: options.component.name || "AnonymousComponent",
        recipients: Array.isArray(options.to) ? options.to.length : 1,
        duration: `${duration}ms`,
      };

      const wrappedError = wrapError(error, context);
      this.logger.error("Failed to send custom email", context, wrappedError);
      throw wrappedError;
    }
  }

  async previewTemplate(
    templateName: EmailTemplate,
    props: Record<string, any>
  ): Promise<string> {
    try {
      this.logger.debug("Generating template preview", { templateName });

      // Ensure templates are initialized
      if (!this.initialized) {
        await this.initializeTemplates();
      }

      return await this.renderTemplate(templateName, props);
    } catch (error) {
      const wrappedError = wrapError(error, {
        operation: "previewTemplate",
        templateName,
      });
      this.logger.error(
        "Failed to generate template preview",
        { templateName },
        wrappedError
      );
      throw wrappedError;
    }
  }

  async previewCustomComponent(
    component: React.ComponentType,
    props: Record<string, any>
  ): Promise<string> {
    try {
      const componentName = component.name || "AnonymousComponent";
      this.logger.debug("Generating custom component preview", {
        componentName,
      });
      return await this.renderCustomComponent(component, props);
    } catch (error) {
      const componentName = component.name || "AnonymousComponent";
      const wrappedError = wrapError(error, {
        operation: "previewCustomComponent",
        componentName,
      });
      this.logger.error(
        "Failed to generate component preview",
        { componentName },
        wrappedError
      );
      throw wrappedError;
    }
  }

  async close(): Promise<void> {
    try {
      this.logger.debug("Closing email service");
      await this.transport.close();
      this.logger.info("Email service closed successfully");
    } catch (error) {
      this.logger.warn(
        "Error closing email service",
        undefined,
        error instanceof Error ? error : undefined
      );
      // Don't throw on close errors
    }
  }

  getTransportInfo(): { type: string; [key: string]: any } {
    return this.transport.getInfo();
  }

  private async renderTemplate(
    templateName: EmailTemplate,
    props: Record<string, any>
  ): Promise<string> {
    return withRetry(
      async () => {
        try {
          const startTime = Date.now();
          const template = getTemplate(templateName);
          const html = await render(React.createElement(template, props));
          const duration = Date.now() - startTime;

          EmailLogger.templateRender(templateName, duration);
          return html;
        } catch (error) {
          throw new TemplateRenderError(
            `Failed to render template ${templateName}: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error : undefined,
            { templateName, props: Object.keys(props) }
          );
        }
      },
      this.config.retryConfig?.template || RetryConfigs.template,
      {
        operation: "renderTemplate",
        templateName,
      }
    );
  }

  private async renderCustomComponent(
    component: React.ComponentType,
    props: Record<string, any>
  ): Promise<string> {
    return withRetry(
      async () => {
        try {
          const startTime = Date.now();
          const html = await render(React.createElement(component, props));
          const duration = Date.now() - startTime;

          this.logger.debug("Custom component rendered", {
            componentName: component.name || "AnonymousComponent",
            duration: `${duration}ms`,
          });

          return html;
        } catch (error) {
          const componentName = component.name || "AnonymousComponent";
          throw new TemplateRenderError(
            `Failed to render component ${componentName}: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error : undefined,
            { componentName, props: Object.keys(props) }
          );
        }
      },
      this.config.retryConfig?.template || RetryConfigs.template,
      {
        operation: "renderCustomComponent",
        componentName: component.name || "AnonymousComponent",
      }
    );
  }
}

export function createEmailService(
  config: SMTPConfig,
  serviceConfig?: EmailServiceConfig
): EmailService {
  const transport = new NodemailerTransport(config);
  return new EmailServiceImplementation(transport, serviceConfig);
}

export function createEmailServiceWithTransport(
  transport: EmailTransport,
  config?: EmailServiceConfig
): EmailService {
  return new EmailServiceImplementation(transport, config);
}
