// Import ESLint's recommended JavaScript rules
import js from "@eslint/js";

// Import the defineConfig helper function to create ESLint configuration
import { defineConfig } from "eslint/config";

// Import TypeScript ESLint plugin with recommended TypeScript-specific rules
import tseslint from "typescript-eslint";

// Export the ESLint configuration
export default defineConfig({
  // Apply these rules to all JavaScript and TypeScript files in the project
  files: ["**/*.{js,ts}"],

  // enable the recommended rules from both JavaScript and TypeScript ESLint
  // This activates best practices from both ecosystems
  extends: [js.configs.recommended, tseslint.configs.recommended],
});
