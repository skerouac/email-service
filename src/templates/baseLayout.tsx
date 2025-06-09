import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
} from "@react-email/components";
import type { BaseLayoutProps } from "./types";

export function BaseLayout({
  title,
  children,
  footerText = "This email was sent to you because you signed up for our service.",
  companyName = "Your Company",
  companyUrl = "#",
}: BaseLayoutProps) {
  return (
    <Html>
      <Head>
        <title>{title}</title>
      </Head>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Heading as="h1" style={logoStyle}>
              {companyName}
            </Heading>
          </Section>

          <Section style={contentStyle}>{children}</Section>

          <Hr style={hrStyle} />

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>{footerText}</Text>
            <Text style={footerTextStyle}>
              <Link href={companyUrl} style={linkStyle}>
                Visit our website
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
} as const;

const containerStyle = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
} as const;

const headerStyle = {
  padding: "32px 24px",
  borderBottom: "1px solid #e6ebf1",
} as const;

const logoStyle = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
  textAlign: "center" as const,
} as const;

const contentStyle = {
  padding: "32px 24px",
} as const;

const footerStyle = {
  padding: "0 24px",
  textAlign: "center" as const,
} as const;

const footerTextStyle = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "8px 0",
} as const;

const linkStyle = {
  color: "#556cd6",
  textDecoration: "underline",
} as const;

const hrStyle = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
} as const;
