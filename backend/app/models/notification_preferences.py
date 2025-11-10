from datetime import datetime
from .. import db


class NotificationPreference(db.Model):
    __tablename__ = "notification_preferences"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)
    email_enabled = db.Column(db.Boolean, default=True)
    push_enabled = db.Column(db.Boolean, default=True)
    in_app_enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User")

    @staticmethod
    def get_default_preferences():
        """Default notification preferences for new users"""
        return [
            {"notification_type": "application_received", "email_enabled": True, "push_enabled": True, "in_app_enabled": True},
            {"notification_type": "application_status", "email_enabled": True, "push_enabled": True, "in_app_enabled": True},
            {"notification_type": "gig_update", "email_enabled": False, "push_enabled": True, "in_app_enabled": True},
            {"notification_type": "gig_approved", "email_enabled": True, "push_enabled": True, "in_app_enabled": True},
            {"notification_type": "rating_received", "email_enabled": False, "push_enabled": True, "in_app_enabled": True},
            {"notification_type": "rating_warning", "email_enabled": True, "push_enabled": True, "in_app_enabled": True},
            {"notification_type": "role_changed", "email_enabled": True, "push_enabled": True, "in_app_enabled": True},
        ]


class EmailQueue(db.Model):
    __tablename__ = "email_queue"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email_address = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    body = db.Column(db.Text, nullable=False)
    template = db.Column(db.String(100))
    template_data = db.Column(db.JSON)
    status = db.Column(db.String(20), default="pending")  # pending, sent, failed
    attempts = db.Column(db.Integer, default=0)
    last_attempt = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sent_at = db.Column(db.DateTime)

    user = db.relationship("User")


class PushNotification(db.Model):
    __tablename__ = "push_notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_token = db.Column(db.String(255))
    platform = db.Column(db.String(20))  # ios, android, web
    title = db.Column(db.String(255), nullable=False)
    body = db.Column(db.Text, nullable=False)
    data = db.Column(db.JSON)
    status = db.Column(db.String(20), default="pending")  # pending, sent, failed
    attempts = db.Column(db.Integer, default=0)
    last_attempt = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sent_at = db.Column(db.DateTime)

    user = db.relationship("User")