name: firebase-web-sdk-setup
overview: Set up a clean, environment-variable–driven Firebase Web SDK integration for your Next.js 15 frontend using your single Firebase project (formulator-488620).
todos:
  - id: create-firebase-lib
    content: Create a centralized Firebase Web SDK module at frontend/src/lib/firebase.ts that reads from NEXT_PUBLIC_FIREBASE_* env vars and exports initialized services.
    status: pending
  - id: define-env-vars
    content: Populate .env.local with all required NEXT_PUBLIC_FIREBASE_* variables for project formulator-488620.
    status: pending
  - id: wire-frontend-usage
    content: Update Next.js client components to import Firebase services from src/lib/firebase.ts instead of initializing Firebase inline.
    status: pending
  - id: confirm-backend-admin
    content: Ensure Firebase Functions use the Admin SDK separately and do not rely on NEXT_PUBLIC_* env vars.
    status: pending
isProject: false
---

## Firebase Web SDK & Env Setup Plan

### 1. Clarify what runs where

- **Frontend (`Next.js 15` on Firebase App Hosting)**: Uses **Firebase Web SDK** only (no admin privileges) for Auth, Firestore (client access patterns), Storage, and optionally Analytics.
- **Backend (`Firebase Functions` TypeScript)**: Uses **Firebase Admin SDK** for privileged operations; this is separate from the Web SDK and does not use the `NEXT_PUBLIC_...` env vars.
- **Single project constraint**: All SDKs (web + admin) point to the same Firebase project `formulator-488620` and its default Firestore DB and Storage bucket.

### 2. Create a centralized Firebase Web SDK module

- **File**: `[frontend/src/lib/firebase.ts](frontend/src/lib/firebase.ts)`
- **Responsibility**:
  - Read config from `NEXT_PUBLIC_FIREBASE_*` env vars.
  - Initialize the Firebase app exactly once (guard with `getApps()` / `getApp()` or a simple singleton pattern).
  - Export typed helpers: `firebaseApp`, `firebaseAuth`, `firebaseFirestore`, `firebaseStorage`, and optionally `firebaseAnalytics`.
  - Make Analytics initialization **browser-only** and conditional on `measurementId` being present (to avoid SSR errors in Next.js).

### 3. Define required environment variables

- **Frontend runtime env (exposed to browser)** – to be placed in `.env.local` and wired into Firebase config:
  - `NEXT_PUBLIC_FIREBASE_API_KEY` → `apiKey`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` → `authDomain`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` → `projectId` (`formulator-488620`)
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` → `storageBucket`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` → `messagingSenderId`
  - `NEXT_PUBLIC_FIREBASE_APP_ID` → `appId`
  - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional but recommended if you want Analytics) → `measurementId`
- **What else you might need later (but not mandatory to start)**:
  - If you add **Cloud Messaging** in the browser: no extra env vars beyond those above; you
  d configure it in code.
  - If you use **emulators locally**: `FIREBASE_EMULATOR_HOST`, `FIRESTORE_EMULATOR_HOST`, etc. (non-`NEXT_PUBLIC_`), consumed only during dev.

### 4. Wire Firebase into your Next.js app

- **For client components or hooks**:
  - Import the shared instance from `src/lib/firebase.ts` instead of re-initializing:
    - e.g. `import { firebaseAuth } from "@/lib/firebase";`
  - Use it in React hooks/components for login, Firestore reads/writes, and Storage uploads.
- **Avoid in server components/SSR**:
  - Do not call Web SDK (like `getAnalytics`, `getAuth`) in server components or `getServerSideProps`; keep Web SDK usage strictly in browser/client components.

### 5. Keep admin access in Functions only

- **Firebase Functions (backend)**:
  - Use the **Admin SDK** with application default credentials (or `initializeApp()` with service account) pointing to `formulator-488620`.
  - Do not reuse the `NEXT_PUBLIC_FIREBASE_*` config here; instead, rely on function environment and Firebase defaults.
  - Expose secure HTTP callable or REST endpoints that the frontend can call when privileged operations are required (e.g., vector indexing, bulk writes).

### 6. Local development and safety checks

- **Local `.env.local`**:
  - Populate all `NEXT_PUBLIC_FIREBASE_*` values using the config from your Firebase console for `formulator-488620`.
  - Never commit `.env.local` to git (ensure it’s in `.gitignore`).
- **Sanity checks before first use**:
  - Verify the Firebase app initializes without errors in the browser console.
  - Confirm Firestore reads/writes work using the Web SDK with your logged-in user.
  - Optionally confirm Analytics events appear in the Firebase console if `measurementId` is configured.

