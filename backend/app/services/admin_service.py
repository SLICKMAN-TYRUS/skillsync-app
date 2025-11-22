from datetime import datetime, timedelta
from typing import Dict, Optional

from sqlalchemy import and_, func, or_

from .. import db
from ..models import Application, AuditLog, Gig, Rating, User, SavedGig
from .exceptions import AuthorizationError, NotFoundError, ValidationError
from .gig_service import get_gig_by_id
from .notification_service import create_notification, notify_gig_approved
from .user_service import get_user_by_id, update_user_average_rating


def _assert_admin(user_id: int) -> User:
    admin = get_user_by_id(user_id)
    if not admin.is_role("admin"):
        raise AuthorizationError("Administrator privileges required")
    return admin


def _log_action(
    user_id: int,
    action: str,
    resource_type: str,
    resource_id: int,
    details: Optional[Dict] = None,
):
    log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
    )
    db.session.add(log)
    db.session.commit()
    return log


def _start_of_month(dt: datetime) -> datetime:
    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _previous_month_start(dt: datetime) -> datetime:
    month = dt.month - 1 or 12
    year = dt.year - 1 if dt.month == 1 else dt.year
    return dt.replace(year=year, month=month, day=1, hour=0, minute=0, second=0, microsecond=0)


def get_pending_gigs():
    return (
        Gig.query.filter_by(approval_status="pending")
        .order_by(Gig.created_at.asc())
        .all()
    )


def approve_gig(gig_id: int, admin_id: int) -> Gig:
    admin = _assert_admin(admin_id)
    gig = get_gig_by_id(gig_id)
    gig.approval_status = "approved"
    gig.status = "open"
    db.session.commit()

    _log_action(
        admin.id,
        "gig_approved",
        "gig",
        gig_id,
        {"provider_id": gig.provider_id},
    )

    notify_gig_approved(gig.provider_id, gig_id)
    # Notify impacted students (applicants + users who saved the gig)
    try:
        applicant_ids = {
            student_id
            for (student_id,) in Application.query.with_entities(Application.student_id)
            .filter(Application.gig_id == gig_id)
            .all()
        }
        saved_ids = {
            user_id
            for (user_id,) in SavedGig.query.with_entities(SavedGig.user_id)
            .filter(SavedGig.gig_id == gig_id)
            .all()
        }
        impacted = list(applicant_ids.union(saved_ids))
        if impacted:
            from . import notification_service as _notification_service

            _notification_service.notify_gig_update(impacted, gig_id, "approved")
    except Exception:
        # Non-fatal: approval should succeed even if notifications fail
        pass
    return gig


def reject_gig(gig_id: int, admin_id: int, reason: str) -> Gig:
    admin = _assert_admin(admin_id)
    gig = get_gig_by_id(gig_id)
    gig.approval_status = "rejected"
    gig.status = "closed"
    db.session.commit()

    _log_action(
        admin.id,
        "gig_rejected",
        "gig",
        gig_id,
        {"provider_id": gig.provider_id, "reason": reason},
    )

    create_notification(
        user_id=gig.provider_id,
        type="gig_rejected",
        title="Gig rejected",
        message=f"Your gig '{gig.title}' was rejected. Reason: {reason}",
        related_ids={"gig_id": gig_id},
    )
    return gig


def update_user_role(user_id: int, new_role: str, admin_id: int) -> User:
    admin = _assert_admin(admin_id)
    user = get_user_by_id(user_id)
    valid_roles = {"student", "provider", "admin"}
    if new_role not in valid_roles:
        raise ValidationError("Invalid role supplied")
    previous_role = user.role
    user.role = new_role
    db.session.commit()

    _log_action(
        admin.id,
        "user_role_changed",
        "user",
        user_id,
        {"previous_role": previous_role, "new_role": new_role},
    )
    create_notification(
        user_id=user.id,
        type="role_changed",
        title="Role updated",
        message=f"Your platform role changed from {previous_role} to {new_role}.",
    )
    return user


def get_all_users(filters: Dict, pagination: Dict):
    query = User.query

    role = filters.get("role")
    if role:
        query = query.filter(User.role == role)

    search = filters.get("search")
    if search:
        query = query.filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )

    query = query.order_by(User.created_at.desc())

    page = max(int(pagination.get("page", 1)), 1)
    per_page = min(int(pagination.get("per_page", 20)), 100)
    pagination_obj = query.paginate(page=page, per_page=per_page, error_out=False)

    return {
        "items": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "average_rating": float(user.average_rating or 0.0),
                "created_at": user.created_at.isoformat() if user.created_at else None,
            }
            for user in pagination_obj.items
        ],
        "page": pagination_obj.page,
        "per_page": pagination_obj.per_page,
        "total": pagination_obj.total,
        "pages": pagination_obj.pages,
    }


def get_system_analytics():
    now = datetime.utcnow()
    current_month_start = _start_of_month(now)
    previous_month_start = _previous_month_start(now)

    total_active_gigs = (
        db.session.query(func.count(Gig.id)).filter(Gig.status == "open").scalar() or 0
    )
    total_completed_gigs = (
        db.session.query(func.count(Gig.id))
        .filter(Gig.status == "completed")
        .scalar()
        or 0
    )
    total_applications = (
        db.session.query(func.count(Application.id)).scalar() or 0
    )

    role_counts = dict(
        db.session.query(User.role, func.count(User.id)).group_by(User.role).all()
    )

    new_users_this_month = (
        db.session.query(func.count(User.id))
        .filter(User.created_at >= current_month_start)
        .scalar()
        or 0
    )
    new_users_last_month = (
        db.session.query(func.count(User.id))
        .filter(
            and_(
                User.created_at >= previous_month_start,
                User.created_at < current_month_start,
            )
        )
        .scalar()
        or 0
    )

    avg_platform_rating = (
        db.session.query(func.avg(Rating.score)).scalar() or 0.0
    )

    return {
        "active_gigs_count": int(total_active_gigs),
        "completed_gigs_count": int(total_completed_gigs),
        "total_students": int(role_counts.get("student", 0)),
        "total_providers": int(role_counts.get("provider", 0)),
        "total_admins": int(role_counts.get("admin", 0)),
        "new_users_this_month": int(new_users_this_month),
        "new_users_last_month": int(new_users_last_month),
        "platform_average_rating": round(float(avg_platform_rating), 2)
        if avg_platform_rating
        else 0.0,
        "total_applications": int(total_applications),
    }


def get_gig_analytics():
    status_breakdown = dict(
        db.session.query(Gig.status, func.count(Gig.id)).group_by(Gig.status).all()
    )
    category_breakdown = dict(
        db.session.query(Gig.category, func.count(Gig.id))
        .filter(Gig.category.isnot(None))
        .group_by(Gig.category)
        .all()
    )

    completed_gigs = Gig.query.filter(Gig.status == "completed").all()
    if completed_gigs:
        avg_completion_seconds = sum(
            max((gig.updated_at or gig.created_at) - gig.created_at, timedelta()).total_seconds()
            for gig in completed_gigs
        ) / len(completed_gigs)
    else:
        avg_completion_seconds = 0

    top_categories = sorted(
        category_breakdown.items(), key=lambda item: item[1], reverse=True
    )[:5]

    return {
        "status_breakdown": status_breakdown,
        "category_breakdown": category_breakdown,
        "average_completion_days": round(avg_completion_seconds / 86400, 2)
        if avg_completion_seconds
        else 0.0,
        "top_categories": [
            {"category": category, "count": count} for category, count in top_categories
        ],
    }


def get_user_analytics():
    six_months_ago = datetime.utcnow().replace(day=1) - timedelta(days=182)
    growth_data = (
        db.session.query(
            func.date_trunc("month", User.created_at).label("month"),
            func.count(User.id),
        )
        .filter(User.created_at >= six_months_ago)
        .group_by("month")
        .order_by("month")
        .all()
    )

    users_by_role = dict(
        db.session.query(User.role, func.count(User.id)).group_by(User.role).all()
    )

    top_providers = (
        db.session.query(User, func.count(Gig.id).label("gig_count"))
        .join(Gig, Gig.provider_id == User.id)
        .filter(User.role == "provider")
        .group_by(User.id)
        .order_by(func.count(Gig.id).desc())
        .limit(5)
        .all()
    )

    top_students = (
        db.session.query(User, func.count(Application.id).label("application_count"))
        .join(Application, Application.student_id == User.id)
        .filter(User.role == "student")
        .group_by(User.id)
        .order_by(func.count(Application.id).desc())
        .limit(5)
        .all()
    )

    return {
        "user_growth": [
            {"month": month.strftime("%Y-%m"), "count": count} for month, count in growth_data
        ],
        "users_by_role": users_by_role,
        "most_active_providers": [
            {
                "id": provider.id,
                "name": provider.name,
                "gig_count": int(gig_count),
            }
            for provider, gig_count in top_providers
        ],
        "most_active_students": [
            {
                "id": student.id,
                "name": student.name,
                "application_count": int(app_count),
            }
            for student, app_count in top_students
        ],
    }


def get_flagged_ratings():
    flagged = (
        Rating.query.filter(Rating.score <= 2)
        .order_by(Rating.created_at.desc())
        .all()
    )
    results = []
    for rating in flagged:
        results.append(
            {
                "id": rating.id,
                "score": rating.score,
                "comment": rating.comment,
                "created_at": rating.created_at.isoformat()
                if rating.created_at
                else None,
                "rater": {
                    "id": rating.rater.id,
                    "name": rating.rater.name,
                    "role": rating.rater.role,
                },
                "ratee": {
                    "id": rating.ratee.id,
                    "name": rating.ratee.name,
                    "role": rating.ratee.role,
                },
            }
        )
    return results


def moderate_rating(rating_id: int, admin_id: int, action: str, note: str = ""):
    admin = _assert_admin(admin_id)
    rating = Rating.query.get(rating_id)
    if not rating:
        raise NotFoundError(f"Rating with id {rating_id} not found")

    action = action.lower()
    if action not in {"approve", "remove", "warn_user"}:
        raise ValidationError("Unsupported moderation action")

    # Update moderation fields
    rating.moderated_by = admin_id
    rating.moderated_at = datetime.utcnow()
    
    response = {"action": action, "note": note}
    if action == "remove":
        ratee_id = rating.ratee_id
        rating.moderation_status = "rejected"
        db.session.delete(rating)
        db.session.commit()
        update_user_average_rating(ratee_id)
        response["status"] = "removed"
    elif action == "warn_user":
        rating.moderation_status = "flagged"
        create_notification(
            user_id=rating.rater_id,
            type="rating_warning",
            title="Rating under review",
            message=note or "Your recent rating was flagged by an administrator.",
        )
        db.session.commit()
        response["status"] = "warning_sent"
    else:
        rating.moderation_status = "approved"
        rating.is_flagged = False
        db.session.commit()
        response["status"] = "approved"

    _log_action(
        admin.id,
        "rating_moderated",
        "rating",
        rating_id,
        {"action": action, "note": note},
    )
    return response


def get_audit_logs(filters: Dict, pagination: Dict):
    query = AuditLog.query

    if action := filters.get("action"):
        query = query.filter(AuditLog.action == action)
    if resource_type := filters.get("resource_type"):
        query = query.filter(AuditLog.resource_type == resource_type)
    if user_id := filters.get("user_id"):
        query = query.filter(AuditLog.user_id == int(user_id))
    if start_date := filters.get("start_date"):
        start = datetime.fromisoformat(start_date)
        query = query.filter(AuditLog.created_at >= start)
    if end_date := filters.get("end_date"):
        end = datetime.fromisoformat(end_date)
        query = query.filter(AuditLog.created_at <= end)

    query = query.order_by(AuditLog.created_at.desc())

    page = max(int(pagination.get("page", 1)), 1)
    per_page = min(int(pagination.get("per_page", 20)), 100)
    pagination_obj = query.paginate(page=page, per_page=per_page, error_out=False)

    return {
        "items": [
            {
                "id": log.id,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None,
                "user": (
                    {
                        "id": log.user.id,
                        "name": log.user.name,
                        "role": log.user.role,
                    }
                    if log.user
                    else None
                ),
            }
            for log in pagination_obj.items
        ],
        "page": pagination_obj.page,
        "per_page": pagination_obj.per_page,
        "total": pagination_obj.total,
        "pages": pagination_obj.pages,
    }


def get_platform_health_metrics():
    """Get platform health and performance metrics"""
    from datetime import datetime, timedelta
    
    # Get metrics for the last 24 hours, 7 days, and 30 days
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # User activity metrics
    active_users_today = User.query.filter(User.last_login >= day_ago).count() if hasattr(User, 'last_login') else 0
    new_users_today = User.query.filter(User.created_at >= day_ago).count()
    new_users_week = User.query.filter(User.created_at >= week_ago).count()
    
    # Gig activity metrics
    gigs_created_today = Gig.query.filter(Gig.created_at >= day_ago).count()
    gigs_created_week = Gig.query.filter(Gig.created_at >= week_ago).count()
    applications_today = Application.query.filter(Application.applied_at >= day_ago).count()
    applications_week = Application.query.filter(Application.applied_at >= week_ago).count()
    
    # Rating activity
    ratings_today = Rating.query.filter(Rating.created_at >= day_ago).count()
    ratings_week = Rating.query.filter(Rating.created_at >= week_ago).count()
    
    # Success metrics
    completed_gigs_week = Gig.query.filter(
        and_(Gig.status == "completed", Gig.updated_at >= week_ago)
    ).count()
    
    # Platform health indicators
    pending_gigs = Gig.query.filter(Gig.approval_status == "pending").count()
    flagged_ratings = Rating.query.filter(Rating.is_flagged == True).count() if hasattr(Rating, 'is_flagged') else 0
    
    return {
        "user_metrics": {
            "active_users_today": active_users_today,
            "new_users_today": new_users_today,
            "new_users_week": new_users_week,
            "total_users": User.query.count()
        },
        "gig_metrics": {
            "gigs_created_today": gigs_created_today,
            "gigs_created_week": gigs_created_week,
            "completed_gigs_week": completed_gigs_week,
            "pending_approval": pending_gigs,
            "total_gigs": Gig.query.count()
        },
        "engagement_metrics": {
            "applications_today": applications_today,
            "applications_week": applications_week,
            "ratings_today": ratings_today,
            "ratings_week": ratings_week,
            "total_applications": Application.query.count(),
            "total_ratings": Rating.query.count()
        },
        "moderation_metrics": {
            "pending_gigs": pending_gigs,
            "flagged_ratings": flagged_ratings,
            "recent_audit_actions": AuditLog.query.filter(AuditLog.created_at >= day_ago).count()
        }
    }


def get_revenue_analytics():
    """Get revenue and transaction analytics"""
    # This would integrate with payment systems when implemented
    # For now, return placeholder analytics based on completed gigs
    
    completed_gigs = Gig.query.filter(Gig.status == "completed").all()
    
    if not completed_gigs:
        return {
            "total_revenue": 0.0,
            "average_gig_value": 0.0,
            "commission_earned": 0.0,
            "transactions_count": 0,
            "revenue_trends": []
        }
    
    total_value = sum(float(gig.budget or 0) for gig in completed_gigs)
    commission_rate = 0.05  # 5% commission
    commission_earned = total_value * commission_rate
    
    return {
        "total_revenue": round(total_value, 2),
        "average_gig_value": round(total_value / len(completed_gigs), 2),
        "commission_earned": round(commission_earned, 2),
        "transactions_count": len(completed_gigs),
        "commission_rate": commission_rate,
        "currency": "USD"
    }


def get_user_engagement_analytics():
    """Get detailed user engagement analytics"""
    # Get user activity patterns
    total_users = User.query.count()
    students = User.query.filter(User.role == "student").count()
    providers = User.query.filter(User.role == "provider").count()
    
    # Get application success rates
    total_applications = Application.query.count()
    accepted_applications = Application.query.filter(Application.status == "accepted").count()
    
    # Get gig completion rates
    total_gigs = Gig.query.count()
    completed_gigs = Gig.query.filter(Gig.status == "completed").count()
    
    # Get most active users
    top_providers = db.session.query(
        User,
        func.count(Gig.id).label("gig_count")
    ).join(Gig, Gig.provider_id == User.id).filter(
        User.role == "provider"
    ).group_by(User.id).order_by(
        func.count(Gig.id).desc()
    ).limit(10).all()
    
    top_students = db.session.query(
        User,
        func.count(Application.id).label("application_count")
    ).join(Application, Application.student_id == User.id).filter(
        User.role == "student"
    ).group_by(User.id).order_by(
        func.count(Application.id).desc()
    ).limit(10).all()
    
    return {
        "user_distribution": {
            "total_users": total_users,
            "students": students,
            "providers": providers,
            "student_percentage": round((students / total_users) * 100, 1) if total_users > 0 else 0,
            "provider_percentage": round((providers / total_users) * 100, 1) if total_users > 0 else 0
        },
        "engagement_rates": {
            "application_success_rate": round((accepted_applications / total_applications) * 100, 1) if total_applications > 0 else 0,
            "gig_completion_rate": round((completed_gigs / total_gigs) * 100, 1) if total_gigs > 0 else 0,
            "average_applications_per_gig": round(total_applications / total_gigs, 1) if total_gigs > 0 else 0
        },
        "top_performers": {
            "most_active_providers": [
                {
                    "id": provider.id,
                    "name": provider.name,
                    "gig_count": gig_count,
                    "average_rating": float(provider.average_rating or 0.0)
                }
                for provider, gig_count in top_providers
            ],
            "most_active_students": [
                {
                    "id": student.id,
                    "name": student.name,
                    "application_count": app_count,
                    "average_rating": float(student.average_rating or 0.0)
                }
                for student, app_count in top_students
            ]
        }
    }
