Frontend development notes

Dev test-token authentication
-----------------------------

For fast local development you can enable a simple test-token auth mode that the
backend accepts. This avoids needing to exchange real Firebase ID tokens while
you build UI and exercise protected endpoints.

Enable test tokens (web):

1. Open the browser console for the running Expo web app.
2. Run the following commands to set a test UID and role:

```javascript
localStorage.setItem('use_test_tokens', 'true');
localStorage.setItem('dev_test_uid', 'firebase-uid-admin1');
localStorage.setItem('dev_test_role', 'admin');
```

3. Refresh the app. The frontend will add an `Authorization: Bearer test:<uid>:<role>`
   header to outgoing requests when `use_test_tokens` is `true`.

Disable test tokens (web):

```javascript
localStorage.setItem('use_test_tokens', 'false');
localStorage.removeItem('dev_test_uid');
localStorage.removeItem('dev_test_role');
```

Notes:
- This mode is for development only. Do not enable `use_test_tokens` in production.
- The backend already supports these `test:` tokens and will auto-create seeded users.

Using the real Firebase project for end-to-end auth
-----------------------------------------------

To verify real Firebase ID tokens end-to-end, the frontend must use a web app
configuration that belongs to the same Firebase project as the backend's
service-account JSON (the backend expects tokens issued for that project).

Steps to create a matching web app in Firebase Console and configure the frontend:

1. Open Firebase Console and select the project that corresponds to the backend service account
   (the backend service account `project_id` is visible in `backend/firebase_credentials.json`).
2. In the project, Add App → Web App and register a new web app (give it a nickname).
3. Firebase will display the web app config object (apiKey, authDomain, projectId, etc.).
4. Do NOT paste the JSON into source code in plaintext for shared repos. Instead set env vars locally.

Set the following environment variables before starting the frontend (example):

```bash
export FIREBASE_API_KEY="<apiKey>"
export FIREBASE_AUTH_DOMAIN="<authDomain>"
export FIREBASE_PROJECT_ID="<projectId>"
export FIREBASE_STORAGE_BUCKET="<storageBucket>"
export FIREBASE_MESSAGING_SENDER_ID="<messagingSenderId>"
export FIREBASE_APP_ID="<appId>"
export FIREBASE_MEASUREMENT_ID="<measurementId>"
```

You can use either the `FIREBASE_` prefixed env vars or `REACT_APP_` equivalents (e.g. `REACT_APP_FIREBASE_API_KEY`).

After setting env vars restart the frontend dev server (Expo) so the values are picked up.

Verification
1. Start the backend (ensure `FIREBASE_SERVICE_ACCOUNT` points to `backend/firebase_credentials.json`).
2. Start the frontend with the env vars set and sign in through the web UI.
3. The frontend will call backend endpoints with a real Firebase ID token; the backend should accept
   and verify the token if both sides use the same Firebase project.
(Frontend development notes)

(Dev test-token authentication)
(-----------------------------)

(For fast local development you can enable a simple test-token auth mode that the)
(backend accepts. This avoids needing to exchange real Firebase ID tokens while)
(you build UI and exercise protected endpoints.)

(Enable test tokens (web):)

(1. Open the browser console for the running Expo web app.)
(2. Run the following commands to set a test UID and role:)

(```)
localStorage.setItem('use_test_tokens', 'true');
localStorage.setItem('dev_test_uid', 'firebase-uid-admin1');
localStorage.setItem('dev_test_role', 'admin');
(```)

(3. Refresh the app. The frontend will add an `Authorization: Bearer test:<uid>:<role>`)
(   header to outgoing requests when `use_test_tokens` is `true`.)

(Disable test tokens (web):)

(```)
localStorage.setItem('use_test_tokens', 'false');
localStorage.removeItem('dev_test_uid');
localStorage.removeItem('dev_test_role');
(```)

(Notes:)
(- This mode is for development only. Do not enable `use_test_tokens` in production.)
(- The backend already supports these `test:` tokens and will auto-create seeded users.)
