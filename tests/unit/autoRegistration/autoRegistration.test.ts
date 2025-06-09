// Simple test approach - testing actual functionality
const mockRegisterTemplate = jest.fn();
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock the imports before importing the module
jest.mock("../../../src/templateResolver", () => ({
  registerTemplate: mockRegisterTemplate,
}));

jest.mock("../../../src/utils/logger", () => ({
  getLogger: () => mockLogger,
}));

jest.mock("../../../src/templates/types", () => ({
  WelcomeEmail: "WelcomeEmailComponent",
  NotificationEmail: "NotificationEmailComponent",
}));

// Now import after mocking
import {
  autoRegisterBuiltInTemplates,
  discoverTemplatesFromDirectory,
  registerDiscoveredTemplates,
  initializeTemplates,
  getInitializationStatus,
} from "../../../src/autoRegistration";

describe("Template Initialization Tests", () => {
  beforeEach(() => {
    mockRegisterTemplate.mockClear();
    mockLogger.info.mockClear();
    mockLogger.debug.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
  });

  test("autoRegisterBuiltInTemplates calls registerTemplate twice", () => {
    autoRegisterBuiltInTemplates();

    expect(mockRegisterTemplate).toHaveBeenCalledTimes(2);
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Auto-registering built-in templates"
    );
  });

  test("autoRegisterBuiltInTemplates registers welcome template correctly", () => {
    autoRegisterBuiltInTemplates();

    const firstCall = mockRegisterTemplate.mock.calls[0][0];
    expect(firstCall.name).toBe("welcome");
    expect(firstCall.category).toBe("onboarding");
    expect(firstCall.description).toBe("Welcome email for new users");
  });

  test("autoRegisterBuiltInTemplates registers notification template correctly", () => {
    autoRegisterBuiltInTemplates();

    const secondCall = mockRegisterTemplate.mock.calls[1][0];
    expect(secondCall.name).toBe("notification");
    expect(secondCall.category).toBe("system");
    expect(secondCall.description).toBe(
      "General notification email with priority levels"
    );
  });

  test("welcome template subject generator works", () => {
    autoRegisterBuiltInTemplates();

    const welcomeTemplate = mockRegisterTemplate.mock.calls[0][0];
    const subjectGen = welcomeTemplate.subjectGenerator;

    expect(subjectGen({ companyName: "TestCorp" })).toBe(
      "Welcome to TestCorp!"
    );
    expect(subjectGen({})).toBe("Welcome to our service!");
  });

  test("notification template subject generator works", () => {
    autoRegisterBuiltInTemplates();

    const notificationTemplate = mockRegisterTemplate.mock.calls[1][0];
    const subjectGen = notificationTemplate.subjectGenerator;

    expect(subjectGen({ title: "Alert" })).toBe("Alert");
    expect(subjectGen({})).toBe("Important notification");
  });

  test("autoRegisterBuiltInTemplates handles registration errors", () => {
    mockRegisterTemplate.mockImplementationOnce(() => {
      throw new Error("Registration failed");
    });

    autoRegisterBuiltInTemplates();

    expect(mockLogger.error).toHaveBeenCalledWith(
      "Failed to auto-register template: welcome",
      { templateName: "welcome" },
      expect.any(Error)
    );
  });

  test("discoverTemplatesFromDirectory returns empty array", async () => {
    const result = await discoverTemplatesFromDirectory("/test/path");

    expect(result).toEqual([]);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "Template directory discovery is an advanced feature",
      expect.objectContaining({
        templateDir: "/test/path",
      })
    );
  });

  test("registerDiscoveredTemplates with valid templates", () => {
    const mockComponent = jest.fn();
    const templates = [
      {
        name: "test-template",
        path: "/path/test.tsx",
        component: mockComponent,
        metadata: {
          category: "test",
          description: "Test template",
        },
      },
    ];

    const result = registerDiscoveredTemplates(templates);

    expect(result.registered).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.errors).toEqual([]);
    expect(mockRegisterTemplate).toHaveBeenCalledWith({
      name: "test-template",
      component: mockComponent,
      category: "test",
      description: "Test template",
      propsSchema: undefined,
    });
  });

  test("registerDiscoveredTemplates with invalid template", () => {
    const templates = [
      {
        name: "invalid-template",
        path: "/path/invalid.tsx",
        // missing component
      },
    ];

    const result = registerDiscoveredTemplates(templates);

    expect(result.registered).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe(
      "Template invalid-template has no component"
    );
  });

  test("initializeTemplates with default options", async () => {
    await initializeTemplates();

    expect(mockRegisterTemplate).toHaveBeenCalledTimes(2);
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Initializing template system",
      { autoRegisterBuiltIn: true, customTemplateCount: 0 }
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Template system initialization complete"
    );
  });

  test("initializeTemplates with custom templates", async () => {
    const customTemplates = [
      {
        name: "custom1",
        component: jest.fn(),
        category: "custom",
      },
    ];

    await initializeTemplates({ customTemplates });

    expect(mockRegisterTemplate).toHaveBeenCalledTimes(3); // 2 built-in + 1 custom
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Registering 1 custom templates"
    );
  });

  test("initializeTemplates with autoRegisterBuiltIn false", async () => {
    await initializeTemplates({ autoRegisterBuiltIn: false });

    expect(mockRegisterTemplate).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Initializing template system",
      { autoRegisterBuiltIn: false, customTemplateCount: 0 }
    );
  });

  test("initializeTemplates handles errors", async () => {
    // Custom template registration errors DO propagate up (not caught individually)
    const customTemplates = [
      {
        name: "failing-custom",
        component: jest.fn(),
        category: "custom",
      },
    ];

    mockRegisterTemplate.mockImplementation(() => {
      throw new Error("Init failed");
    });

    await expect(initializeTemplates({ customTemplates })).rejects.toThrow(
      "Init failed"
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Template system initialization failed",
      undefined,
      expect.any(Error)
    );
  });

  test("getInitializationStatus returns correct info", () => {
    const status = getInitializationStatus();

    expect(status).toEqual({
      builtInTemplatesAvailable: 2,
      builtInTemplateNames: ["welcome", "notification"],
    });
  });

  test("welcome template has correct props schema", () => {
    autoRegisterBuiltInTemplates();

    const welcomeTemplate = mockRegisterTemplate.mock.calls[0][0];
    expect(welcomeTemplate.propsSchema).toEqual({
      name: { type: "string", required: true },
      email: { type: "string", required: true },
      actionUrl: { type: "string", required: false },
      actionText: { type: "string", required: false },
      companyName: { type: "string", required: false },
      companyUrl: { type: "string", required: false },
    });
  });

  test("notification template has correct props schema", () => {
    autoRegisterBuiltInTemplates();

    const notificationTemplate = mockRegisterTemplate.mock.calls[1][0];
    expect(notificationTemplate.propsSchema.priority).toEqual({
      type: "string",
      required: false,
      enum: ["low", "normal", "high"],
      default: "normal",
    });
  });
});
