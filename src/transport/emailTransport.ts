export interface MailOptions {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{
    fileName: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailTransport {
  sendMail(options: MailOptions): Promise<void>;
  verify(): Promise<boolean>;
  close(): Promise<void>;
  getInfo(): { type: string; [key: string]: any };
}

export interface TransportConfig {
  retryConfig?: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
  };
}

export abstract class BaseEmailTransport implements EmailTransport {
  protected config: TransportConfig;

  constructor(config: TransportConfig = {}) {
    this.config = config;
  }

  abstract sendMail(options: MailOptions): Promise<void>;
  abstract verify(): Promise<boolean>;
  abstract close(): Promise<void>;
  abstract getInfo(): { type: string; [key: string]: any };
}

// Mock transport for testing
export class MockEmailTransport extends BaseEmailTransport {
  private sentEmails: MailOptions[] = [];
  private shouldFail = false;
  private verifyResult = true;

  sendMail(options: MailOptions): Promise<void> {
    if (this.shouldFail) {
      throw new Error("Mock transport configured to fail");
    }

    this.sentEmails.push({ ...options });
    return Promise.resolve();
  }

  verify(): Promise<boolean> {
    return Promise.resolve(this.verifyResult);
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  getInfo() {
    return {
      type: "mock",
      sentCount: this.sentEmails.length,
    };
  }

  // Test helpers
  getSentEmails(): MailOptions[] {
    return [...this.sentEmails];
  }

  getLastSentEmail(): MailOptions | undefined {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  clearSentEmails(): void {
    this.sentEmails = [];
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setVerifyResult(result: boolean): void {
    this.verifyResult = result;
  }

  reset(): void {
    this.sentEmails = [];
    this.shouldFail = false;
    this.verifyResult = true;
  }
}
