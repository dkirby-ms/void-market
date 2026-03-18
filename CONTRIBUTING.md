# Contributing to Void Market

Thanks for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Branching & PRs](#branching--prs)
- [Code Style & Quality](#code-style--quality)
- [Testing](#testing)
- [Committing & Pushing](#committing--pushing)
- [Pull Request Process](#pull-request-process)
- [Questions & Help](#questions--help)

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/void-market.git
   cd void-market
   ```
3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/dkirby-ms/void-market.git
   git fetch upstream
   ```

## Development Setup

Follow the Quick Start in [README.md](README.md#quick-start):

```bash
npm install
cp .env.example .env
docker compose up -d
npm run dev
```

Verify everything works:
- Navigate to http://localhost:5173 in your browser
- You should see the game client load (no errors in console)
- Server logs should appear in your terminal

## Making Changes

### Before You Start

1. **Check existing issues** — avoid duplicate work
2. **Pick an issue** or create one describing your change
3. **Discuss larger changes** — open an issue first to agree on approach
4. **Keep scope small** — focused PRs are easier to review and merge

### File Organization

- **Server logic:** `server/src/`
- **Client UI/rendering:** `client/src/`
- **Shared types & schemas:** `shared/src/`
- **Tests:** Next to source files as `*.test.ts` or `*.test.tsx`
- **Docs:** `docs/` (architecture, game systems, UX)

## Branching & PRs

### Branch Naming

Follow the pattern: `squad/{issue-number}-{slug}`

```bash
# Example: Working on issue #48 (developer onboarding)
git checkout -b squad/48-dev-onboarding

# Example: Working on issue #42 (player authentication)
git checkout -b squad/42-player-auth

# Example: Working on issue #150 (fix combat resolution bug)
git checkout -b squad/150-combat-resolution-fix
```

### Create Your Branch

```bash
# Sync with latest dev
git fetch upstream dev
git checkout -b squad/{issue-number}-{slug} upstream/dev

# Make your changes
# ... edit files ...

# Check your work
npm run lint   # Fix style issues
npm run test   # Verify tests pass
npm run build  # Ensure compilation succeeds
```

## Code Style & Quality

### TypeScript

- **Strict mode:** `strict: true` in `tsconfig.json` — no `any` types
- **Naming:** PascalCase for components/types, camelCase for functions/variables, UPPER_SNAKE_CASE for constants
- **Imports:** Use ES6 `import` syntax
- **Type annotations:** Always provide return types and parameter types

**Good:**
```typescript
export function calculateTaxOnTrade(amount: number, tradeType: string): number {
  return amount * TAX_RATE[tradeType];
}

export interface TradeRequest {
  fromPort: number;
  toPort: number;
  commodity: string;
  amount: number;
}
```

**Avoid:**
```typescript
export function calculateTaxOnTrade(amount: any, tradeType: any) {  // Missing types
  return amount * TAX_RATE[tradeType];
}

const MyComponent: any = () => <div />;  // Using `any`
```

### Formatting & Linting

Run before committing:

```bash
# Auto-fix formatting issues
npm run format

# Check for linting errors
npm run lint

# If lint errors remain, fix them manually (check the output)
```

**CI will fail if** code doesn't pass `npm run lint`.

### Comments

- Write self-documenting code; avoid unnecessary comments
- Comment *why*, not *what* — readers can see what the code does
- Use JSDoc for public functions/exports

**Good:**
```typescript
// Regenerate turns every 90 seconds to match game balance design
const TURN_REGEN_INTERVAL_MS = 90_000;

export function calculateNewTurns(currentTurns: number, msElapsed: number): number {
  const newTurns = Math.floor(msElapsed / TURN_REGEN_INTERVAL_MS);
  return Math.min(currentTurns + newTurns, MAX_TURN_BANK);
}
```

**Avoid:**
```typescript
// Add turns
const i = 90000;

function f(t: number, e: number): number {
  const n = Math.floor(e / i);
  return Math.min(t + n, 2000);
}
```

## Testing

### Write Tests

All changes should include tests. Tests live next to source files:

```
server/src/systems/
  ├── economy.ts           # Implementation
  └── economy.test.ts      # Tests
```

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { calculatePortPrice } from './economy';

describe('calculatePortPrice', () => {
  it('returns base price with zero demand', () => {
    expect(calculatePortPrice('Fuel Ore', 0)).toBe(100);
  });

  it('scales price by demand', () => {
    expect(calculatePortPrice('Fuel Ore', 5)).toBe(105);
  });

  it('handles negative demand', () => {
    expect(calculatePortPrice('Fuel Ore', -3)).toBe(97);
  });
});
```

### Run Tests

```bash
# Run all tests (once)
npm run test

# Run tests in watch mode (re-run on file change)
npm run test -- --watch

# Run tests with coverage report
npm run test:coverage
```

**Coverage threshold:** 80%. PRs with coverage below this won't merge.

## Committing & Pushing

### Commit Messages

Use clear, descriptive messages. Format: `verb: description`

```bash
# Good
git commit -m "feat: add turn regeneration system"
git commit -m "fix: correct port price calculation for negative demand"
git commit -m "docs: expand architecture guide with combat flow"
git commit -m "test: add edge-case tests for trade validation"
git commit -m "refactor: consolidate economy calculations"

# Less clear (avoid)
git commit -m "update stuff"
git commit -m "WIP"
git commit -m "fixes"
```

### Push to GitHub

```bash
# Push your branch
git push origin squad/{issue-number}-{slug}

# GitHub will prompt you to create a PR (click the link, or use `gh pr create` below)
```

## Pull Request Process

### Create Your PR

**Via CLI (recommended):**
```bash
gh pr create --title "Brief description of change" \
             --body "Closes #48" \
             --base dev \
             --web
```

**Manual:**
1. Go to https://github.com/dkirby-ms/void-market/pull/new
2. Select base: `dev` (not main/master)
3. Select compare: your branch (`squad/{issue-number}-{slug}`)
4. Fill in title and description

### PR Description Template

```markdown
## Description
Brief explanation of what you changed and why.

## Related Issue
Closes #48

## Testing
How did you test this change? (manual steps, new tests, etc.)

## Checklist
- [x] Code follows style guidelines (`npm run lint` passes)
- [x] Tests written and passing (`npm run test` passes)
- [x] Documentation updated (if applicable)
- [x] No breaking changes
```

### PR Review & Merge

1. **CI checks** run automatically (build, lint, test)
2. **Code review** — maintainers will review your code
3. **Revisions** — if changes are requested, update your branch:
   ```bash
   git add .
   git commit -m "Address review feedback"
   git push origin squad/{issue-number}-{slug}
   ```
4. **Merge** — once approved and CI passes, your PR will be merged to `dev`

## Questions & Help

- **Stuck on setup?** Check [README.md#prerequisites](README.md#prerequisites)
- **TypeScript errors?** Run `npm run build` for detailed output
- **Test failures?** Run `npm run test` and read the error
- **Design questions?** Check `docs/ARCHITECTURE.md`, `docs/GAME-SYSTEMS.md`, or open an issue
- **General questions?** Open a GitHub Discussion or ask in an issue

**We're here to help.** Don't hesitate to ask — good questions make the project better for everyone.

---

**Thank you for contributing to Void Market!** 🚀
