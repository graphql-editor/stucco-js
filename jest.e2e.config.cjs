module.exports = {
  roots: ['<rootDir>/src', '<rootDir>/e2e'],
  collectCoverage: false,
  transform: { '^.+\\.ts?$': 'ts-jest' },
  testEnvironment: 'node',
  testMatch: ['**/e2e/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  preset: 'ts-jest/presets/default-esm',
  globals: {
    'ts-jest': {
        useESM: true,
        tsconfig: 'tsconfig.json'
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
