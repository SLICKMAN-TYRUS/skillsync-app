from flask import Blueprint, jsonify, g, request

from ..services.notification_service import notify_rating_received
from ..services.rating_service import (
    create_rating,
    get_user_ratings,
)
from ..services.user_service import get_user_by_id
from ..services.utils import require_auth
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
