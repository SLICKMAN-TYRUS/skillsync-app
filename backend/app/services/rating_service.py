from typing import List, Optional

from .. import db
from ..models import Application, Gig, Rating, User
from .exceptions import AuthorizationError, NotFoundError, ValidationError
from .gig_service import get_gig_by_id
from .user_service import get_user_by_id, update_user_average_rating


def get_rating_by_gig_and_users(gig_id: int, rater_id: int, ratee_id: int) -> Optional[Rating]:
    return Rating.query.filter_by(
        gig_id=gig_id, rater_id=rater_id, ratee_id=ratee_id
    ).first()


def _validate_rating_context(rater: User, ratee: User, gig_id: int) -> None:
    if rater.id == ratee.id:
        raise ValidationError("Users cannot rate themselves")

    gig = get_gig_by_id(gig_id)
    if gig.status != "completed":
        raise ValidationError("Ratings are only allowed after the gig is completed")

    # Ensure rater participated in the gig
    if rater.role == "provider":
        if ratee.role != "student":
            raise ValidationError("Providers can only rate students")
        # Provider rating student; ensure student was accepted
        selected_application = (
            Application.query.filter_by(gig_id=gig_id, student_id=ratee.id)
            .filter(Application.status.in_(("accepted", "completed")))
            .first()
        )
        if not selected_application:
            raise AuthorizationError("Provider can only rate the accepted student")
        if gig.provider_id != rater.id:
            raise AuthorizationError("Providers can only rate their own gigs")
    elif rater.role == "student":
        if ratee.role != "provider":
            raise ValidationError("Students can only rate providers")
        # Student rating provider; ensure they were accepted for the gig
        selected_application = (
            Application.query.filter_by(gig_id=gig_id, student_id=rater.id)
            .filter(Application.status.in_(("accepted", "completed")))
            .first()
        )
        if not selected_application:
            raise AuthorizationError("Only accepted students can rate the provider")
        if gig.provider_id != ratee.id:
            raise ValidationError("Student ratings must target the gig's provider")
    else:
        raise AuthorizationError("Only students and providers can issue ratings")


def create_rating(
    rater_id: int,
    ratee_id: int,
    gig_id: int,
    score: int,
    comment: str = "",
) -> Rating:
    rater = get_user_by_id(rater_id)
    ratee = get_user_by_id(ratee_id)
    _validate_rating_context(rater, ratee, gig_id)

    if get_rating_by_gig_and_users(gig_id, rater_id, ratee_id):
        raise ValidationError("A rating for this user and gig already exists")

    if score is None:
        raise ValidationError("Score is required")
    try:
        Rating.validate_score(score)
    except ValueError as exc:
        raise ValidationError(str(exc))

    rating = Rating(
        rater_id=rater_id,
        ratee_id=ratee_id,
        gig_id=gig_id,
        score=score,
        comment=comment,
    )
    db.session.add(rating)
    db.session.commit()
    update_user_average_rating(ratee_id)
    return rating


def get_user_ratings(user_id: int) -> List[Rating]:
    get_user_by_id(user_id)
    return Rating.query.filter_by(ratee_id=user_id).order_by(Rating.created_at.desc()).all()


def calculate_average_rating(user_id: int) -> float:
    user = update_user_average_rating(user_id)
    return float(user.average_rating or 0.0)
