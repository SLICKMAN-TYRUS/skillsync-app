from flask import Blueprint, jsonify, g, request

from ..services.auth_service import verify_token
from ..services.exceptions import ValidationError
from ..services.user_service import create_user, get_user_by_uid
from ..services.utils import require_auth
from .serializers import user_to_dict

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/verify", methods=["POST"])
def verify():
    payload = request.get_json(silent=True) or {}
    token = payload.get("token")
    user = verify_token(token)
    if user:
        return jsonify({"status": "verified", "uid": user["uid"]}), 200
    return jsonify({"error": "Invalid token"}), 401


@auth_bp.route("/register", methods=["POST"])
def register():
    payload = request.get_json(silent=True) or {}
    id_token = payload.get("id_token")
    name = payload.get("name")
    email = payload.get("email")
    role = payload.get("role")

    decoded = verify_token(id_token)
    if not decoded:
        return jsonify({"error": "Invalid or missing Firebase token"}), 401

    uid = decoded.get("uid")
    if not uid:
        raise ValidationError("Firebase token missing uid claim")

    if get_user_by_uid(uid):
        return jsonify(
            {
                "message": "User already registered",
                "user": user_to_dict(get_user_by_uid(uid), include_email=True),
            }
        ), 200

    if not all([name, email, role]):
        raise ValidationError("name, email, and role are required")
    if role not in {"student", "provider", "admin"}:
        raise ValidationError("Role must be student, provider, or admin")

    user = create_user(uid=uid, name=name, email=email, role=role)
    return (
        jsonify(
            {
                "message": "Registration successful",
                "user": user_to_dict(user, include_email=True),
            }
        ),
        201,
    )


@auth_bp.route("/me", methods=["GET"])
@require_auth
def me():
    user = g.current_user
    stats = {
        "provided_gigs": user.provided_gigs.count()
        if user.is_role("provider")
        else 0,
        "applications": user.applications.count()
        if user.is_role("student")
        else 0,
        "notifications_unread": user.notifications.filter_by(read=False).count(),
        "average_rating": float(user.average_rating or 0.0),
    }
    profile = user_to_dict(user, include_email=True)
    profile["stats"] = stats
    return jsonify(profile), 200
