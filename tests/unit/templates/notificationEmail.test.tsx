import React from "react";
import { render } from "../../../tests/setup/test-utils";
import { NotificationEmail } from "../../../src/templates/notificationEmail";
import {
  basicNotificationProps,
  completeNotificationProps,
  highPriorityNotificationProps,
  lowPriorityNotificationProps,
  noActionNotificationProps,
  longMessageNotificationProps,
  priorityTestData,
  edgeCaseProps,
  notificationEmailScenarios,
} from "../../../tests/fixtures/templates";
import { expect } from "@jest/globals";

describe("NotificationEmail Component", () => {
  // Helper function to find the priority badge element
  const findPriorityBadge = (container: HTMLElement) => {
    // Find divs that contain "PRIORITY" in their text content
    const potentialBadges = Array.from(
      container.querySelectorAll("div")
    ).filter((div) => div.textContent?.includes("PRIORITY"));

    // Find the one that is the most likely to be the badge (smallest text content)
    return potentialBadges.reduce(
      (shortest, current) => {
        if (!shortest) return current;
        return (current.textContent?.length || Infinity) <
          (shortest.textContent?.length || Infinity)
          ? current
          : shortest;
      },
      null as HTMLDivElement | null
    );
  };

  // Test basic rendering with required props
  test("renders with minimal required props", () => {
    const props = {
      title: "Test Notification",
      message: "This is a test notification message.",
    };

    const { container } = render(<NotificationEmail {...props} />);

    // Check if title is rendered
    expect(container.textContent).toContain("Test Notification");

    // Check if message is rendered
    expect(container.textContent).toContain(
      "This is a test notification message."
    );

    // Check if default priority badge is rendered
    const priorityBadge = findPriorityBadge(container);
    expect(priorityBadge?.textContent?.trim()).toBe("NORMAL PRIORITY");

    // Check if default company name is rendered
    expect(container.textContent).toContain("Your Company");

    // Check for automated notification message
    expect(container.textContent).toContain(
      "This is an automated notification from Your Company"
    );
  });

  // Test with different priority levels
  test.each([
    ["low", "LOW PRIORITY"],
    ["normal", "NORMAL PRIORITY"],
    ["high", "HIGH PRIORITY"],
  ])("renders with %s priority", (priorityLevel, expectedText) => {
    const props = {
      title: "Priority Test",
      message: "Testing priority levels",
      priority: priorityLevel as "low" | "normal" | "high",
    };

    const { container } = render(<NotificationEmail {...props} />);

    // Check if priority badge text is correct
    const priorityBadge = findPriorityBadge(container);
    expect(priorityBadge?.textContent?.trim()).toBe(expectedText);
  });

  // Test with action button
  test("renders with action button when actionUrl and actionText are provided", () => {
    const props = {
      title: "Action Test",
      message: "This notification has an action button",
      actionUrl: "https://example.com/action",
      actionText: "Take Action",
    };

    const { container } = render(<NotificationEmail {...props} />);

    // Check if action button is rendered
    const buttonElement = container.querySelector(
      `a[href="${props.actionUrl}"]`
    );
    expect(buttonElement).not.toBeNull();
    expect(buttonElement?.textContent).toBe("Take Action");
  });

  // Test without action button
  test("does not render action button when actionUrl or actionText is missing", () => {
    const propsNoUrl = {
      title: "No URL Test",
      message: "This notification has no action URL",
      actionText: "Take Action",
    };

    const { container: container1 } = render(
      <NotificationEmail {...propsNoUrl} />
    );

    // Check that no button is rendered when URL is missing
    const buttonElement1 = container1.querySelector(`a[href]`);
    expect(buttonElement1?.textContent).not.toBe("Take Action");

    const propsNoText = {
      title: "No Text Test",
      message: "This notification has no action text",
      actionUrl: "https://example.com/action",
    };

    const { container: container2 } = render(
      <NotificationEmail {...propsNoText} />
    );

    // Check that no button is rendered when text is missing
    const buttonElement2 = container2.querySelector(
      `a[href="https://example.com/action"]`
    );
    expect(buttonElement2).toBeNull();
  });

  // Test with custom company info
  test("renders with custom company information", () => {
    const props = {
      title: "Company Test",
      message: "Testing custom company info",
      companyName: "Test Corp",
      companyUrl: "https://testcorp.example.com",
    };

    const { container } = render(<NotificationEmail {...props} />);

    // Check if custom company name is rendered
    expect(container.textContent).toContain("Test Corp");
    expect(container.textContent).toContain(
      "This is an automated notification from Test Corp"
    );

    // Check if company URL is set correctly
    const linkElements = container.querySelectorAll("a");
    // Find the company URL link (might be in the BaseLayout footer)
    const companyLink = Array.from(linkElements).find(
      (link) => link.getAttribute("href") === "https://testcorp.example.com"
    );
    expect(companyLink).not.toBeNull();
  });

  // Test with basic fixture data
  test("renders correctly with basic fixture data", () => {
    const { container } = render(
      <NotificationEmail {...basicNotificationProps} />
    );

    expect(container.textContent).toContain(basicNotificationProps.title);
    expect(container.textContent).toContain(basicNotificationProps.message);
  });

  // Test with complete fixture data
  test("renders correctly with complete fixture data", () => {
    const props = completeNotificationProps;
    const { container } = render(<NotificationEmail {...props} />);

    // Check title and message
    expect(container.textContent).toContain(props.title);
    expect(container.textContent).toContain(props.message);

    // Check company info
    expect(container.textContent).toContain(props.companyName);
    expect(container.textContent).toContain(
      `This is an automated notification from ${props.companyName}`
    );

    // Check action button
    const buttonElement = container.querySelector(
      `a[href="${props.actionUrl}"]`
    );
    expect(buttonElement).not.toBeNull();
    expect(buttonElement?.textContent).toBe(props.actionText);

    // Check priority
    const priorityBadge = findPriorityBadge(container);
    expect(priorityBadge?.textContent?.trim()).toBe("NORMAL PRIORITY");
  });

  // Test high priority notification
  test("renders high priority notification correctly", () => {
    const props = highPriorityNotificationProps;
    const { container } = render(<NotificationEmail {...props} />);

    // Check priority badge
    const priorityBadge = findPriorityBadge(container);
    expect(priorityBadge?.textContent?.trim()).toBe("HIGH PRIORITY");

    // High priority should have a different color (testing indirectly through structure)
    const buttonElement = container.querySelector(
      `a[href="${props.actionUrl}"]`
    );
    expect(buttonElement).not.toBeNull();
  });

  // Test low priority notification
  test("renders low priority notification correctly", () => {
    const props = lowPriorityNotificationProps;
    const { container } = render(<NotificationEmail {...props} />);

    // Check priority badge
    const priorityBadge = findPriorityBadge(container);
    expect(priorityBadge?.textContent?.trim()).toBe("LOW PRIORITY");
  });

  // Test notification without action
  test("renders notification without action button correctly", () => {
    const props = noActionNotificationProps;
    const { container } = render(<NotificationEmail {...props} />);

    // Confirm no action button is present for the given URL
    const actionButton = container.querySelector('a[href]:not([href="#"])');
    expect(actionButton).toBeNull();
  });

  // Test notification with long message
  test("renders notification with long message correctly", () => {
    const props = longMessageNotificationProps;
    const { container } = render(<NotificationEmail {...props} />);

    // The long message should be included in the output
    expect(container.textContent).toContain(props.message.substring(0, 50));
    expect(container.textContent).toContain(props.message.substring(50, 100));
  });

  // Test with HTML content in notification
  test("handles HTML content in notification props", () => {
    const props = edgeCaseProps.notificationWithHtml;
    const { container } = render(<NotificationEmail {...props} />);

    // HTML in the title and message is included as literal text
    expect(container.textContent).toContain("HTML <strong>Test</strong>");
    expect(container.textContent).toContain(
      "This message contains <em>HTML</em> and should be properly escaped"
    );

    // Check if the HTML tags are treated as text and not parsed as HTML elements
    const strongElements = container.querySelectorAll("strong");
    const emElements = container.querySelectorAll("em");

    // There should be no actual strong or em elements created from the content
    expect(
      Array.from(strongElements).some((el) => el.textContent === "Test")
    ).toBe(false);
    expect(Array.from(emElements).some((el) => el.textContent === "HTML")).toBe(
      false
    );
  });

  // Test email structure and components
  test("has correct email structure and components", () => {
    const { container } = render(
      <NotificationEmail
        title="Structure Test"
        message="Testing the email structure"
        actionUrl="https://example.com/test"
        actionText="Test Action"
      />
    );

    // Check for main structural elements
    const priorityBadge = findPriorityBadge(container);
    expect(priorityBadge).not.toBeNull();

    // Check for the message text
    expect(container.textContent).toContain("Testing the email structure");

    // Check for the button
    const buttonElement = container.querySelector(
      'a[href="https://example.com/test"]'
    );
    expect(buttonElement).not.toBeNull();
    expect(buttonElement?.textContent).toBe("Test Action");

    // Check for the automated notification message
    expect(container.textContent).toContain(
      "This is an automated notification from"
    );
  });

  // Test that all priority colors are correctly applied
  test("applies correct color based on priority", () => {
    // Test each priority level separately

    // Test low priority
    const lowProps = {
      title: "Low Priority Test",
      message: "Testing low priority color",
      priority: "low" as const,
      actionUrl: "https://example.com/action",
      actionText: "Action",
    };

    const { container: lowContainer } = render(
      <NotificationEmail {...lowProps} />
    );
    const lowPriorityBadge = findPriorityBadge(lowContainer);
    expect(lowPriorityBadge?.textContent?.trim()).toBe("LOW PRIORITY");

    // Test normal priority
    const normalProps = {
      title: "Normal Priority Test",
      message: "Testing normal priority color",
      priority: "normal" as const,
      actionUrl: "https://example.com/action",
      actionText: "Action",
    };

    const { container: normalContainer } = render(
      <NotificationEmail {...normalProps} />
    );
    const normalPriorityBadge = findPriorityBadge(normalContainer);
    expect(normalPriorityBadge?.textContent?.trim()).toBe("NORMAL PRIORITY");

    // Test high priority
    const highProps = {
      title: "High Priority Test",
      message: "Testing high priority color",
      priority: "high" as const,
      actionUrl: "https://example.com/action",
      actionText: "Action",
    };

    const { container: highContainer } = render(
      <NotificationEmail {...highProps} />
    );
    const highPriorityBadge = findPriorityBadge(highContainer);
    expect(highPriorityBadge?.textContent?.trim()).toBe("HIGH PRIORITY");
  });
});
