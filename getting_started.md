# AttendBuddy Frontend Getting Started (`web/`)

## 1) What this frontend is

AttendBuddy's frontend is a Vite + React app used by both:

- **Teachers/creators** to create classrooms and run attendance sessions (QR/token-based)
- **Students/members** to join classrooms and mark/view attendance

It talks directly to the Nitro backend (`http://localhost:5000` by default) via REST + Better Auth endpoints.

---

## 2) Frontend stack and key dependencies

- **Runtime/build**
    - React `^19`
    - TypeScript `~6`
    - Vite `^8`
    - React Router DOM `^7`
- **Styling/UI**
    - Tailwind CSS `^4` (`@tailwindcss/vite`)
    - `clsx`, `tailwind-merge`, `class-variance-authority`
    - `lucide-react` icons
- **Auth**
    - `better-auth` React client (`createAuthClient`)
- **Feature-specific**
    - `qrcode.react` for rendering attendance QR codes
- **Lint/build scripts**
    - `npm run dev`, `npm run lint`, `npm run build`, `npm run preview`

---

## 3) Directory structure overview (`web/src`)

```text
web/src/
  main.tsx                     # App entry, RouterProvider + ToasterProvider
  router.tsx                   # Browser router definitions
  index.css                    # Tailwind import + global dark theme defaults

  routes/
    auth-route.tsx             # "/" login/session handling
    dashboard-route.tsx        # "/app" main authenticated workspace

  layout/
    app-shell.tsx              # Top-level app chrome (header/actions/content shell)

  lib/
    auth-client.ts             # Better Auth client setup
    api.ts                     # All frontend API calls (fetch + credentials)
    utils.ts                   # UI utility helpers (cn, etc.)

  hooks/
    use-classrooms.ts          # Classroom CRUD/join/leave state
    use-attendance.ts          # Start/close active attendance session
    use-classroom-analytics.ts # Creator/member analytics data fetch

  types/
    classroom.ts               # Shared frontend domain types

  components/
    auth/google-sign-in-card.tsx
    classroom/*                # Sidebar, forms, panels, focus card
    ui/*                       # Button/card/input/dialog/toaster/spinner/etc.

  assets/
    hero.png, react.svg, vite.svg
```

---

## 4) Environment variables (frontend)

### Required/used

- `VITE_BETTER_AUTH_URL`
    - Used as frontend API/auth base URL in:
        - `src/lib/auth-client.ts`
        - `src/lib/api.ts`

### Default behavior

- If missing, frontend falls back to:
    - `http://localhost:5000`

### Current repo values

- `web/.env.example` contains:
    - `VITE_BETTER_AUTH_URL=http://localhost:5000`
- `web/.env` currently also points to the same localhost backend.

---

## 5) Auth flow end-to-end (frontend <-> backend)

1. User lands on `/` (`AuthRoute`).
2. Frontend checks session via `useSession()` (Better Auth React client).
3. On "Sign in with Google", frontend calls:
    - `signIn.social({ provider: "google", callbackURL: "<origin>/app" })`
4. Backend handles auth routes at:
    - `/api/auth/*` (`src/api/auth/[...all].ts` -> `auth.handler`)
5. After OAuth callback, frontend refreshes session (`getSession()`), clears OAuth query params, and navigates to `/app`.
6. API requests include cookies (`credentials: "include"`).
7. Backend middleware protects `/api/**` except `/api/auth`:
    - unauthenticated calls return `401 Unauthorized`.

Practical takeaway: if session/auth fails, first verify frontend backend URL alignment and Google callback URL config on backend.

---

## 6) Main user flows

### Teacher / creator flow

1. Sign in with Google.
2. Open **Create Classroom** dialog -> submit name/description.
3. Select a created classroom from sidebar.
4. Generate attendance QR with duration (5/10/15/30/45 min).
5. Share QR/token with students.
6. Close session when complete.
7. View creator analytics:
    - member count, total sessions, attendance marks, student table.

### Student / member flow

1. Sign in with Google.
2. Open **Join Classroom** dialog -> enter 6-char code.
3. Select joined classroom.
4. Mark attendance by entering token (from scanned QR).
5. View personal attendance summary:
    - total sessions, attended sessions, percentage, per-session history.
6. Optionally leave classroom.

---

## 7) Current routing map

- `/` -> `AuthRoute`
    - login screen + session bootstrap
    - redirects authenticated users to `/app`
- `/app` -> `DashboardRoute`
    - main protected workspace
    - redirects unauthenticated users back to `/`

No additional nested/page routes are currently defined.

---

## 8) API endpoints called by frontend

From `src/lib/api.ts`:

- `GET /api/classroom/list`
- `POST /api/classroom/create`
- `POST /api/classroom/join`
- `POST /api/classroom/leave`
- `DELETE /api/classroom/:code`
- `POST /api/classroom/:classroomCode/attendance/session.create`
- `POST /api/classroom/:classroomCode/attendance/session/:attendanceSessionId/close`
- `GET /api/classroom/:classroomCode/attendance/overview`
- `GET /api/classroom/:classroomCode/attendance/me`
- `POST /api/attendance/scan`

Auth/session endpoints are handled through Better Auth client at:

- `/api/auth/*`

---

## 9) UI architecture at a glance

- **App shell (`layout/app-shell.tsx`)**
    - Global header: app branding, user info, create/join/sign-out actions
    - Main content container
- **Sidebar (`classroom-sidebar.tsx`)**
    - Classroom groups:
        - Created by you (teacher view)
        - Joined as student (student view)
    - Selection drives right-side content
- **Primary cards/panels**
    - `ClassroomFocusCard` (context + leave/delete)
    - `AttendancePanel` (creator QR session controls)
    - `MarkAttendanceForm` (member token submit)
    - `CreatorOverviewPanel` / `MemberAttendancePanel` (role-based analytics)
- **Dialogs**
    - Create classroom
    - Join classroom
- **Toaster**
    - Global success/error notifications for all async actions

---

## 10) Run, lint, and build

From repo root:

- Install backend deps:
    - `npm install`
- Install frontend deps:
    - `npm install --prefix web`

Run in development (two terminals):

- Backend: `npm run dev`
- Frontend: `npm run dev --prefix web` (Vite on port `3000`)

Frontend quality/build:

- Lint: `npm run lint --prefix web`
- Build: `npm run build --prefix web`
- Preview production build: `npm run preview --prefix web`

---

## 11) Gotchas and quick troubleshooting

- **401 on API calls**
    - Ensure backend is running and user is logged in.
    - Confirm frontend uses correct `VITE_BETTER_AUTH_URL`.
- **Google sign-in redirects but no session in app**
    - Check backend `APP_BACKEND_URL` and Google callback URL:
        - `<APP_BACKEND_URL>/api/auth/callback/google`
- **CORS/trusted origins issues**
    - Backend auth currently trusts `http://localhost:3000` and `http://localhost:5000`.
    - If you change frontend port/host, update backend trusted origins.
- **Data not updating after classroom/session actions**
    - Most flows rely on hook `refresh()` calls; look for failed toast/error message.
- **Token submit fails**
    - Token must be valid and active (backend enforces min length, session open, not expired).
- **Join classroom failures**
    - Code is normalized uppercase and expected to be 6 chars.
- **Wrong backend target in frontend**
    - Update `web/.env` and restart Vite after changing env vars.
