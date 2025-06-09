# Email Service Package

A powerful, type-safe email service for Node.js that combines React Email templates with Nodemailer's reliability. Send beautiful, responsive emails using React components with full TypeScript support.

[![npm version](https://badge.fury.io/js/email-service-package.svg)](https://badge.fury.io/js/email-service-package)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎨 **React Email Templates** - Design emails using React components
- 📧 **Built-in Templates** - Welcome and notification emails ready to use
- 🔧 **Custom Templates** - Easy template registration and management
- 🛡️ **Type Safety** - Full TypeScript support with comprehensive types
- 🔄 **Retry Logic** - Automatic retry with exponential backoff
- ✅ **Validation** - Email address and SMTP configuration validation
- 📊 **Logging** - Structured logging with configurable levels
- 🚨 **Error Handling** - Comprehensive error types and context
- 🔌 **Transport Agnostic** - Use Nodemailer or custom transports
- 🧪 **Testing Support** - Mock transport for testing

## 📦 Installation

```bash
npm install email-service-package
# or
yarn add email-service-package
# or
pnpm add email-service-package
```

### Peer Dependencies

```bash
npm install react
```

## 🚀 Quick Start

### 1. Basic Setup

```typescript
import { createEmailService } from "email-service-package";

// Configure SMTP
const smtpConfig = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "your-email@gmail.com",
    pass: "your-app-password",
  },
};

// Create email service
const emailService = createEmailService(smtpConfig, {
  defaultFrom: "noreply@yourcompany.com",
});
```

### 2. Send a Welcome Email

```typescript
await emailService.sendTemplateEmail({
  to: "user@example.com",
  templateName: "welcome",
  templateProps: {
    name: "John Doe",
    email: "user@example.com",
    actionUrl: "https://yourapp.com/verify",
    actionText: "Verify Account",
    companyName: "YourCompany",
  },
});
```

### 3. Send a Notification Email

```typescript
await emailService.sendTemplateEmail({
  to: "user@example.com",
  templateName: "notification",
  templateProps: {
    title: "Payment Received",
    message: "Your payment of $99.99 has been processed successfully.",
    priority: "high",
    actionUrl: "https://yourapp.com/invoice/123",
    actionText: "View Invoice",
  },
});
```

## 📖 API Reference

### createEmailService(smtpConfig, serviceConfig?)

Creates a new email service instance.

```typescript
const emailService = createEmailService(smtpConfig, {
  defaultFrom: "noreply@company.com",
  autoInitializeTemplates: true, // default: true
  customTemplates: [], // custom template definitions
  retryConfig: {
    smtp: { maxAttempts: 3, initialDelay: 2000 },
    template: { maxAttempts: 2, initialDelay: 500 },
  },
});
```

### EmailService Methods

#### `sendTemplateEmail(options)`

Send an email using a registered template.

```typescript
interface TemplateEmailOptions {
  from?: string; // Uses defaultFrom if not provided
  to: string | string[]; // Recipient(s)
  cc?: string | string[]; // CC recipients
  bcc?: string | string[]; // BCC recipients
  templateName: string; // Name of registered template
  templateProps: object; // Props to pass to template
  subject?: string; // Override template subject
  replyTo?: string; // Reply-to address
  attachments?: Array<{
    // File attachments
    fileName: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

await emailService.sendTemplateEmail({
  to: "user@example.com",
  templateName: "welcome",
  templateProps: { name: "John", email: "user@example.com" },
});
```

#### `sendCustomEmail(options)`

Send an email using a custom React component.

```typescript
import { MyCustomTemplate } from "./templates/MyCustomTemplate";

await emailService.sendCustomEmail({
  to: "user@example.com",
  component: MyCustomTemplate,
  props: { userName: "John", orderId: "12345" },
  subject: "Your Order Confirmation",
});
```

#### `previewTemplate(templateName, props)`

Generate HTML preview of a template (useful for testing).

```typescript
const html = await emailService.previewTemplate("welcome", {
  name: "John Doe",
  email: "john@example.com",
});
console.log(html); // Full HTML output
```

#### `testConnection()`

Verify SMTP connection.

```typescript
const isConnected = await emailService.testConnection();
console.log("SMTP connected:", isConnected);
```

## 🎨 Custom Templates

### Creating a Custom Template

```typescript
import { BaseLayout } from 'email-service-package';
import { Text, Heading, Button } from '@react-email/components';

interface OrderConfirmationProps {
  userName: string;
  orderNumber: string;
  total: string;
  items: Array<{ name: string; price: string }>;
}

export function OrderConfirmation({
  userName,
  orderNumber,
  total,
  items
}: OrderConfirmationProps) {
  return (
    <BaseLayout title="Order Confirmation" companyName="YourStore">
      <Heading>Thanks for your order, {userName}!</Heading>

      <Text>Order #{orderNumber} has been confirmed.</Text>

      {items.map((item, index) => (
        <div key={index}>
          <Text>{item.name}: {item.price}</Text>
        </div>
      ))}

      <Text><strong>Total: {total}</strong></Text>

      <Button href="https://yourstore.com/orders">
        View Order Details
      </Button>
    </BaseLayout>
  );
}
```

### Registering Custom Templates

```typescript
import { registerTemplate } from "email-service-package";
import { OrderConfirmation } from "./templates/OrderConfirmation";

// Register single template
registerTemplate({
  name: "order-confirmation",
  component: OrderConfirmation,
  category: "transactional",
  description: "Order confirmation email",
  subjectGenerator: (props) => `Order #${props.orderNumber} Confirmed`,
  propsSchema: {
    userName: { type: "string", required: true },
    orderNumber: { type: "string", required: true },
    total: { type: "string", required: true },
    items: { type: "array", required: true },
  },
});

// Now use it
await emailService.sendTemplateEmail({
  to: "customer@example.com",
  templateName: "order-confirmation",
  templateProps: {
    userName: "John Doe",
    orderNumber: "ORD-001",
    total: "$99.99",
    items: [{ name: "Product A", price: "$99.99" }],
  },
});
```

### Bulk Template Registration

```typescript
import { registerTemplates } from "email-service-package";

registerTemplates([
  {
    name: "password-reset",
    component: PasswordResetTemplate,
    subjectGenerator: () => "Reset Your Password",
  },
  {
    name: "invoice",
    component: InvoiceTemplate,
    subjectGenerator: (props) => `Invoice #${props.invoiceNumber}`,
  },
]);
```

## ⚙️ Configuration

### SMTP Configuration

```typescript
interface SMTPConfig {
  host: string;
  port: number;
  secure?: boolean; // true for 465, false for other ports
  auth: {
    user: string;
    pass: string; // Use app passwords for Gmail
  };
  tls?: {
    rejectUnauthorized?: boolean;
  };
}

// Gmail
const gmailConfig = {
  host: "smtp.gmail.com",
  port: 587,
  auth: { user: "user@gmail.com", pass: "app-password" },
};

// SendGrid
const sendgridConfig = {
  host: "smtp.sendgrid.net",
  port: 587,
  auth: { user: "apikey", pass: "your-sendgrid-api-key" },
};

// Custom SMTP
const customConfig = {
  host: "mail.yourcompany.com",
  port: 465,
  secure: true,
  auth: { user: "noreply@yourcompany.com", pass: "password" },
};
```

### Service Configuration

```typescript
interface EmailServiceConfig {
  defaultFrom?: string; // Default sender address
  autoInitializeTemplates?: boolean; // Auto-register built-in templates
  customTemplates?: TemplateDefinition[]; // Custom templates to register
  retryConfig?: {
    smtp: RetryConfig; // SMTP retry configuration
    template: RetryConfig; // Template rendering retry config
  };
}
```

### Retry Configuration

```typescript
interface RetryConfig {
  maxAttempts: number; // Maximum retry attempts
  initialDelay: number; // Initial delay in milliseconds
  maxDelay: number; // Maximum delay between retries
  backoffMultiplier: number; // Exponential backoff multiplier
  jitter: boolean; // Add random jitter to delays
}

// Default SMTP retry config
const smtpRetry = {
  maxAttempts: 3,
  initialDelay: 2000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
};
```

## 🧪 Testing

### Using Mock Transport

```typescript
import {
  MockEmailTransport,
  createEmailServiceWithTransport,
} from "email-service-package";

// Create mock transport for testing
const mockTransport = new MockEmailTransport();
const emailService = createEmailServiceWithTransport(mockTransport);

// Send email in test
await emailService.sendTemplateEmail({
  to: "test@example.com",
  templateName: "welcome",
  templateProps: { name: "Test User", email: "test@example.com" },
});

// Verify email was sent
const sentEmails = mockTransport.getSentEmails();
expect(sentEmails).toHaveLength(1);
expect(sentEmails[0].to).toBe("test@example.com");

// Get last sent email
const lastEmail = mockTransport.getLastSentEmail();
expect(lastEmail.subject).toContain("Welcome");
```

### Testing Templates

```typescript
// Preview template without sending
const html = await emailService.previewTemplate("welcome", {
  name: "Test User",
  email: "test@example.com",
});

// Check if HTML contains expected content
expect(html).toContain("Welcome to");
expect(html).toContain("Test User");
```

## 🔍 Validation

### Email Validation

```typescript
import { validateEmailAddress } from "email-service-package";

const result = validateEmailAddress("user@example.com", {
  strict: true,
  allowDisposable: false,
  allowSuspicious: false,
});

if (!result.valid) {
  console.log("Validation errors:", result.errors);
  console.log("Warnings:", result.warnings);
}
```

### SMTP Configuration Validation

```typescript
import { validateSMTPConfig } from "email-service-package";

const result = validateSMTPConfig(smtpConfig);
if (!result.valid) {
  console.log("SMTP config errors:", result.errors);
}
```

## 📊 Logging

### Configure Logging

```typescript
import { setLogger, createConsoleLogger } from "email-service-package";

// Use custom log level
const logger = createConsoleLogger("debug"); // 'debug' | 'info' | 'warn' | 'error'
setLogger(logger);

// Create silent logger for testing
import { createSilentLogger } from "email-service-package";
setLogger(createSilentLogger());

// Custom logger implementation
import { Logger } from "email-service-package";

class CustomLogger implements Logger {
  debug(message: string, context?: any): void {
    // Send to your logging service
  }
  // ... implement other methods
}

setLogger(new CustomLogger());
```

### Log Output Examples

```
[2024-01-15T10:30:00.000Z] INFO  Email sent successfully | Context: {"recipients":1,"templateName":"welcome"}
[2024-01-15T10:30:01.000Z] DEBUG SMTP connection established | Context: {"host":"smtp.gmail.com","port":587}
[2024-01-15T10:30:02.000Z] WARN  Email send failed, retrying | Context: {"attempt":1,"maxAttempts":3}
```

## 🚨 Error Handling

### Error Types

```typescript
import {
  EmailError,
  SMTPConfigurationError,
  SMTPConnectionError,
  SMTPAuthenticationError,
  EmailValidationError,
  TemplateNotFoundError,
  TemplateRenderError,
  EmailSendError
} from 'email-service-package';

try {
  await emailService.sendTemplateEmail({...});
} catch (error) {
  if (error instanceof SMTPAuthenticationError) {
    console.log('Check your SMTP credentials');
  } else if (error instanceof TemplateNotFoundError) {
    console.log('Template not registered:', error.context?.templateName);
  } else if (error instanceof EmailValidationError) {
    console.log('Invalid email format');
  }
}
```

### Error Context

All errors include helpful context:

```typescript
catch (error) {
  console.log('Error message:', error.message);
  console.log('Error context:', error.context);
  console.log('Caused by:', error.cause);
  console.log('Retryable:', error.retryable);
}
```

## 🔧 Advanced Usage

### Custom Transport

```typescript
import { BaseEmailTransport, MailOptions } from "email-service-package";

class CustomTransport extends BaseEmailTransport {
  async sendMail(options: MailOptions): Promise<void> {
    // Implement custom sending logic
    // e.g., use AWS SES SDK, SendGrid API, etc.
  }

  async verify(): Promise<boolean> {
    // Implement connection verification
    return true;
  }

  async close(): Promise<void> {
    // Cleanup resources
  }

  getInfo() {
    return { type: "custom", provider: "my-service" };
  }
}

const customTransport = new CustomTransport();
const emailService = createEmailServiceWithTransport(customTransport);
```

### Template Discovery

```typescript
import {
  getAvailableTemplates,
  getTemplatesByCategory,
} from "email-service-package";

// List all registered templates
const templates = getAvailableTemplates();
console.log("Available templates:", templates);

// Get templates by category
const categorized = getTemplatesByCategory();
console.log("Transactional templates:", categorized.transactional);
console.log("Marketing templates:", categorized.marketing);
```

### Batch Email Sending

```typescript
const recipients = [
  "user1@example.com",
  "user2@example.com",
  "user3@example.com",
];

// Send to multiple recipients (single email)
await emailService.sendTemplateEmail({
  to: recipients,
  templateName: "newsletter",
  templateProps: { content: "Monthly update..." },
});

// Send personalized emails
await Promise.all(
  recipients.map((email) =>
    emailService.sendTemplateEmail({
      to: email,
      templateName: "welcome",
      templateProps: {
        name: getUserName(email),
        email: email,
      },
    })
  )
);
```

## 🛠️ Troubleshooting

### Common Issues

**SMTP Authentication Failed**

```
Error: SMTP authentication failed
```

- Verify username and password
- Use app-specific passwords for Gmail
- Check if 2FA is enabled
- Ensure "Less secure app access" is enabled (if applicable)

**Template Not Found**

```
Error: Template "my-template" not found
```

- Ensure template is registered with `registerTemplate()`
- Check template name spelling
- Verify auto-initialization is enabled

**Connection Timeout**

```
Error: SMTP connection timeout
```

- Check firewall settings
- Verify SMTP server host and port
- Try different ports (587, 465, 25)
- Check if TLS/SSL settings are correct

**Rate Limiting**

```
Error: Rate limit exceeded
```

- Implement delays between emails
- Use different SMTP providers
- Contact your email provider about limits

### Debug Mode

Enable detailed logging to troubleshoot issues:

```typescript
import { createConsoleLogger, setLogger } from 'email-service-package';

setLogger(createConsoleLogger('debug'));

// Now all operations will log detailed information
await emailService.sendTemplateEmail({...});
```

### Testing SMTP Connection

```typescript
// Test connection before sending emails
try {
  const isConnected = await emailService.testConnection();
  if (isConnected) {
    console.log("✅ SMTP connection successful");
  } else {
    console.log("❌ SMTP connection failed");
  }
} catch (error) {
  console.log("❌ SMTP error:", error.message);
}
```

## 📚 Examples

Check out the `/examples` directory for complete working examples:

- [Basic Usage](examples/basic-usage.ts) - Simple email sending
- [Custom Templates](examples/custom-templates.ts) - Creating custom templates
- [Advanced Configuration](examples/advanced-config.ts) - Advanced setup
- [Testing](examples/testing.ts) - Testing with mocks
- [Error Handling](examples/error-handling.ts) - Comprehensive error handling

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
git clone https://github.com/username/email-service-package.git
cd email-service-package
npm install
npm run build
npm test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

- 📖 [Documentation](https://github.com/username/email-service-package#readme)
- 🐛 [Issue Tracker](https://github.com/username/email-service-package/issues)
- 💬 [Discussions](https://github.com/username/email-service-package/discussions)

## 🚀 Roadmap

- [ ] Email template marketplace
- [ ] Visual template editor
- [ ] Advanced analytics
- [ ] Webhook support
- [ ] Multi-language templates
- [ ] Email testing tools

---

Made with ❤️ by [Your Name](https://github.com/username)
