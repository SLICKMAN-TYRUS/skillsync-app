from flask import Blueprint, jsonify, g, request

from ..services import notification_service
from ..models import User
from ..services.application_service import (
    bulk_update_applications,
    create_application,
    get_application_by_id,
    get_student_applications,
    select_candidate,
    update_application_status,
    withdraw_application,
)
from ..services.exceptions import AuthorizationError, ValidationError
from ..services.gig_service import get_gig_by_id
from ..services.utils import require_auth, require_role
from .serializers import application_to_dict

application_bp = Blueprint("applications", __name__)


@application_bp.route("", methods=["POST"])
@require_auth
@require_role("student")
def apply_to_gig():
    payload = request.get_json(silent=True) or {}
    gig_id = payload.get("gig_id")
    notes = payload.get("notes", "")
    if not gig_id:
        raise ValidationError("gig_id is required")

    application = create_application(g.current_user.id, gig_id, notes)
    gig = get_gig_by_id(gig_id)
    notification_service.notify_application_received(
        gig.provider_id, gig_id, application.id
    )
    # Also notify admins about a new application (non-fatal)
    try:
        admins = User.query.filter_by(role='admin').all()
        for admin in admins:
            notification_service.create_notification_with_preferences(
                user_id=admin.id,
                type='application_submitted',
                title='New application submitted',
                message=f"A new application was submitted for '{gig.title}'.",
                related_ids={'gig_id': gig_id, 'application_id': application.id},
            )
    except Exception:
        pass
    return (
        jsonify(application_to_dict(application, include_gig=True)),
        201,
    )


@application_bp.route("/my-applications", methods=["GET"])
@require_auth
@require_role("student")
def my_applications():
    status_filter = request.args.get("status")
    applications = get_student_applications(g.current_user.id)
    if status_filter:
        applications = [
            app for app in applications if app.status == status_filter
        ]
    return (
        jsonify(
            [
                application_to_dict(app, include_gig=True)
                for app in applications
            ]
        ),
        200,
    )


@application_bp.route("/<int:application_id>/select", methods=["PATCH"])
@require_auth
@require_role("provider")
def select_application(application_id: int):
    application = select_candidate(application_id, g.current_user.id)
    notification_service.notify_application_status_change(
        application.student_id,
        application.gig_id,
        application.id,
        application.status,
    )
    return jsonify(application_to_dict(application, include_student=True)), 200


@application_bp.route("/<int:application_id>/reject", methods=["PATCH"])
@require_auth
@require_role("provider")
def reject_application(application_id: int):
    application = get_application_by_id(application_id)
    if application.gig.provider_id != g.current_user.id:
        raise AuthorizationError("You can only modify applications for your gigs")
    updated = update_application_status(application_id, "rejected")
    notification_service.notify_application_status_change(
        updated.student_id,
        updated.gig_id,
        updated.id,
        updated.status,
    )
    return jsonify(application_to_dict(updated, include_student=True)), 200


@application_bp.route("/<int:application_id>/withdraw", methods=["PATCH"])
@require_auth
@require_role("student")
def withdraw_application_endpoint(application_id: int):
    withdraw_application(application_id, g.current_user.id)
    application = get_application_by_id(application_id)
    notification_service.notify_application_status_change(
        application.gig.provider_id,
        application.gig_id,
        application.id,
        "withdrawn",
    )
    return jsonify({"message": "Application withdrawn successfully"}), 200


@application_bp.route("/bulk-update", methods=["PATCH"])
@require_auth
@require_role("provider")
def bulk_update_applications_endpoint():
    payload = request.get_json(silent=True) or {}
    gig_id = payload.get("gig_id")
    updates = payload.get("updates", [])
    
    if not gig_id:
        raise ValidationError("gig_id is required")
    
    if not updates:
        raise ValidationError("updates list is required")
    
    updated_applications = bulk_update_applications(gig_id, g.current_user.id, updates)
    
    # Send notifications for status changes
    for app in updated_applications:
        notification_service.notify_application_status_change(
            app.student_id,
            app.gig_id,
            app.id,
            app.status,
        )
    
    return jsonify({
        "message": f"Updated {len(updated_applications)} applications",
        "updated_applications": [
            application_to_dict(app, include_student=True) 
            for app in updated_applications
        ]
    }), 200
