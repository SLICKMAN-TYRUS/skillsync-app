from .. import db
from ..models import SavedGig
from .exceptions import NotFoundError, ValidationError
from .gig_service import get_gig_by_id
from .user_service import get_user_by_id


def save_gig(user_id: int, gig_id: int) -> SavedGig:
    get_user_by_id(user_id)
    get_gig_by_id(gig_id)
    if is_gig_saved(user_id, gig_id):
        raise ValidationError("Gig already saved")
    saved = SavedGig(user_id=user_id, gig_id=gig_id)
    db.session.add(saved)
    db.session.commit()
    return saved


def unsave_gig(user_id: int, gig_id: int) -> None:
    saved = SavedGig.query.filter_by(user_id=user_id, gig_id=gig_id).first()
    if not saved:
        raise NotFoundError("Saved gig not found")
    db.session.delete(saved)
    db.session.commit()


def get_saved_gigs(user_id: int):
    get_user_by_id(user_id)
    return SavedGig.query.filter_by(user_id=user_id).order_by(SavedGig.saved_at.desc()).all()


def is_gig_saved(user_id: int, gig_id: int) -> bool:
    return (
        SavedGig.query.filter_by(user_id=user_id, gig_id=gig_id).first() is not None
    )
