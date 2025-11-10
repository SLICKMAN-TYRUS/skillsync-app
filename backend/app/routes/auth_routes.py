from flask import Blueprint, jsonify, g, request

from ..services.auth_service import verify_token
from ..services.exceptions import ValidationError, AuthorizationError
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


@auth_bp.route("/set-role", methods=["POST"])
@require_auth
def set_role():
    from ..services.utils import require_role
    
    # Only admins can change roles
    if not g.current_user.is_role("admin"):
        raise AuthorizationError("Only admins can change user roles")
    
    payload = request.get_json(silent=True) or {}
    user_uid = payload.get("user_uid")
    new_role = payload.get("role")
    
    if not user_uid or not new_role:
        raise ValidationError("user_uid and role are required")
    
    if new_role not in {"student", "provider", "admin"}:
        raise ValidationError("Role must be student, provider, or admin")
    
    from ..services.user_service import update_user_role
    updated_user = update_user_role(user_uid, new_role, g.current_user.id)
    
    return jsonify({
        "message": f"User role updated to {new_role}",
        "user": user_to_dict(updated_user, include_email=True)
    }), 200


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
