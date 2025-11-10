from flask import Blueprint, jsonify, g, request

from ..models import SavedGig
from ..services.exceptions import ValidationError
from ..services.saved_gigs_service import (
    get_saved_gigs,
    save_gig,
    unsave_gig,
)
from ..services.skill_service import (
    add_student_skill,
    get_all_skills,
    get_student_skills,
    remove_student_skill,
    search_skills,
    update_student_availability,
    update_student_skill,
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


@user_bp.route("/skills", methods=["GET"])
@require_auth
@require_role("student")
def get_user_skills():
    student_skills = get_student_skills(g.current_user.id)
    return jsonify([skill.to_dict() for skill in student_skills]), 200


@user_bp.route("/skills", methods=["POST"])
@require_auth
@require_role("student")
def add_user_skill():
    payload = request.get_json(silent=True) or {}
    skill_name = payload.get("skill_name")
    proficiency_level = payload.get("proficiency_level", "beginner")
    
    if not skill_name:
        raise ValidationError("skill_name is required")
    
    student_skill = add_student_skill(g.current_user.id, skill_name, proficiency_level)
    return jsonify(student_skill.to_dict()), 201


@user_bp.route("/skills/<string:skill_name>", methods=["PUT"])
@require_auth
@require_role("student")
def update_user_skill(skill_name: str):
    payload = request.get_json(silent=True) or {}
    proficiency_level = payload.get("proficiency_level")
    
    if not proficiency_level:
        raise ValidationError("proficiency_level is required")
    
    student_skill = update_student_skill(g.current_user.id, skill_name, proficiency_level)
    return jsonify(student_skill.to_dict()), 200


@user_bp.route("/skills/<string:skill_name>", methods=["DELETE"])
@require_auth
@require_role("student")
def remove_user_skill(skill_name: str):
    remove_student_skill(g.current_user.id, skill_name)
    return "", 204


@user_bp.route("/availability", methods=["PUT"])
@require_auth
@require_role("student")
def update_availability():
    payload = request.get_json(silent=True) or {}
    availability_status = payload.get("availability_status")
    
    if not availability_status:
        raise ValidationError("availability_status is required")
    
    update_student_availability(g.current_user.id, availability_status)
    return jsonify({"message": "Availability status updated", "status": availability_status}), 200


@user_bp.route("/skills/search", methods=["GET"])
@require_auth
def search_available_skills():
    search_term = request.args.get("q", "")
    category = request.args.get("category")
    
    if search_term:
        skills = search_skills(search_term)
    else:
        skills = get_all_skills(category)
    
    return jsonify([skill.to_dict() for skill in skills]), 200
