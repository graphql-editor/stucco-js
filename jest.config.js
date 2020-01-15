module.exports = {
	roots: ["<rootDir>/src", "<rootDir>/tests"],
	collectCoverageFrom: [
		"**/src/**/*.ts",
		"!**/src/proto/*.ts",
	],
	collectCoverage: true,
	transform: {'^.+\\.ts?$': 'ts-jest'},
	testEnvironment: 'node',
	testMatch: ['**/tests/**/*.test.ts'],
	moduleFileExtensions: ['ts', 'js'],
	globals: {
		"ts-jest": {
			tsConfig: "tsconfig.json"
		}
	},
	testEnvironment: 'node'
};
