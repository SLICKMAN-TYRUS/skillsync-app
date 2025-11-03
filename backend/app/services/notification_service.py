from typing import Dict, Iterable, List, Optional
from .. import db
from ..models import Notification
from .exceptions import AuthorizationError, NotFoundError


def create_notification(
    user_id: int,
    type: str,
    title: str,
    message: str,
    related_ids: Optional[Dict[str, int]] = None,
) -> Notification:
    related_ids = related_ids or {}
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        related_gig_id=related_ids.get("gig_id"),
        related_application_id=related_ids.get("application_id"),
    )
    db.session.add(notification)
    db.session.commit()
    return notification


def get_user_notifications(user_id: int, unread_only: bool = False) -> List[Notification]:
    query = Notification.query.filter_by(user_id=user_id)
    if unread_only:
        query = query.filter(Notification.read.is_(False))
    return query.order_by(Notification.created_at.desc()).all()


def mark_notification_read(notification_id: int, user_id: Optional[int] = None) -> Notification:
    notification = Notification.query.get(notification_id)
    if not notification:
        raise NotFoundError(f"Notification with id {notification_id} not found")
    if user_id is not None and notification.user_id != user_id:
        raise AuthorizationError("Cannot modify another user's notification")
    notification.read = True
    db.session.commit()
    return notification


def mark_all_notifications_read(user_id: int) -> int:
    updated = (
        Notification.query.filter_by(user_id=user_id, read=False)
        .update({Notification.read: True}, synchronize_session=False)
    )
    db.session.commit()
    return updated


def notify_application_received(
    provider_id: int, gig_id: int, application_id: int
) -> Notification:
    return create_notification(
        user_id=provider_id,
        type="application_received",
        title="New application received",
        message="A student has applied to your gig.",
        related_ids={"gig_id": gig_id, "application_id": application_id},
    )


def notify_application_status_change(
    student_id: int, gig_id: int, application_id: int, status: str
) -> Notification:
    return create_notification(
        user_id=student_id,
        type="application_status",
        title="Application status updated",
        message=f"Your application status is now '{status}'.",
        related_ids={"gig_id": gig_id, "application_id": application_id},
    )


def notify_gig_update(
    student_ids: Iterable[int], gig_id: int, update_type: str
) -> List[Notification]:
    notifications: List[Notification] = []
    for student_id in student_ids:
        notifications.append(
            create_notification(
                user_id=student_id,
                type="gig_update",
                title="Gig update",
                message=f"A gig you applied to has a new update: {update_type}.",
                related_ids={"gig_id": gig_id},
            )
        )
    return notifications


def notify_rating_received(user_id: int, rating_id: int) -> Notification:
    return create_notification(
        user_id=user_id,
        type="rating_received",
        title="New rating received",
        message="You have received a new rating.",
    )


def notify_gig_approved(provider_id: int, gig_id: int) -> Notification:
    return create_notification(
        user_id=provider_id,
        type="gig_approved",
        title="Gig approved",
        message="Your gig has been approved and is now visible to students.",
        related_ids={"gig_id": gig_id},
    )
