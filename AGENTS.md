# AGENTS.md

Operational guide for agentic coding tools working in this repository.

## Repository Snapshot

- Backend runtime/framework: Nitro (`nitro`, ESM, TypeScript).
- Backend source root: `src/`.
- API routes: `src/api/**` map to `/api/**`.
- Non-API routes: `src/routes/**` map to `/**`.
- Middleware: `src/middleware/*` (numeric prefixes define order).
- Auth: Better Auth + Drizzle adapter + Google OAuth.
- Database: Drizzle ORM + libsql client + SQLite dialect.
- DB schema: `db/schema.ts`.
- DB migrations: `db/migrations/`.
- Mobile client: Expo + React Native in `mobile/`.
- Face matching microservice: Python + DeepFace in `face_matching/`.

## Rule Files (Cursor/Copilot)

Checked in this repository:

- `.cursor/rules/**`: not present.
- `.cursorrules`: not present.
- `.github/copilot-instructions.md`: not present.

If these files are added later, treat them as higher-priority local policy.

## Setup and Development Commands

- Install backend dependencies: `npm install`
- Install mobile dependencies: `npm install --prefix mobile`
- Run backend dev server: `npm run dev`
- Run mobile dev server: `npm run dev --prefix mobile`
- Run mobile Android target: `npm run android --prefix mobile`
- Run mobile iOS target: `npm run ios --prefix mobile`
- Run mobile web target: `npm run web --prefix mobile`
- Run face matching server: `uvicorn server:app --host 127.0.0.1 --port 8000` (from `face_matching/`)

## Build, Lint, and Test Commands

### Backend (repository root)

- Build production server: `npm run build`
- Preview production build: `npm run preview`
- Format code with oxfmt: `npm run lint`
- Check formatting without writing: `npm run lint:check`

Backend test status:

- No `test` script exists in root `package.json`.
- No backend test runner is configured today.
- Single-test execution is currently unavailable.

If Vitest is added later, use:

- Run all tests: `npx vitest run`
- Run one test file: `npx vitest run path/to/file.test.ts`
- Run one named test: `npx vitest run -t "test name"`

### Mobile (`mobile/`)

- Start Expo dev server: `npm run dev --prefix mobile`
- Start Expo for Android: `npm run android --prefix mobile`
- Start Expo for iOS: `npm run ios --prefix mobile`
- Start Expo for web: `npm run web --prefix mobile`

Mobile lint/test/build status:

- No `lint` script is defined in `mobile/package.json`.
- No `test` script is defined in `mobile/package.json`.
- No dedicated mobile CI build script is defined.
- Single-test execution is currently unavailable.

If Jest or Vitest is added later, include single-test commands in this file.

## Database and Migration Commands

- Generate migrations: `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- Push schema directly: `npm run db:push`
- Open Drizzle Studio: `npm run db:studio`

## Environment and Secrets

Nitro runtime config uses env prefix `APP_` (`nitro.config.ts`).

Expected environment variables:

- `APP_DATABASE_URL`
- `APP_DATABASE_AUTH_TOKEN`
- `APP_BETTER_AUTH_SECRET`
- `APP_GOOGLE_CLIENT_ID`
- `APP_GOOGLE_CLIENT_SECRET`
- `APP_FRONTEND_URL`
- `APP_BACKEND_URL`
- `FACE_MATCHING_SERVER`
- `PORT`

Notes:

- `src/lib/db.ts` falls back to `file:./db/local.db` when DB URL is missing.
- Never commit real credentials, tokens, or secrets.

## Code Style and Conventions

### Imports

- Prefer `@/*` alias imports for internal modules.
- Keep external imports before internal imports.
- Use one blank line between import groups.
- Prefer named imports; avoid namespace imports unless clearly better.
- Keep import ordering stable to reduce noisy diffs.

### Formatting

Based on `.prettierrc` and `.oxfmtrc.json`:

- Use double quotes.
- Use semicolons.
- Use trailing commas where valid.
- Use 4-space indentation.
- Target ~80 character lines where practical.
- Avoid formatting-only churn in unrelated files.
- Prefer ASCII unless a file already requires Unicode.

### TypeScript and Types

- Prefer explicit types for exported functions and public contracts.
- Allow local inference for obvious locals.
- Prefer narrow unions/literals over broad primitive types.
- Avoid `any`; if unavoidable, keep usage tightly scoped.
- Use `as` assertions sparingly.
- Keep zod schemas explicit for request parsing/validation.

### Naming

- Files: lowercase and descriptive.
- Variables/functions: `camelCase`.
- Types/interfaces/classes: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE` only when truly constant.
- Route files: Nitro conventions like `index.ts`, `[id].ts`, `x.post.ts`.
- Middleware ordering: preserve numeric prefixes like `1.cors.ts`.

## API and Error Handling

- For request/auth/validation failures, throw `HTTPError.status(...)`.
- Prefer `401 Unauthorized` for authentication failures.
- Keep success envelope consistent: `{ success: true, payload: ... }`.
- Keep error envelope consistent through `src/error.ts`.
- Do not swallow exceptions silently.
- Do not leak secrets in logs or response payloads.
- Keep authorization checks explicit for owner-only actions.

## Backend-Specific Notes

- Auth context is attached in `src/middleware/2.auth.ts` for `/api/**`
  except `/api/auth` routes.
- Better Auth handler is mounted at `src/api/auth/[...all].ts`.
- Keep DB wiring centralized in `src/lib/db.ts`.
- Keep Better Auth setup centralized in `src/lib/auth.ts`.
- Use Drizzle patterns consistent with nearby files.

## Database Change Policy

- Make schema changes in `db/schema.ts`.
- Generate migrations from schema changes; do not hand-write snapshots.
- Commit schema and migration artifacts together.
- Run `npm run db:migrate` locally when schema changes.
- Preserve foreign keys, uniqueness, and indexes when evolving tables.

## Agent Workflow Expectations

- Read nearby files and match existing patterns before editing.
- Keep patches focused and minimal.
- Avoid unrelated refactors in the same change.
- Update this file when scripts/tooling/workflows change.
- Prefer deterministic commands in notes and PR descriptions.

## Pre-Handoff Validation Checklist

- Run relevant checks for touched areas.
- Backend baseline: `npm run lint:check` and `npm run build`.
- Mobile baseline: run at least `npm run dev --prefix mobile` if applicable.
- If tests exist in future, run them and include single-test examples.
- Confirm `@/*` imports resolve after edits.
- Confirm no secrets were introduced in tracked files.
- Call out assumptions, risks, and known limitations.
