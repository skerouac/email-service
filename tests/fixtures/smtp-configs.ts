import { SMTPConfig } from "../../src/types";

// Basic valid SMTP configuration
export const basicSMTPConfig: SMTPConfig = {
  host: "smtp.test.com",
  port: 587,
  secure: false,
  auth: {
    user: "testuser",
    pass: "testpass123",
  },
};

// Secure SMTP configuration (SSL/TLS)
export const secureSMTPConfig: SMTPConfig = {
  host: "smtp.secure.test.com",
  port: 465,
  secure: true,
  auth: {
    user: "secure.user",
    pass: "securepassword456",
  },
  tls: {
    rejectUnauthorized: true,
  },
};

// SMTP configuration with custom TLS settings
export const customTLSSMTPConfig: SMTPConfig = {
  host: "smtp.custom.test.com",
  port: 587,
  secure: false,
  auth: {
    user: "custom.user",
    pass: "custompass789",
  },
  tls: {
    rejectUnauthorized: false,
  },
};

// Gmail-like SMTP configuration
export const gmailSMTPConfig: SMTPConfig = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "testuser@gmail.com",
    pass: "app_specific_password",
  },
  tls: {
    rejectUnauthorized: true,
  },
};

// Outlook/Hotmail SMTP configuration
export const outlookSMTPConfig: SMTPConfig = {
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false,
  auth: {
    user: "testuser@outlook.com",
    pass: "outlook_password",
  },
  tls: {
    rejectUnauthorized: true,
  },
};

// Yahoo SMTP configuration
export const yahooSMTPConfig: SMTPConfig = {
  host: "smtp.mail.yahoo.com",
  port: 465,
  secure: true,
  auth: {
    user: "testuser@yahoo.com",
    pass: "yahoo_app_password",
  },
};

// Development/localhost SMTP configuration
export const localhostSMTPConfig: SMTPConfig = {
  host: "localhost",
  port: 1025,
  secure: false,
  auth: {
    user: "dev",
    pass: "dev",
  },
  tls: {
    rejectUnauthorized: false,
  },
};

// Alternative port SMTP configuration
export const alternativePortSMTPConfig: SMTPConfig = {
  host: "smtp.alternative.test.com",
  port: 2525,
  secure: false,
  auth: {
    user: "alt.user",
    pass: "alt.password",
  },
};

// SMTP configuration with long credentials
export const longCredentialsSMTPConfig: SMTPConfig = {
  host: "smtp.longcreds.test.com",
  port: 587,
  secure: false,
  auth: {
    user: "very.long.username.for.testing@longdomain.example.com",
    pass: "very_long_password_with_special_characters_!@#$%^&*()_+{}|:<>?[]\\;'\",./`~",
  },
};

// Invalid SMTP configurations for testing validation
export const invalidSMTPConfigs = {
  missingHost: {
    port: 587,
    auth: {
      user: "test",
      pass: "test",
    },
  } as Partial<SMTPConfig>,

  emptyHost: {
    host: "",
    port: 587,
    auth: {
      user: "test",
      pass: "test",
    },
  } as Partial<SMTPConfig>,

  invalidHost: {
    host: "invalid..host..name",
    port: 587,
    auth: {
      user: "test",
      pass: "test",
    },
  } as Partial<SMTPConfig>,

  missingPort: {
    host: "smtp.test.com",
    auth: {
      user: "test",
      pass: "test",
    },
  } as Partial<SMTPConfig>,

  invalidPortZero: {
    host: "smtp.test.com",
    port: 0,
    auth: {
      user: "test",
      pass: "test",
    },
  } as Partial<SMTPConfig>,

  invalidPortNegative: {
    host: "smtp.test.com",
    port: -1,
    auth: {
      user: "test",
      pass: "test",
    },
  } as Partial<SMTPConfig>,

  invalidPortTooHigh: {
    host: "smtp.test.com",
    port: 99999,
    auth: {
      user: "test",
      pass: "test",
    },
  } as Partial<SMTPConfig>,

  missingAuth: {
    host: "smtp.test.com",
    port: 587,
  } as Partial<SMTPConfig>,

  missingAuthUser: {
    host: "smtp.test.com",
    port: 587,
    auth: {
      pass: "test",
    },
  } as Partial<SMTPConfig>,

  missingAuthPass: {
    host: "smtp.test.com",
    port: 587,
    auth: {
      user: "test",
    },
  } as Partial<SMTPConfig>,

  emptyAuthUser: {
    host: "smtp.test.com",
    port: 587,
    auth: {
      user: "",
      pass: "test",
    },
  } as Partial<SMTPConfig>,

  emptyAuthPass: {
    host: "smtp.test.com",
    port: 587,
    auth: {
      user: "test",
      pass: "",
    },
  } as Partial<SMTPConfig>,

  shortPassword: {
    host: "smtp.test.com",
    port: 587,
    auth: {
      user: "test",
      pass: "123", // Very short password
    },
  } as Partial<SMTPConfig>,

  invalidTLSConfig: {
    host: "smtp.test.com",
    port: 587,
    auth: {
      user: "test",
      pass: "test",
    },
    tls: "invalid" as any,
  } as Partial<SMTPConfig>,
};

// Common SMTP provider configurations for testing
export const providerConfigs = {
  gmail: gmailSMTPConfig,
  outlook: outlookSMTPConfig,
  yahoo: yahooSMTPConfig,
  sendgrid: {
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    auth: {
      user: "apikey",
      pass: "SG.test_api_key",
    },
  } as SMTPConfig,
  mailgun: {
    host: "smtp.mailgun.org",
    port: 587,
    secure: false,
    auth: {
      user: "postmaster@test.mailgun.org",
      pass: "mailgun_password",
    },
  } as SMTPConfig,
  amazonSES: {
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    secure: false,
    auth: {
      user: "AKIAIOSFODNN7EXAMPLE",
      pass: "aws_ses_password",
    },
  } as SMTPConfig,
};

// Test scenarios for different connection types
export const connectionScenarios = {
  standardTLS: {
    ...basicSMTPConfig,
    port: 587,
    secure: false,
  },
  ssl: {
    ...basicSMTPConfig,
    port: 465,
    secure: true,
  },
  alternativePort: {
    ...basicSMTPConfig,
    port: 2525,
    secure: false,
  },
  development: localhostSMTPConfig,
};

// Performance test configurations
export const performanceTestConfigs = {
  fastConnection: {
    ...basicSMTPConfig,
    host: "fast.smtp.test.com",
  },
  slowConnection: {
    ...basicSMTPConfig,
    host: "slow.smtp.test.com",
  },
  unreliableConnection: {
    ...basicSMTPConfig,
    host: "unreliable.smtp.test.com",
  },
};

// Security test configurations
export const securityTestConfigs = {
  noTLS: {
    ...basicSMTPConfig,
    tls: undefined,
  },
  rejectUnauthorized: {
    ...basicSMTPConfig,
    tls: {
      rejectUnauthorized: true,
    },
  },
  allowUnauthorized: {
    ...basicSMTPConfig,
    tls: {
      rejectUnauthorized: false,
    },
  },
};

// Helper functions to create SMTP configs with variations
export const createSMTPConfig = (
  overrides: Partial<SMTPConfig> = {}
): SMTPConfig => ({
  ...basicSMTPConfig,
  ...overrides,
});

export const createSecureSMTPConfig = (
  overrides: Partial<SMTPConfig> = {}
): SMTPConfig => ({
  ...secureSMTPConfig,
  ...overrides,
});

export const createInvalidSMTPConfig = (
  type: keyof typeof invalidSMTPConfigs
): Partial<SMTPConfig> => {
  return invalidSMTPConfigs[type];
};

// Common ports and their typical security settings
export const commonPorts = {
  25: { secure: false, name: "SMTP (usually blocked by ISPs)" },
  465: { secure: true, name: "SMTPS (SSL/TLS)" },
  587: { secure: false, name: "Submission (STARTTLS)" },
  2525: { secure: false, name: "Alternative (often used by services)" },
};

// Configuration validation scenarios
export const validationScenarios = {
  valid: [
    basicSMTPConfig,
    secureSMTPConfig,
    customTLSSMTPConfig,
    gmailSMTPConfig,
    localhostSMTPConfig,
  ],
  invalid: Object.values(invalidSMTPConfigs),
  warning: [
    localhostSMTPConfig, // localhost warning
    {
      ...basicSMTPConfig,
      auth: {
        user: "test",
        pass: "1234567", // short password warning
      },
    },
    {
      ...basicSMTPConfig,
      tls: {
        rejectUnauthorized: false, // security warning
      },
    },
  ],
};

// Export collections for easy access
export const allValidConfigs = [
  basicSMTPConfig,
  secureSMTPConfig,
  customTLSSMTPConfig,
  gmailSMTPConfig,
  outlookSMTPConfig,
  yahooSMTPConfig,
  localhostSMTPConfig,
  alternativePortSMTPConfig,
];

export const allProviderConfigs = Object.values(providerConfigs);
export const allInvalidConfigs = Object.values(invalidSMTPConfigs);
