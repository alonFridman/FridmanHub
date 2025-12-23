# Family Portal

An MVP Smart TV–friendly family portal that merges Google Calendar events from Dad and Mom with kids' weekly school schedules stored in Firestore. Built with React, TypeScript, Vite, Tailwind, and Firebase (Auth, Firestore, Cloud Functions, Hosting).

## Folder structure
- `web/` – React + Vite + Tailwind frontend optimized for TV viewing.
- `functions/` – Firebase Cloud Functions v2 for Google Calendar aggregation and configuration APIs.
- `firebase.json` – Hosting rewrites and function endpoints.
- `firestore.rules` – Authenticated family-only Firestore security rules.
- `.env.example` – Environment variable template for frontend and backend.

## Color system
Only the required palette is used:
- Primary `#5A9CB5` (background)
- Highlight `#FACE68` (today/now accents)
- Secondary `#FAAC68` (kids/school events)
- Alert `#FA6868` (warnings/actions)
- White/near-black for contrast text and panels

## Prerequisites
- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud project with Calendar API enabled and OAuth client (web) configured
- Firebase project with Auth + Firestore enabled

## Environment setup
1. Copy `.env.example` to `.env` (root for Functions, `.env` or `.env.local` for `web`).
2. Fill in Firebase keys and OAuth credentials:
   - `VITE_FIREBASE_*` for the frontend
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OAUTH_REDIRECT_URI` for server-side Calendar access
   - `VITE_FUNCTIONS_ORIGIN` set to your deployed Functions base (e.g., `https://<project>.cloudfunctions.net` or emulator URL)
3. Set `FAMILY_CONFIG_DOC` if you want a non-default config document id.

## Firebase setup
- **Auth**: Enable Google Sign-In in Firebase console.
- **Firestore**: Collections used
  - `familyConfig/{docId}` – stores calendar IDs and timezone.
  - `calendarTokens/{owner}` – stores OAuth refresh tokens for `dad` and `mom`.
  - `kids/{kidId}` – kids metadata and display color (palette only).
  - `schoolSchedules/{id}` – weekly templates `{childId, dayOfWeek (0-6), startTime, endTime, title}`.
- **Rules**: Deploy `firestore.rules` to restrict access to authenticated users.

## Cloud Functions (v2, Node 20)
Endpoints (rewritten by Hosting):
- `GET /calendar/list` – lists calendars for Dad and Mom using stored OAuth tokens.
- `GET /events/range?start=YYYY-MM-DD&end=YYYY-MM-DD` – returns unified events from Google + school templates, cached server-side for 5 minutes.
- `GET/POST /config` – read/write config, kids, and school schedules; POST also updates stored refresh tokens.

Authentication: All endpoints require a Firebase ID token (`Authorization: Bearer <token>`). Google Calendar OAuth refresh tokens are loaded from Firestore and used server-side.

## Frontend (Vite + React + Tailwind)
Routes
- `/today` – vertical daily timeline with “Now” indicator.
- `/week` – grouped 7-day view.
- `/setup` – admin setup for calendar selection and kids/school schedule.

Features
- Firebase Auth (Google) gate.
- Auto-refresh every 5 minutes for schedule views.
- TV-first UI: large typography, high-contrast palette, keyboard/focus-friendly navigation.

## Running locally
> Package installation may require access to npm registry. Ensure your environment can install dependencies.

```bash
cd functions
npm install
npm run build

cd ../web
npm install
npm run dev
```

To emulate Firebase:
```bash
firebase emulators:start
```

## Deployment
```bash
npm --prefix functions run build
firebase deploy --only functions,hosting,firestore:rules
```

## Notes on OAuth tokens
Store refresh tokens for Dad and Mom in Firestore under `calendarTokens/dad` and `calendarTokens/mom` with fields `{ refreshToken, ownerEmail }`. The `/config` POST endpoint can also set them via `calendarTokens` payload when invoked by an authenticated admin.
