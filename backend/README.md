SkillSync backend — Firebase service account setup
===============================================

This project optionally uses the Firebase Admin SDK for server-side operations (verifying ID tokens, sending FCM messages, reading protected Firestore data). For local development or demos you can provide a Firebase service account JSON key.

Important security notes
- Do NOT commit the JSON key into source control. The repository `.gitignore` already contains an entry to ignore `backend/firebase_credentials.json`.
- Revoke the key in the Firebase console after your demo if it was created temporarily.

Options to provide credentials

1) Place the key file at `backend/firebase_credentials.json`
	- Recommended for quick local testing.
	- Then export the environment variable so the app picks it up:

	  ```bash
	  export FIREBASE_SERVICE_ACCOUNT=$(pwd)/backend/firebase_credentials.json
	  # start the backend
	  python run.py
	  ```

2) Or store the key anywhere on your machine and set the env var `FIREBASE_SERVICE_ACCOUNT` to the absolute path to the JSON file.

How the app reads credentials
- The backend code will look for `FIREBASE_SERVICE_ACCOUNT` (or `FIREBASE_CREDENTIALS`) environment variable and attempt to initialize the Firebase Admin SDK from that file. If not present, it will attempt to use Application Default Credentials (useful when running on GCP).

Quick checklist for giving access to a collaborator
1. Preferred — add their Google account to the Firebase project with the appropriate role (Firebase Admin or GCP Editor):
	- Console → Firebase project “skillsync-app-e7ae7” → Settings (gear) → Users and permissions → Add member → enter email → role: “Firebase Admin” or GCP “Editor” → Save.

2. If you can’t add them as a user — generate a service account key and share securely:
	- Console → Project settings → Service accounts → Generate new private key (JSON).
	- Share securely (Google Drive shared to the collaborator's email with limited access/expiry, or a password-protected zip and provide the password via a separate channel).
	- Place the JSON at `backend/firebase_credentials.json` locally on the machine that runs the backend and set `FIREBASE_SERVICE_ACCOUNT` (see above).

Example message you can send to a colleague (edit as needed):

"Hi @Pacifique Uwenayo — URGENT: I need backend access for tomorrow’s midday demo.

Two quick options (pick one):

Preferred — add my Google account
Email: a.chol@alustdent.com
Console → Firebase project “skillsync-app-e7ae7” → Settings (gear) → Users and permissions → Add member → enter my email → role: “Firebase Admin” or GCP “Editor” → Save.

If you can’t add me — generate a service-account key and share securely
Console → Project settings → Service accounts → Generate new private key (JSON).
Share securely (Google Drive shared to a.chol@alustdent.com with limited access/expiry, or send a password‑protected zip and give the password over a separate channel).

I’ll place it at backend/firebase_credentials.json, add it to .gitignore, restart the backend, verify, and delete the key from my machine after the demo.

Why this is needed:
The backend must verify Firebase ID tokens and perform server-side actions (FCM, admin Firestore reads) for a full end-to-end demo — the frontend config alone isn’t sufficient.

Security note: Don’t commit the JSON to git. If you generate a key, please revoke it after the demo (I can do that or show you how)."

If you want, I can add a small helper script to start the backend with the environment variable set and (optionally) add a safe placeholder file path. I will not write any credential content into the repository.
