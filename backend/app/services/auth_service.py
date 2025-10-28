import firebase_admin
from firebase_admin import auth, credentials
import os

cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-service-account.json')
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

def verify_token(id_token):
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception:
        return None