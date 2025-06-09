import { WelcomeEmail, NotificationEmail } from "./templates/types";
import { registerTemplate, TemplateDefinition } from "./templateResolver";
import { WelcomeEmailProps, NotificationEmailProps } from "./templates/types";
import { getLogger } from "./utils/logger";

const logger = getLogger();

const BUILT_IN_TEMPLATES: TemplateDefinition[] = [
  {
    name: "welcome",
    component: WelcomeEmail,
    category: "onboarding",
    description: "Welcome email for new users",
    subjectGenerator: (props: WelcomeEmailProps) =>
      `Welcome to ${props.companyName || "our service"}!`,
    propsSchema: {
      name: { type: "string", required: true },
      email: { type: "string", required: true },
      actionUrl: { type: "string", required: false },
      actionText: { type: "string", required: false },
      companyName: { type: "string", required: false },
      companyUrl: { type: "string", required: false },
    },
  },
  {
    name: "notification",
    component: NotificationEmail,
    category: "system",
    description: "General notification email with priority levels",
    subjectGenerator: (props: NotificationEmailProps) =>
      props.title || "Important notification",
    propsSchema: {
      title: { type: "string", required: true },
      message: { type: "string", required: true },
      actionUrl: { type: "string", required: false },
      actionText: { type: "string", required: false },
      priority: {
        type: "string",
        required: false,
        enum: ["low", "normal", "high"],
        default: "normal",
      },
      companyName: { type: "string", required: false },
      companyUrl: { type: "string", required: false },
    },
  },
];

export function autoRegisterBuiltInTemplates(): void {
  logger.info("Auto-registering built-in templates");

  BUILT_IN_TEMPLATES.forEach((template) => {
    try {
      registerTemplate(template);
      logger.debug(`Auto-registered template: ${template.name}`, {
        category: template.category,
        hasSchema: !!template.propsSchema,
      });
    } catch (error) {
      logger.error(
        `Failed to auto-register template: ${template.name}`,
        {
          templateName: template.name,
        },
        error instanceof Error ? error : undefined
      );
    }
  });

  logger.info(
    `Auto-registration complete. Registered ${BUILT_IN_TEMPLATES.length} templates`
  );
}

export interface DiscoveredTemplate {
  name: string;
  path: string;
  component?: React.ComponentType<any>;
  metadata?: {
    category?: string;
    description?: string;
    schema?: Record<string, any>;
  };
}

export async function discoverTemplatesFromDirectory(
  templateDir: string,
  options: {
    pattern?: RegExp;
    recursive?: boolean;
  } = {}
): Promise<DiscoveredTemplate[]> {
  const { pattern = /\.(ts|tsx|js|jsx)$/, recursive = true } = options;

  logger.warn("Template directory discovery is an advanced feature", {
    templateDir,
    pattern: pattern.toString(),
  });

  return [];
}

export function registerDiscoveredTemplates(templates: DiscoveredTemplate[]): {
  registered: number;
  failed: number;
  errors: Error[];
} {
  let registered = 0;
  let failed = 0;
  const errors: Error[] = [];

  templates.forEach((template) => {
    try {
      if (!template.component) {
        throw new Error(`Template ${template.name} has no component`);
      }

      const definition: TemplateDefinition = {
        name: template.name,
        component: template.component,
        category: template.metadata?.category || "discovered",
        description:
          template.metadata?.description ||
          `Auto-discovered template: ${template.name}`,
        propsSchema: template.metadata?.schema,
      };

      registerTemplate(definition);
      registered++;

      logger.debug(`Registered discovered template: ${template.name}`, {
        path: template.path,
        category: definition.category,
      });
    } catch (error) {
      failed++;
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);

      logger.error(
        `Failed to register discovered template: ${template.name}`,
        {
          templateName: template.name,
          path: template.path,
        },
        err
      );
    }
  });

  logger.info("Template discovery registration complete", {
    registered,
    failed,
    total: templates.length,
  });

  return { registered, failed, errors };
}

export function initializeTemplates(
  options: {
    autoRegisterBuiltIn?: boolean;
    customTemplates?: TemplateDefinition[];
  } = {}
): Promise<void> {
  const { autoRegisterBuiltIn = true, customTemplates = [] } = options;

  return new Promise(async (resolve, reject) => {
    try {
      logger.info("Initializing template system", {
        autoRegisterBuiltIn,
        customTemplateCount: customTemplates.length,
      });

      // 1. Auto-register built-in templates
      if (autoRegisterBuiltIn) {
        autoRegisterBuiltInTemplates();
      }

      // 2. Register custom templates
      if (customTemplates.length > 0) {
        logger.info(`Registering ${customTemplates.length} custom templates`);
        customTemplates.forEach(registerTemplate);
      }

      logger.info("Template system initialization complete");
      resolve();
    } catch (error) {
      logger.error(
        "Template system initialization failed",
        undefined,
        error instanceof Error ? error : undefined
      );
      reject(error);
    }
  });
}

export function getInitializationStatus() {
  return {
    builtInTemplatesAvailable: BUILT_IN_TEMPLATES.length,
    builtInTemplateNames: BUILT_IN_TEMPLATES.map((t) => t.name),
  };
}
