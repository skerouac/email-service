import { Button, Text, Heading } from "@react-email/components";
import { BaseLayout } from "./baseLayout";
import type { WelcomeEmailProps } from "./types";

export function WelcomeEmail({
  name,
  email,
  actionUrl = "#",
  actionText = "Get Started",
  companyName = "Your Company",
  companyUrl = "#",
}: WelcomeEmailProps) {
  return (
    <BaseLayout
      title={`Welcome to ${companyName}`}
      companyName={companyName}
      companyUrl={companyUrl}
    >
      <Heading as="h2" style={headingStyle}>
        Welcome to {companyName}, {name}!
      </Heading>

      <Text style={textStyle}>
        Thank you for joining us! We're excited to have you on board.
      </Text>

      <Text style={textStyle}>
        Your account has been created with the email address:{" "}
        <strong>{email}</strong>
      </Text>

      <Text style={textStyle}>To get started, click the button below:</Text>

      <div style={buttonContainerStyle}>
        <Button href={actionUrl} style={buttonStyle}>
          {actionText}
        </Button>
      </div>

      <Text style={textStyle}>
        If you have any questions, feel free to reach out to our support team.
        We're here to help!
      </Text>

      <Text style={textStyle}>
        Best regards,
        <br />
        The {companyName} Team
      </Text>
    </BaseLayout>
  );
}

const headingStyle = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 20px",
  lineHeight: "32px",
} as const;

const textStyle = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
} as const;

const buttonContainerStyle = {
  textAlign: "center" as const,
  margin: "32px 0",
} as const;

const buttonStyle = {
  backgroundColor: "#556cd6",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  border: "none",
  cursor: "pointer",
} as const;
