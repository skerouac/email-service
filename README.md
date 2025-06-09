# Email Service Package

A TypeScript email service package with React Email templates and Nodemailer transport.

## Features

- 📧 SMTP email sending via Nodemailer
- 🎨 Beautiful email templates with React Email
- 📝 Built-in responsive templates (Welcome, Notification)
- 🔧 Custom template support
- ✅ Comprehensive email validation
- 🔄 Automatic retry with exponential backoff
- 📊 Structured logging
- 🛡️ TypeScript support
- ⚡ Auto-registration of templates

## Installation

```bash
npm install email-service-package
# or
yarn add email-service-package
```

## Quick Start

```typescript
import { createEmailService } from "email-service-package";

// Create email service with SMTP configuration
const emailService = createEmailService({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "your-email@gmail.com",
    pass: "your-app-password",
  },
});

// Send a welcome email
await emailService.sendTemplateEmail({
  from: "noreply@yourapp.com",
  to: "user@example.com",
  templateName: "welcome",
  templateProps: {
    name: "John Doe",
    email: "user@example.com",
    companyName: "Your Company",
  },
});
```

## Built-in Templates

### Welcome Email

```typescript
await emailService.sendTemplateEmail({
  from: 'noreply@yourapp.com',
  to: 'user@example.com',
  templateName: 'welcome',
  templateProps: {
    name: string;
    email: string;
    actionUrl?: string;
    actionText?: string;
    companyName?: string;
    companyUrl?: string;
  }
});
```

### Notification Email

```typescript
await emailService.sendTemplateEmail({
  from: 'noreply@yourapp.com',
  to: 'user@example.com',
  templateName: 'notification',
  templateProps: {
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    priority?: 'low' | 'normal' | 'high';
    companyName?: string;
    companyUrl?: string;
  }
});
```

## Custom Templates

### Register a Custom Template

```typescript
import { registerTemplate } from "email-service-package";
import { MyCustomTemplate } from "./templates/MyCustomTemplate";

registerTemplate({
  name: "custom-template",
  component: MyCustomTemplate,
  category: "marketing",
  description: "Custom marketing email",
  subjectGenerator: (props) => `Special offer for ${props.customerName}!`,
  propsSchema: {
    customerName: { type: "string", required: true },
    offerDetails: { type: "string", required: true },
  },
});
```

### Create a Custom Template Component

```tsx
import { Button, Text, Heading } from "@react-email/components";
import { BaseLayout } from "email-service-package";

export function MyCustomTemplate({ customerName, offerDetails }) {
  return (
    <BaseLayout title="Special Offer">
      <Heading as="h2">Hello {customerName}!</Heading>
      <Text>{offerDetails}</Text>
      <Button href="https://example.com/offer">Claim Your Offer</Button>
    </BaseLayout>
  );
}
```

## Configuration Options

### Email Service Configuration

```typescript
const emailService = createEmailService(smtpConfig, {
  defaultFrom: 'noreply@yourapp.com',
  autoInitializeTemplates: true, // Auto-register built-in templates
  customTemplates: [...],        // Array of custom template definitions
  retryConfig: {
    smtp: { maxAttempts: 3, initialDelay: 2000 },
    template: { maxAttempts: 2, initialDelay: 500 }
  }
});
```

### SMTP Configuration

```typescript
interface SMTPConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized?: boolean;
  };
}
```

## Advanced Usage

### Send with Attachments

```typescript
await emailService.sendTemplateEmail({
  from: 'noreply@yourapp.com',
  to: 'user@example.com',
  templateName: 'notification',
  templateProps: { ... },
  attachments: [{
    fileName: 'invoice.pdf',
    content: Buffer.from(pdfData),
    contentType: 'application/pdf'
  }]
});
```

### Custom Email Without Template

```typescript
await emailService.sendCustomEmail({
  from: 'noreply@yourapp.com',
  to: 'user@example.com',
  subject: 'Custom Email',
  component: MyReactComponent,
  props: { ... }
});
```

### Preview Templates

```typescript
const htmlPreview = await emailService.previewTemplate("welcome", {
  name: "John Doe",
  email: "john@example.com",
});
```

### Validation

```typescript
import {
  validateEmailAddress,
  validateSMTPConfig,
} from "email-service-package";

// Validate email
const result = validateEmailAddress("user@example.com", {
  allowDisposable: false,
  strict: true,
});

// Validate SMTP config
const configResult = validateSMTPConfig(smtpConfig);
if (!configResult.valid) {
  console.error("Invalid config:", configResult.errors);
}
```

## Error Handling

The
