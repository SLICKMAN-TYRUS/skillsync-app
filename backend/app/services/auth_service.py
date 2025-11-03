import os
from typing import Optional

import firebase_admin
from firebase_admin import auth, credentials

firebase_available = False

cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-service-account.json")
if os.path.exists(cred_path):
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(credentials.Certificate(cred_path))
    firebase_available = True


def verify_token(id_token: Optional[str]):
    if not id_token:
        return None
    if firebase_available:
        try:
            return auth.verify_id_token(id_token)
        except Exception:
            return None
    # Local development helper: accept tokens formatted as "test:<uid>"
    if id_token.startswith("test:"):
        _, uid = id_token.split(":", 1)
        return {"uid": uid, "email": f"{uid}@example.com"}
    return None
