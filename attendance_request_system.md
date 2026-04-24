# AttendBuddy Attendance Request System

The attendance request system provides a fallback mechanism for students who missed the live attendance window. If a session expires and a student was not marked present, they can formally request their teacher to grant them attendance.

Here is a complete breakdown of how this system works across the frontend and backend.

## 1. The Student Workflow (Frontend)

The student's entry point to this feature is the session details screen (`mobile/app/(protected)/classroom/[code]/session/[id].tsx`).

**The Conditions:**
The "Request Attendance" button is strictly conditionally rendered. It only appears if:
1. The student is currently marked as **absent**.
2. The attendance session has **expired** or been manually closed by the teacher.

**The Submission:**
1. The student taps the "Request Attendance" button, which opens a dedicated modal.
2. The student must provide a justification message (minimum 5 characters) explaining why they need manual attendance.
3. Upon submission, the app calls the `/api/session/request` endpoint with the session ID, classroom code, and the message.

## 2. Processing the Request (Backend)

When the student submits the request, it hits the `src/api/session/request.post.ts` endpoint.

**The Validation:**
1. **Session & Classroom Check:** The backend ensures the session exists and belongs to the specified classroom.
2. **Role Check:** It verifies that the user is actually a student in the classroom (teachers cannot request attendance).
3. **Redundancy Check:** It checks if the student is already marked present. If so, the request is rejected immediately.

**Database Storage:**
- If the student previously submitted a request for this session, the backend simply updates the existing row with the new message and resets its status back to `"pending"`.
- Otherwise, it inserts a new row into the `attendance_request` table. The row stores the `studentUserId`, the `message`, and defaults the `status` to `"pending"`.

## 3. The Teacher Review Workflow (Frontend)

When the teacher opens the same session details screen, they see a specialized view:

**Viewing Requests:**
If there are any requests in the database for this session, an "Attendance requests" card appears at the top of the screen.
- It displays the student's name, their justification message, and a status pill (`PENDING`, `APPROVED`, or `REJECTED`).

**Taking Action:**
For `pending` requests, the teacher sees "Reject" and "Approve" buttons.
1. The teacher taps one of the buttons.
2. The app calls the `/api/session/request/review` endpoint, passing the `requestId` and the chosen `action` (`"approve"` or `"reject"`).

## 4. Finalizing the Review (Backend)

The teacher's action is processed by `src/api/session/request/review.post.ts`.

**The Validation:**
1. **Teacher Verification:** The backend verifies that the user making the request is the `creatorId` (teacher) of the classroom.

**Handling Approval (`"approve"`):**
If the teacher approved the request, the backend immediately inserts a new row into the `attendance_record` table for the student.
- Crucially, it sets the `markMethod` to `"teacher"`. This distinguishes it from normal facial-recognition attendance (which sets it to `"student"`), allowing for auditing.

**Updating the Request:**
Regardless of the decision, the `attendance_request` row is updated:
- `status`: Changed to `"approved"` or `"rejected"`.
- `reviewedByUserId`: Set to the teacher's ID.
- `reviewedAt`: Set to the current timestamp.

The frontend re-fetches the session data, immediately updating the UI to reflect the student's new attendance status and the resolved request.
