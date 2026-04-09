# AGENTS.md

Guidance for agentic coding agents operating in this repository.

## Repository Snapshot

- Backend runtime/framework: Nitro (`nitro` package, ESM project).
- Primary language: TypeScript.
- Backend app root: repository root.
- Backend server directory: `src/` (configured in `nitro.config.ts`).
- API routes: `src/api/**` mapped to `/api/**` endpoints.
- Normal routes: `src/routes/**` mapped to `/**` endpoints.
- Auth stack: Better Auth with Drizzle adapter and Google OAuth.
- DB stack: Drizzle ORM + libsql (`@libsql/client`) with SQLite dialect.
- Migrations: schema-first in `db/schema.ts` + generated SQL in `db/migrations`.
- Frontend: separate Vite + React app in `web/`.

## Rule Files Check

- `.cursor/rules/`: not present.
- `.cursorrules`: not present.
- `.github/copilot-instructions.md`: not present.
- No additional Cursor/Copilot rule files are currently defined.

## Source-Of-Truth Files

- `package.json`: backend scripts + dependency versions.
- `web/package.json`: frontend scripts + dependency versions.
- `.prettierrc`: repository formatting policy.
- `tsconfig.json`: backend TypeScript config + `@/*` alias.
- `nitro.config.ts`: Nitro server/runtime configuration.
- `drizzle.config.ts`: Drizzle migration generation config.
- `.env.example`: required backend environment variables.
- `db/schema.ts`: database schema declarations.

## Setup Commands

- Install backend deps: `npm install`
- Install frontend deps: `npm install --prefix web`
- Start backend dev server: `npm run dev`
- Start frontend dev server: `npm run dev --prefix web`

## Build / Lint / Test Commands

### Backend (repository root)

- Build: `npm run build`
- Preview production build: `npm run preview`
- Format: `npm run lint` (runs `oxfmt`)
- Format check: `npm run lint:check`

Test status:

- There is no backend `test` script and no test framework configured right now.
- Running a single backend test is not available in current repo state.

If tests are introduced (recommended Vitest), use:

- All tests: `npx vitest run`
- Single file: `npx vitest run path/to/file.test.ts`
- Single test name: `npx vitest run -t "test name"`

### Frontend (`web/`)

- Dev: `npm run dev --prefix web`
- Build: `npm run build --prefix web`
- Lint: `npm run lint --prefix web` (ESLint)
- Preview: `npm run preview --prefix web`

Test status:

- There is no frontend `test` script configured in `web/package.json`.
- Running a single frontend test is also not available currently.

## Database Commands (backend)

- Generate migration from schema changes: `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- Open Drizzle Studio: `npm run db:studio`

## Environment Variables

Required backend variables (from `.env.example`):

- `APP_DATABASE_URL`
- `APP_DATABASE_AUTH_TOKEN`
- `APP_BETTER_AUTH_SECRET`
- `APP_BETTER_AUTH_URL`
- `APP_GOOGLE_CLIENT_ID`
- `APP_GOOGLE_CLIENT_SECRET`

Notes:

- Runtime env prefix is `APP_` (see `nitro.config.ts`).
- Local DB fallback currently used in code: `file:./db/local.db`.
- Never commit real credentials or tokens.

## Architecture Notes

- `src/db/client.ts`: Drizzle client wiring for runtime DB access.
- `src/lib/auth.ts`: Better Auth setup and provider configuration.
- `src/middleware/auth.ts`: API auth/session gatekeeping.
- `src/error.ts`: centralized Nitro error handling.
- `db/migrate.ts`: migration runner.

## Import Conventions

- Prefer alias imports via `@/*` from `tsconfig.json`.
- Use alias paths for internal modules when practical (avoid deep `../../..`).
- Keep external imports before internal imports.
- Separate import groups with a single blank line.
- Prefer named imports; use namespace imports only when justified.
- Keep import order stable and minimally surprising when editing files.

## Formatting Conventions

From `.prettierrc` and existing code patterns:

- Use double quotes (`"`).
- Do not use semicolons.
- Use trailing commas where valid.
- Use 4-space indentation.
- Keep target line width around 80 characters.
- Keep files ASCII unless existing file content requires otherwise.

## TypeScript Conventions

- Prefer explicit types for exported APIs and public helper contracts.
- Use local inference when the type is obvious from assignment.
- Prefer narrow unions/literals over broad types.
- Avoid `any`; if unavoidable, keep scope small and document why briefly.
- Use `as` assertions sparingly and only when unavoidable.
- Prefer `type` aliases for unions/utility composition; use `interface` where extension/merging benefits readability.

## Naming Conventions

- Files: lowercase, concise, descriptive (`auth.ts`, `client.ts`, `schema.ts`).
- Variables/functions: `camelCase`.
- Types/interfaces: `PascalCase`.
- Constants: `camelCase` unless true compile-time constants need `UPPER_SNAKE_CASE`.
- Nitro route filenames must follow route conventions (`[id].ts`, `[...all].ts`).

## Error Handling Guidelines

- Fail fast on missing required startup/runtime configuration.
- Do not swallow exceptions silently.
- Return framework-appropriate HTTP errors for route handlers/middleware.
- Do not leak secrets in error messages, logs, or response payloads.
- Prefer deterministic fallback behavior only where already established.
- Keep error responses consistent with existing `src/error.ts` behavior.

## Database & Migration Guidelines

- Make schema changes in `db/schema.ts` only.
- Generate SQL via `npm run db:generate`; do not hand-edit migration snapshots.
- Commit schema changes and generated migration artifacts together.
- Apply migrations locally (`npm run db:migrate`) before hand-off.
- Preserve Better Auth table compatibility when changing auth-related schema.

## Auth Integration Guidelines

- Keep Better Auth configuration centralized in `src/lib/auth.ts`.
- Keep auth/session middleware concerns in `src/middleware/auth.ts`.
- Use environment variables for provider credentials (never inline secrets).
- Ensure provider callback URLs match deployed/public auth base URL.

## Agent Workflow Expectations

- Inspect related files first; follow local patterns before introducing new ones.
- Keep changes minimal and scoped to the user request.
- Avoid unrelated refactors in the same patch.
- When scripts/deps/config behavior changes, update docs in the same change.
- Prefer precise file edits over broad rewrites.

## Validation Checklist (Before Hand-off)

- Run relevant commands for touched area (build/lint/db; tests if present).
- Confirm imports resolve, especially `@/*` alias usage.
- Confirm no secrets were added to tracked files.
- Confirm migrations are generated and included when schema changed.
- Call out limitations clearly (e.g., tests not configured yet).
