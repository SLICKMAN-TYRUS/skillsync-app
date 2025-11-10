from flask import Blueprint, jsonify, g, request

from ..services.notification_service import (
    get_user_notifications,
    get_user_notification_preferences,
    get_unread_notification_count,
    get_notification_summary,
    get_recent_notifications,
    mark_all_notifications_read,
    mark_notification_read,
    update_notification_preference,
    update_bulk_notification_preferences,
    send_bulk_notification,
    process_email_queue,
    process_push_notification_queue,
)
from ..services.utils import require_auth, require_role
from ..services.exceptions import ValidationError
from .serializers import notification_to_dict

notification_bp = Blueprint("notifications", __name__)


@notification_bp.route("", methods=["GET"])
@require_auth
def list_notifications():
    unread_only = request.args.get("unread_only", "false").lower() == "true"
    notifications = get_user_notifications(g.current_user.id, unread_only=unread_only)
    return jsonify([notification_to_dict(n) for n in notifications]), 200


@notification_bp.route("/<int:notification_id>/read", methods=["PATCH"])
@require_auth
def mark_read(notification_id: int):
    notification = mark_notification_read(notification_id, g.current_user.id)
    return jsonify(notification_to_dict(notification)), 200


@notification_bp.route("/read-all", methods=["PATCH"])
@require_auth
def mark_all_read():
    updated = mark_all_notifications_read(g.current_user.id)
    return jsonify({"updated": updated}), 200


@notification_bp.route("/preferences", methods=["GET"])
@require_auth
def get_notification_preferences():
    preferences = get_user_notification_preferences(g.current_user.id)
    return jsonify([
        {
            "notification_type": pref.notification_type,
            "email_enabled": pref.email_enabled,
            "push_enabled": pref.push_enabled,
            "in_app_enabled": pref.in_app_enabled,
            "updated_at": pref.updated_at.isoformat() if pref.updated_at else None
        }
        for pref in preferences
    ]), 200


@notification_bp.route("/preferences", methods=["PUT"])
@require_auth
def update_notification_preferences():
    payload = request.get_json(silent=True) or {}
    preferences_data = payload.get("preferences", [])
    
    if not preferences_data:
        raise ValidationError("preferences array is required")
    
    updated_preferences = update_bulk_notification_preferences(
        g.current_user.id, preferences_data
    )
    
    return jsonify({
        "message": f"Updated {len(updated_preferences)} notification preferences",
        "updated_count": len(updated_preferences)
    }), 200


@notification_bp.route("/preferences/<notification_type>", methods=["PATCH"])
@require_auth
def update_single_preference(notification_type: str):
    payload = request.get_json(silent=True) or {}
    
    valid_settings = ["email_enabled", "push_enabled", "in_app_enabled"]
    settings = {k: v for k, v in payload.items() if k in valid_settings}
    
    if not settings:
        raise ValidationError("At least one setting (email_enabled, push_enabled, in_app_enabled) is required")
    
    preference = update_notification_preference(
        g.current_user.id, notification_type, **settings
    )
    
    return jsonify({
        "notification_type": preference.notification_type,
        "email_enabled": preference.email_enabled,
        "push_enabled": preference.push_enabled,
        "in_app_enabled": preference.in_app_enabled,
        "updated_at": preference.updated_at.isoformat()
    }), 200


@notification_bp.route("/summary", methods=["GET"])
@require_auth
def get_notification_summary_endpoint():
    summary = get_notification_summary(g.current_user.id)
    return jsonify(summary), 200


@notification_bp.route("/unread-count", methods=["GET"])
@require_auth
def get_unread_count():
    count = get_unread_notification_count(g.current_user.id)
    return jsonify({"unread_count": count}), 200


@notification_bp.route("/recent", methods=["GET"])
@require_auth
def get_recent_notifications_endpoint():
    limit = request.args.get("limit", 10, type=int)
    limit = min(limit, 50)  # Cap at 50
    
    notifications = get_recent_notifications(g.current_user.id, limit)
    return jsonify([notification_to_dict(n) for n in notifications]), 200


# Admin endpoints for bulk notifications
@notification_bp.route("/bulk", methods=["POST"])
@require_auth
@require_role("admin")
def send_bulk_notification_endpoint():
    payload = request.get_json(silent=True) or {}
    
    user_ids = payload.get("user_ids", [])
    notification_type = payload.get("notification_type")
    title = payload.get("title")
    message = payload.get("message")
    email_template = payload.get("email_template")
    
    if not all([user_ids, notification_type, title, message]):
        raise ValidationError("user_ids, notification_type, title, and message are required")
    
    if not isinstance(user_ids, list) or len(user_ids) == 0:
        raise ValidationError("user_ids must be a non-empty array")
    
    results = send_bulk_notification(
        user_ids=user_ids,
        notification_type=notification_type,
        title=title,
        message=message,
        admin_id=g.current_user.id,
        email_template=email_template
    )
    
    return jsonify(results), 200


# Admin endpoints for processing notification queues
@notification_bp.route("/admin/process-email-queue", methods=["POST"])
@require_auth
@require_role("admin")
def process_email_queue_endpoint():
    limit = request.args.get("limit", 50, type=int)
    limit = min(limit, 200)  # Cap at 200
    
    results = process_email_queue(limit)
    return jsonify(results), 200


@notification_bp.route("/admin/process-push-queue", methods=["POST"])
@require_auth
@require_role("admin")
def process_push_queue_endpoint():
    limit = request.args.get("limit", 100, type=int)
    limit = min(limit, 500)  # Cap at 500
    
    results = process_push_notification_queue(limit)
    return jsonify(results), 200
