# Skill: ESLint 10 Flat Config for TypeScript Monorepo

## When to Use
Setting up ESLint in an npm workspaces monorepo with TypeScript and ESM.

## Pattern

### Dependencies (root devDependencies)
```
eslint @eslint/js typescript-eslint prettier eslint-config-prettier globals
```

### Flat Config Structure (`eslint.config.js`)
```js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["**/dist/", "**/node_modules/", "**/*.js", "!eslint.config.js"] },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  // Per-workspace overrides as needed
  eslintConfigPrettier, // MUST be last
);
```

### Key Gotchas
- `projectService: true` replaces the old `project` array for type-aware linting
- `import.meta.dirname` replaces `__dirname` in ESM
- Colyseus `@type` decorators need `"@typescript-eslint/no-inferrable-types": ["error", { ignoreProperties: true }]`
- React ESLint plugins don't support ESLint 10 yet (as of 2026-03) — use TODO placeholder
- Prettier config MUST be last in the flat config array to override formatting rules

### Workspace Scripts
Each workspace gets `"lint": "eslint src/"`. Root delegates via `npm run lint --workspaces --if-present`.
