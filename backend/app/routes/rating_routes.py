from flask import Blueprint, jsonify, g, request
from datetime import datetime, timedelta

from .. import db
from ..models import Rating
from ..services.notification_service import notify_rating_received
from ..services.rating_service import (
    create_rating,
    flag_rating_for_review,
    get_gig_rating_summary,
    get_platform_rating_stats,
    get_rating_analytics,
    get_ratings_pending_moderation,
    get_user_ratings,
)
from ..services.user_service import get_user_by_id
from ..services.utils import require_auth, require_role
from ..services.exceptions import ValidationError
from .serializers import rating_to_dict

rating_bp = Blueprint("ratings", __name__)


@rating_bp.route("", methods=["POST"])
@require_auth
def create_rating_endpoint():
    payload = request.get_json(silent=True) or {}
    ratee_id = payload.get("ratee_id")
    gig_id = payload.get("gig_id")
    score = payload.get("score")
    comment = payload.get("comment", "")

    if not all([ratee_id, gig_id, score is not None]):
        raise ValidationError("ratee_id, gig_id, and score are required")

    current_user = g.current_user
    if current_user.role not in {"student", "provider"}:
        raise ValidationError("Only students or providers can submit ratings")

    ratee = get_user_by_id(ratee_id)
    if current_user.role == "student" and ratee.role != "provider":
        raise ValidationError("Students can only rate providers")
    if current_user.role == "provider" and ratee.role != "student":
        raise ValidationError("Providers can only rate students")

    rating = create_rating(
        rater_id=current_user.id,
        ratee_id=ratee_id,
        gig_id=gig_id,
        score=score,
        comment=comment,
    )
    notify_rating_received(rating.ratee_id, rating.id)
    return jsonify(rating_to_dict(rating, include_ratee=True)), 201


@rating_bp.route("/user/<int:user_id>", methods=["GET"])
def ratings_for_user(user_id: int):
    ratings = get_user_ratings(user_id)
    return (
        jsonify(
            [rating_to_dict(rating, include_rater=True) for rating in ratings]
        ),
        200,
    )


@rating_bp.route("/user/<int:user_id>/analytics", methods=["GET"])
@require_auth
def get_user_rating_analytics(user_id: int):
    # Users can view their own analytics, others can view basic stats
    if g.current_user.id != user_id and not g.current_user.is_role("admin"):
        # Return limited analytics for other users
        user = get_user_by_id(user_id)
        ratings = get_user_ratings(user_id)
        return jsonify({
            "user_id": user_id,
            "average_rating": float(user.average_rating or 0.0),
            "total_ratings_received": len(ratings),
            "public_view": True
        }), 200
    
    analytics = get_rating_analytics(user_id)
    return jsonify(analytics), 200


@rating_bp.route("/gig/<int:gig_id>/summary", methods=["GET"])
def get_gig_rating_summary_endpoint(gig_id: int):
    summary = get_gig_rating_summary(gig_id)
    return jsonify(summary), 200


@rating_bp.route("/platform/stats", methods=["GET"])
@require_auth
@require_role("admin")
def get_platform_rating_stats_endpoint():
    stats = get_platform_rating_stats()
    return jsonify(stats), 200


@rating_bp.route("/moderation/pending", methods=["GET"])
@require_auth
@require_role("admin")
def get_pending_moderation_ratings():
    ratings = get_ratings_pending_moderation()
    return jsonify([rating_to_dict(rating, include_rater=True, include_ratee=True, include_moderation=True) for rating in ratings]), 200


@rating_bp.route("/<int:rating_id>/update", methods=["PUT"])
@require_auth
def update_rating(rating_id: int):
    # Allow users to update their own ratings within a time window
    rating = Rating.query.get(rating_id)
    if not rating:
        raise ValidationError("Rating not found")
    
    if rating.rater_id != g.current_user.id:
        raise ValidationError("You can only update your own ratings")
    
    # Check if rating is still within edit window (e.g., 24 hours)
    from datetime import datetime, timedelta
    edit_deadline = rating.created_at + timedelta(hours=24)
    if datetime.utcnow() > edit_deadline:
        raise ValidationError("Rating can only be edited within 24 hours of creation")
    
    payload = request.get_json(silent=True) or {}
    new_score = payload.get("score")
    new_comment = payload.get("comment")
    
    if new_score is not None:
        try:
            Rating.validate_score(new_score)
            rating.score = new_score
        except ValueError as exc:
            raise ValidationError(str(exc))
    
    if new_comment is not None:
        rating.comment = new_comment
    
    db.session.commit()
    
    # Update user's average rating
    from ..services.rating_service import calculate_average_rating
    calculate_average_rating(rating.ratee_id)
    
    return jsonify(rating_to_dict(rating, include_ratee=True)), 200


@rating_bp.route("/<int:rating_id>/flag", methods=["POST"])
@require_auth
def flag_rating(rating_id: int):
    # Users can flag ratings they received or admins can flag any rating
    rating = Rating.query.get(rating_id)
    if not rating:
        raise ValidationError("Rating not found")
    
    if rating.ratee_id != g.current_user.id and not g.current_user.is_role("admin"):
        raise ValidationError("You can only flag ratings you received")
    
    payload = request.get_json(silent=True) or {}
    reason = payload.get("reason", "Inappropriate content")
    
    flagged_rating = flag_rating_for_review(rating_id, reason)
    return jsonify(rating_to_dict(flagged_rating, include_ratee=True)), 200
