from flask import Blueprint, jsonify, g, request

from ..services import admin_service
from ..services.utils import require_auth, require_role
from ..services.exceptions import ValidationError
from .serializers import gig_to_dict, user_to_dict

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/gigs/pending", methods=["GET"])
@require_auth
@require_role("admin")
def pending_gigs():
    gigs = admin_service.get_pending_gigs()
    return jsonify([gig_to_dict(gig) for gig in gigs]), 200


@admin_bp.route("/gigs/<int:gig_id>/approve", methods=["PATCH"])
@require_auth
@require_role("admin")
def approve_gig(gig_id: int):
    gig = admin_service.approve_gig(gig_id, g.current_user.id)
    return jsonify(gig_to_dict(gig)), 200


@admin_bp.route("/gigs/<int:gig_id>/reject", methods=["PATCH"])
@require_auth
@require_role("admin")
def reject_gig(gig_id: int):
    reason = (request.get_json(silent=True) or {}).get("reason", "No reason supplied")
    gig = admin_service.reject_gig(gig_id, g.current_user.id, reason)
    return jsonify(gig_to_dict(gig)), 200


@admin_bp.route("/users", methods=["GET"])
@require_auth
@require_role("admin")
def list_users():
    filters = {
        "role": request.args.get("role"),
        "search": request.args.get("search"),
    }
    pagination = {
        "page": request.args.get("page", 1),
        "per_page": request.args.get("per_page", 20),
    }
    data = admin_service.get_all_users(filters, pagination)
    data["items"] = [user for user in data["items"]]
    return jsonify(data), 200


@admin_bp.route("/users/<int:user_id>/role", methods=["PATCH"])
@require_auth
@require_role("admin")
def change_user_role(user_id: int):
    new_role = (request.get_json(silent=True) or {}).get("role")
    if not new_role:
        raise ValidationError("role is required")
    user = admin_service.update_user_role(user_id, new_role, g.current_user.id)
    return jsonify(user_to_dict(user, include_email=True)), 200


@admin_bp.route("/analytics/overview", methods=["GET"])
@require_auth
@require_role("admin")
def analytics_overview():
    return jsonify(admin_service.get_system_analytics()), 200


@admin_bp.route("/analytics/gigs", methods=["GET"])
@require_auth
@require_role("admin")
def analytics_gigs():
    return jsonify(admin_service.get_gig_analytics()), 200


@admin_bp.route("/analytics/users", methods=["GET"])
@require_auth
@require_role("admin")
def analytics_users():
    return jsonify(admin_service.get_user_analytics()), 200


@admin_bp.route("/ratings/flagged", methods=["GET"])
@require_auth
@require_role("admin")
def flagged_ratings():
    return jsonify(admin_service.get_flagged_ratings()), 200


@admin_bp.route("/ratings/<int:rating_id>/moderate", methods=["PATCH"])
@require_auth
@require_role("admin")
def moderate_rating(rating_id: int):
    payload = request.get_json(silent=True) or {}
    action = payload.get("action")
    note = payload.get("note", "")
    if not action:
        raise ValidationError("action is required")
    result = admin_service.moderate_rating(rating_id, g.current_user.id, action, note)
    return jsonify(result), 200


@admin_bp.route("/audit-logs", methods=["GET"])
@require_auth
@require_role("admin")
def audit_logs():
    filters = {
        "action": request.args.get("action"),
        "resource_type": request.args.get("resource_type"),
        "user_id": request.args.get("user_id"),
        "start_date": request.args.get("start_date"),
        "end_date": request.args.get("end_date"),
    }
    pagination = {
        "page": request.args.get("page", 1),
        "per_page": request.args.get("per_page", 20),
    }
    data = admin_service.get_audit_logs(filters, pagination)
    return jsonify(data), 200
