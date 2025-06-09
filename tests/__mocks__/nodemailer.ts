import { jest } from "@jest/globals";

// Mock transport implementation
export class MockTransporter {
  private _sentEmails: any[] = [];
  private _shouldFail = false;
  private _verifyResult = true;
  private _connectionInfo: any = {};

  constructor(options: any = {}) {
    this._connectionInfo = {
      host: options.host || "mock-smtp.test.com",
      port: options.port || 587,
      secure: options.secure || false,
      auth: options.auth || { user: "mockuser", pass: "mockpass" },
    };
  }

  // Mock sendMail method
  sendMail = jest.fn().mockImplementation(async (mailOptions: any) => {
    if (this._shouldFail) {
      const error = new Error("Mock SMTP send failed");
      (error as any).code = "MOCK_SEND_ERROR";
      throw error;
    }

    // Store the sent email for test assertions
    this._sentEmails.push({
      ...mailOptions,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@mock.test`,
      timestamp: new Date().toISOString(),
    });

    return {
      messageId: this._sentEmails[this._sentEmails.length - 1].messageId,
      envelope: {
        from: mailOptions.from,
        to: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
      },
      accepted: Array.isArray(mailOptions.to)
        ? mailOptions.to
        : [mailOptions.to],
      rejected: [],
      pending: [],
      response: "250 Message accepted",
    };
  });

  // Mock verify method
  verify = jest.fn().mockImplementation(async () => {
    if (this._shouldFail) {
      const error = new Error("Mock SMTP connection failed");
      (error as any).code = "MOCK_CONNECTION_ERROR";
      throw error;
    }
    return this._verifyResult;
  });

  // Mock close method
  close = jest.fn().mockImplementation(() => {
    // Mock close operation
    return Promise.resolve();
  });

  // Test helper methods (not part of real Nodemailer API)
  _getSentEmails() {
    return [...this._sentEmails];
  }

  _getLastSentEmail() {
    return this._sentEmails[this._sentEmails.length - 1];
  }

  _clearSentEmails() {
    this._sentEmails = [];
  }

  _setShouldFail(shouldFail: boolean) {
    this._shouldFail = shouldFail;
  }

  _setVerifyResult(result: boolean) {
    this._verifyResult = result;
  }

  _simulateAuthError() {
    this._shouldFail = true;
    this.sendMail.mockImplementation(async () => {
      const error = new Error("Authentication failed");
      (error as any).code = "EAUTH";
      throw error;
    });
  }

  _simulateConnectionError() {
    this._shouldFail = true;
    this.sendMail.mockImplementation(async () => {
      const error = new Error("Connection failed");
      (error as any).code = "ECONNREFUSED";
      throw error;
    });
  }

  _simulateTimeoutError() {
    this._shouldFail = true;
    this.sendMail.mockImplementation(async () => {
      const error = new Error("Connection timeout");
      (error as any).code = "ETIMEDOUT";
      throw error;
    });
  }

  _reset() {
    this._sentEmails = [];
    this._shouldFail = false;
    this._verifyResult = true;
    this.sendMail.mockClear();
    this.verify.mockClear();
    this.close.mockClear();
  }
}

// Mock createTransport function
export const createTransport = jest
  .fn()
  .mockImplementation((options: any = {}) => {
    return new MockTransporter(options);
  });

// Mock createTestAccount function
export const createTestAccount = jest.fn().mockImplementation(async () => {
  return {
    user: "mock.test@ethereal.email",
    pass: "mockpassword123",
    smtp: {
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
    },
    imap: {
      host: "imap.ethereal.email",
      port: 993,
      secure: true,
    },
    pop3: {
      host: "pop3.ethereal.email",
      port: 995,
      secure: true,
    },
    web: "https://ethereal.email",
  };
});

// Mock getTestMessageUrl function
export const getTestMessageUrl = jest.fn().mockImplementation((info: any) => {
  return `https://ethereal.email/message/${info.messageId}`;
});

// Export default object that matches Nodemailer's structure
const nodemailerMock = {
  createTransport,
  createTestAccount,
  getTestMessageUrl,
};

export default nodemailerMock;

// Helper function to get the current mock transporter instance
// This is useful for test assertions
let _currentMockTransporter: MockTransporter | null = null;

export const getCurrentMockTransporter = (): MockTransporter | null => {
  return _currentMockTransporter;
};

// Override createTransport to track the current instance
const originalCreateTransport = createTransport;
createTransport.mockImplementation((options: any = {}) => {
  _currentMockTransporter = new MockTransporter(options);
  return _currentMockTransporter;
});

// Global test helpers for easier test setup
export const mockNodemailerReset = () => {
  if (_currentMockTransporter) {
    _currentMockTransporter._reset();
  }
  createTransport.mockClear();
  createTestAccount.mockClear();
  getTestMessageUrl.mockClear();
};

export const mockNodemailerGetSentEmails = () => {
  return _currentMockTransporter?._getSentEmails() || [];
};

export const mockNodemailerSimulateError = (
  errorType: "auth" | "connection" | "timeout" | "send"
) => {
  if (!_currentMockTransporter) return;

  switch (errorType) {
    case "auth":
      _currentMockTransporter._simulateAuthError();
      break;
    case "connection":
      _currentMockTransporter._simulateConnectionError();
      break;
    case "timeout":
      _currentMockTransporter._simulateTimeoutError();
      break;
    case "send":
      _currentMockTransporter._setShouldFail(true);
      break;
  }
};
