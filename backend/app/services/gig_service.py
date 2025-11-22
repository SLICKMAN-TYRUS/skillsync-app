from datetime import datetime, date
from typing import Dict, Optional
from sqlalchemy import desc, asc, and_, or_, func
from .. import db
from ..models import Gig, User, Application
from . import notification_service as _notification_service
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

    # Notify admins that a new gig is pending approval (service-level so seed scripts trigger it)
    try:
        admins = User.query.filter_by(role='admin').all()
        for admin in admins:
            _notification_service.create_notification_with_preferences(
                user_id=admin.id,
                type="gig_pending",
                title="New gig pending approval",
                message=f"A new gig '{gig.title}' has been posted and is awaiting approval.",
                related_ids={"gig_id": gig.id},
            )
    except Exception:
        pass
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

    # Keyword search in title and description
    search = filters.get("search")
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Gig.title.ilike(search_pattern),
                Gig.description.ilike(search_pattern)
            )
        )

    # Category filtering
    category = filters.get("category")
    if category:
        query = query.filter(Gig.category.ilike(f"%{category}%"))

    # Location filtering
    location = filters.get("location")
    if location:
        query = query.filter(Gig.location.ilike(f"%{location}%"))

    # Price range filtering
    min_budget = filters.get("min_budget")
    max_budget = filters.get("max_budget")
    if min_budget is not None:
        try:
            min_budget = float(min_budget)
            query = query.filter(Gig.budget >= min_budget)
        except (ValueError, TypeError):
            raise ValidationError("min_budget must be a valid number")
    
    if max_budget is not None:
        try:
            max_budget = float(max_budget)
            query = query.filter(Gig.budget <= max_budget)
        except (ValueError, TypeError):
            raise ValidationError("max_budget must be a valid number")

    # Deadline filtering
    deadline_filter = filters.get("deadline_filter")
    if deadline_filter:
        today = date.today()
        if deadline_filter == "urgent":  # Next 3 days
            deadline_cutoff = date.fromordinal(today.toordinal() + 3)
            query = query.filter(
                and_(Gig.deadline.isnot(None), Gig.deadline <= deadline_cutoff)
            )
        elif deadline_filter == "this_week":  # Next 7 days
            deadline_cutoff = date.fromordinal(today.toordinal() + 7)
            query = query.filter(
                and_(Gig.deadline.isnot(None), Gig.deadline <= deadline_cutoff)
            )
        elif deadline_filter == "this_month":  # Next 30 days
            deadline_cutoff = date.fromordinal(today.toordinal() + 30)
            query = query.filter(
                and_(Gig.deadline.isnot(None), Gig.deadline <= deadline_cutoff)
            )

    # Status filtering
    status = filters.get("status")
    if status:
        try:
            Gig.validate_status(status)
        except ValueError as exc:
            raise ValidationError(str(exc))
        query = query.filter(Gig.status == status)

    # Approval status filtering
    approval_status = filters.get("approval_status")
    if approval_status:
        try:
            Gig.validate_approval_status(approval_status)
        except ValueError as exc:
            raise ValidationError(str(exc))
        query = query.filter(Gig.approval_status == approval_status)
    else:
        query = query.filter(Gig.approval_status == "approved")

    # Enhanced sorting options
    sort_by = filters.get("sort")
    if sort_by == "budget_high":
        query = query.order_by(desc(Gig.budget))
    elif sort_by == "budget_low":
        query = query.order_by(asc(Gig.budget))
    elif sort_by == "deadline":
        query = query.order_by(asc(Gig.deadline))
    elif sort_by == "title":
        query = query.order_by(asc(Gig.title))
    elif sort_by == "rating":
        query = query.join(User, Gig.provider_id == User.id).order_by(
            desc(User.average_rating)
        )
    else:  # Default: newest first
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


def get_provider_analytics(provider_id: int) -> Dict:
    """Get analytics data for a provider"""
    provider = get_user_by_id(provider_id)
    if not provider.is_role("provider", "admin"):
        raise ValidationError("Only providers can view analytics")

    # Basic gig counts
    total_gigs = Gig.query.filter_by(provider_id=provider_id).count()
    active_gigs = Gig.query.filter_by(
        provider_id=provider_id, status="open"
    ).count()
    completed_gigs = Gig.query.filter_by(
        provider_id=provider_id, status="completed"
    ).count()
    pending_approval = Gig.query.filter_by(
        provider_id=provider_id, approval_status="pending"
    ).count()

    # Application statistics
    gig_ids = [gig.id for gig in Gig.query.filter_by(provider_id=provider_id).all()]
    total_applications = 0
    avg_applications_per_gig = 0
    
    if gig_ids:
        total_applications = Application.query.filter(
            Application.gig_id.in_(gig_ids)
        ).count()
        avg_applications_per_gig = round(total_applications / len(gig_ids), 1) if gig_ids else 0

    # Budget statistics
    budget_stats = db.session.query(
        func.avg(Gig.budget),
        func.min(Gig.budget),
        func.max(Gig.budget),
        func.sum(Gig.budget)
    ).filter(
        Gig.provider_id == provider_id,
        Gig.budget.isnot(None)
    ).first()

    avg_budget = float(budget_stats[0]) if budget_stats[0] else 0
    min_budget = float(budget_stats[1]) if budget_stats[1] else 0
    max_budget = float(budget_stats[2]) if budget_stats[2] else 0
    total_budget = float(budget_stats[3]) if budget_stats[3] else 0

    # Recent activity (last 30 days)
    thirty_days_ago = date.today().replace(day=1)  # Start of current month
    recent_gigs = Gig.query.filter(
        Gig.provider_id == provider_id,
        Gig.created_at >= thirty_days_ago
    ).count()

    return {
        "total_gigs": total_gigs,
        "active_gigs": active_gigs,
        "completed_gigs": completed_gigs,
        "pending_approval": pending_approval,
        "total_applications": total_applications,
        "avg_applications_per_gig": avg_applications_per_gig,
        "budget_stats": {
            "average": round(avg_budget, 2),
            "minimum": round(min_budget, 2),
            "maximum": round(max_budget, 2),
            "total": round(total_budget, 2)
        },
        "recent_activity": {
            "gigs_this_month": recent_gigs
        }
    }


def get_expiring_gigs(days_ahead: int = 3):
    """Get gigs that are expiring within the specified number of days"""
    cutoff_date = date.fromordinal(date.today().toordinal() + days_ahead)
    return Gig.query.filter(
        and_(
            Gig.deadline.isnot(None),
            Gig.deadline <= cutoff_date,
            Gig.status == "open"
        )
    ).all()


def mark_expired_gigs():
    """Mark gigs as closed if their deadline has passed"""
    today = date.today()
    expired_gigs = Gig.query.filter(
        and_(
            Gig.deadline.isnot(None),
            Gig.deadline < today,
            Gig.status == "open"
        )
    ).all()
    
    count = 0
    for gig in expired_gigs:
        gig.status = "closed"
        count += 1
    
    if count > 0:
        db.session.commit()
    
    return count


def get_gigs_expiring_soon(provider_id: int, days_ahead: int = 7):
    """Get provider's gigs that are expiring soon"""
    cutoff_date = date.fromordinal(date.today().toordinal() + days_ahead)
    return Gig.query.filter(
        and_(
            Gig.provider_id == provider_id,
            Gig.deadline.isnot(None),
            Gig.deadline <= cutoff_date,
            Gig.status == "open"
        )
    ).order_by(asc(Gig.deadline)).all()
