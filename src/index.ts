// EmailService exports
export {
  createEmailService,
  createEmailServiceWithTransport,
} from "./emailService";
export type { EmailService, EmailServiceConfig } from "./emailService";

// Enhanced template management exports
export {
  registerTemplate,
  registerTypedTemplate,
  registerTemplates,
  getTemplate,
  getTemplateDefinition,
  getTemplateSubject,
  getAvailableTemplates,
  getTemplatesByCategory,
  validateTemplateProps,
  clearTemplates,
  getRegistryInfo,
} from "./templateResolver";

export type {
  TemplateDefinition,
  TemplateRegistry,
  TypeSafeTemplateMap,
} from "./templateResolver";

// Auto-registration exports
export {
  autoRegisterBuiltInTemplates,
  initializeTemplates,
  discoverTemplatesFromDirectory,
  registerDiscoveredTemplates,
  getInitializationStatus,
} from "./autoRegistration";

export type { DiscoveredTemplate } from "./autoRegistration";

// Core type exports
export type {
  SMTPConfig,
  EmailOptions,
  TemplateEmailOptions,
  CustomEmailOptions,
  EmailPriority,
  EmailTemplate,
} from "./types";

// Enhanced validation exports
export {
  validateEmailAddress,
  validateSMTPConfig,
  validateEmailOptions,
  validateEmailOptionsStrict,
  validateSMTPConfigStrict,
} from "./utils/validation";

export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "./utils/validation";

// Error types and utilities
export {
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
} from "./utils/errors";

// Logging utilities
export {
  setLogger,
  getLogger,
  createContextLogger,
  createConsoleLogger,
  createSilentLogger,
  EmailLogger,
} from "./utils/logger";

export type { Logger, LogLevel, LogContext, LogEntry } from "./utils/logger";

// Retry utilities
export {
  withRetry,
  RetryableOperation,
  RetryConfigs,
  DEFAULT_RETRY_CONFIG,
} from "./utils/retry";

export type { RetryConfig, RetryState } from "./utils/retry";

// Transport interfaces (for testing and custom implementations)
export type {
  EmailTransport,
  MailOptions,
  TransportConfig,
} from "./transport/emailTransport";

export {
  BaseEmailTransport,
  MockEmailTransport,
} from "./transport/emailTransport";

export { NodemailerTransport } from "./transport/nodemailerTransport";

// Template exports (convenience re-exports)
export { WelcomeEmail, NotificationEmail, BaseLayout } from "./templates/types";

export type {
  WelcomeEmailProps,
  NotificationEmailProps,
  BaseLayoutProps,
} from "./templates/types";
