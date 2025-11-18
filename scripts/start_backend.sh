#!/bin/bash
# Helper to start the backend with optional Firebase service account file located at backend/firebase_credentials.json
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/backend"

if [ -f "firebase_credentials.json" ]; then
  export FIREBASE_SERVICE_ACCOUNT="$ROOT_DIR/backend/firebase_credentials.json"
  echo "Using FIREBASE_SERVICE_ACCOUNT=$FIREBASE_SERVICE_ACCOUNT"
else
  echo "No backend/firebase_credentials.json found. Ensure FIREBASE_SERVICE_ACCOUNT is set if you need Firebase Admin SDK."
fi

echo "Starting Flask backend (run.py)"
python run.py
