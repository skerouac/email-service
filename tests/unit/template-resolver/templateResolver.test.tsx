import React from "react";
import {
  TemplateDefinition,
  TemplateRegistry,
  TypeSafeTemplateMap,
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
} from "../../../src/templateResolver";
import { TemplateNotFoundError } from "../../../src/utils/errors";
import { getLogger } from "../../../src/utils/logger";

// Mock dependencies - must be at the very top
jest.mock("../../../src/utils/errors", () => ({
  TemplateNotFoundError: class extends Error {
    constructor(message: string, cause?: any, context?: any) {
      super(message);
      this.name = "TemplateNotFoundError";
    }
  },
}));

jest.mock("../../../src/utils/logger", () => ({
  getLogger: jest.fn().mockReturnValue({
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Test components with proper typing for TypeSafeTemplateMap
interface WelcomeProps {
  name: string;
  email: string;
  actionUrl?: string;
  actionText?: string;
  companyName?: string;
  companyUrl?: string;
}

interface NotificationProps {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  priority?: "low" | "normal" | "high";
  companyName?: string;
  companyUrl?: string;
}

const MockWelcomeComponent: React.ComponentType<WelcomeProps> = ({
  name,
  email,
}) => React.createElement("div", null, `Welcome ${name} (${email})`);

const MockNotificationComponent: React.ComponentType<NotificationProps> = ({
  title,
  message,
}) =>
  React.createElement(
    "div",
    null,
    React.createElement("h1", null, title),
    React.createElement("p", null, message)
  );

const MockSimpleComponent: React.ComponentType<{}> = () =>
  React.createElement("div", null, "Simple template");

describe("Template Resolver", () => {
  let mockLogger: { warn: jest.Mock; debug: jest.Mock };

  beforeEach(() => {
    clearTemplates();
    // Get the mock logger instance that was returned by getLogger
    mockLogger = getLogger() as any;
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();
  });

  describe("Template Registration", () => {
    describe("registerTemplate", () => {
      it("should register a basic template successfully", () => {
        const definition: TemplateDefinition = {
          name: "test-template",
          component: MockSimpleComponent,
          description: "A test template",
        };

        expect(() => registerTemplate(definition)).not.toThrow();
        expect(getAvailableTemplates()).toContain("test-template");
      });

      it("should register a template with all properties", () => {
        const subjectGenerator = jest.fn().mockReturnValue("Test Subject");
        const definition: TemplateDefinition = {
          name: "full-template",
          component: MockWelcomeComponent,
          subjectGenerator,
          propsSchema: {
            name: { type: "string", required: true },
            email: { type: "string", required: true },
          },
          description: "A full featured template",
          category: "authentication",
        };

        registerTemplate(definition);

        const retrieved = getTemplateDefinition("full-template");
        expect(retrieved).toEqual(definition);
        expect(retrieved?.subjectGenerator).toBe(subjectGenerator);
      });

      it("should throw error when name is missing", () => {
        const definition = {
          component: MockSimpleComponent,
        } as TemplateDefinition;

        expect(() => registerTemplate(definition)).toThrow(
          "Template name is required"
        );
      });

      it("should throw error when component is missing", () => {
        const definition = {
          name: "test-template",
        } as TemplateDefinition;

        expect(() => registerTemplate(definition)).toThrow(
          "Template component is required"
        );
      });

      it("should warn when overriding existing template", () => {
        const definition1: TemplateDefinition = {
          name: "duplicate-template",
          component: MockSimpleComponent,
        };

        const definition2: TemplateDefinition = {
          name: "duplicate-template",
          component: MockWelcomeComponent,
        };

        registerTemplate(definition1);
        registerTemplate(definition2);

        expect(mockLogger.warn).toHaveBeenCalledWith(
          "Template duplicate-template is being overridden"
        );
      });

      it("should log debug information on successful registration", () => {
        const definition: TemplateDefinition = {
          name: "debug-template",
          component: MockSimpleComponent,
          subjectGenerator: () => "Subject",
          propsSchema: { prop: { type: "string" } },
          category: "test",
        };

        registerTemplate(definition);

        expect(mockLogger.debug).toHaveBeenCalledWith("Template registered", {
          name: "debug-template",
          hasSubjectGenerator: true,
          hasSchema: true,
          category: "test",
        });
      });
    });

    describe("registerTypedTemplate", () => {
      it("should register welcome template with type safety", () => {
        registerTypedTemplate("welcome", {
          component: MockWelcomeComponent,
          subjectGenerator: (props) => `Welcome ${props.name}!`,
          category: "authentication",
        });

        expect(getAvailableTemplates()).toContain("welcome");
        const definition = getTemplateDefinition("welcome");
        expect(definition?.name).toBe("welcome");
        expect(definition?.category).toBe("authentication");
      });

      it("should register notification template with type safety", () => {
        registerTypedTemplate("notification", {
          component: MockNotificationComponent,
          subjectGenerator: (props) => props.title,
          propsSchema: {
            title: { type: "string", required: true },
            message: { type: "string", required: true },
          },
        });

        expect(getAvailableTemplates()).toContain("notification");
        const definition = getTemplateDefinition("notification");
        expect(definition?.name).toBe("notification");
      });
    });

    describe("registerTemplates", () => {
      it("should register multiple templates at once", () => {
        const definitions: TemplateDefinition[] = [
          {
            name: "template1",
            component: MockSimpleComponent,
            category: "cat1",
          },
          {
            name: "template2",
            component: MockWelcomeComponent,
            category: "cat2",
          },
          {
            name: "template3",
            component: MockNotificationComponent,
            category: "cat1",
          },
        ];

        registerTemplates(definitions);

        expect(getAvailableTemplates()).toEqual([
          "template1",
          "template2",
          "template3",
        ]);
      });

      it("should handle empty array", () => {
        registerTemplates([]);
        expect(getAvailableTemplates()).toEqual([]);
      });
    });
  });

  describe("Template Retrieval", () => {
    beforeEach(() => {
      registerTemplate({
        name: "existing-template",
        component: MockWelcomeComponent,
      });
    });

    describe("getTemplate", () => {
      it("should return template component for existing template", () => {
        const component = getTemplate("existing-template");
        expect(component).toBe(MockWelcomeComponent);
      });

      it("should throw TemplateNotFoundError for non-existing template", () => {
        expect(() => getTemplate("non-existing")).toThrow(
          TemplateNotFoundError
        );
      });

      it("should include available templates in error message", () => {
        registerTemplate({
          name: "another-template",
          component: MockSimpleComponent,
        });

        expect(() => getTemplate("non-existing")).toThrow(
          'Template "non-existing" not found'
        );
      });
    });

    describe("getTemplateDefinition", () => {
      it("should return template definition for existing template", () => {
        const definition = getTemplateDefinition("existing-template");
        expect(definition).toBeDefined();
        expect(definition?.name).toBe("existing-template");
        expect(definition?.component).toBe(MockWelcomeComponent);
      });

      it("should return undefined for non-existing template", () => {
        const definition = getTemplateDefinition("non-existing");
        expect(definition).toBeUndefined();
      });
    });
  });

  describe("Subject Generation", () => {
    beforeEach(() => {
      registerTemplate({
        name: "custom-subject",
        component: MockWelcomeComponent,
        subjectGenerator: (props: { name: string }) => `Hello ${props.name}!`,
      });

      registerTemplate({
        name: "no-subject",
        component: MockSimpleComponent,
      });
    });

    describe("getTemplateSubject", () => {
      it("should use custom subject generator when available", () => {
        const subject = getTemplateSubject("custom-subject", { name: "John" });
        expect(subject).toBe("Hello John!");
      });

      it("should use welcome fallback for welcome template", () => {
        registerTemplate({
          name: "welcome",
          component: MockWelcomeComponent,
        });

        const subject = getTemplateSubject("welcome", {
          companyName: "TestCorp",
        });
        expect(subject).toBe("Welcome to TestCorp!");
      });

      it("should use notification fallback for notification template", () => {
        registerTemplate({
          name: "notification",
          component: MockNotificationComponent,
        });

        const subject = getTemplateSubject("notification", { title: "Alert!" });
        expect(subject).toBe("Alert!");
      });

      it("should use reset_password fallback", () => {
        registerTemplate({
          name: "reset_password",
          component: MockSimpleComponent,
        });

        const subject = getTemplateSubject("reset_password", {});
        expect(subject).toBe("Reset your password");
      });

      it("should use email_verification fallback", () => {
        registerTemplate({
          name: "email_verification",
          component: MockSimpleComponent,
        });

        const subject = getTemplateSubject("email_verification", {});
        expect(subject).toBe("Verify your email address");
      });

      it("should use invoice fallback with invoice number", () => {
        registerTemplate({
          name: "invoice",
          component: MockSimpleComponent,
        });

        const subject = getTemplateSubject("invoice", {
          invoiceNumber: "INV-123",
          companyName: "TestCorp",
        });
        expect(subject).toBe("Invoice INV-123 from TestCorp");
      });

      it("should use default fallback when no specific fallback exists", () => {
        const subject = getTemplateSubject("no-subject", {});
        expect(subject).toBe("Email notification");
      });

      it("should handle subject generator errors gracefully", () => {
        registerTemplate({
          name: "error-subject",
          component: MockSimpleComponent,
          subjectGenerator: () => {
            throw new Error("Subject generator error");
          },
        });

        const subject = getTemplateSubject("error-subject", {});
        expect(subject).toBe("Email notification");
        expect(mockLogger.warn).toHaveBeenCalledWith(
          "Subject generator failed for template error-subject",
          { error: expect.any(Error) }
        );
      });

      it("should handle fallback generator errors gracefully", () => {
        registerTemplate({
          name: "welcome",
          component: MockWelcomeComponent,
        });

        // Create a props object that will cause the fallback to throw
        const maliciousProps = {
          get companyName() {
            throw new Error("Getter error");
          },
        };

        const subject = getTemplateSubject("welcome", maliciousProps);
        expect(subject).toBe("Email notification");
        expect(mockLogger.warn).toHaveBeenCalledWith(
          "Fallback subject generator failed for template welcome",
          { error: expect.any(Error) }
        );
      });
    });
  });

  describe("Template Listing", () => {
    beforeEach(() => {
      registerTemplates([
        {
          name: "auth-login",
          component: MockSimpleComponent,
          category: "authentication",
        },
        {
          name: "auth-register",
          component: MockWelcomeComponent,
          category: "authentication",
        },
        {
          name: "notification-alert",
          component: MockNotificationComponent,
          category: "notifications",
        },
        {
          name: "uncategorized-template",
          component: MockSimpleComponent,
        },
      ]);
    });

    describe("getAvailableTemplates", () => {
      it("should return all registered template names", () => {
        const templates = getAvailableTemplates();
        expect(templates).toEqual([
          "auth-login",
          "auth-register",
          "notification-alert",
          "uncategorized-template",
        ]);
      });

      it("should return empty array when no templates registered", () => {
        clearTemplates();
        expect(getAvailableTemplates()).toEqual([]);
      });
    });

    describe("getTemplatesByCategory", () => {
      it("should group templates by category", () => {
        const categorized = getTemplatesByCategory();

        expect(categorized).toHaveProperty("authentication");
        expect(categorized).toHaveProperty("notifications");
        expect(categorized).toHaveProperty("uncategorized");

        expect(categorized.authentication).toHaveLength(2);
        expect(categorized.notifications).toHaveLength(1);
        expect(categorized.uncategorized).toHaveLength(1);

        expect(categorized.authentication.map((t) => t.name)).toEqual([
          "auth-login",
          "auth-register",
        ]);
        expect(categorized.notifications.map((t) => t.name)).toEqual([
          "notification-alert",
        ]);
        expect(categorized.uncategorized.map((t) => t.name)).toEqual([
          "uncategorized-template",
        ]);
      });

      it("should return empty object when no templates registered", () => {
        clearTemplates();
        expect(getTemplatesByCategory()).toEqual({});
      });
    });
  });

  describe("Template Validation", () => {
    beforeEach(() => {
      registerTemplate({
        name: "validated-template",
        component: MockWelcomeComponent,
        propsSchema: {
          name: { type: "string", required: true },
          email: { type: "string", required: true },
          age: { type: "number", required: false },
          role: { type: "string", enum: ["admin", "user", "guest"] },
        },
      });

      registerTemplate({
        name: "no-schema",
        component: MockSimpleComponent,
      });
    });

    describe("validateTemplateProps", () => {
      it("should validate props successfully when all requirements met", () => {
        const result = validateTemplateProps("validated-template", {
          name: "John Doe",
          email: "john@example.com",
          age: 30,
          role: "admin",
        });

        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it("should return validation errors for missing required props", () => {
        const result = validateTemplateProps("validated-template", {
          email: "john@example.com",
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Property "name" is required');
      });

      it("should return validation errors for wrong prop types", () => {
        const result = validateTemplateProps("validated-template", {
          name: "John Doe",
          email: "john@example.com",
          age: "thirty", // wrong type
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Property "age" should be of type number'
        );
      });

      it("should return validation errors for invalid enum values", () => {
        const result = validateTemplateProps("validated-template", {
          name: "John Doe",
          email: "john@example.com",
          role: "invalid-role",
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Property "role" should be one of: admin, user, guest'
        );
      });

      it("should return valid for templates without schema", () => {
        const result = validateTemplateProps("no-schema", {
          anyProp: "anyValue",
        });

        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it("should return error for non-existing template", () => {
        const result = validateTemplateProps("non-existing", {});

        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Template non-existing not found");
      });

      it("should handle null and undefined values correctly", () => {
        const result = validateTemplateProps("validated-template", {
          name: "John Doe",
          email: null, // null value for required prop
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Property "email" is required');
      });
    });
  });

  describe("Registry Management", () => {
    describe("clearTemplates", () => {
      it("should remove all registered templates", () => {
        registerTemplate({
          name: "test-template",
          component: MockSimpleComponent,
        });

        expect(getAvailableTemplates()).toHaveLength(1);

        clearTemplates();

        expect(getAvailableTemplates()).toHaveLength(0);
      });
    });

    describe("getRegistryInfo", () => {
      beforeEach(() => {
        registerTemplates([
          {
            name: "auth-login",
            component: MockSimpleComponent,
            category: "authentication",
            description: "Login template",
            subjectGenerator: () => "Login",
            propsSchema: { email: { type: "string" } },
          },
          {
            name: "auth-register",
            component: MockWelcomeComponent,
            category: "authentication",
            description: "Registration template",
          },
          {
            name: "notification",
            component: MockNotificationComponent,
            category: "notifications",
          },
          {
            name: "uncategorized",
            component: MockSimpleComponent,
          },
        ]);
      });

      it("should return comprehensive registry information", () => {
        const info = getRegistryInfo();

        expect(info.totalTemplates).toBe(4);
        expect(info.categories).toEqual([
          "authentication",
          "notifications",
          "uncategorized",
        ]);
        expect(info.templates).toHaveLength(4);
      });

      it("should include detailed template information", () => {
        const info = getRegistryInfo();
        const authLogin = info.templates.find((t) => t.name === "auth-login");

        expect(authLogin).toEqual({
          name: "auth-login",
          category: "authentication",
          description: "Login template",
          hasSubjectGenerator: true,
          hasSchema: true,
        });
      });

      it("should handle templates without optional properties", () => {
        const info = getRegistryInfo();
        const uncategorized = info.templates.find(
          (t) => t.name === "uncategorized"
        );

        expect(uncategorized).toEqual({
          name: "uncategorized",
          category: "uncategorized",
          description: undefined,
          hasSubjectGenerator: false,
          hasSchema: false,
        });
      });

      it("should return empty info when no templates registered", () => {
        clearTemplates();
        const info = getRegistryInfo();

        expect(info.totalTemplates).toBe(0);
        expect(info.categories).toEqual([]);
        expect(info.templates).toEqual([]);
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle registration with empty string name", () => {
      const definition: TemplateDefinition = {
        name: "",
        component: MockSimpleComponent,
      };

      expect(() => registerTemplate(definition)).toThrow(
        "Template name is required"
      );
    });

    it("should handle template retrieval with empty string name", () => {
      expect(() => getTemplate("")).toThrow(TemplateNotFoundError);
    });

    it("should handle subject generation for template with empty name", () => {
      // This should fallback to default since template won't be found
      const subject = getTemplateSubject("", {});
      expect(subject).toBe("Email notification");
    });

    it("should handle props validation with null schema", () => {
      registerTemplate({
        name: "null-schema",
        component: MockSimpleComponent,
        propsSchema: null as any,
      });

      const result = validateTemplateProps("null-schema", {});
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should handle complex nested props in subject generation", () => {
      registerTemplate({
        name: "complex-subject",
        component: MockSimpleComponent,
        subjectGenerator: (props: any) =>
          `Hello ${props.user?.name || "Guest"}`,
      });

      const subject1 = getTemplateSubject("complex-subject", {
        user: { name: "John" },
      });
      expect(subject1).toBe("Hello John");

      const subject2 = getTemplateSubject("complex-subject", {});
      expect(subject2).toBe("Hello Guest");
    });
  });
});
