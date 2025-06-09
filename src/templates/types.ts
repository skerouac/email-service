import { EmailPriority } from "../types";

export interface BaseLayoutProps {
  title: string;
  children: React.ReactNode;
  footerText?: string;
  companyName?: string;
  companyUrl?: string;
}

export interface WelcomeEmailProps {
  name: string;
  email: string;
  actionUrl?: string;
  actionText?: string;
  companyName?: string;
  companyUrl?: string;
}

export interface NotificationEmailProps {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  priority?: EmailPriority;
  companyName?: string;
  companyUrl?: string;
}

export { WelcomeEmail } from "./welcomeEmail";
export { NotificationEmail } from "./notificationEmail";
export { BaseLayout } from "./baseLayout";
