# Skill: npm Workspaces Monorepo Setup

## When to Use
Setting up a TypeScript monorepo with npm workspaces and composite project references.

## Pattern

### Root package.json
- `"private": true`, `"type": "module"`, `"workspaces": ["shared", "server", "client"]`
- Scripts delegate via `npm run X --workspaces --if-present`
- `tsc --build` at root compiles all packages in dependency order

### Base tsconfig.json
- `"composite": true` enables project references
- `"module": "NodeNext"` + `"moduleResolution": "NodeNext"` for ESM
- Root tsconfig has `"files": []` and `"references"` to each workspace
- Each workspace extends base and adds `rootDir`, `outDir`, and own `references`

### Cross-workspace imports
- Shared package uses `"exports"` field pointing to `./dist/index.js` + types
- Dependents list shared with `"*"` version (npm workspace protocol)
- Workspace tsconfig adds `{ "path": "../shared" }` to references for build ordering

### Gotchas
- `@types/node` needed at root for `console`, `process`, etc. in strict ESM
- `.gitignore` must include `dist/` and `*.tsbuildinfo`
- `"isolatedModules": true` required for most bundler compatibility
