export default {
  testEnvironment: "node",

  /**
   * Strip .js extensions from imports.
   * TypeScript (ESM) requires .js extensions, but Jest running in CJS mode doesn't.
   * This lets us test the source files without changing any import paths.
   */
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },

  /**
   * Compile TypeScript to CommonJS for Jest.
   * The source code stays TypeScript/ESM — only Jest's internal runner uses CJS.
   * This makes jest.mock() hoisting work normally and avoids experimental VM flags.
   */
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      tsconfig: {
        module: "CommonJS",
        moduleResolution: "node",
        verbatimModuleSyntax: false,       // Required for CJS output
        exactOptionalPropertyTypes: false  // Too strict for test helper objects
      }
    }]
  },

  // Where to find test files
  testMatch: ["**/src/jest_tests/**/*.test.ts"],

  // Fail the entire test run if any coverage type drops below 70%
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 65,
      lines: 65,
      statements: 65
    }
  },

  // Which files to measure coverage on (exclude wiring, seed scripts, DB, and models)
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts",
    "!src/seed.ts",
    "!src/config/config.ts",
    "!src/infrastructure/database.ts",
    "!src/infrastructure/models/**",
    "!src/infrastructure/repositories/**",
    "!src/jest_tests/**"
  ]
}
