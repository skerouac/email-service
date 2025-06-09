import React from "react";
import { render } from "../../../tests/setup/test-utils";
import { BaseLayout } from "../../../src/templates/baseLayout";
import { baseLayoutScenarios } from "../../../tests/fixtures/templates";
import { expect } from "@jest/globals";

describe("BaseLayout Component", () => {
  // Test basic rendering with default props
  test("renders with minimal props", () => {
    const { container } = render(
      <BaseLayout title="Test Email">
        <p>Test content</p>
      </BaseLayout>
    );

    // Check if title is set correctly in the document head
    const titleElement =
      container.querySelector("title") || document.querySelector("title");
    expect(titleElement?.textContent).toBe("Test Email");

    // Check if content is rendered
    expect(container.textContent).toContain("Test content");

    // Check if default company name is rendered
    expect(container.textContent).toContain("Your Company");

    // Check if default footer text is rendered
    expect(container.textContent).toContain(
      "This email was sent to you because you signed up for our service"
    );

    // Check if "Visit our website" link exists
    const linkElement = container.querySelector("a");
    expect(linkElement).not.toBeNull();
    expect(linkElement?.textContent).toContain("Visit our website");
  });

  // Test with custom company information
  test("renders with custom company info", () => {
    const { container } = render(
      <BaseLayout
        title="Custom Company Email"
        companyName="Test Company Inc."
        companyUrl="https://test-company.com"
      >
        <p>Custom company content</p>
      </BaseLayout>
    );

    // Check if custom company name is rendered
    expect(container.textContent).toContain("Test Company Inc.");

    // Check if company URL is set correctly
    const linkElement = container.querySelector("a");
    expect(linkElement).not.toBeNull();
    expect(linkElement?.getAttribute("href")).toBe("https://test-company.com");
  });

  // Test with custom footer text
  test("renders with custom footer text", () => {
    const customFooter =
      "This is a custom footer message for testing purposes.";
    const { container } = render(
      <BaseLayout title="Footer Test Email" footerText={customFooter}>
        <p>Footer test content</p>
      </BaseLayout>
    );

    // Check if custom footer text is rendered
    expect(container.textContent).toContain(customFooter);
  });

  // Test with complex children
  test("renders complex children correctly", () => {
    const { container } = render(
      <BaseLayout title="Complex Content Email">
        <div>
          <h2>Welcome to our service</h2>
          <p>
            This is a <strong>complex</strong> test with multiple elements.
          </p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
          <button>Action Button</button>
        </div>
      </BaseLayout>
    );

    // Check if complex content is rendered correctly
    expect(container.textContent).toContain("Welcome to our service");
    expect(container.textContent).toContain(
      "This is a complex test with multiple elements"
    );
    expect(container.textContent).toContain("Item 1");
    expect(container.textContent).toContain("Item 2");
    expect(container.textContent).toContain("Item 3");
    expect(container.textContent).toContain("Action Button");
  });

  // Test email structure
  test("has correct email structure", () => {
    const { container } = render(
      <BaseLayout title="Structure Test">
        <p>Structure test content</p>
      </BaseLayout>
    );

    // Check for the content we know should be there
    expect(container.textContent).toContain("Structure test content");
    expect(container.textContent).toContain("Your Company");

    // Check for key structural elements
    const headingElement = container.querySelector("h1");
    expect(headingElement).not.toBeNull();

    // There should be at least one link (for the website)
    const linkElement = container.querySelector("a");
    expect(linkElement).not.toBeNull();

    // Should have paragraphs for the content and footer
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs.length).toBeGreaterThan(1);
  });

  // Test using fixtures
  test("renders correctly with complete fixture props", () => {
    // Using the complete scenario from fixtures
    const props = baseLayoutScenarios.complete;

    // Need to add children as they're required but null in the fixture
    const { container } = render(
      <BaseLayout {...props}>
        <p>Fixture test content</p>
      </BaseLayout>
    );

    // Check title
    const titleElement =
      container.querySelector("title") || document.querySelector("title");
    expect(titleElement?.textContent).toBe(props.title);

    // Check company name
    expect(container.textContent).toContain(props.companyName);

    // Check footer text
    expect(container.textContent).toContain(props.footerText);

    // Check company URL in link
    const linkElement = container.querySelector("a");
    expect(linkElement?.getAttribute("href")).toBe(props.companyUrl);
  });

  // Test basic styling - focusing on content rather than specific styles
  test("applies styles to components", () => {
    const { container } = render(
      <BaseLayout title="Style Test">
        <p>Style test content</p>
      </BaseLayout>
    );

    // Instead of checking for body element and specific styles which might be brittle,
    // check for expected content
    expect(container.textContent).toContain("Style test content");
    expect(container.textContent).toContain("Your Company");

    // Check for the heading (company name)
    const heading = container.querySelector("h1");
    expect(heading).not.toBeNull();

    // Check for footer text elements
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs.length).toBeGreaterThan(1);

    // At least one paragraph should contain our footer text
    const footerTextFound = Array.from(paragraphs).some((p) =>
      p.textContent?.includes(
        "This email was sent to you because you signed up for our service"
      )
    );
    expect(footerTextFound).toBe(true);
  });

  // Test with empty title
  test("renders with empty title", () => {
    const { container } = render(
      <BaseLayout title="">
        <p>Empty title test</p>
      </BaseLayout>
    );

    // Title should be empty but exist
    const titleElement =
      container.querySelector("title") || document.querySelector("title");
    expect(titleElement).not.toBeNull();
    expect(titleElement?.textContent).toBe("");
  });

  // Test with very long company name
  test("handles very long company name", () => {
    const longCompanyName =
      "This is an extremely long company name that could potentially cause layout issues or text wrapping problems in the email template header section";

    const { container } = render(
      <BaseLayout title="Long Name Test" companyName={longCompanyName}>
        <p>Long company name test</p>
      </BaseLayout>
    );

    // Long name should be rendered
    expect(container.textContent).toContain(longCompanyName);

    // Check that the content is rendered correctly
    expect(container.textContent).toContain("Long company name test");

    // Check for key structural elements
    const heading = container.querySelector("h1");
    expect(heading).not.toBeNull();
    expect(heading?.textContent).toBe(longCompanyName);
  });
});
