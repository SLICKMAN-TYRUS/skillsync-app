from typing import Dict, Optional
from sqlalchemy import func
from .. import db
from ..models import Application, Gig, Rating, User
from .exceptions import NotFoundError, ValidationError


def get_user_by_id(user_id: int) -> User:
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError(f"User with id {user_id} not found")
    return user


def get_user_by_uid(firebase_uid: str) -> Optional[User]:
    return User.query.filter_by(uid=firebase_uid).first()


def create_user(uid: str, name: str, email: str, role: str) -> User:
    if get_user_by_uid(uid):
        raise ValidationError("User with supplied Firebase UID already exists")
    if User.query.filter_by(email=email).first():
        raise ValidationError("User with supplied email already exists")
    user = User(uid=uid, name=name, email=email, role=role.lower())
    db.session.add(user)
    db.session.commit()
    return user


def update_user_profile(user_id: int, profile_data: Dict) -> User:
    user = get_user_by_id(user_id)
    allowed_fields = {"name", "profile_photo", "location", "bio"}
    for field, value in profile_data.items():
        if field in allowed_fields:
            setattr(user, field, value)
    db.session.commit()
    return user


def get_user_gig_history(user_id: int):
    """Return gigs completed either by the provider or via accepted student applications."""
    provider_gigs = (
        Gig.query.filter_by(provider_id=user_id, status="completed")
        .order_by(Gig.updated_at.desc())
        .all()
    )

    student_gig_ids = (
        db.session.query(Application.gig_id)
        .join(Gig, Application.gig_id == Gig.id)
        .filter(
            Application.student_id == user_id,
            Application.status.in_(("accepted", "completed")),
            Gig.status == "completed",
        )
        .all()
    )
    student_gigs = (
        Gig.query.filter(Gig.id.in_([gid for (gid,) in student_gig_ids]))
        .order_by(Gig.updated_at.desc())
        .all()
        if student_gig_ids
        else []
    )

    return {
        "provider": [gig.to_dict() for gig in provider_gigs],
        "student": [gig.to_dict() for gig in student_gigs],
    }


def update_user_average_rating(user_id: int) -> User:
    user = get_user_by_id(user_id)
    avg_score = (
        db.session.query(func.avg(Rating.score))
        .filter(Rating.ratee_id == user_id)
        .scalar()
    )
    user.average_rating = round(float(avg_score), 2) if avg_score else 0.0
    db.session.commit()
    return user
