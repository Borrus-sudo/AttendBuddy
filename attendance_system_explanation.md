# AttendBuddy Attendance System

The attendance system in AttendBuddy enforces secure, verifiable attendance tracking by combining geolocation bounds and facial recognition. Here is a complete breakdown of how the entire process works from the moment a student attempts to mark attendance until it is recorded in the database.

## 1. The Frontend Experience (React Native / Expo)

The student interacts with the attendance system through a mobile app. The primary logic is handled in the session details screen (`mobile/app/(protected)/classroom/[code]/session/[id].tsx`).

**The Workflow:**
1. **Inputting the Code:** The student types in a session code provided by the teacher.
2. **Selfie Capture:** The student taps "Capture Selfie". The app uses `expo-camera` to open the front-facing camera in a circular viewfinder, capturing an image and converting it into a base64 string.
3. **Location Fetching:** When the student taps "Verify + Submit", the app uses `expo-location` to grab the device's precise GPS coordinates (latitude and longitude).
4. **Submitting the Request:** The app sends a single request to the backend's `/api/session/verify` endpoint containing:
    - The `attendanceCode`
    - The `selfieBase64` string
    - The `latitude` and `longitude`

If the backend approves the request, the UI updates instantly to show the student as "Present".

## 2. Location Verification

Before the backend even processes the image, it ensures the student is physically in the correct location. This logic lives in `src/lib/location.ts`.

**The Workflow:**
1. The server receives the `latitude` and `longitude` from the mobile app.
2. It uses the Haversine formula to calculate the great-circle distance between the student's location and a hardcoded target zone (e.g., `19.0218916667 N, 72.8559305556 E`).
3. If the distance is greater than the allowed radius (e.g., 150 meters), the request is rejected immediately with an error.

*(Note: Currently, `isGpsTrackingDisabled` is set to `true`, which bypasses this check for development, but the mathematical framework is fully in place.)*

## 3. Session Validation

Once the location is verified, the system checks the validity of the attendance session (`src/api/session/verify.post.ts`):
1. **Session Exists:** It looks up the `attendanceCode` in the database to find the corresponding `attendanceSession`.
2. **Session Active:** It verifies that the session is not manually closed (`isClosed = false`) and that it has not reached its `expiresAt` timestamp.
3. **Membership Check:** It ensures the user making the request is actually a registered student in the classroom and not the teacher trying to mark their own attendance.

## 4. Face Verification (DeepFace Microservice)

The most secure part of the process is the facial biometric check, orchestrated by `src/lib/attendance-verify.ts` and an external Python microservice.

**The Workflow:**
1. **Fetching the Reference:** The backend looks up the student's profile photo (`referenceImageUrl`) in the database and downloads it into a Buffer.
2. **Sending to Python Server:** The backend converts the reference image to base64 and sends both the live selfie and the reference image to the `face_matching` Python server running locally.
3. **DeepFace Analysis:** The Python microservice uses the `DeepFace` library to compare the facial embeddings of the two images.
4. **Scoring:** The microservice returns an `ok` boolean (based on distance thresholds) and a `confidence` score. The Nitro backend checks if this result meets the `faceVerificationMinScore` (typically 75%).
5. **Recording the Attempt:** A record of the attempt, including the success state, confidence score, and any failure reasons, is saved to the `attendance_verification_attempt` database table.

## 5. Finalizing Attendance

If all checks pass (Location -> Session Validity -> Facial Match), the backend inserts a new row into the `attendance_record` table. The `markMethod` is recorded as `"student"`, successfully logging the student as present for that class session.
