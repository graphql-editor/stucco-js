module.exports = {
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  collectCoverageFrom: ['**/src/**/*.ts', '!**/src/proto/*.ts'],
  transform: {
	  '^.+\\.ts?$': [
		  'ts-jest',
		  {
			  useESM: true,
			  tsconfig: 'tsconfig.json',
		  },
	  ],
  },
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'js'],
  testRunner: 'jest-circus/runner',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  }
};
