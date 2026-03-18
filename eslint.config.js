import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "**/dist/",
      "**/node_modules/",
      ".squad/",
      "docs/",
      "infra/",
      "**/*.js",
      "!eslint.config.js",
    ],
  },

  // Base JS recommended rules
  eslint.configs.recommended,

  // TypeScript strict + stylistic rules for all workspaces
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // TypeScript parser options (project-aware linting)
  {
    languageOptions: {
      parserOptions: {
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Allow numbers and booleans in template literals — this is idiomatic TS
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true },
      ],
      // Colyseus @type decorators require explicit type annotations on initialized properties
      "@typescript-eslint/no-inferrable-types": ["error", { ignoreProperties: true }],
    },
  },

  // Shared workspace overrides
  {
    files: ["shared/src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./shared/tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {},
  },

  // Server workspace overrides
  {
    files: ["server/src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./server/tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {},
  },

  // Client workspace overrides
  {
    files: ["client/src/**/*.ts", "client/src/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./client/tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {},
  },

  // Test file relaxations — test assertions commonly use void expressions
  {
    files: ["**/__tests__/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-confusing-void-expression": "off",
    },
  },

  // Prettier must be last to disable conflicting formatting rules
  eslintConfigPrettier,
);
