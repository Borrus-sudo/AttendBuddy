# Frontend Architecture & State Management

The AttendBuddy mobile client (React Native / Expo) takes a lightweight, hook-driven approach to state management and backend interfacing. It avoids heavy third-party state libraries (like Redux or Zustand) in favor of localized, predictable component state and a strongly-typed centralized API client.

Here is a detailed breakdown of how data flows between the backend and the UI.

## 1. Interfacing with the Backend

All external network requests are abstracted away from the UI components into a centralized library: `mobile/lib/api.ts`. 

### The `request` Wrapper
At the core of the API library is a generic `request<T>` wrapper around the native `fetch` API. It handles:
- **Base URL Resolution:** Automatically prepends the environment-specific `API_BASE_URL`.
- **Platform-Specific Auth:** React Native handles cookies differently than a web browser. If the app is running natively, it extracts the session cookie via `getAuthCookie()` and injects it directly into the request headers.
- **Error Normalization:** If a response is not `ok`, it attempts to parse the JSON error body (e.g., `{ message: "Session expired" }`) and throws a standardized `ApiError`.

### Type-Safe Endpoints
UI components never call `fetch` directly. Instead, they call typed wrapper functions. 
For example, to get a session:
```typescript
export async function getAttendanceSessionDetail(
    classroomCode: string,
    sessionId: string,
): Promise<AttendanceSessionDetailPayload>
```
These functions map strictly to the Nitro backend's expected payloads and response envelopes (`SuccessEnvelope<T>`). Types are shared and defined in `mobile/types/api.ts`.

## 2. State Management Strategy

The application relies entirely on React's built-in hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) to manage the state of the screens. 

### Standard View State Pattern
A typical screen (like `mobile/app/(protected)/classroom/[code]/session/[id].tsx`) defines a set of isolated state variables to control the UI lifecycle:
- **`data`**: Holds the core payload fetched from the API.
- **`isLoading`**: A boolean flag for the initial data fetch (controls the full-screen spinner).
- **`isSaving`** / **`isSubmitting`**: Boolean flags used to show loading spinners inside specific buttons during mutations.
- **`error`**: Holds any string messages from thrown `ApiError` instances to display to the user.

### Optimistic UI Updates
To ensure the app feels fast and responsive (especially for frequent actions like a teacher toggling a student's attendance), the frontend uses optimistic updates.

**How it works:**
1. **Cache Current State:** The component stores the current data in memory (`const previousMembers = data.members;`).
2. **Mutate Locally:** The component immediately calls `setData` with the new expected state (e.g., toggling `isPresent: true`). The UI re-renders instantly.
3. **Fire API Call:** The component triggers the API mutation (`setAttendancePresence()`).
4. **Reconcile or Rollback:**
    - *If success:* The component fetches the absolute latest data from the server (`getAttendanceSessionDetail`) to ensure total synchronization.
    - *If failure:* The `catch` block catches the `ApiError`, reverts the state (`setData({ ...data, members: previousMembers })`), and displays an error toast/text.

## 3. Computed State (Derived Data)

Rather than storing derived data in state (which can cause synchronization bugs), the app relies heavily on `useMemo` to compute UI-specific data on the fly based on the core `data` payload.

**Examples:**
- `attendanceStats`: Computes total, present, and absent counts from the raw member list.
- `currentStudent`: Filters the member list to find the logged-in user's specific row.
- `isSessionExpired`: Compares the `data.session.expiresAt` timestamp against `Date.now()`.

Because these are wrapped in `useMemo`, they only recalculate when `data` changes, keeping renders highly performant.

## Summary
By keeping state localized to the screen level and funneling all mutations through a robust, type-safe API wrapper, the frontend maintains a strict separation of concerns. The UI components handle *presentation and optimistic transitions*, while the API library handles *network transport and error normalization*.
