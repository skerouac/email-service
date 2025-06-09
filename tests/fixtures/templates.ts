import {
  WelcomeEmailProps,
  NotificationEmailProps,
  BaseLayoutProps,
} from "../../src/templates/types";
import { EmailPriority } from "../../src/types";

// Basic welcome email props
export const basicWelcomeProps: WelcomeEmailProps = {
  name: "John Doe",
  email: "john.doe@example.com",
};

// Complete welcome email props with all optional fields
export const completeWelcomeProps: WelcomeEmailProps = {
  name: "Jane Smith",
  email: "jane.smith@example.com",
  actionUrl: "https://app.example.com/welcome",
  actionText: "Get Started Now",
  companyName: "Test Company Inc.",
  companyUrl: "https://testcompany.com",
};

// Welcome email with custom action
export const customActionWelcomeProps: WelcomeEmailProps = {
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  actionUrl: "https://app.example.com/setup",
  actionText: "Complete Setup",
  companyName: "StartupCo",
  companyUrl: "https://startupco.io",
};

// Welcome email with long name for testing
export const longNameWelcomeProps: WelcomeEmailProps = {
  name: "Alexander Christopher Montgomery-Wellington III",
  email:
    "alexander.christopher.montgomery.wellington.iii@verylongdomainname.example.com",
  companyName: "Very Long Company Name That Might Cause Layout Issues Ltd.",
};

// Welcome email with international characters
export const internationalWelcomeProps: WelcomeEmailProps = {
  name: "José María García-González",
  email: "jose.maria@empresa.es",
  companyName: "Empresa Internacional S.A.",
  companyUrl: "https://empresa.es",
  actionText: "Comenzar",
};

// Basic notification email props
export const basicNotificationProps: NotificationEmailProps = {
  title: "System Notification",
  message: "This is a basic system notification message.",
};

// Complete notification email props
export const completeNotificationProps: NotificationEmailProps = {
  title: "Account Updated Successfully",
  message:
    "Your account settings have been updated. All changes are now active.",
  actionUrl: "https://app.example.com/account",
  actionText: "View Account",
  priority: "normal" as EmailPriority,
  companyName: "Service Provider",
  companyUrl: "https://serviceprovider.com",
};

// High priority notification
export const highPriorityNotificationProps: NotificationEmailProps = {
  title: "Security Alert",
  message:
    "We detected unusual activity on your account. Please review your recent activity and secure your account.",
  actionUrl: "https://app.example.com/security",
  actionText: "Review Activity",
  priority: "high" as EmailPriority,
  companyName: "Security Services",
  companyUrl: "https://security.example.com",
};

// Low priority notification
export const lowPriorityNotificationProps: NotificationEmailProps = {
  title: "Weekly Summary Available",
  message:
    "Your weekly activity summary is ready to view. Check out what you accomplished this week.",
  actionUrl: "https://app.example.com/summary",
  actionText: "View Summary",
  priority: "low" as EmailPriority,
  companyName: "Analytics Dashboard",
};

// Notification without action button
export const noActionNotificationProps: NotificationEmailProps = {
  title: "Maintenance Complete",
  message:
    "Scheduled maintenance has been completed successfully. All services are now fully operational.",
  priority: "normal" as EmailPriority,
  companyName: "Infrastructure Team",
};

// Long message notification
export const longMessageNotificationProps: NotificationEmailProps = {
  title: "Important Service Update",
  message: `We're writing to inform you about important updates to our service terms and privacy policy. 
    These changes will take effect on the first day of next month. We've made several improvements to enhance 
    your experience, including better security measures, improved performance, and new features. 
    Please take a moment to review the updated terms when you have a chance. If you have any questions 
    or concerns about these changes, our support team is here to help. Thank you for being a valued customer.`,
  actionUrl: "https://app.example.com/terms",
  actionText: "Review Changes",
  priority: "normal" as EmailPriority,
  companyName: "Legal Department",
};

// Basic base layout props
export const basicBaseLayoutProps: BaseLayoutProps = {
  title: "Test Email",
  children: null, // Will be filled in by React components
};

// Complete base layout props
export const completeBaseLayoutProps: BaseLayoutProps = {
  title: "Complete Email Layout Test",
  children: null,
  footerText:
    "You received this email because you signed up for our amazing service.",
  companyName: "Amazing Service Co.",
  companyUrl: "https://amazingservice.co",
};

// Custom footer layout props
export const customFooterBaseLayoutProps: BaseLayoutProps = {
  title: "Custom Footer Email",
  children: null,
  footerText:
    "This is a custom footer message with additional information about unsubscribing and contact details.",
  companyName: "Custom Company",
  companyUrl: "https://customcompany.example.com",
};

// Minimal layout props
export const minimalBaseLayoutProps: BaseLayoutProps = {
  title: "Minimal Email",
  children: null,
  companyName: "MinimalCo",
};

// Invalid props for testing validation
export const invalidWelcomeProps = {
  missingName: {
    email: "test@example.com",
  } as Partial<WelcomeEmailProps>,

  missingEmail: {
    name: "Test User",
  } as Partial<WelcomeEmailProps>,

  emptyName: {
    name: "",
    email: "test@example.com",
  } as Partial<WelcomeEmailProps>,

  emptyEmail: {
    name: "Test User",
    email: "",
  } as Partial<WelcomeEmailProps>,

  invalidEmail: {
    name: "Test User",
    email: "invalid-email",
  } as Partial<WelcomeEmailProps>,
};

export const invalidNotificationProps = {
  missingTitle: {
    message: "Test message",
  } as Partial<NotificationEmailProps>,

  missingMessage: {
    title: "Test Title",
  } as Partial<NotificationEmailProps>,

  emptyTitle: {
    title: "",
    message: "Test message",
  } as Partial<NotificationEmailProps>,

  emptyMessage: {
    title: "Test Title",
    message: "",
  } as Partial<NotificationEmailProps>,

  invalidPriority: {
    title: "Test Title",
    message: "Test message",
    priority: "invalid" as any,
  } as Partial<NotificationEmailProps>,
};

export const invalidBaseLayoutProps = {
  missingTitle: {
    children: null,
  } as Partial<BaseLayoutProps>,

  emptyTitle: {
    title: "",
    children: null,
  } as Partial<BaseLayoutProps>,

  missingChildren: {
    title: "Test Title",
  } as Partial<BaseLayoutProps>,
};

// Template testing scenarios
export const welcomeEmailScenarios = {
  basic: basicWelcomeProps,
  complete: completeWelcomeProps,
  customAction: customActionWelcomeProps,
  longName: longNameWelcomeProps,
  international: internationalWelcomeProps,
};

export const notificationEmailScenarios = {
  basic: basicNotificationProps,
  complete: completeNotificationProps,
  highPriority: highPriorityNotificationProps,
  lowPriority: lowPriorityNotificationProps,
  noAction: noActionNotificationProps,
  longMessage: longMessageNotificationProps,
};

export const baseLayoutScenarios = {
  basic: basicBaseLayoutProps,
  complete: completeBaseLayoutProps,
  customFooter: customFooterBaseLayoutProps,
  minimal: minimalBaseLayoutProps,
};

// Priority testing data
export const priorityTestData = {
  priorities: ["low", "normal", "high"] as EmailPriority[],
  priorityColors: {
    low: "#28a745",
    normal: "#556cd6",
    high: "#dc3545",
  },
};

// Edge case testing props
export const edgeCaseProps = {
  welcomeWithUnicode: {
    name: "🚀 Unicode User 测试 🎉",
    email: "unicode@test.com",
    companyName: "🏢 Unicode Company 公司",
    actionText: "开始 Start 🎯",
  } as WelcomeEmailProps,

  notificationWithHtml: {
    title: "HTML <strong>Test</strong>",
    message:
      "This message contains <em>HTML</em> and should be properly escaped.",
    priority: "normal" as EmailPriority,
  } as NotificationEmailProps,

  veryLongContent: {
    name: "A".repeat(100),
    email:
      "very.long.email.address.for.testing@very.long.domain.name.example.com",
    companyName:
      "Very Long Company Name That Should Test Layout Boundaries".repeat(3),
    actionText: "Very Long Action Button Text That Might Cause Issues",
  } as WelcomeEmailProps,

  specialCharacters: {
    name: 'User "Special" & <Characters>',
    email: "special+chars@test.com",
    companyName: 'Company & Co. "Special Characters"',
    actionText: 'Action & "Quotes"',
  } as WelcomeEmailProps,
};

// Helper functions to create props with overrides
export const createWelcomeProps = (
  overrides: Partial<WelcomeEmailProps> = {}
): WelcomeEmailProps => ({
  ...basicWelcomeProps,
  ...overrides,
});

export const createNotificationProps = (
  overrides: Partial<NotificationEmailProps> = {}
): NotificationEmailProps => ({
  ...basicNotificationProps,
  ...overrides,
});

export const createBaseLayoutProps = (
  overrides: Partial<BaseLayoutProps> = {}
): BaseLayoutProps => ({
  ...basicBaseLayoutProps,
  ...overrides,
});

// Performance testing props
export const performanceTestProps = {
  manyProps: {
    ...completeWelcomeProps,
    name: "Performance Test User",
    email: "performance@test.com",
    // Add many optional props for testing
    actionUrl: "https://performance.test.com/action",
    actionText: "Performance Action",
    companyName: "Performance Test Company",
    companyUrl: "https://performance.test.com",
  } as WelcomeEmailProps,

  minimalProps: {
    name: "Min",
    email: "min@test.com",
  } as WelcomeEmailProps,
};

// Subject generation test data
export const subjectTestData = {
  welcomeSubjects: {
    default: "Welcome to Test Company Inc.!",
    custom: "Welcome aboard, John!",
    international: "Bienvenido a nuestra empresa",
  },
  notificationSubjects: {
    normal: "Account Updated Successfully",
    high: "Security Alert",
    low: "Weekly Summary Available",
    custom: "Custom Notification Subject",
  },
};

// Export collections for easy access
export const allWelcomeProps = Object.values(welcomeEmailScenarios);
export const allNotificationProps = Object.values(notificationEmailScenarios);
export const allBaseLayoutProps = Object.values(baseLayoutScenarios);
export const allInvalidProps = {
  welcome: Object.values(invalidWelcomeProps),
  notification: Object.values(invalidNotificationProps),
  baseLayout: Object.values(invalidBaseLayoutProps),
};

// Common test data combinations
export const commonTestCombinations = {
  welcomeBasic: {
    emailOptions: {
      from: "noreply@test.com",
      to: "user@test.com",
      templateName: "welcome",
      templateProps: basicWelcomeProps,
    },
    expectedSubject: "Welcome to Your Company!",
  },
  notificationHigh: {
    emailOptions: {
      from: "alerts@test.com",
      to: "user@test.com",
      templateName: "notification",
      templateProps: highPriorityNotificationProps,
    },
    expectedSubject: "Security Alert",
  },
};
