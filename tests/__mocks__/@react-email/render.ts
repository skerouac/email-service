import { jest } from "@jest/globals";
import React from "react";

// Mock render function with realistic HTML output
export const render = jest.fn().mockImplementation(async (element: any) => {
  // Extract component name and props for realistic mock output
  const componentName =
    typeof element.type === "function"
      ? element.type.name
      : element.type || "Component";
  const props = element.props || {};

  // Generate realistic HTML based on component type and props
  let mockHtml = "";

  // Check if it's a known email component type
  if (componentName === "WelcomeEmail") {
    mockHtml = generateWelcomeEmailHtml(props);
  } else if (componentName === "NotificationEmail") {
    mockHtml = generateNotificationEmailHtml(props);
  } else if (componentName === "BaseLayout") {
    mockHtml = generateBaseLayoutHtml(props);
  } else {
    // Generic component mock
    mockHtml = generateGenericEmailHtml(componentName, props);
  }

  // Store the render call for test assertions
  (render as any).__lastRenderCall = {
    componentName,
    props,
    html: mockHtml,
    timestamp: new Date().toISOString(),
  };

  return mockHtml;
});

// Realistic HTML generators for different email types
function generateWelcomeEmailHtml(props: any): string {
  const {
    name = "User",
    email = "user@example.com",
    actionUrl = "#",
    actionText = "Get Started",
    companyName = "Company",
    companyUrl = "#",
  } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Welcome to ${companyName}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
    <header style="text-align: center; padding: 32px 24px; border-bottom: 1px solid #e6ebf1;">
      <h1 style="color: #333; font-size: 24px; font-weight: bold; margin: 0;">${companyName}</h1>
    </header>
    <main style="padding: 32px 24px;">
      <h2 style="color: #333; font-size: 24px; font-weight: bold; margin: 0 0 20px;">Welcome to ${companyName}, ${name}!</h2>
      <p style="color: #333; font-size: 16px; line-height: 24px; margin: 0 0 16px;">Thank you for joining us! We're excited to have you on board.</p>
      <p style="color: #333; font-size: 16px; line-height: 24px; margin: 0 0 16px;">Your account has been created with the email address: <strong>${email}</strong></p>
      <p style="color: #333; font-size: 16px; line-height: 24px; margin: 0 0 16px;">To get started, click the button below:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${actionUrl}" style="background-color: #556cd6; border-radius: 6px; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; text-align: center; display: inline-block; padding: 12px 24px; border: none; cursor: pointer;">${actionText}</a>
      </div>
      <p style="color: #333; font-size: 16px; line-height: 24px; margin: 0 0 16px;">If you have any questions, feel free to reach out to our support team. We're here to help!</p>
      <p style="color: #333; font-size: 16px; line-height: 24px; margin: 0 0 16px;">Best regards,<br>The ${companyName} Team</p>
    </main>
    <footer style="text-align: center; padding: 0 24px;">
      <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 8px 0;">This email was sent to you because you signed up for our service.</p>
      <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 8px 0;">
        <a href="${companyUrl}" style="color: #556cd6; text-decoration: underline;">Visit our website</a>
      </p>
    </footer>
  </div>
</body>
</html>`.trim();
}

function generateNotificationEmailHtml(props: any): string {
  const {
    title = "Notification",
    message = "This is a notification message.",
    actionUrl,
    actionText,
    priority = "normal",
    companyName = "Company",
    companyUrl = "#",
  } = props;

  const priorityColors = {
    low: "#28a745",
    normal: "#556cd6",
    high: "#dc3545",
  };

  const priorityColor =
    priorityColors[priority as keyof typeof priorityColors] ||
    priorityColors.normal;

  return `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
    <header style="text-align: center; padding: 32px 24px; border-bottom: 1px solid #e6ebf1;">
      <h1 style="color: #333; font-size: 24px; font-weight: bold; margin: 0;">${companyName}</h1>
    </header>
    <main style="padding: 32px 24px;">
      <div style="display: inline-block; padding: 4px 8px; border-radius: 4px; color: #ffffff; font-size: 10px; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 16px; background-color: ${priorityColor};">
        ${priority.toUpperCase()} PRIORITY
      </div>
      <h2 style="color: #333; font-size: 24px; font-weight: bold; margin: 0 0 20px;">${title}</h2>
      <p style="color: #333; font-size: 16px; line-height: 24px; margin: 0 0 16px;">${message}</p>
      ${
        actionUrl && actionText
          ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${actionUrl}" style="background-color: ${priorityColor}; border-radius: 6px; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; text-align: center; display: inline-block; padding: 12px 24px; border: none; cursor: pointer;">${actionText}</a>
      </div>
      `
          : ""
      }
      <p style="color: #8898aa; font-size: 14px; line-height: 20px; margin: 24px 0 0;">This is an automated notification from ${companyName}. If you believe you received this in error, please contact our support team.</p>
    </main>
    <footer style="text-align: center; padding: 0 24px;">
      <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 8px 0;">This email was sent to you because you signed up for our service.</p>
      <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 8px 0;">
        <a href="${companyUrl}" style="color: #556cd6; text-decoration: underline;">Visit our website</a>
      </p>
    </footer>
  </div>
</body>
</html>`.trim();
}

function generateBaseLayoutHtml(props: any): string {
  const {
    title = "Email",
    children,
    footerText = "This email was sent to you because you signed up for our service.",
    companyName = "Company",
    companyUrl = "#",
  } = props;

  // For children, we'll just render a placeholder since we can't actually render React children in a mock
  const childrenHtml =
    typeof children === "string" ? children : "<div>[Email Content]</div>";

  return `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; margin-bottom: 64px;">
    <header style="padding: 32px 24px; border-bottom: 1px solid #e6ebf1;">
      <h1 style="color: #333; font-size: 24px; font-weight: bold; margin: 0; text-align: center;">${companyName}</h1>
    </header>
    <main style="padding: 32px 24px;">
      ${childrenHtml}
    </main>
    <hr style="border-color: #e6ebf1; margin: 20px 0;">
    <footer style="padding: 0 24px; text-align: center;">
      <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 8px 0;">${footerText}</p>
      <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 8px 0;">
        <a href="${companyUrl}" style="color: #556cd6; text-decoration: underline;">Visit our website</a>
      </p>
    </footer>
  </div>
</body>
</html>`.trim();
}

function generateGenericEmailHtml(componentName: string, props: any): string {
  const propsString = Object.keys(props)
    .map(
      (key) =>
        `${key}: ${typeof props[key] === "string" ? props[key] : JSON.stringify(props[key])}`
    )
    .join(", ");

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Mock Email - ${componentName}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
    <h1>Mock ${componentName}</h1>
    <p>This is a mock render of the ${componentName} component.</p>
    ${propsString ? `<p><strong>Props:</strong> ${propsString}</p>` : ""}
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;">
      [Mock ${componentName} Content]
    </div>
  </div>
</body>
</html>`.trim();
}

// Test helper functions
export const getLastRenderCall = () => {
  return (render as any).__lastRenderCall;
};

export const clearRenderHistory = () => {
  (render as any).__lastRenderCall = null;
  render.mockClear();
};

// Mock render with error simulation
export const simulateRenderError = (
  errorMessage: string = "Mock render error"
) => {
  render.mockImplementationOnce(async (_element: any) => {
    throw new Error(errorMessage);
  });
};

// Mock render with custom HTML
export const mockRenderWithHtml = (html: string) => {
  render.mockImplementationOnce(async (_element: any) => html);
};

// Reset to default behavior
export const resetRenderMock = () => {
  render.mockRestore();
  clearRenderHistory();
};

export default { render };
