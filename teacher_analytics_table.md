# Teacher Analytics Table

The "Members" table is a powerful dashboard in the AttendBuddy app that allows teachers to analyze attendance across the entire classroom. It provides at-a-glance metrics, sorting, filtering, and deep-links into specific student records.

Here is a breakdown of how it works and where the UI and logic are implemented in the codebase.

## 1. Frontend Implementation

**File:** `mobile/app/(protected)/classroom/[code]/index.tsx`

This screen serves as the primary classroom hub. If the logged-in user is recognized as the teacher (`role === "teacher"`), the app defaults the view to the "Members" tab.

### Data Hydration (`hydrateTeacherMemberRows`)
When the classroom loads, the app fetches the basic list of enrolled students. For each student, the app fires a separate API call to fetch their specific analytics:
```typescript
// Fetching data from mobile/lib/api.ts
const analytics = await getMemberAttendanceAnalytics(classroomCode, member.id);
```
It maps the response into a `MemberTableRow` object containing properties like `presentCount`, `absentCount`, `percentage`, and a computed `status` (`"good"`, `"warning"`, or `"critical"` based on the percentage).

### The UI Construction
The UI is composed of several custom components and native React Native elements:

- **Controls (`View`, `AppButton`, `AppInput`):** Above the table, there is a control bar containing a search input (`AppInput`) and buttons (`AppButton`) to trigger Filter, Sort, and Columns modals.
- **Active Filters (`StatusPill`, `Pressable`):** A horizontal row that displays active filter "chips" which the teacher can tap to remove.
- **The Table Shell:** A styled `View` that acts as the container. It has a sticky header row defining the columns: "Student", "P" (Present), "A" (Absent), "%", and "Last".
- **The List (`renderMemberRow`):** 
    - The table rows are rendered inside a `FlatList` (or a `ScrollView` mapping over the array). 
    - Each row is a `Pressable` component.
    - If a student's status is `"critical"`, the row has a subtle red background tint. 
    - Tapping a row expands it (controlled by `expandedRowId`), revealing an `AppButton` to "Open member details", which uses `expo-router` to push the specific member view.

### State Features (Lines ~416-520)
- **Search & Filtering:** The `filteredMemberRows` hook uses `useMemo` to natively filter the `memberRows` array based on the `queryInput` (name/email), the `statusFilter` (good/warning/critical), and any `minPct` or `maxPct` threshold the teacher set in the `AppModal`.
- **Sorting:** The same `useMemo` block handles sorting logic, allowing the teacher to sort by `name_asc`, `attendance_asc`, or `last_attended_desc`.
- **Dynamic Columns:** The `visibleColumns` state allows teachers to toggle off specific columns (like turning off the "Last Attended" column to save horizontal space) via a modal interface.

## 2. The API Client

**File:** `mobile/lib/api.ts`

The frontend uses the wrapper function to make the typed API request and handle errors seamlessly:
```typescript
export async function getMemberAttendanceAnalytics(
    classroomCode: string,
    memberId: string,
): Promise<MemberAttendanceAnalytics>
```

## 3. Backend Implementation

**File:** `src/api/classroom/[code]/member/[id]/analytics.get.ts`

When the backend receives the request for a specific student's analytics, it performs the following steps:
1. **Authorization Check:** It ensures the user making the request is the `creatorId` (teacher) of the classroom.
2. **Fetch Sessions:** It queries the database (`schema.attendanceSession`) to grab every session ever created for the classroom.
3. **Fetch Records:** It queries the database (`schema.attendanceRecord`) for any row matching the student's `userId` and the `classroomCode`.
4. **Calculations:** 
   - `totalSessions` is the total count of all classroom sessions.
   - `presentCount` is the number of records the student has.
   - `absentCount` is mathematically derived (`totalSessions - presentCount`).
   - `percentage` is computed and rounded (`(presentCount / totalSessions) * 100`).
5. **Recent Activity:** It maps the last 20 sessions to quickly indicate if the student was present or absent for recent classes.

All of this data is bundled up and returned to the frontend to populate the table row efficiently.
