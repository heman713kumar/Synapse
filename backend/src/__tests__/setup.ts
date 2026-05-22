/**
 * Test Setup File
 * Configure test environment, mocks, and utilities
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/synapse_test';
process.env.JWT_SECRET = 'test-secret';
process.env.SMTP_HOST = 'smtp.test.com';

// Suppress console logs during tests
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);
