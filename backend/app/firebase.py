import os
import logging

import firebase_admin
from firebase_admin import auth as fb_auth, credentials, messaging

logger = logging.getLogger(__name__)


def init_firebase_app(app=None) -> bool:
    """Initialize Firebase Admin SDK.

    Looks for FIREBASE_SERVICE_ACCOUNT or FIREBASE_CREDENTIALS env var pointing to a JSON key file.
    Falls back to Application Default Credentials when not found (useful on GCP).

    Returns True when initialization appears successful, False otherwise.
    """
    try:
        cred_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT") or os.environ.get("FIREBASE_CREDENTIALS")

        if cred_path:
            if os.path.isfile(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info("Initialized Firebase Admin SDK from service account file: %s", cred_path)
                return True
            else:
                logger.warning("FIREBASE_SERVICE_ACCOUNT set but file not found: %s", cred_path)

        # Try application default credentials (useful on GCP). If these are not available this will raise.
        try:
            firebase_admin.initialize_app()
            logger.info("Initialized Firebase Admin SDK with application default credentials")
            return True
        except Exception:
            logger.info("No Firebase service account file provided and application default credentials not available")
            return False

    except Exception as e:
        # If initialization fails, log and continue — callers should handle missing Firebase gracefully.
        logger.exception("Failed to initialize Firebase Admin SDK: %s", e)
        return False


def verify_id_token(id_token: str):
    """Verify Firebase ID token and return decoded token dict.

    Raises exceptions from firebase_admin.auth if invalid.
    """
    if not id_token:
        raise ValueError("No ID token provided")
    return fb_auth.verify_id_token(id_token)


def send_push_notification(token: str, title: str, body: str, data: dict = None):
    """Send a push notification via FCM to a single device token.

    Returns the messaging API response string.
    """
    if not token:
        raise ValueError("No device token provided")
    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        token=token,
        data=data or {}
    )
    return messaging.send(message)
