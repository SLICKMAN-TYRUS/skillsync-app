# Firebase integration for SkillSync

This document explains how the project integrates with Firebase (Auth, FCM, Firestore) and recommendations for safe adoption.

## Summary
- The backend uses the Firebase Admin SDK to verify ID tokens and send push notifications (FCM).
- The frontend uses the Firebase JS SDK for client-side auth and Firestore access (placeholder config in `frontend/services/firebaseConfig.js`).
- Service account credentials (private key) are required for the Admin SDK and must not be committed.

## Backend setup (Python / Flask)

1. Add dependency (already present):

   ```text
   firebase-admin
   ```

   It's present in `backend/requirements.txt`.

2. Provide credentials:

   - Generate a service account JSON from the Firebase Console (Project Settings → Service accounts → Generate new private key).
   - Place it on the server (outside the repo) and set environment variable `FIREBASE_SERVICE_ACCOUNT` to the file path.
   - For local development you can use `firebase_credentials.json` (ignored by `.gitignore`) and set `FIREBASE_CREDENTIALS_PATH` or `FIREBASE_SERVICE_ACCOUNT`.

3. Initialization

   - The app initializes the Admin SDK at startup via `backend/app/firebase.py`'s `init_firebase_app()` function. It falls back to Application Default Credentials (ADC) if a key file is not found (useful when running on GCP).

4. Token verification

   - Use the helper `verify_token()` from `backend/app/services/auth_service.py` (supports test tokens and real Firebase tokens).
   - A decorator `@token_required()` is available in `backend/app/decorators.py` that validates the token, ensures a local `User` exists, and sets `flask.g.current_user`.

5. Sending push notifications

   - Use `send_push_notification(token, title, body, data)` in `backend/app/firebase.py` to send FCM messages.

## Frontend setup (React Native / Expo)

1. Client config

   - Copy Firebase client config from the Firebase Console → Project Settings → Your apps (web app config) into `frontend/services/firebaseConfig.js`.
   - This config is not secret and can be committed.

2. SDK

   - `npm install firebase` was added to the frontend to provide the Firebase JS SDK.
   - For Expo-managed projects, the JS SDK works for Auth and Firestore. For full native FCM features, use `react-native-firebase` in a bare RN app or configure Expo push notifications with FCM credentials.

## Development & testing

- The project supports `test:` tokens for local tests (format `test:<uid>:<role>`). Tests use these tokens and the `verify_token` function handles them.
- Use the Firebase Emulator Suite for local testing of Auth, Firestore, and Functions to avoid hitting production.

## Security

- Never commit service account JSON. Use `.gitignore` (already ignores `firebase_credentials.json`).
- Use secret storage for CI and production (GitHub Actions secrets, GCP Secret Manager, etc.).
- Configure Firestore and Storage security rules to enforce role checks and ownership.

## Migration considerations

- If you keep Postgres as the system of record, use Firebase for Auth and FCM only. This is the recommended incremental approach.
- Full migration to Firestore requires rethinking data models (no joins) and writing migration/ETL scripts.

## Next steps (recommended)
1. Decide whether to provision local users automatically when a Firebase account signs in (`auto_create_user=True` in the decorator) or require manual provisioning.
2. Add tests that use the Firebase Emulator Suite in CI for integration tests.
3. Harden error handling: wrap Firebase exceptions into project `ServiceError` for consistent API responses.
4. Document the developer workflow for registering FCM tokens from clients.

