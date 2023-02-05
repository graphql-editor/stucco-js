module.exports = {
  roots: ['<rootDir>/src', '<rootDir>/e2e'],
  collectCoverage: false,
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
  testMatch: ['**/e2e/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  preset: 'ts-jest/presets/default-esm',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
