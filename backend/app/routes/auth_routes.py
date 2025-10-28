from flask import Blueprint, request, jsonify
from ..services.auth_service import verify_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/verify', methods=['POST'])
def verify():
    token = request.json.get('token')
    user = verify_token(token)
    if user:
        return jsonify({"status": "verified", "uid": user['uid']}), 200
    return jsonify({"error": "Invalid token"}), 401