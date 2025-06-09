import React, { ReactNode } from "react";
import type { BaseLayoutProps } from "../../src/templates/types";

// This is a mock version of BaseLayout that doesn't include html/head/body tags
// to avoid React warnings during testing
export function BaseLayout({
  title,
  children,
  footerText = "This email was sent to you because you signed up for our service.",
  companyName = "Your Company",
  companyUrl = "#",
}: BaseLayoutProps) {
  return (
    <div className="email-container" data-testid="base-layout">
      {/* Mock title element to simulate the real title tag */}
      <div
        className="mock-title"
        data-testid="mock-title"
        style={{ display: "none" }}
      >
        {title}
      </div>
      <div className="email-header">
        <h1>{companyName}</h1>
      </div>
      <div className="email-content">{children}</div>
      <hr />
      <div className="email-footer">
        <p>{footerText}</p>
        <p>
          <a href={companyUrl}>Visit our website</a>
        </p>
      </div>
    </div>
  );
}

export default BaseLayout;
