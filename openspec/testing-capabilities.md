# Testing Capabilities — Statistics-Graph

**Strict TDD Mode**: enabled
**Detected**: 2026-05-14

## Test Runner
- Command: `npx vitest run`
- Framework: Vitest 4.1.6 + @testing-library/react 16.3.2 + jsdom 29.1.1

## Test Layers

| Layer | Available | Tool |
|-------|-----------|------|
| Unit | ✅ | Vitest + Testing Library (5 suites, 806 lines) |
| Integration | ✅ | Vitest + Testing Library (SWR/Recharts mocked) |
| E2E | ❌ | — |

## Coverage
- Available: ❌ (not configured; `/coverage` in `.gitignore` but no `--coverage` flag)
- Command: `npx vitest run --coverage` would need `@vitest/coverage-v8`

## Quality Tools

| Tool | Available | Command |
|------|-----------|---------|
| Linter | ✅ | `npm run lint` (ESLint 9 / eslint-config-next) |
| Type checker | ✅ | `npx tsc --noEmit` (TS strict mode) |
| Formatter | ❌ | — |

## Test Inventory

| Test File | Lines | Scope |
|-----------|-------|-------|
| `src/server/__tests__/mockData.test.ts` | 277 | Shape, integer rules, monotonicity, sums, determinism |
| `src/app/api/metrics/__tests__/metrics.test.ts` | 190 | All 4 endpoints: status, body shape, error handling |
| `src/components/__tests__/DashboardClient.test.tsx` | 179 | SWR loading, skeleton, refresh button, partial error |
| `src/components/__tests__/Charts.test.tsx` | 118 | 3 chart components render SVGs, empty data |
| `src/components/__tests__/MetricCard.test.tsx` | 42 | Value, skeleton, zero, string rendering |

## Recommendations
1. Install `@vitest/coverage-v8` and set a coverage threshold
2. Add Playwright for E2E if needed
3. Install Prettier and configure a format script
4. Set up a CI pipeline (GitHub Actions or similar)
