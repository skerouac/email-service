module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  testMatch: [
    '**/tests/**/*.(test|spec).(ts|tsx)',
    '**/*.(test|spec).(ts|tsx)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/tests/setup/',
    '/tests/__mocks__/',
    '/tests/fixtures/'
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/types.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
};