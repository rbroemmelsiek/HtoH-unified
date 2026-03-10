# App Hosting deploy: "Unable to parse JSON / XML" error

## What’s going on

The error **"Unable to parse JSON: SyntaxError: Unexpected token '<', \"<?xml vers\"..."** does **not** come from a file in your repo. It happens when:

1. The Firebase CLI uploads the frontend zip to Google’s App Hosting API.
2. The server responds with an **XML error document** (e.g. 403 Forbidden, 413 Payload Too Large, 502 Bad Gateway).
3. The CLI expects JSON and tries to parse that XML as JSON, which fails.

So the “bad file” is the **API response**, not your source code.

## What we fixed in the project

- **`firebase.json` → `apphosting.ignore`**  
  We added **`.next`** and **out** so the Next.js build cache and output are not included in the zip. That keeps the upload smaller and avoids many server-side errors.

If you still see the error after pulling this change, use the steps below to see the real error.

## How to see the real error

Run the deploy with **debug** and (optionally) save the log:

```powershell
firebase deploy --only apphosting --project htoh-3-0 --debug
```

Or to save the log:

```powershell
firebase deploy --only apphosting --project htoh-3-0 --debug 2>&1 | Tee-Object -FilePath firebase-deploy-debug.log
```

In the output, look for:

- **HTTP status** (e.g. 403, 413, 502).
- **Response body** – often an XML or HTML error page that explains the failure (permission, quota, size, etc.).

## Other checks

- **Auth:** `firebase login` and, if needed, `gcloud auth application-default login`.
- **Backend:** In [Firebase Console → App Hosting](https://console.firebase.google.com/project/htoh-3-0/apphosting), confirm the backend **htoh-frontend** exists and is set up.
- **CLI:** `npm install -g firebase-tools` (or use the latest supported version) so you get current error handling and fixes.
