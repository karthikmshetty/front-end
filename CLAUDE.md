# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

React 19 + TypeScript (strict) + Vite 8 + Tailwind CSS v4. Node >= 20.19. Single-page app with
one entry point: `index.html` -> `src/main.tsx` -> `src/App.tsx`. `App.tsx` holds the
react-router 7 routes (8.x needs Node 22); route screens live in `src/pages/`. No state library
is installed yet.

## Commands

```bash
npm run dev           # Vite dev server
npm run build         # tsc -b, then vite build
npm run typecheck     # tsc -b (project references: tsconfig.app.json + tsconfig.node.json)
npm run lint          # eslint, fails on ANY warning (--max-warnings=0)
npm run lint:fix
npm run format        # prettier --write (also sorts Tailwind classes)
npm run check         # typecheck + lint + format:check — run this before declaring work done
npm run arch          # ArchGuard architecture check (naming, layers, reuse)
npm run arch:analyze  # rebuild the .archguard/ cache used by the MCP server
```

```bash
npm test              # Vitest in watch mode
npm run test:run      # Vitest once (CI)
```

Component tests use Vitest + jsdom + Testing Library (`test` block in `vite.config.ts`, setup in
`src/setupTests.ts`). Test files sit next to the source as `*.test.tsx`. Vitest globals are off:
import `describe`/`it`/`expect` from `vitest`. Pinned to Node 20 compatible versions (Vitest 4.1,
jsdom 29, jest-dom 6); Vitest 5, jsdom 30 and jest-dom 7 need Node 22.

## Best practices and ArchGuard

Project conventions live in `.claude/rules/` (loaded automatically when working in `src/`):
`architecture.md` (domain/layer layout, naming, reuse), `state-and-data.md` (state placement,
filter popups, API client, validation), `styling.md` (tokens, shared wrappers). When a new
pattern is agreed on, add it there, not only in a conversation.

ArchGuard is vendored as a prebuilt package in `packages/arcguard/` (installed via
`"@7edge/arcguard": "file:./packages/arcguard"`; do not edit its `dist/`, update it by copying a
new build from the ArchGuard repo). Config: `arcguard.config.json`. `.mcp.json` registers it as
the `arcguard` MCP server (approve it on first launch); use its `scaffold` tool to create files and
`validate_file` after editing them.

## Commit hooks

`npm install` runs `prepare` -> `husky`. lint-staged (config in `package.json`) runs
`eslint --fix --max-warnings=0` + `prettier --write` on staged TS/JS, and `prettier --write` on
json/css/md/html/yml. The README says the pre-commit hook also runs `tsc -b`. Note: the README
references `.husky/pre-commit`, `.nvmrc`, and `.vscode/` but these are not present in the repo
yet.

## Strictness rules that affect how code must be written

TypeScript (`tsconfig.app.json`, covers `src/` only; `tsconfig.node.json` covers `vite.config.ts`):

- `noUncheckedIndexedAccess`: array/record index access returns `T | undefined` — narrow it.
- `exactOptionalPropertyTypes`: you cannot pass `undefined` to an optional prop unless its type
  includes `| undefined`.
- `noPropertyAccessFromIndexSignature`: use `obj['key']` for index-signature types.
- `verbatimModuleSyntax` + `erasableSyntaxOnly`: no `enum`, no `namespace`, no constructor
  parameter properties; type-only imports must use `import type`.
- `allowImportingTsExtensions`: local imports include the extension (e.g. `import App from './App.tsx'`).

ESLint (`eslint.config.js`, type-aware via `projectService`):

- typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`, `react-x` strict-type-checked,
  `react-dom` strict, react-hooks, react-refresh (components files should only export components).
- Explicit return types on functions (e.g. components return `React.JSX.Element`, handlers `void`).
- `consistent-type-imports` with separate `import type` statements.
- `eqeqeq`, `curly: all`, no `any`, no floating promises, exhaustive `switch` on unions.
- `no-console` except `console.warn`/`console.error`.
- Unused vars/args allowed only with a `_` prefix.

Prettier: no semicolons, single quotes, trailing commas, 100-col width, LF.

## Styling

Tailwind v4 via `@tailwindcss/vite` — there is no `tailwind.config.js`. Design tokens live in the
`@theme` block in `src/index.css` (e.g. `--color-primary` -> `bg-primary`, `text-primary`). Token
names follow the Figma colour roles; values marked "estimated" there still need confirming against
Figma. Add new tokens there rather than hard-coding colors. Prettier's Tailwind plugin reads this stylesheet to
sort classes.
