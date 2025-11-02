from flask import Blueprint, jsonify, g, request

from ..services.notification_service import (
    get_user_notifications,
    mark_all_notifications_read,
    mark_notification_read,
)
from ..services.utils import require_auth
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
