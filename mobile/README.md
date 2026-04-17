# AttendBuddy Mobile

Expo app for AttendBuddy (Android, iOS, and web).

## Start

Install deps:

```bash
npm install
```

Start dev server:

```bash
npx expo start
```

## Backend URL by Platform

Default API base URL in `mobile/lib/config.ts`:

- Android physical device: `http://<expo-host-ip>:5000` (auto-detected)
- Android emulator fallback: `http://10.0.2.2:5000`
- Web and iOS simulator: `http://localhost:5000`

If needed, set an explicit API URL:

```bash
EXPO_PUBLIC_API_BASE_URL=http://<your-machine-ip>:5000 npx expo start --lan
```

Recommended for Android emulator:

```bash
npx expo start --lan --android
```

## Common Commands

- Start dev: `npm run dev`
- Android: `npm run android`
- iOS: `npm run ios`
- Web: `npm run web`

## Notes

- Keep backend running at port `5000` unless you also update
  `EXPO_PUBLIC_API_BASE_URL`.
- If connection/auth appears stale, restart with cache clear:

```bash
npx expo start --clear
```
