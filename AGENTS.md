# AGENTS.md

Operational guidance for agentic coding tools working in this repository.

## Repository Snapshot

- Backend framework/runtime: Nitro (`nitro`, ESM, TypeScript).
- Backend app root: repository root.
- Server source directory: `src/`.
- API routes: `src/api/**` -> `/api/**`.
- Non-API routes: `src/routes/**` -> `/**`.
- Middleware: `src/middleware/*` (numeric prefixes define order).
- Auth stack: Better Auth + Drizzle adapter + Google OAuth.
- DB stack: Drizzle ORM + libsql + SQLite dialect.
- Migrations: schema in `db/schema.ts`, SQL in `db/migrations`.
- Frontend app: Vite + React in `web/`.

## Rule Files (Cursor/Copilot)

Checked in this repo:

- `.cursor/rules/**`: not present.
- `.cursorrules`: not present.
- `.github/copilot-instructions.md`: not present.

If these appear later, treat them as higher-priority local policy and update
this file.

## Setup and Dev Commands

- Install backend deps: `npm install`
- Install frontend deps: `npm install --prefix web`
- Run backend dev server: `npm run dev`
- Run frontend dev server: `npm run dev --prefix web`

## Build, Lint, and Test Commands

### Backend (root)

- Build production server: `npm run build`
- Preview production build: `npm run preview`
- Format code: `npm run lint`
- Check formatting: `npm run lint:check`

Backend test status:

- No `test` script in root `package.json`.
- No backend test runner configured.
- Single-test execution is not available yet.

If Vitest is added:

- Run all tests: `npx vitest run`
- Run one test file: `npx vitest run path/to/file.test.ts`
- Run one named test: `npx vitest run -t "test name"`

### Frontend (`web/`)

- Dev server: `npm run dev --prefix web`
- Build: `npm run build --prefix web`
- Lint: `npm run lint --prefix web`
- Preview build: `npm run preview --prefix web`

Frontend test status:

- No `test` script in `web/package.json`.
- No frontend test runner configured.
- Single-test execution is not available yet.

If Vitest is added to frontend:

- Run all tests: `npx vitest run --root web`
- Run one test file: `npx vitest run --root web src/path/file.test.tsx`
- Run one named test: `npx vitest run --root web -t "test name"`

## Database and Migration Commands

- Generate migrations: `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- Open Drizzle Studio: `npm run db:studio`

## Environment and Secrets

Env var prefix is `APP_` (`nitro.config.ts`).

Configured/expected variables:

- `APP_DATABASE_URL`
- `APP_DATABASE_AUTH_TOKEN`
- `APP_BETTER_AUTH_SECRET`
- `APP_GOOGLE_CLIENT_ID`
- `APP_GOOGLE_CLIENT_SECRET`
- `APP_FRONTEND_URL`
- `APP_BACKEND_URL`
- `PORT`

Notes:

- `src/lib/db.ts` falls back to `file:./db/local.db` when URL is missing.
- Never commit real credentials, tokens, or keys.

## Code Style and Conventions

### Imports

- Prefer `@/*` alias imports for internal modules.
- Keep external imports before internal imports.
- Separate import groups with one blank line.
- Prefer named imports; avoid namespace imports unless clearer.
- Keep import ordering stable to avoid noisy diffs.
- Aliases may appear as `@/src/...` and `@/db/...`; follow local file style.

### Formatting

Based on `.prettierrc` and existing files:

- Use double quotes.
- Use semicolons.
- Use trailing commas where valid.
- Use 4-space indentation.
- Keep lines near 80 chars when practical.
- Keep files ASCII unless existing content already uses Unicode.
- Avoid formatting-only churn in unrelated files.

### TypeScript and Types

- Prefer explicit types on exported functions and public contracts.
- Use local inference for obvious locals.
- Prefer narrow unions/literals over broad primitive types.
- Avoid `any`; if unavoidable, keep scope minimal.
- Use `as` assertions sparingly.
- Use `type` for unions/composition; `interface` for extension/merging.
- Keep zod schemas and parsed payload handling explicit.

### Naming

- Files: lowercase and descriptive.
- Variables/functions: `camelCase`.
- Types/interfaces: `PascalCase`.
- Route filenames: follow Nitro conventions (`index.ts`, `[id].ts`,
  `create.post.ts`, `join.[code].post.ts`).
- Middleware ordering: preserve numeric prefixes (`1.cors.ts`, `2.auth.ts`).

## API and Error Handling

- Throw `HTTPError.status(...)` for validation/auth/request errors.
- Prefer 401 for auth failures.
- Keep API success shape as `{ success: true, payload: { ... } }`.
- Let centralized handler in `src/error.ts` normalize unexpected errors.
- Do not swallow errors silently.
- Do not leak secrets in errors, logs, or response payloads.
- Fail fast on missing critical runtime config.

## API Surface (`src/api`)

Current API directory layout:

- `src/api/auth/`: currently empty (auth routes handled by Better Auth wiring).
- `src/api/session/`: currently empty.
- `src/api/classroom/`: classroom CRUD/join endpoints.
- `src/api/user/`: user self-service endpoints.

Current route files and observed behavior:

- `src/api/classroom/create.post.ts`
    - Creates classroom rows with `code`, `creatorId`, `name`, `description`.
    - Uses zod body parsing and requires authenticated user from middleware.
- `src/api/classroom/join.[code].post.ts`
    - Joins current user to a classroom by route param `code`.
    - Validates classroom existence, inserts into `classroom_member` with
      `onConflictDoNothing()`.
- `src/api/classroom/[code].get.ts`
    - Returns classroom details and members/owner info for authenticated users.
    - Validates code param and existence checks before payload response.
- `src/api/classroom/[code].delete.ts`
    - Allows deletion only for classroom owner (`creatorId === userId`).
    - Returns success after deleting classroom.
- `src/api/user/[id].get.ts`
    - Allows users to fetch their own profile only (`requestedId === userId`).
    - Returns user info plus classroom list with computed role.
- `src/api/user/[id].delete.ts`
    - Allows users to delete their own account only.
- `src/api/user/index.ts`
    - Lightweight placeholder route returning a static success payload.

Implementation notes for agents editing API routes:

- Auth context is populated by `src/middleware/2.auth.ts` for `/api/**` except
  `/api/auth`.
- Most handlers validate route params via zod `safeParse`.
- Prefer consistent success envelope: `{ success: true, payload: ... }`.
- Prefer `HTTPError.status(code, statusText, { message })` over ad-hoc errors.
- Maintain route file naming by HTTP method and Nitro dynamic segments.
- Keep DB queries in Drizzle style already used in nearby route files.
- Preserve user-ownership checks for sensitive operations.

## Database and Auth Guidelines

- Make schema edits in `db/schema.ts`.
- Generate migrations via command, not hand-written SQL snapshots.
- Commit schema and migration artifacts together.
- Run migrations locally before hand-off if schema changed.
- Preserve foreign keys and indexes when evolving tables.
- Keep Better Auth setup centralized in `src/lib/auth.ts`.
- Keep DB client wiring centralized in `src/lib/db.ts`.
- Keep provider credentials/URLs in environment variables only.

## Tooling Notes

- Backend lint command is formatter-based (`oxfmt`), not ESLint.
- Frontend lint command is ESLint (`web/eslint.config.js`).
- Frontend build runs `tsc -b` before Vite build.
- No backend/frontend test files are currently present.

## Agent Workflow Expectations

- Read nearby files and follow local patterns before edits.
- Keep patches focused and minimal.
- Avoid unrelated refactors in the same change.
- If scripts/config behavior changes, update docs in the same patch.
- Prefer deterministic, reproducible commands in notes/PRs.
- When adding tooling/scripts, document commands in this file.

## Validation Checklist (Before Hand-off)

- Run relevant checks for touched areas (build/lint/db).
- Run tests if a runner exists; otherwise state tests are not configured.
- Confirm `@/*` imports resolve after edits.
- Confirm no secrets were added to tracked files.
- Confirm migration artifacts are included when schema changed.
- Call out risks, assumptions, and limitations clearly.

Quick pre-handoff commands (as applicable):

- `npm run lint:check`
- `npm run build`
- `npm run lint --prefix web`
- `npm run build --prefix web`
- `npm run db:migrate`
