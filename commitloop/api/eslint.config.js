import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  {
    files: ["src/features/**/*.service.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "express",
              message:
                "Feature services stay framework-free; use *.routes.ts for HTTP.",
            },
          ],
          patterns: [
            {
              group: ["**/features/**/*.routes*"],
              message: "Services must not import route modules.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/clients/**/*.ts", "src/middleware/**/*.ts", "src/config/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/features/**"],
              message:
                "Infrastructure layers must not depend on feature modules.",
            },
          ],
        },
      ],
    },
  },
);
