/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/**/*.test.ts"],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    moduleDirectories: ["node_modules", "src"],
    moduleNameMapper: {
        "^uuid$": "uuid"
    },
    transformIgnorePatterns: [
        "node_modules/(?!(uuid)/)"
    ]
};
