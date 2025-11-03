from datetime import datetime
from typing import Dict, Optional
from sqlalchemy import desc
from .. import db
from ..models import Gig, User
from .exceptions import NotFoundError, ValidationError
from .user_service import get_user_by_id


DATE_FORMATS = ("%Y-%m-%d", "%Y/%m/%d")


def _parse_deadline(value: Optional[str]):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    raise ValidationError("Deadline must be provided in YYYY-MM-DD format")


def create_gig(provider_id: int, gig_data: Dict) -> Gig:
    provider = get_user_by_id(provider_id)
    if not provider.is_role("provider", "admin"):
        raise ValidationError("Only providers can create gigs")

    gig = Gig(
        title=gig_data["title"],
        description=gig_data["description"],
        budget=gig_data.get("budget"),
        category=gig_data.get("category"),
        location=gig_data.get("location"),
        provider_id=provider_id,
        deadline=_parse_deadline(gig_data.get("deadline")),
        status=gig_data.get("status", "open"),
        approval_status="pending",
    )

    try:
        Gig.validate_status(gig.status)
    except ValueError as exc:
        raise ValidationError(str(exc))

    db.session.add(gig)
    db.session.commit()
    return gig


def get_gig_by_id(gig_id: int) -> Gig:
    gig = Gig.query.get(gig_id)
    if not gig:
        raise NotFoundError(f"Gig with id {gig_id} not found")
    return gig


def update_gig(gig_id: int, gig_data: Dict) -> Gig:
    gig = get_gig_by_id(gig_id)
    editable_fields = {
        "title",
        "description",
        "budget",
        "category",
        "location",
        "deadline",
        "status",
    }
    for field, value in gig_data.items():
        if field not in editable_fields:
            continue
        if field == "deadline":
            setattr(gig, field, _parse_deadline(value))
        else:
            setattr(gig, field, value)
        if field == "status":
            try:
                Gig.validate_status(value)
            except ValueError as exc:
                raise ValidationError(str(exc))
    db.session.commit()
    return gig


def delete_gig(gig_id: int) -> None:
    gig = get_gig_by_id(gig_id)
    db.session.delete(gig)
    db.session.commit()


def browse_gigs(filters: Dict, pagination: Dict):
    query = Gig.query

    category = filters.get("category")
    if category:
        query = query.filter(Gig.category.ilike(f"%{category}%"))

    location = filters.get("location")
    if location:
        query = query.filter(Gig.location.ilike(f"%{location}%"))

    status = filters.get("status")
    if status:
        try:
            Gig.validate_status(status)
        except ValueError as exc:
            raise ValidationError(str(exc))
        query = query.filter(Gig.status == status)

    approval_status = filters.get("approval_status")
    if approval_status:
        try:
            Gig.validate_approval_status(approval_status)
        except ValueError as exc:
            raise ValidationError(str(exc))
        query = query.filter(Gig.approval_status == approval_status)
    else:
        query = query.filter(Gig.approval_status == "approved")

    sort_by = filters.get("sort")
    if sort_by == "rating":
        query = query.join(User, Gig.provider_id == User.id).order_by(
            desc(User.average_rating)
        )
    else:
        query = query.order_by(desc(Gig.created_at))

    page = max(int(pagination.get("page", 1)), 1)
    per_page = min(int(pagination.get("per_page", 20)), 100)
    pagination_obj = query.paginate(page=page, per_page=per_page, error_out=False)

    return {
        "items": pagination_obj.items,
        "page": pagination_obj.page,
        "per_page": pagination_obj.per_page,
        "total": pagination_obj.total,
        "pages": pagination_obj.pages,
    }


def update_gig_status(gig_id: int, new_status: str) -> Gig:
    gig = get_gig_by_id(gig_id)
    try:
        Gig.validate_status(new_status)
    except ValueError as exc:
        raise ValidationError(str(exc))
    gig.status = new_status
    db.session.commit()
    return gig


def get_provider_gigs(provider_id: int):
    return (
        Gig.query.filter_by(provider_id=provider_id)
        .order_by(desc(Gig.created_at))
        .all()
    )
