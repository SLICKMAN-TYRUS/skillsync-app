from flask import Blueprint, jsonify, g, request
import json
from datetime import datetime

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


@user_bp.route("/profile/extended", methods=["GET"])
@require_auth
def get_extended_profile():
    """Get extended profile data (phone, social links, experience, education)"""
    user = get_user_by_id(g.current_user.id)
    
    # Parse extended data from bio field (JSON storage)
    extended_data = {
        "phone": "",
        "social_links": {
            "github": "",
            "linkedin": "", 
            "portfolio": ""
        },
        "experience": [],
        "education": []
    }
    
    try:
        if user.bio and user.bio.startswith('{'):
            parsed_bio = json.loads(user.bio)
            # Merge with extended_data
            if "phone" in parsed_bio:
                extended_data["phone"] = parsed_bio.get("phone", "")
            if "social_links" in parsed_bio:
                extended_data["social_links"] = parsed_bio.get("social_links", {})
            if "experience" in parsed_bio:
                extended_data["experience"] = parsed_bio.get("experience", [])
            if "education" in parsed_bio:
                extended_data["education"] = parsed_bio.get("education", [])
    except json.JSONDecodeError:
        # Bio is not JSON, use default extended data
        pass
    
    return jsonify(extended_data), 200


@user_bp.route("/profile/extended", methods=["PUT"])
@require_auth
def update_extended_profile():
    """Update extended profile data"""
    payload = request.get_json(silent=True) or {}
    
    user = get_user_by_id(g.current_user.id)
    current_bio = user.bio or ""
    
    # Parse existing bio if it's JSON
    existing_data = {}
    original_bio_text = current_bio
    
    try:
        if current_bio and current_bio.startswith('{'):
            existing_data = json.loads(current_bio)
            original_bio_text = existing_data.get("original_bio", current_bio)
    except json.JSONDecodeError:
        original_bio_text = current_bio
        existing_data = {}
    
    # Update with new data
    updated_data = {
        "original_bio": original_bio_text,
        "phone": payload.get("phone", existing_data.get("phone", "")),
        "social_links": {
            "github": payload.get("social_links", {}).get("github", existing_data.get("social_links", {}).get("github", "")),
            "linkedin": payload.get("social_links", {}).get("linkedin", existing_data.get("social_links", {}).get("linkedin", "")),
            "portfolio": payload.get("social_links", {}).get("portfolio", existing_data.get("social_links", {}).get("portfolio", ""))
        },
        "experience": payload.get("experience", existing_data.get("experience", [])),
        "education": payload.get("education", existing_data.get("education", []))
    }
    
    # Update user's bio with JSON data
    updated = update_user_profile(g.current_user.id, {"bio": json.dumps(updated_data)})
    
    return jsonify({
        "message": "Extended profile updated successfully",
        "data": updated_data
    }), 200


@user_bp.route("/profile/experience", methods=["POST"])
@require_auth
def add_experience():
    """Add a work experience entry"""
    payload = request.get_json(silent=True) or {}
    
    required_fields = ["title", "company"]
    if not all(field in payload for field in required_fields):
        raise ValidationError("Title and company are required")
    
    user = get_user_by_id(g.current_user.id)
    current_bio = user.bio or "{}"
    
    # Parse existing data
    existing_data = {}
    original_bio_text = current_bio
    
    try:
        if current_bio and current_bio.startswith('{'):
            existing_data = json.loads(current_bio)
            original_bio_text = existing_data.get("original_bio", current_bio)
    except json.JSONDecodeError:
        original_bio_text = current_bio
        existing_data = {"original_bio": original_bio_text}
    
    # Create new experience item
    new_experience = {
        "id": str(datetime.now().timestamp()),
        "title": payload["title"],
        "company": payload["company"],
        "duration": payload.get("duration", ""),
        "description": payload.get("description", "")
    }
    
    # Add to existing experiences
    experiences = existing_data.get("experience", [])
    experiences.append(new_experience)
    existing_data["experience"] = experiences
    existing_data["original_bio"] = original_bio_text
    
    # Update user profile
    update_user_profile(g.current_user.id, {"bio": json.dumps(existing_data)})
    
    return jsonify(new_experience), 201


@user_bp.route("/profile/experience/<string:exp_id>", methods=["DELETE"])
@require_auth
def delete_experience(exp_id: str):
    """Delete a work experience entry"""
    user = get_user_by_id(g.current_user.id)
    current_bio = user.bio or "{}"
    
    # Parse existing data
    existing_data = {}
    original_bio_text = current_bio
    
    try:
        if current_bio and current_bio.startswith('{'):
            existing_data = json.loads(current_bio)
            original_bio_text = existing_data.get("original_bio", current_bio)
    except json.JSONDecodeError:
        original_bio_text = current_bio
        existing_data = {"original_bio": original_bio_text}
    
    # Remove the experience
    experiences = existing_data.get("experience", [])
    filtered_experiences = [exp for exp in experiences if exp.get("id") != exp_id]
    existing_data["experience"] = filtered_experiences
    existing_data["original_bio"] = original_bio_text
    
    # Update user profile
    update_user_profile(g.current_user.id, {"bio": json.dumps(existing_data)})
    
    return "", 204


@user_bp.route("/profile/education", methods=["POST"])
@require_auth
def add_education():
    """Add an education entry"""
    payload = request.get_json(silent=True) or {}
    
    required_fields = ["institution", "degree"]
    if not all(field in payload for field in required_fields):
        raise ValidationError("Institution and degree are required")
    
    user = get_user_by_id(g.current_user.id)
    current_bio = user.bio or "{}"
    
    # Parse existing data
    existing_data = {}
    original_bio_text = current_bio
    
    try:
        if current_bio and current_bio.startswith('{'):
            existing_data = json.loads(current_bio)
            original_bio_text = existing_data.get("original_bio", current_bio)
    except json.JSONDecodeError:
        original_bio_text = current_bio
        existing_data = {"original_bio": original_bio_text}
    
    # Create new education item
    new_education = {
        "id": str(datetime.now().timestamp()),
        "institution": payload["institution"],
        "degree": payload["degree"],
        "field": payload.get("field", ""),
        "year": payload.get("year", "")
    }
    
    # Add to existing education
    education = existing_data.get("education", [])
    education.append(new_education)
    existing_data["education"] = education
    existing_data["original_bio"] = original_bio_text
    
    # Update user profile
    update_user_profile(g.current_user.id, {"bio": json.dumps(existing_data)})
    
    return jsonify(new_education), 201


@user_bp.route("/profile/education/<string:edu_id>", methods=["DELETE"])
@require_auth
def delete_education(edu_id: str):
    """Delete an education entry"""
    user = get_user_by_id(g.current_user.id)
    current_bio = user.bio or "{}"
    
    # Parse existing data
    existing_data = {}
    original_bio_text = current_bio
    
    try:
        if current_bio and current_bio.startswith('{'):
            existing_data = json.loads(current_bio)
            original_bio_text = existing_data.get("original_bio", current_bio)
    except json.JSONDecodeError:
        original_bio_text = current_bio
        existing_data = {"original_bio": original_bio_text}
    
    # Remove the education
    education = existing_data.get("education", [])
    filtered_education = [edu for edu in education if edu.get("id") != edu_id]
    existing_data["education"] = filtered_education
    existing_data["original_bio"] = original_bio_text
    
    # Update user profile
    update_user_profile(g.current_user.id, {"bio": json.dumps(existing_data)})
    
    return "", 204


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