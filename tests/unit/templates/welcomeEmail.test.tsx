import React from "react";
import { render } from "../../../tests/setup/test-utils";
import { WelcomeEmail } from "../../../src/templates/welcomeEmail";
import {
  welcomeEmailScenarios,
  basicWelcomeProps,
  completeWelcomeProps,
  edgeCaseProps,
} from "../../../tests/fixtures/templates";
import { expect } from "@jest/globals";

describe("WelcomeEmail Component", () => {
  // Test basic rendering with required props
  test("renders with minimal required props", () => {
    const props = {
      name: "John Doe",
      email: "john.doe@example.com",
    };

    const { container } = render(<WelcomeEmail {...props} />);

    // Check if name is rendered
    expect(container.textContent).toContain("John Doe");

    // Check if email is rendered
    expect(container.textContent).toContain("john.doe@example.com");

    // Check if default company name is rendered
    expect(container.textContent).toContain("Your Company");

    // Check if default action text is rendered
    expect(container.textContent).toContain("Get Started");

    // Check for welcome message
    expect(container.textContent).toContain(
      "Welcome to Your Company, John Doe!"
    );

    // Check for thank you message
    expect(container.textContent).toContain("Thank you for joining us");

    // Check for the support message
    expect(container.textContent).toContain("If you have any questions");

    // Check for closing
    expect(container.textContent).toContain("Best regards");
    expect(container.textContent).toContain("The Your Company Team");
  });

  // Test with custom company info
  test("renders with custom company information", () => {
    const props = {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      companyName: "Acme Corporation",
      companyUrl: "https://acme.example.com",
    };

    const { container } = render(<WelcomeEmail {...props} />);

    // Check if custom company name is rendered
    expect(container.textContent).toContain("Acme Corporation");
    expect(container.textContent).toContain(
      "Welcome to Acme Corporation, Jane Smith!"
    );
    expect(container.textContent).toContain("The Acme Corporation Team");

    // Check if company URL is set correctly
    const linkElements = container.querySelectorAll("a");
    // Find the company URL link (might be in the BaseLayout footer)
    const companyLink = Array.from(linkElements).find(
      (link) => link.getAttribute("href") === "https://acme.example.com"
    );
    expect(companyLink).not.toBeNull();
  });

  // Test with custom action button
  test("renders with custom action button", () => {
    const props = {
      name: "Alex Johnson",
      email: "alex@example.com",
      actionText: "Activate Account",
      actionUrl: "https://example.com/activate/123",
    };

    const { container } = render(<WelcomeEmail {...props} />);

    // Check if custom action text is rendered
    expect(container.textContent).toContain("Activate Account");

    // Check if action URL is set correctly
    const buttonElement = container.querySelector(
      'a[href="https://example.com/activate/123"]'
    );
    expect(buttonElement).not.toBeNull();
    expect(buttonElement?.textContent).toBe("Activate Account");
  });

  // Test with fixture data
  test("renders correctly with basic fixture data", () => {
    const { container } = render(<WelcomeEmail {...basicWelcomeProps} />);

    expect(container.textContent).toContain(basicWelcomeProps.name);
    expect(container.textContent).toContain(basicWelcomeProps.email);
  });

  // Test with complete fixture data
  test("renders correctly with complete fixture data", () => {
    const props = completeWelcomeProps;
    const { container } = render(<WelcomeEmail {...props} />);

    // Check name and email
    expect(container.textContent).toContain(props.name);
    expect(container.textContent).toContain(props.email);

    // Check company info
    expect(container.textContent).toContain(props.companyName);
    expect(container.textContent).toContain(
      `Welcome to ${props.companyName}, ${props.name}!`
    );

    // Check action button
    const buttonElement = container.querySelector(
      `a[href="${props.actionUrl}"]`
    );
    expect(buttonElement).not.toBeNull();
    expect(buttonElement?.textContent).toBe(props.actionText);
  });

  // Test email structure and components
  test("has correct email structure and components", () => {
    const { container } = render(
      <WelcomeEmail name="Test User" email="test@example.com" />
    );

    // Check for main structural elements
    const headingElement = container.querySelector("h2");
    expect(headingElement).not.toBeNull();
    expect(headingElement?.textContent).toContain(
      "Welcome to Your Company, Test User!"
    );

    // Check for paragraphs (Text components)
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs.length).toBeGreaterThan(3); // Should have multiple text elements

    // Check for the button
    const buttonElement = container.querySelector('a[href="#"]'); // Default href is #
    expect(buttonElement).not.toBeNull();
    expect(buttonElement?.textContent).toBe("Get Started");
  });

  // Test with long values
  test("handles long name and email values", () => {
    const props = {
      name: "Alexander Christopher Montgomery-Wellington III",
      email:
        "alexander.christopher.montgomery.wellington.iii@verylongdomainname.example.com",
    };

    const { container } = render(<WelcomeEmail {...props} />);

    // Check if long name is rendered
    expect(container.textContent).toContain(
      "Alexander Christopher Montgomery-Wellington III"
    );

    // Check if long email is rendered
    expect(container.textContent).toContain(
      "alexander.christopher.montgomery.wellington.iii@verylongdomainname.example.com"
    );

    // Check if welcome message contains the long name
    expect(container.textContent).toContain(
      `Welcome to Your Company, ${props.name}!`
    );
  });

  // Test with special characters
  test("handles special characters in name and email", () => {
    const props = {
      name: "Jörg Müller-Schmidt & Co.",
      email: "special+chars@example.com",
      companyName: "Company & Sons™",
    };

    const { container } = render(<WelcomeEmail {...props} />);

    // Check if special characters in name are rendered correctly
    expect(container.textContent).toContain("Jörg Müller-Schmidt & Co.");

    // Check if special characters in email are rendered correctly
    expect(container.textContent).toContain("special+chars@example.com");

    // Check if special characters in company name are rendered correctly
    expect(container.textContent).toContain("Company & Sons™");
    expect(container.textContent).toContain("Welcome to Company & Sons™");
  });

  // Test internationalization scenario
  test("handles international characters", () => {
    const props = {
      name: "张伟 (Zhang Wei)",
      email: "zhang@international.example",
      companyName: "国际公司",
      actionText: "开始使用",
    };

    const { container } = render(<WelcomeEmail {...props} />);

    // Check if international characters in name are rendered correctly
    expect(container.textContent).toContain("张伟 (Zhang Wei)");

    // Check if international characters in company name are rendered correctly
    expect(container.textContent).toContain("国际公司");

    // Check if international characters in action text are rendered correctly
    expect(container.textContent).toContain("开始使用");

    // Check if welcome message contains international characters
    expect(container.textContent).toContain(
      `Welcome to 国际公司, 张伟 (Zhang Wei)!`
    );
  });

  // Test button properties
  test("renders button with correct properties", () => {
    const props = {
      name: "Button Test",
      email: "button@test.com",
      actionUrl: "https://test.com/action",
      actionText: "Click Me",
    };

    const { container } = render(<WelcomeEmail {...props} />);

    // Find the button element
    const buttonElement = container.querySelector(
      'a[href="https://test.com/action"]'
    );
    expect(buttonElement).not.toBeNull();

    // Check button text
    expect(buttonElement?.textContent).toBe("Click Me");

    // The button should be inside a container with center alignment
    const buttonContainer = buttonElement?.parentElement;
    expect(buttonContainer).not.toBeNull();
  });
});
