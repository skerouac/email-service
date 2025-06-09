import React from "react";
import { TemplateNotFoundError } from "./utils/errors";
import { getLogger } from "./utils/logger";

// Template registry types
export interface TemplateDefinition<TProps = any> {
  name: string;
  component: React.ComponentType<TProps>;
  subjectGenerator?: (props: TProps) => string;
  propsSchema?: Record<string, any>; // JSON Schema for validation
  description?: string;
  category?: string;
}

export interface TemplateRegistry {
  [key: string]: TemplateDefinition;
}

// Type-safe template map
export interface TypeSafeTemplateMap {
  welcome: TemplateDefinition<{
    name: string;
    email: string;
    actionUrl?: string;
    actionText?: string;
    companyName?: string;
    companyUrl?: string;
  }>;
  notification: TemplateDefinition<{
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    priority?: "low" | "normal" | "high";
    companyName?: string;
    companyUrl?: string;
  }>;
}

// Global template registry
const templates = new Map<string, TemplateDefinition>();
const logger = getLogger();

export function registerTemplate<TProps extends Record<string, any>>(
  definition: TemplateDefinition<TProps>
): void {
  if (!definition.name) {
    throw new Error("Template name is required");
  }

  if (!definition.component) {
    throw new Error("Template component is required");
  }

  if (templates.has(definition.name)) {
    logger.warn(`Template ${definition.name} is being overridden`);
  }

  templates.set(definition.name, definition);

  logger.debug("Template registered", {
    name: definition.name,
    hasSubjectGenerator: !!definition.subjectGenerator,
    hasSchema: !!definition.propsSchema,
    category: definition.category || "uncategorized",
  });
}

export function registerTypedTemplate<K extends keyof TypeSafeTemplateMap>(
  name: K,
  definition: Omit<TypeSafeTemplateMap[K], "name">
): void {
  registerTemplate({
    name,
    ...definition,
  } as TemplateDefinition);
}

export function registerTemplates(definitions: TemplateDefinition[]): void {
  definitions.forEach(registerTemplate);
}

export function getTemplate<TProps = any>(
  name: string
): React.ComponentType<TProps> {
  const definition = templates.get(name);
  if (!definition) {
    const availableTemplates = Array.from(templates.keys()).join(", ");
    throw new TemplateNotFoundError(
      `Template "${name}" not found. Available templates: ${availableTemplates}`,
      undefined,
      { templateName: name, availableTemplates: Array.from(templates.keys()) }
    );
  }
  return definition.component as React.ComponentType<TProps>;
}

export function getTemplateDefinition(
  name: string
): TemplateDefinition | undefined {
  return templates.get(name);
}

export function getTemplateSubject(
  name: string,
  props: Record<string, any>
): string {
  const definition = templates.get(name);

  if (definition?.subjectGenerator) {
    try {
      return definition.subjectGenerator(props);
    } catch (error) {
      logger.warn(`Subject generator failed for template ${name}`, { error });
    }
  }

  // Enhanced fallbacks
  const fallbacks: Record<string, (props: any) => string> = {
    welcome: (props) => `Welcome to ${props.companyName || "our service"}!`,
    notification: (props) => props.title || "Important notification",
    reset_password: (props) => "Reset your password",
    email_verification: (props) => "Verify your email address",
    invoice: (props) =>
      `Invoice ${props.invoiceNumber || ""} from ${props.companyName || "us"}`,
  };

  const fallbackGenerator = fallbacks[name];
  if (fallbackGenerator) {
    try {
      return fallbackGenerator(props);
    } catch (error) {
      logger.warn(`Fallback subject generator failed for template ${name}`, {
        error,
      });
    }
  }

  return `Email notification`;
}

export function getAvailableTemplates(): string[] {
  return Array.from(templates.keys());
}

export function getTemplatesByCategory(): Record<string, TemplateDefinition[]> {
  const categorized: Record<string, TemplateDefinition[]> = {};

  templates.forEach((definition) => {
    const category = definition.category || "uncategorized";
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(definition);
  });

  return categorized;
}

export function validateTemplateProps(
  templateName: string,
  props: Record<string, any>
): { valid: boolean; errors: string[] } {
  const definition = templates.get(templateName);

  if (!definition) {
    return { valid: false, errors: [`Template ${templateName} not found`] };
  }

  if (!definition.propsSchema) {
    return { valid: true, errors: [] };
  }

  // Simple schema validation (in a real implementation, use ajv or similar)
  const errors: string[] = [];
  const schema = definition.propsSchema;

  Object.entries(schema).forEach(([key, config]: [string, any]) => {
    const value = props[key];

    if (config.required && (value === undefined || value === null)) {
      errors.push(`Property "${key}" is required`);
    }

    if (value !== undefined && config.type && typeof value !== config.type) {
      errors.push(`Property "${key}" should be of type ${config.type}`);
    }

    if (config.enum && !config.enum.includes(value)) {
      errors.push(
        `Property "${key}" should be one of: ${config.enum.join(", ")}`
      );
    }
  });

  return { valid: errors.length === 0, errors };
}

export function clearTemplates(): void {
  templates.clear();
}

export function getRegistryInfo() {
  const categories = getTemplatesByCategory();

  return {
    totalTemplates: templates.size,
    categories: Object.keys(categories),
    templates: Array.from(templates.entries()).map(([name, definition]) => ({
      name,
      category: definition.category || "uncategorized",
      description: definition.description,
      hasSubjectGenerator: !!definition.subjectGenerator,
      hasSchema: !!definition.propsSchema,
    })),
  };
}
