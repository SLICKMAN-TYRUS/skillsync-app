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
    
    # Local development helper: accept tokens formatted as "test:<uid>" or "test:<uid>:<role>"
    # Check test tokens first to support local development even when Firebase is configured
    if id_token.startswith("test:"):
        parts = id_token.split(":")
        if len(parts) >= 2:
            uid = parts[1]
            role = parts[2] if len(parts) >= 3 else "student"  # Default to student
            return {
                "uid": uid, 
                "email": f"{uid}@example.com",
                "name": f"Test User {uid}",
                "role": role
            }
    
    if firebase_available:
        try:
            decoded = auth.verify_id_token(id_token)
            # Extract role from custom claims if available
            custom_claims = decoded.get("custom_claims", {})
            if "role" in custom_claims:
                decoded["role"] = custom_claims["role"]
            return decoded
        except Exception:
            return None
    
    return None
