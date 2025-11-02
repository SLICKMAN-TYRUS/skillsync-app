from flask import Blueprint, jsonify, g, request

from ..models import Application, SavedGig
from ..services import notification_service
from ..services.exceptions import AuthorizationError, NotFoundError, ValidationError
from ..services.gig_service import (
    browse_gigs,
    create_gig,
    delete_gig,
    get_gig_by_id,
    get_provider_gigs,
    update_gig,
    update_gig_status,
)
from ..services.utils import require_auth, require_role
from .serializers import application_to_dict, gig_to_dict

gig_bp = Blueprint("gigs", __name__)


def _collect_impacted_students(gig_id: int):
    applicant_ids = {
        student_id
        for (student_id,) in Application.query.with_entities(Application.student_id)
        .filter(Application.gig_id == gig_id)
        .all()
    }
    saved_ids = {
        user_id
        for (user_id,) in SavedGig.query.with_entities(SavedGig.user_id)
        .filter(SavedGig.gig_id == gig_id)
        .all()
    }
    return list(applicant_ids.union(saved_ids))


def _validate_gig_payload(payload, require_all: bool = True):
    required_fields = {"title", "description"}
    if require_all:
        missing = required_fields - payload.keys()
        if missing:
            raise ValidationError(
                f"Missing required fields: {', '.join(sorted(missing))}"
            )

    budget = payload.get("budget")
    if budget is not None:
        try:
            float(budget)
        except (ValueError, TypeError):
            raise ValidationError("Budget must be numeric")
    if payload.get("title") and len(payload["title"]) > 255:
        raise ValidationError("Title must be 255 characters or fewer")
    if payload.get("category") and len(payload["category"]) > 100:
        raise ValidationError("Category must be 100 characters or fewer")


@gig_bp.route("", methods=["GET"])
def list_gigs():
    filters = {
        "category": request.args.get("category"),
        "location": request.args.get("location"),
        "status": request.args.get("status"),
        "approval_status": request.args.get("approval_status"),
        "sort": request.args.get("sort_by"),
    }
    pagination = {
        "page": request.args.get("page", 1),
        "per_page": request.args.get("per_page", 20),
    }
    data = browse_gigs(filters, pagination)
    return (
        jsonify(
            {
                "items": [gig_to_dict(item) for item in data["items"]],
                "page": data["page"],
                "per_page": data["per_page"],
                "total": data["total"],
                "pages": data["pages"],
            }
        ),
        200,
    )


@gig_bp.route("/<int:gig_id>", methods=["GET"])
def retrieve_gig(gig_id: int):
    gig = get_gig_by_id(gig_id)
    if gig.approval_status != "approved":
        raise NotFoundError("Gig not available or pending approval")
    return jsonify(gig_to_dict(gig)), 200


@gig_bp.route("", methods=["POST"])
@require_auth
@require_role("provider")
def create_gig_endpoint():
    payload = request.get_json(silent=True) or {}
    _validate_gig_payload(payload)
    gig = create_gig(g.current_user.id, payload)
    return jsonify(gig_to_dict(gig)), 201


@gig_bp.route("/my-gigs", methods=["GET"])
@require_auth
@require_role("provider")
def list_provider_gigs():
    gigs = get_provider_gigs(g.current_user.id)
    return jsonify([gig_to_dict(gig, include_provider=False) for gig in gigs]), 200


@gig_bp.route("/<int:gig_id>/applications", methods=["GET"])
@require_auth
@require_role("provider")
def list_gig_applications(gig_id: int):
    gig = get_gig_by_id(gig_id)
    if gig.provider_id != g.current_user.id:
        raise AuthorizationError("You can only view applications for your gigs")
    applications = get_gig_applications(gig_id)
    return (
        jsonify([application_to_dict(app, include_student=True) for app in applications]),
        200,
    )


@gig_bp.route("/<int:gig_id>", methods=["PUT"])
@require_auth
@require_role("provider")
def update_gig_endpoint(gig_id: int):
    gig = get_gig_by_id(gig_id)
    if gig.provider_id != g.current_user.id:
        raise AuthorizationError("You can only edit your own gigs")
    payload = request.get_json(silent=True) or {}
    if not payload:
        raise ValidationError("No fields provided for update")
    _validate_gig_payload(payload, require_all=False)
    updated = update_gig(gig_id, payload)
    impacted = _collect_impacted_students(gig_id)
    if impacted:
        notification_service.notify_gig_update(impacted, gig_id, "details_updated")
    return jsonify(gig_to_dict(updated)), 200


@gig_bp.route("/<int:gig_id>/status", methods=["PATCH"])
@require_auth
@require_role("provider")
def update_status(gig_id: int):
    gig = get_gig_by_id(gig_id)
    if gig.provider_id != g.current_user.id:
        raise AuthorizationError("You can only modify your own gigs")
    payload = request.get_json(silent=True) or {}
    new_status = payload.get("status")
    if not new_status:
        raise ValidationError("Status is required")
    updated = update_gig_status(gig_id, new_status)
    impacted = _collect_impacted_students(gig_id)
    if impacted:
        notification_service.notify_gig_update(
            impacted, gig_id, f"status_changed_{new_status}"
        )
    return jsonify(gig_to_dict(updated)), 200


@gig_bp.route("/<int:gig_id>", methods=["DELETE"])
@require_auth
@require_role("provider")
def delete_gig_endpoint(gig_id: int):
    gig = get_gig_by_id(gig_id)
    if gig.provider_id != g.current_user.id:
        raise AuthorizationError("You can only delete your own gigs")
    has_selected = (
        Application.query.filter(
            Application.gig_id == gig_id,
            Application.status.in_(("accepted", "completed")),
        ).count()
        > 0
    )
    if has_selected:
        raise ValidationError("Cannot delete gig with accepted or completed applications")
    delete_gig(gig_id)
    return "", 204
