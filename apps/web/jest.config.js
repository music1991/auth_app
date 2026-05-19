const nextJest = require("next/jest.js");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/__tests__/**/*.(test|spec).(ts|tsx)"],
  collectCoverageFrom: [
    "src/lib/utils.ts",
    "src/lib/formulas.ts",
    "src/components/dashboard/StatItem.tsx",
    "src/components/dashboard/EvaluationCard.tsx",
    "!src/**/*.d.ts",
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageDirectory: "<rootDir>/coverage",
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
};

module.exports = createJestConfig(config);
