export interface SMTPConfig {
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

export interface EmailOptions {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  replyTo?: string;
  attachments?: Array<{
    fileName: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface TemplateEmailOptions extends Omit<EmailOptions, "subject"> {
  templateName: EmailTemplate;
  templateProps: Record<string, any>;
  subject?: string;
}

export interface CustomEmailOptions extends Omit<EmailOptions, "subject"> {
  component: React.FunctionComponent<any>;
  props: Record<string, any>;
  subject?: string;
}

export type EmailPriority = "low" | "normal" | "high";

// Updated to be extensible for custom templates
export type EmailTemplate = "welcome" | "notification" | string;

// Service initialization options
export interface ServiceInitializationOptions {
  autoRegisterBuiltIn?: boolean;
  customTemplates?: Array<{
    name: string;
    component: React.ComponentType<any>;
    category?: string;
    description?: string;
    subjectGenerator?: (props: any) => string;
    propsSchema?: Record<string, any>;
  }>;
}
