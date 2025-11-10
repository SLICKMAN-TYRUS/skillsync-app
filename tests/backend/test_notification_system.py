"""
Comprehensive tests for the enhanced notification system
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

from app.models import User, Notification
from app.models.notification_preferences import NotificationPreference, EmailQueue, PushNotification
from app.services.notification_service import (
    create_notification,
    create_notification_with_preferences,
    get_user_notification_preferences,
    update_notification_preference,
    update_bulk_notification_preferences,
    queue_email_notification,
    queue_push_notification,
    process_email_queue,
    process_push_notification_queue,
    send_bulk_notification,
    get_unread_notification_count,
    get_notification_summary,
    mark_notification_read,
    mark_all_notifications_read
)
from app.services.exceptions import ValidationError, AuthorizationError, NotFoundError


class TestNotificationPreferences:
    """Test notification preference management"""
    
    @pytest.fixture
    def sample_user(self, db_session):
        """Create a sample user for testing"""
        user = User(
            uid="test_user_123",
            name="Test User",
            email="test@example.com",
            role="student",
            average_rating=0.0
        )
        db_session.add(user)
        db_session.commit()
        return user
    
    def test_get_default_preferences(self, db_session, sample_user):
        """Test getting default notification preferences for new user"""
        preferences = get_user_notification_preferences(sample_user.id)
        
        # Should create default preferences
        assert len(preferences) > 0
        
        # Verify default types are included
        pref_types = [p.notification_type for p in preferences]
        expected_types = [
            "application_received", "application_status", "gig_update", 
            "gig_approved", "rating_received", "rating_warning", "role_changed"
        ]
        
        for expected_type in expected_types:
            assert expected_type in pref_types
    
    def test_update_single_preference(self, db_session, sample_user):
        """Test updating a single notification preference"""
        # Get initial preferences
        get_user_notification_preferences(sample_user.id)
        
        # Update specific preference
        updated_pref = update_notification_preference(
            user_id=sample_user.id,
            notification_type="application_received",
            email_enabled=False,
            push_enabled=True,
            in_app_enabled=True
        )
        
        assert updated_pref.email_enabled is False
        assert updated_pref.push_enabled is True
        assert updated_pref.in_app_enabled is True
        assert updated_pref.notification_type == "application_received"
    
    def test_update_bulk_preferences(self, db_session, sample_user):
        """Test updating multiple preferences at once"""
        # Get initial preferences
        get_user_notification_preferences(sample_user.id)
        
        # Update multiple preferences
        preferences_data = [
            {
                "notification_type": "application_received",
                "email_enabled": False,
                "push_enabled": True
            },
            {
                "notification_type": "gig_update",
                "email_enabled": True,
                "push_enabled": False
            }
        ]
        
        updated_prefs = update_bulk_notification_preferences(
            sample_user.id, preferences_data
        )
        
        assert len(updated_prefs) == 2
        
        # Find and verify each preference
        app_received_pref = next(p for p in updated_prefs if p.notification_type == "application_received")
        gig_update_pref = next(p for p in updated_prefs if p.notification_type == "gig_update")
        
        assert app_received_pref.email_enabled is False
        assert app_received_pref.push_enabled is True
        
        assert gig_update_pref.email_enabled is True
        assert gig_update_pref.push_enabled is False
    
    def test_create_new_preference_type(self, db_session, sample_user):
        """Test creating preference for new notification type"""
        new_pref = update_notification_preference(
            user_id=sample_user.id,
            notification_type="custom_notification",
            email_enabled=True,
            push_enabled=False,
            in_app_enabled=True
        )
        
        assert new_pref.notification_type == "custom_notification"
        assert new_pref.email_enabled is True
        assert new_pref.push_enabled is False
        assert new_pref.in_app_enabled is True


class TestNotificationCreationWithPreferences:
    """Test notification creation respecting user preferences"""
    
    @pytest.fixture
    def user_with_preferences(self, db_session):
        """Create user with specific notification preferences"""
        user = User(
            uid="test_user_456",
            name="Pref User",
            email="prefuser@example.com",
            role="provider",
            average_rating=0.0
        )
        db_session.add(user)
        db_session.commit()
        
        # Set specific preferences
        pref = NotificationPreference(
            user_id=user.id,
            notification_type="application_received",
            email_enabled=True,
            push_enabled=False,
            in_app_enabled=True
        )
        db_session.add(pref)
        db_session.commit()
        
        return user
    
    @patch('app.services.notification_service.queue_email_notification')
    @patch('app.services.notification_service.queue_push_notification')
    def test_notification_with_preferences(self, mock_push, mock_email, db_session, user_with_preferences):
        """Test notification creation respecting preferences"""
        mock_email.return_value = 123
        mock_push.return_value = None  # Push disabled
        
        result = create_notification_with_preferences(
            user_id=user_with_preferences.id,
            type="application_received",
            title="New Application",
            message="You have a new application",
            email_template="application_received"
        )
        
        # Should create in-app and email notifications, but not push
        created_types = [item["type"] for item in result["created"]]
        assert "in_app" in created_types
        assert "email" in created_types
        assert "push" not in created_types
        
        mock_email.assert_called_once()
        mock_push.assert_not_called()
    
    def test_notification_default_preferences(self, db_session, user_with_preferences):
        """Test notification creation with default preferences for new type"""
        with patch('app.services.notification_service.queue_email_notification') as mock_email, \
             patch('app.services.notification_service.queue_push_notification') as mock_push:
            
            mock_email.return_value = 124
            mock_push.return_value = 125
            
            result = create_notification_with_preferences(
                user_id=user_with_preferences.id,
                type="new_notification_type",  # Not in preferences yet
                title="New Type",
                message="New notification type"
            )
            
            # Should create all types (defaults to all enabled)
            created_types = [item["type"] for item in result["created"]]
            assert "in_app" in created_types
            assert "email" in created_types
            assert "push" in created_types


class TestEmailNotificationSystem:
    """Test email notification queueing and processing"""
    
    @pytest.fixture
    def user_with_email(self, db_session):
        """Create user with email for testing"""
        user = User(
            uid="email_user_789",
            name="Email User",
            email="emailuser@example.com",
            role="student",
            average_rating=0.0
        )
        db_session.add(user)
        db_session.commit()
        return user
    
    def test_queue_email_notification(self, db_session, user_with_email):
        """Test queueing email notifications"""
        email_id = queue_email_notification(
            user_id=user_with_email.id,
            subject="Test Email",
            message="Test email message",
            template="test_template",
            template_data={"name": "Test"}
        )
        
        assert email_id is not None
        
        # Verify email was queued
        email = EmailQueue.query.get(email_id)
        assert email.user_id == user_with_email.id
        assert email.subject == "Test Email"
        assert email.body == "Test email message"
        assert email.template == "test_template"
        assert email.status == "pending"
    
    def test_queue_email_no_user_email(self, db_session):
        """Test queueing email for user without email"""
        user_no_email = User(
            uid="no_email_user",
            name="No Email User", 
            email="",  # Empty email string (not None due to NOT NULL constraint)
            role="student",
            average_rating=0.0
        )
        db_session.add(user_no_email)
        db_session.commit()
        
        email_id = queue_email_notification(
            user_id=user_no_email.id,
            subject="Test",
            message="Test"
        )
        
        # Should return None for user without email
        assert email_id is None
    
    @patch('app.services.notification_service.send_email_mock')
    def test_process_email_queue_success(self, mock_send, db_session, user_with_email):
        """Test successful email queue processing"""
        mock_send.return_value = True
        
        # Queue an email
        email_id = queue_email_notification(
            user_id=user_with_email.id,
            subject="Test Process",
            message="Test processing"
        )
        
        # Process the queue
        results = process_email_queue(limit=10)
        
        assert results["sent"] == 1
        assert results["failed"] == 0
        
        # Verify email status updated
        email = EmailQueue.query.get(email_id)
        assert email.status == "sent"
        assert email.sent_at is not None
    
    @patch('app.services.notification_service.send_email_mock')
    def test_process_email_queue_failure(self, mock_send, db_session, user_with_email):
        """Test email queue processing with failures"""
        mock_send.return_value = False
        
        # Queue an email
        email_id = queue_email_notification(
            user_id=user_with_email.id,
            subject="Test Fail",
            message="Test failure"
        )
        
        # Process multiple times to trigger failure after max attempts
        for _ in range(3):
            process_email_queue(limit=10)
        
        # Verify email marked as failed after max attempts
        email = EmailQueue.query.get(email_id)
        assert email.status == "failed"
        assert email.attempts == 3


class TestPushNotificationSystem:
    """Test push notification queueing and processing"""
    
    @pytest.fixture
    def sample_user(self, db_session):
        """Create sample user for push testing"""
        user = User(
            uid="push_user_123",
            name="Push User",
            email="pushuser@example.com",
            role="provider",
            average_rating=0.0
        )
        db_session.add(user)
        db_session.commit()
        return user
    
    def test_queue_push_notification(self, db_session, sample_user):
        """Test queueing push notifications"""
        push_id = queue_push_notification(
            user_id=sample_user.id,
            title="Push Test",
            body="Push notification body",
            data={"action": "open_gig", "gig_id": 123}
        )
        
        assert push_id is not None
        
        # Verify push notification was queued
        push = PushNotification.query.get(push_id)
        assert push.user_id == sample_user.id
        assert push.title == "Push Test"
        assert push.body == "Push notification body"
        assert push.data["action"] == "open_gig"
        assert push.status == "pending"
    
    @patch('app.services.notification_service.send_push_notification_mock')
    def test_process_push_queue(self, mock_send, db_session, sample_user):
        """Test push notification queue processing"""
        mock_send.return_value = True
        
        # Queue a push notification
        push_id = queue_push_notification(
            user_id=sample_user.id,
            title="Process Test",
            body="Test processing"
        )
        
        # Process the queue
        results = process_push_notification_queue(limit=10)
        
        assert results["sent"] == 1
        assert results["failed"] == 0
        
        # Verify push status updated
        push = PushNotification.query.get(push_id)
        assert push.status == "sent"
        assert push.sent_at is not None


class TestBulkNotificationSystem:
    """Test bulk notification functionality"""
    
    @pytest.fixture
    def multiple_users(self, db_session):
        """Create multiple users for bulk testing"""
        users = []
        for i in range(3):
            user = User(
                uid=f"bulk_user_{i}",
                name=f"Bulk User {i}",
                email=f"bulk{i}@example.com",
                role="student",
                average_rating=0.0
            )
            users.append(user)
            db_session.add(user)
        
        admin = User(
            uid="admin_bulk",
            name="Admin User",
            email="admin@example.com",
            role="admin",
            average_rating=0.0
        )
        users.append(admin)
        db_session.add(admin)
        
        db_session.commit()
        return users
    
    @patch('app.services.notification_service.create_notification_with_preferences')
    def test_send_bulk_notification(self, mock_create, db_session, multiple_users):
        """Test sending bulk notifications"""
        admin = multiple_users[-1]  # Last user is admin
        target_users = multiple_users[:-1]  # All except admin
        
        mock_create.return_value = {
            "created": [
                {"type": "in_app", "id": 1},
                {"type": "email", "id": 2}
            ]
        }
        
        user_ids = [user.id for user in target_users]
        
        results = send_bulk_notification(
            user_ids=user_ids,
            notification_type="system_announcement",
            title="System Maintenance",
            message="Scheduled maintenance tonight",
            admin_id=admin.id
        )
        
        assert results["total_users"] == 3
        assert results["in_app_sent"] == 3  # 3 users * 1 in_app each
        assert results["emails_queued"] == 3  # 3 users * 1 email each
        assert len(results["errors"]) == 0
        
        # Verify mock was called for each user
        assert mock_create.call_count == 3


class TestNotificationUtilities:
    """Test notification utility functions"""
    
    @pytest.fixture
    def user_with_notifications(self, db_session):
        """Create user with sample notifications"""
        user = User(
            uid="notif_user",
            name="Notification User",
            email="notif@example.com",
            role="student",
            average_rating=0.0
        )
        db_session.add(user)
        db_session.commit()
        
        # Create notifications
        notifications = []
        for i in range(5):
            notif = Notification(
                user_id=user.id,
                type="test_notification",
                title=f"Test {i}",
                message=f"Test message {i}",
                read=(i < 2)  # First 2 are read, last 3 unread
            )
            notifications.append(notif)
            db_session.add(notif)
        
        db_session.commit()
        return user, notifications
    
    def test_get_unread_notification_count(self, user_with_notifications):
        """Test getting unread notification count"""
        user, notifications = user_with_notifications
        
        count = get_unread_notification_count(user.id)
        assert count == 3  # 3 unread notifications
    
    def test_mark_notification_read(self, db_session, user_with_notifications):
        """Test marking single notification as read"""
        user, notifications = user_with_notifications
        unread_notif = next(n for n in notifications if not n.read)
        
        marked_notif = mark_notification_read(unread_notif.id, user.id)
        
        assert marked_notif.read is True
        assert marked_notif.id == unread_notif.id
    
    def test_mark_all_notifications_read(self, db_session, user_with_notifications):
        """Test marking all notifications as read"""
        user, notifications = user_with_notifications
        
        updated_count = mark_all_notifications_read(user.id)
        
        assert updated_count == 3  # 3 notifications were marked as read
        
        # Verify all notifications are now read
        final_count = get_unread_notification_count(user.id)
        assert final_count == 0
    
    def test_get_notification_summary(self, user_with_notifications):
        """Test getting notification summary"""
        user, notifications = user_with_notifications
        
        summary = get_notification_summary(user.id)
        
        assert summary["total_notifications"] == 5
        assert summary["unread_count"] == 3
        assert "recent_by_type" in summary
        assert "last_30_days" in summary
    
    def test_mark_notification_unauthorized(self, db_session, user_with_notifications):
        """Test marking notification from different user"""
        user, notifications = user_with_notifications
        
        # Create another user
        other_user = User(
            uid="other_user",
            name="Other User",
            email="other@example.com",
            role="provider",
            average_rating=0.0
        )
        db_session.add(other_user)
        db_session.commit()
        
        # Try to mark notification belonging to first user
        with pytest.raises(AuthorizationError):
            mark_notification_read(notifications[0].id, other_user.id)
    
    def test_mark_nonexistent_notification(self):
        """Test marking non-existent notification"""
        with pytest.raises(NotFoundError):
            mark_notification_read(99999, 1)