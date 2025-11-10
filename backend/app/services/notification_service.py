from typing import Dict, Iterable, List, Optional
from datetime import datetime, timedelta
from .. import db
from ..models import Notification
from ..models.notification_preferences import NotificationPreference, EmailQueue, PushNotification
from .exceptions import AuthorizationError, NotFoundError, ValidationError
from .user_service import get_user_by_id


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


# Notification Preferences Management
def get_user_notification_preferences(user_id: int) -> List[NotificationPreference]:
    """Get user's notification preferences, creating defaults if none exist"""
    preferences = NotificationPreference.query.filter_by(user_id=user_id).all()
    
    if not preferences:
        # Create default preferences for new user
        preferences = create_default_notification_preferences(user_id)
    
    return preferences


def create_default_notification_preferences(user_id: int) -> List[NotificationPreference]:
    """Create default notification preferences for a user"""
    default_prefs = NotificationPreference.get_default_preferences()
    preferences = []
    
    for pref_data in default_prefs:
        preference = NotificationPreference(
            user_id=user_id,
            **pref_data
        )
        db.session.add(preference)
        preferences.append(preference)
    
    db.session.commit()
    return preferences


def update_notification_preference(user_id: int, notification_type: str, **settings) -> NotificationPreference:
    """Update a specific notification preference"""
    preference = NotificationPreference.query.filter_by(
        user_id=user_id, 
        notification_type=notification_type
    ).first()
    
    if not preference:
        # Create new preference if it doesn't exist
        preference = NotificationPreference(
            user_id=user_id,
            notification_type=notification_type
        )
        db.session.add(preference)
    
    # Update settings
    for key, value in settings.items():
        if hasattr(preference, key):
            setattr(preference, key, value)
    
    preference.updated_at = datetime.utcnow()
    db.session.commit()
    return preference


def update_bulk_notification_preferences(user_id: int, preferences_data: List[Dict]) -> List[NotificationPreference]:
    """Update multiple notification preferences at once"""
    updated_preferences = []
    
    for pref_data in preferences_data:
        notification_type = pref_data.get("notification_type")
        if not notification_type:
            continue
            
        settings = {k: v for k, v in pref_data.items() if k != "notification_type"}
        preference = update_notification_preference(user_id, notification_type, **settings)
        updated_preferences.append(preference)
    
    return updated_preferences


# Enhanced notification creation with preference checking
def create_notification_with_preferences(
    user_id: int,
    type: str,
    title: str,
    message: str,
    related_ids: Optional[Dict[str, int]] = None,
    email_template: Optional[str] = None,
    email_data: Optional[Dict] = None,
) -> Dict:
    """Create notification respecting user preferences and send via multiple channels"""
    
    # Get user preferences
    preference = NotificationPreference.query.filter_by(
        user_id=user_id, 
        notification_type=type
    ).first()
    
    if not preference:
        # Create default preference if none exists
        preference = NotificationPreference(
            user_id=user_id,
            notification_type=type,
            email_enabled=True,
            push_enabled=True,
            in_app_enabled=True
        )
        db.session.add(preference)
        db.session.commit()
    
    results = {"created": []}
    
    # Create in-app notification if enabled
    if preference.in_app_enabled:
        notification = create_notification(user_id, type, title, message, related_ids)
        results["created"].append({"type": "in_app", "id": notification.id})
    
    # Queue email notification if enabled
    if preference.email_enabled:
        email_id = queue_email_notification(
            user_id, title, message, email_template, email_data
        )
        if email_id:
            results["created"].append({"type": "email", "id": email_id})
    
    # Queue push notification if enabled
    if preference.push_enabled:
        push_id = queue_push_notification(user_id, title, message, related_ids)
        if push_id:
            results["created"].append({"type": "push", "id": push_id})
    
    return results


# Email notification system
def queue_email_notification(
    user_id: int, 
    subject: str, 
    message: str, 
    template: Optional[str] = None,
    template_data: Optional[Dict] = None
) -> Optional[int]:
    """Queue an email notification for sending"""
    try:
        user = get_user_by_id(user_id)
        if not user.email:
            return None
        
        email = EmailQueue(
            user_id=user_id,
            email_address=user.email,
            subject=subject,
            body=message,
            template=template,
            template_data=template_data or {}
        )
        db.session.add(email)
        db.session.commit()
        return email.id
    except Exception:
        return None


def process_email_queue(limit: int = 50) -> Dict:
    """Process pending emails in the queue"""
    pending_emails = EmailQueue.query.filter_by(status="pending").limit(limit).all()
    
    results = {"sent": 0, "failed": 0, "errors": []}
    
    for email in pending_emails:
        try:
            # Here you would integrate with an email service like SendGrid, SES, etc.
            # For now, we'll simulate the sending process
            success = send_email_mock(email)
            
            if success:
                email.status = "sent"
                email.sent_at = datetime.utcnow()
                results["sent"] += 1
            else:
                email.attempts += 1
                email.last_attempt = datetime.utcnow()
                if email.attempts >= 3:
                    email.status = "failed"
                    results["failed"] += 1
        except Exception as e:
            email.attempts += 1
            email.last_attempt = datetime.utcnow()
            results["errors"].append(f"Email {email.id}: {str(e)}")
            if email.attempts >= 3:
                email.status = "failed"
                results["failed"] += 1
    
    db.session.commit()
    return results


def send_email_mock(email: EmailQueue) -> bool:
    """Mock email sending function - replace with actual email service integration"""
    # In a real implementation, this would integrate with SendGrid, AWS SES, etc.
    # For demo purposes, we'll just return True
    return True


# Push notification system
def queue_push_notification(
    user_id: int, 
    title: str, 
    body: str, 
    data: Optional[Dict] = None
) -> Optional[int]:
    """Queue a push notification for sending"""
    try:
        # You would get device tokens from user registration data
        push_notification = PushNotification(
            user_id=user_id,
            title=title,
            body=body,
            data=data or {}
        )
        db.session.add(push_notification)
        db.session.commit()
        return push_notification.id
    except Exception:
        return None


def process_push_notification_queue(limit: int = 100) -> Dict:
    """Process pending push notifications"""
    pending_pushes = PushNotification.query.filter_by(status="pending").limit(limit).all()
    
    results = {"sent": 0, "failed": 0, "errors": []}
    
    for push in pending_pushes:
        try:
            # Here you would integrate with FCM, APNS, etc.
            success = send_push_notification_mock(push)
            
            if success:
                push.status = "sent"
                push.sent_at = datetime.utcnow()
                results["sent"] += 1
            else:
                push.attempts += 1
                push.last_attempt = datetime.utcnow()
                if push.attempts >= 3:
                    push.status = "failed"
                    results["failed"] += 1
        except Exception as e:
            push.attempts += 1
            push.last_attempt = datetime.utcnow()
            results["errors"].append(f"Push {push.id}: {str(e)}")
            if push.attempts >= 3:
                push.status = "failed"
                results["failed"] += 1
    
    db.session.commit()
    return results


def send_push_notification_mock(push: PushNotification) -> bool:
    """Mock push notification sending - replace with FCM/APNS integration"""
    # In a real implementation, this would integrate with Firebase Cloud Messaging, APNS, etc.
    return True


# Bulk notification system for admins
def send_bulk_notification(
    user_ids: List[int], 
    notification_type: str,
    title: str, 
    message: str,
    admin_id: int,
    email_template: Optional[str] = None
) -> Dict:
    """Send bulk notifications to multiple users (admin only)"""
    results = {
        "total_users": len(user_ids),
        "in_app_sent": 0,
        "emails_queued": 0,
        "push_queued": 0,
        "errors": []
    }
    
    for user_id in user_ids:
        try:
            notification_result = create_notification_with_preferences(
                user_id=user_id,
                type=notification_type,
                title=title,
                message=message,
                email_template=email_template
            )
            
            for created in notification_result["created"]:
                if created["type"] == "in_app":
                    results["in_app_sent"] += 1
                elif created["type"] == "email":
                    results["emails_queued"] += 1
                elif created["type"] == "push":
                    results["push_queued"] += 1
                    
        except Exception as e:
            results["errors"].append(f"User {user_id}: {str(e)}")
    
    # Log bulk notification in audit log
    from .admin_service import _log_action
    _log_action(
        admin_id,
        "bulk_notification_sent",
        "notification",
        0,
        {
            "notification_type": notification_type,
            "title": title,
            "total_recipients": len(user_ids),
            "results": results
        }
    )
    
    return results


# Real-time notification helpers
def get_unread_notification_count(user_id: int) -> int:
    """Get count of unread notifications for a user"""
    return Notification.query.filter_by(user_id=user_id, read=False).count()


def get_recent_notifications(user_id: int, limit: int = 10) -> List[Notification]:
    """Get recent notifications for real-time updates"""
    return Notification.query.filter_by(user_id=user_id).order_by(
        Notification.created_at.desc()
    ).limit(limit).all()


def get_notification_summary(user_id: int) -> Dict:
    """Get notification summary for dashboard"""
    total_notifications = Notification.query.filter_by(user_id=user_id).count()
    unread_count = get_unread_notification_count(user_id)
    
    # Get notifications by type for the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_by_type = db.session.query(
        Notification.type,
        db.func.count(Notification.id)
    ).filter(
        Notification.user_id == user_id,
        Notification.created_at >= thirty_days_ago
    ).group_by(Notification.type).all()
    
    return {
        "total_notifications": total_notifications,
        "unread_count": unread_count,
        "recent_by_type": dict(recent_by_type),
        "last_30_days": len(recent_by_type)
    }
