module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    'server/*.ts',
    '!**.test.ts',
    '!**/node_modules/**',
    '!server/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    }
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/dist/',
  ]
};