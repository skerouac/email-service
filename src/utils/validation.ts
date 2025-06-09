import {
  CustomEmailOptions,
  EmailOptions,
  SMTPConfig,
  TemplateEmailOptions,
} from "../types";
import { EmailValidationError } from "./errors";

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// Enhanced email regex with better validation
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Domain validation for common issues
const SUSPICIOUS_DOMAINS = [
  "test.com",
  "example.com",
  "localhost",
  "test.local",
  "example.org",
  "example.net",
];

const DISPOSABLE_EMAIL_DOMAINS = [
  "10minutemail.com",
  "guerrillamail.com",
  "tempmail.org",
  "mailinator.com",
  "throwaway.email",
];

/**
 * Enhanced email validation
 */
export function validateEmailAddress(
  email: string,
  options: {
    allowDisposable?: boolean;
    allowSuspicious?: boolean;
    strict?: boolean;
  } = {}
): ValidationResult {
  const {
    allowDisposable = true,
    allowSuspicious = true,
    strict = false,
  } = options;
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Basic format validation
  if (!email || typeof email !== "string") {
    errors.push({
      field: "email",
      message: "Email address is required and must be a string",
      code: "MISSING_EMAIL",
      value: email,
    });
    return { valid: false, errors, warnings };
  }

  // Trim and normalize
  const normalizedEmail = email.trim().toLowerCase();

  // Length validation
  if (normalizedEmail.length > 254) {
    errors.push({
      field: "email",
      message: "Email address is too long (max 254 characters)",
      code: "EMAIL_TOO_LONG",
      value: email,
    });
  }

  // Format validation
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    errors.push({
      field: "email",
      message: "Invalid email address format",
      code: "INVALID_EMAIL_FORMAT",
      value: email,
    });
    return { valid: false, errors, warnings };
  }

  // Split email parts
  const [localPart, domain] = normalizedEmail.split("@");

  // Local part validation
  if (localPart.length > 64) {
    errors.push({
      field: "email",
      message: "Email local part is too long (max 64 characters)",
      code: "LOCAL_PART_TOO_LONG",
      value: localPart,
    });
  }

  // Domain validation
  if (!domain || domain.length === 0) {
    errors.push({
      field: "email",
      message: "Email domain is missing",
      code: "MISSING_DOMAIN",
      value: email,
    });
  } else {
    // Check for suspicious domains
    if (!allowSuspicious && SUSPICIOUS_DOMAINS.includes(domain)) {
      if (strict) {
        errors.push({
          field: "email",
          message: `Suspicious email domain: ${domain}`,
          code: "SUSPICIOUS_DOMAIN",
          value: domain,
        });
      } else {
        warnings.push({
          field: "email",
          message: `Using test/example domain: ${domain}`,
          suggestion: "Consider using a real domain for production",
        });
      }
    }

    // Check for disposable email domains
    if (!allowDisposable && DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
      if (strict) {
        errors.push({
          field: "email",
          message: `Disposable email domain not allowed: ${domain}`,
          code: "DISPOSABLE_EMAIL",
          value: domain,
        });
      } else {
        warnings.push({
          field: "email",
          message: `Disposable email domain detected: ${domain}`,
          suggestion: "Consider requiring permanent email addresses",
        });
      }
    }

    // Basic domain format validation
    if (
      !domain.includes(".") ||
      domain.startsWith(".") ||
      domain.endsWith(".")
    ) {
      errors.push({
        field: "email",
        message: "Invalid domain format",
        code: "INVALID_DOMAIN_FORMAT",
        value: domain,
      });
    }
  }

  // Additional strict mode validations
  if (strict) {
    // Check for consecutive dots
    if (normalizedEmail.includes("..")) {
      errors.push({
        field: "email",
        message: "Email address contains consecutive dots",
        code: "CONSECUTIVE_DOTS",
        value: email,
      });
    }

    // Check for starting/ending dots in local part
    if (localPart.startsWith(".") || localPart.endsWith(".")) {
      errors.push({
        field: "email",
        message: "Email local part cannot start or end with a dot",
        code: "INVALID_LOCAL_PART_DOTS",
        value: localPart,
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Enhanced SMTP configuration validation
 */
export function validateSMTPConfig(config: SMTPConfig): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!config) {
    errors.push({
      field: "config",
      message: "SMTP configuration is required",
      code: "MISSING_CONFIG",
    });
    return { valid: false, errors, warnings };
  }

  // Host validation
  if (!config.host || typeof config.host !== "string") {
    errors.push({
      field: "host",
      message: "SMTP host is required and must be a string",
      code: "MISSING_HOST",
      value: config.host,
    });
  } else {
    // Basic hostname validation
    const hostRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!hostRegex.test(config.host)) {
      errors.push({
        field: "host",
        message: "Invalid SMTP host format",
        code: "INVALID_HOST_FORMAT",
        value: config.host,
      });
    }

    // Check for common test hosts
    if (
      config.host.includes("localhost") ||
      config.host.includes("127.0.0.1")
    ) {
      warnings.push({
        field: "host",
        message: "Using localhost SMTP host",
        suggestion: "Ensure this is intended for development/testing only",
      });
    }
  }

  // Port validation
  if (config.port === undefined || config.port === null) {
    errors.push({
      field: "port",
      message: "SMTP port is required",
      code: "MISSING_PORT",
    });
  } else if (
    !Number.isInteger(config.port) ||
    config.port < 1 ||
    config.port > 65535
  ) {
    errors.push({
      field: "port",
      message: "SMTP port must be a valid integer between 1 and 65535",
      code: "INVALID_PORT",
      value: config.port,
    });
  } else {
    // Check for common secure/insecure ports
    const commonPorts = {
      25: { secure: false, name: "SMTP" },
      465: { secure: true, name: "SMTPS" },
      587: { secure: false, name: "SMTP with STARTTLS" },
      2525: { secure: false, name: "Alternative SMTP" },
    };

    const portInfo = commonPorts[config.port as keyof typeof commonPorts];
    if (portInfo) {
      if (config.secure !== undefined && config.secure !== portInfo.secure) {
        warnings.push({
          field: "port",
          message: `Port ${config.port} is typically ${portInfo.secure ? "secure" : "insecure"} (${portInfo.name})`,
          suggestion: `Consider setting secure: ${portInfo.secure}`,
        });
      }
    }
  }

  // Authentication validation
  if (!config.auth) {
    errors.push({
      field: "auth",
      message: "SMTP authentication is required",
      code: "MISSING_AUTH",
    });
  } else {
    if (!config.auth.user || typeof config.auth.user !== "string") {
      errors.push({
        field: "auth.user",
        message: "SMTP username is required and must be a string",
        code: "MISSING_AUTH_USER",
        value: config.auth.user,
      });
    }

    if (!config.auth.pass || typeof config.auth.pass !== "string") {
      errors.push({
        field: "auth.pass",
        message: "SMTP password is required and must be a string",
        code: "MISSING_AUTH_PASS",
      });
    } else if (config.auth.pass.length < 8) {
      warnings.push({
        field: "auth.pass",
        message: "SMTP password is very short",
        suggestion:
          "Consider using app-specific passwords or longer credentials",
      });
    }
  }

  // TLS validation
  if (config.tls) {
    if (typeof config.tls !== "object") {
      errors.push({
        field: "tls",
        message: "TLS configuration must be an object",
        code: "INVALID_TLS_CONFIG",
        value: config.tls,
      });
    } else if (config.tls.rejectUnauthorized === false) {
      warnings.push({
        field: "tls.rejectUnauthorized",
        message: "TLS certificate validation is disabled",
        suggestion: "Enable certificate validation for production use",
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Enhanced email options validation
 */
export function validateEmailOptions(
  options: EmailOptions | TemplateEmailOptions | CustomEmailOptions
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!options) {
    errors.push({
      field: "options",
      message: "Email options are required",
      code: "MISSING_OPTIONS",
    });
    return { valid: false, errors, warnings };
  }

  // Validate recipient addresses
  if (!options.to) {
    errors.push({
      field: "to",
      message: "Recipient email address is required",
      code: "MISSING_RECIPIENT",
    });
  } else {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    if (recipients.length === 0) {
      errors.push({
        field: "to",
        message: "At least one recipient is required",
        code: "EMPTY_RECIPIENTS",
      });
    } else if (recipients.length > 100) {
      warnings.push({
        field: "to",
        message: `Large number of recipients (${recipients.length})`,
        suggestion: "Consider using BCC for mass emails",
      });
    }

    recipients.forEach((email, index) => {
      const validation = validateEmailAddress(email);
      if (!validation.valid) {
        validation.errors.forEach((error) => {
          errors.push({
            ...error,
            field: `to[${index}]`,
            message: `Recipient ${index + 1}: ${error.message}`,
          });
        });
      }
      warnings.push(...validation.warnings);
    });
  }

  // Validate CC addresses
  if (options.cc) {
    const ccRecipients = Array.isArray(options.cc) ? options.cc : [options.cc];
    ccRecipients.forEach((email, index) => {
      const validation = validateEmailAddress(email);
      if (!validation.valid) {
        validation.errors.forEach((error) => {
          errors.push({
            ...error,
            field: `cc[${index}]`,
            message: `CC recipient ${index + 1}: ${error.message}`,
          });
        });
      }
    });
  }

  // Validate BCC addresses
  if (options.bcc) {
    const bccRecipients = Array.isArray(options.bcc)
      ? options.bcc
      : [options.bcc];
    bccRecipients.forEach((email, index) => {
      const validation = validateEmailAddress(email);
      if (!validation.valid) {
        validation.errors.forEach((error) => {
          errors.push({
            ...error,
            field: `bcc[${index}]`,
            message: `BCC recipient ${index + 1}: ${error.message}`,
          });
        });
      }
    });
  }

  // Validate sender address
  if (options.from) {
    const validation = validateEmailAddress(options.from);
    if (!validation.valid) {
      validation.errors.forEach((error) => {
        errors.push({
          ...error,
          field: "from",
          message: `Sender: ${error.message}`,
        });
      });
    }
  }

  // Validate reply-to address
  if (options.replyTo) {
    const validation = validateEmailAddress(options.replyTo);
    if (!validation.valid) {
      validation.errors.forEach((error) => {
        errors.push({
          ...error,
          field: "replyTo",
          message: `Reply-to: ${error.message}`,
        });
      });
    }
  }

  // Validate attachments
  if (options.attachments) {
    if (!Array.isArray(options.attachments)) {
      errors.push({
        field: "attachments",
        message: "Attachments must be an array",
        code: "INVALID_ATTACHMENTS_TYPE",
        value: typeof options.attachments,
      });
    } else {
      let totalSize = 0;
      options.attachments.forEach((attachment, index) => {
        if (!attachment.fileName) {
          errors.push({
            field: `attachments[${index}].fileName`,
            message: `Attachment ${index + 1}: fileName is required`,
            code: "MISSING_ATTACHMENT_FILENAME",
          });
        }

        if (!attachment.content) {
          errors.push({
            field: `attachments[${index}].content`,
            message: `Attachment ${index + 1}: content is required`,
            code: "MISSING_ATTACHMENT_CONTENT",
          });
        } else {
          // Calculate size
          let size = 0;
          if (Buffer.isBuffer(attachment.content)) {
            size = attachment.content.length;
          } else if (typeof attachment.content === "string") {
            size = Buffer.byteLength(attachment.content, "utf8");
          }

          totalSize += size;

          // Warn about large attachments
          if (size > 25 * 1024 * 1024) {
            // 25MB
            warnings.push({
              field: `attachments[${index}]`,
              message: `Large attachment detected (${Math.round(size / 1024 / 1024)}MB)`,
              suggestion:
                "Consider using file sharing services for large files",
            });
          }
        }
      });

      // Warn about total attachment size
      if (totalSize > 25 * 1024 * 1024) {
        warnings.push({
          field: "attachments",
          message: `Total attachment size is large (${Math.round(totalSize / 1024 / 1024)}MB)`,
          suggestion: "Large emails may be rejected by some email providers",
        });
      }
    }
  }

  // Template-specific validation
  if ("templateName" in options) {
    const templateOptions = options as TemplateEmailOptions;
    if (!templateOptions.templateName) {
      errors.push({
        field: "templateName",
        message: "Template name is required for template emails",
        code: "MISSING_TEMPLATE_NAME",
      });
    }

    if (
      !templateOptions.templateProps ||
      typeof templateOptions.templateProps !== "object"
    ) {
      errors.push({
        field: "templateProps",
        message: "Template props are required and must be an object",
        code: "INVALID_TEMPLATE_PROPS",
        value: templateOptions.templateProps,
      });
    }
  }

  // Custom email validation
  if ("component" in options) {
    const customOptions = options as CustomEmailOptions;
    if (!customOptions.component) {
      errors.push({
        field: "component",
        message: "React component is required for custom emails",
        code: "MISSING_COMPONENT",
      });
    }

    if (!customOptions.subject) {
      errors.push({
        field: "subject",
        message: "Subject is required for custom emails",
        code: "MISSING_SUBJECT",
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validation helper that throws on errors
 */
export function validateEmailOptionsStrict(
  options: EmailOptions | TemplateEmailOptions | CustomEmailOptions
): void {
  const result = validateEmailOptions(options);
  if (!result.valid) {
    const errorMessages = result.errors.map(
      (error) => `${error.field}: ${error.message}`
    );
    throw new EmailValidationError(
      `Email validation failed: ${errorMessages.join("; ")}`,
      undefined,
      { errors: result.errors, warnings: result.warnings }
    );
  }
}

/**
 * SMTP validation helper that throws on errors
 */
export function validateSMTPConfigStrict(config: SMTPConfig): void {
  const result = validateSMTPConfig(config);
  if (!result.valid) {
    const errorMessages = result.errors.map(
      (error) => `${error.field}: ${error.message}`
    );
    throw new EmailValidationError(
      `SMTP configuration validation failed: ${errorMessages.join("; ")}`,
      undefined,
      { errors: result.errors, warnings: result.warnings }
    );
  }
}
