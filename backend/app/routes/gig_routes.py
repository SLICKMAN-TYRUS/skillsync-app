from flask import Blueprint, jsonify, g, request

from ..models import Application, SavedGig
from ..services import notification_service
from ..services.application_service import get_gig_applications
from ..services.exceptions import AuthorizationError, NotFoundError, ValidationError
from ..services.gig_service import (
    browse_gigs,
    create_gig,
    delete_gig,
    get_gig_by_id,
    get_gigs_expiring_soon,
    get_provider_analytics,
    get_provider_gigs,
    mark_expired_gigs,
    update_gig,
    update_gig_status,
)
from ..services.recommendation_service import (
    get_recommended_gigs_for_student,
    get_similar_gigs,
    get_student_recommendation_stats,
    get_trending_gigs,
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
        "search": request.args.get("search"),
        "category": request.args.get("category"),
        "location": request.args.get("location"),
        "min_budget": request.args.get("min_budget"),
        "max_budget": request.args.get("max_budget"),
        "deadline_filter": request.args.get("deadline_filter"),
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


@gig_bp.route("/analytics", methods=["GET"])
@require_auth
@require_role("provider")
def get_provider_analytics_endpoint():
    analytics = get_provider_analytics(g.current_user.id)
    return jsonify(analytics), 200


@gig_bp.route("/expiring-soon", methods=["GET"])
@require_auth
@require_role("provider")
def get_expiring_gigs_endpoint():
    days_ahead = request.args.get("days", 7, type=int)
    expiring_gigs = get_gigs_expiring_soon(g.current_user.id, days_ahead)
    return jsonify([gig_to_dict(gig, include_provider=False) for gig in expiring_gigs]), 200


@gig_bp.route("/mark-expired", methods=["POST"])
@require_auth
@require_role("admin")
def mark_expired_gigs_endpoint():
    count = mark_expired_gigs()
    return jsonify({"expired_count": count, "message": f"Marked {count} gigs as expired"}), 200


@gig_bp.route("/recommended", methods=["GET"])
@require_auth
@require_role("student")
def get_recommended_gigs_endpoint():
    limit = request.args.get("limit", 10, type=int)
    recommended_gigs = get_recommended_gigs_for_student(g.current_user.id, min(limit, 20))
    return jsonify([gig_to_dict(gig) for gig in recommended_gigs]), 200


@gig_bp.route("/<int:gig_id>/similar", methods=["GET"])
def get_similar_gigs_endpoint(gig_id: int):
    limit = request.args.get("limit", 5, type=int)
    similar_gigs = get_similar_gigs(gig_id, min(limit, 10))
    return jsonify([gig_to_dict(gig) for gig in similar_gigs]), 200


@gig_bp.route("/trending", methods=["GET"])
def get_trending_gigs_endpoint():
    limit = request.args.get("limit", 10, type=int)
    trending_gigs = get_trending_gigs(min(limit, 20))
    return jsonify(trending_gigs), 200


@gig_bp.route("/recommendation-stats", methods=["GET"])
@require_auth
@require_role("student")
def get_recommendation_stats_endpoint():
    stats = get_student_recommendation_stats(g.current_user.id)
    return jsonify(stats), 200


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
