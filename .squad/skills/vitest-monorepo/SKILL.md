# SKILL: Vitest Monorepo Configuration

## When to use
Setting up Vitest in an npm workspaces monorepo with TypeScript ESM.

## Pattern

### Root config (`vitest.config.ts`)
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["shared", "server", "client"], // workspace dirs
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
```

### Per-workspace config (`{workspace}/vitest.config.ts`)
```ts
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "workspace-name",
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true, // important for empty workspaces
  },
});
```

### Scripts
- Each workspace: `"test": "vitest run"`, `"test:watch": "vitest"`
- Root: `"test": "npm run test --workspaces --if-present"`, `"test:coverage": "vitest run --coverage"`

## Gotchas
- Vitest 4 uses `test.projects`, NOT `test.workspace` (removed)
- Per-workspace configs use `defineProject()`, NOT `defineConfig()`
- `passWithNoTests: true` prevents CI failures in empty workspaces
- ESM imports in tests need `.js` extension (`from "../index.js"`)
