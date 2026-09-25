import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import nodePlugin from "eslint-plugin-n";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  nodePlugin.configs["flat/recommended"],
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir,
      },
    },
    rules: {
      "n/no-missing-import": "off",
      "n/no-unpublished-import": "off",
      "n/hashbang": "off",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-console": ["error", { allow: ["info", "warn", "error"] }],
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/no-confusing-void-expression": "off",
    },
  },
  {
    files: ["src/seat/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "n/no-unsupported-features/node-builtins": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  {
    files: ["eslint.config.js", "prettier.config.js"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ["test/**/*.{ts,tsx}", "vite.config.ts", "vitest.config.ts"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      "n/no-unsupported-features/node-builtins": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
  eslintConfigPrettier,
);
