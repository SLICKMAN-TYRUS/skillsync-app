#!/usr/bin/env python3
"""
Create Firebase Auth users that match the seeded database UIDs and set role custom claims.

Usage:
  export FIREBASE_SERVICE_ACCOUNT=/full/path/to/backend/firebase_credentials.json
  # optional: activate your venv
  python backend/scripts/create_firebase_users.py

This will create or update deterministic users and set a simple password.
"""

import os
import sys
import json
from typing import List, Dict

try:
    import firebase_admin
    from firebase_admin import credentials, auth
except Exception as e:
    print("Missing dependency: firebase-admin. Install with: pip install firebase-admin")
    raise


DEFAULT_PASSWORD = os.environ.get('SEED_USER_PASSWORD', 'P@ssw0rd!')

SERVICE_ACCOUNT = os.environ.get('FIREBASE_SERVICE_ACCOUNT', os.path.join(os.getcwd(), 'backend', 'firebase_credentials.json'))


USERS: List[Dict] = [
    {"uid": "firebase-uid-student1", "email": "jane.student@example.com", "display_name": "Jane Student", "role": "student"},
    {"uid": "firebase-uid-provider1", "email": "paul.provider@example.com", "display_name": "Paul Provider", "role": "provider"},
    {"uid": "firebase-uid-admin1", "email": "ava.admin@example.com", "display_name": "Ava Admin", "role": "admin"},
    {"uid": "firebase-uid-student2", "email": "alex.chen@example.com", "display_name": "Alex Chen", "role": "student"},
    {"uid": "firebase-uid-student3", "email": "maria.silva@example.com", "display_name": "Maria Silva", "role": "student"},
    {"uid": "firebase-uid-student4", "email": "david.okonkwo@example.com", "display_name": "David Okonkwo", "role": "student"},
    {"uid": "firebase-uid-provider2", "email": "sarah.tech@example.com", "display_name": "Sarah Tech", "role": "provider"},
    {"uid": "firebase-uid-provider3", "email": "john.events@example.com", "display_name": "John Events", "role": "provider"},
    {"uid": "firebase-uid-student5", "email": "emma.watson@example.com", "display_name": "Emma Watson", "role": "student"},
    {"uid": "firebase-uid-student6", "email": "michael.brown@example.com", "display_name": "Michael Brown", "role": "student"},
]


def init_firebase(sa_path: str):
    if not os.path.exists(sa_path):
        print(f"Service account file not found: {sa_path}")
        sys.exit(1)

    cred = credentials.Certificate(sa_path)
    try:
        firebase_admin.initialize_app(cred)
    except ValueError:
        # already initialized
        pass


def create_or_update_user(u: Dict):
    uid = u['uid']
    email = u['email']
    display_name = u.get('display_name')
    role = u.get('role', 'student')

    try:
        existing = auth.get_user(uid)
        print(f"User exists: {uid} (updating email/display name and resetting password)")
        # Ensure the seeded password is set for existing test users so local sign-in works reliably
        auth.update_user(uid, email=email, display_name=display_name, password=DEFAULT_PASSWORD)
    except auth.UserNotFoundError:
        try:
            user = auth.create_user(uid=uid, email=email, display_name=display_name, password=DEFAULT_PASSWORD)
            print(f"Created user: {user.uid} (password: {DEFAULT_PASSWORD})")
        except Exception as e:
            print(f"Failed creating user {uid}: {e}")
            return
    except Exception as e:
        print(f"Error fetching user {uid}: {e}")
        return

    # set custom claims (role)
    try:
        auth.set_custom_user_claims(uid, {"role": role})
        print(f"Set custom claims role={role} for {uid}")
    except Exception as e:
        print(f"Failed to set custom claims for {uid}: {e}")


def main():
    print("Using service account:", SERVICE_ACCOUNT)
    init_firebase(SERVICE_ACCOUNT)

    print("Creating/updating users...")
    for u in USERS:
        create_or_update_user(u)

    print("Done. Verify users in Firebase Console -> Authentication.")
    print("Remember the seeded password is:", DEFAULT_PASSWORD)


if __name__ == '__main__':
    main()
