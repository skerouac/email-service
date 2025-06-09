import { Text, Heading, Button } from "@react-email/components";
import { BaseLayout } from "./baseLayout";
import type { NotificationEmailProps } from "./types";

const PRIORITY_COLORS = {
  low: "#28a745",
  normal: "#556cd6",
  high: "#dc3545",
} as const;

export function NotificationEmail({
  title,
  message,
  actionUrl,
  actionText,
  priority = "normal",
  companyName = "Your Company",
  companyUrl = "#",
}: NotificationEmailProps) {
  const priorityColor = PRIORITY_COLORS[priority];

  return (
    <BaseLayout title={title} companyName={companyName} companyUrl={companyUrl}>
      <div
        style={{
          ...priorityBadgeStyle,
          backgroundColor: priorityColor,
        }}
      >
        {priority.toUpperCase()} PRIORITY
      </div>

      <Heading as="h2" style={headingStyle}>
        {title}
      </Heading>

      <Text style={textStyle}>{message}</Text>

      {actionUrl && actionText && (
        <div style={buttonContainerStyle}>
          <Button
            href={actionUrl}
            style={{
              ...buttonStyle,
              backgroundColor: priorityColor,
            }}
          >
            {actionText}
          </Button>
        </div>
      )}

      <Text style={smallTextStyle}>
        This is an automated notification from {companyName}. If you believe you
        received this in error, please contact our support team.
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

const priorityBadgeStyle = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: "4px",
  color: "#ffffff",
  fontSize: "10px",
  fontWeight: "bold",
  letterSpacing: "0.5px",
  marginBottom: "16px",
} as const;

const smallTextStyle = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "24px 0 0",
} as const;
