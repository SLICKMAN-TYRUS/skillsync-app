from flask import Blueprint, jsonify, g, request

from ..models import SavedGig
from ..services.exceptions import ValidationError
from ..services.saved_gigs_service import (
    get_saved_gigs,
    save_gig,
    unsave_gig,
)
from ..services.user_service import (
    get_user_by_id,
    get_user_gig_history,
    update_user_profile,
)
from ..services.utils import require_auth, require_role
from .serializers import saved_gig_to_dict, user_to_dict

user_bp = Blueprint("users", __name__)


@user_bp.route("/<int:user_id>", methods=["GET"])
@require_auth
def get_user_profile(user_id: int):
    user = get_user_by_id(user_id)
    include_email = user.id == g.current_user.id
    profile = user_to_dict(user, include_email=include_email)
    profile["ratings_count"] = user.ratings_received.count()
    return jsonify(profile), 200


@user_bp.route("/profile", methods=["PUT"])
@require_auth
def update_profile():
    payload = request.get_json(silent=True) or {}
    allowed = {"name", "bio", "location", "profile_photo"}
    if not any(field in payload for field in allowed):
        raise ValidationError("Provide at least one field to update")
    updated = update_user_profile(g.current_user.id, payload)
    return jsonify(user_to_dict(updated, include_email=True)), 200


@user_bp.route("/gig-history", methods=["GET"])
@require_auth
@require_role("student")
def user_gig_history():
    history = get_user_gig_history(g.current_user.id)
    return jsonify(history), 200


@user_bp.route("/saved-gigs", methods=["POST"])
@require_auth
def save_gig_endpoint():
    payload = request.get_json(silent=True) or {}
    gig_id = payload.get("gig_id")
    if not gig_id:
        raise ValidationError("gig_id is required")
    saved = save_gig(g.current_user.id, gig_id)
    return jsonify(saved_gig_to_dict(saved)), 201


@user_bp.route("/saved-gigs", methods=["GET"])
@require_auth
def list_saved_gigs():
    saved_items = get_saved_gigs(g.current_user.id)
    return jsonify([saved_gig_to_dict(item) for item in saved_items]), 200


@user_bp.route("/saved-gigs/<int:saved_gig_id>", methods=["DELETE"])
@require_auth
def remove_saved_gig(saved_gig_id: int):
    saved = SavedGig.query.get(saved_gig_id)
    if not saved or saved.user_id != g.current_user.id:
        raise ValidationError("Saved gig not found")
    unsave_gig(g.current_user.id, saved.gig_id)
    return "", 204
