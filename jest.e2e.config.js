module.exports = {
  roots: ['<rootDir>/src', '<rootDir>/e2e'],
  collectCoverage: false,
  transform: { '^.+\\.ts?$': 'ts-jest' },
  testEnvironment: 'node',
  testMatch: ['**/e2e/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  globals: {
    'ts-jest': { tsconfig: 'tsconfig.json' },
  },
  testRunner: 'jest-circus/runner',
};
