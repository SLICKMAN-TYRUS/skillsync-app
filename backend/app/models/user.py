from datetime import datetime
from .. import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    uid = db.Column(db.String(128), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    role = db.Column(db.String(50), nullable=False)  # student, provider, admin
    profile_photo = db.Column(db.String(255))
    location = db.Column(db.String(255))
    bio = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    average_rating = db.Column(db.Numeric(3, 2), default=0.0)

    provided_gigs = db.relationship(
        "Gig", back_populates="provider", cascade="all, delete-orphan", lazy="dynamic"
    )
    applications = db.relationship(
        "Application",
        back_populates="student",
        cascade="all, delete-orphan",
        lazy="dynamic",
        foreign_keys="Application.student_id",
    )
    ratings_given = db.relationship(
        "Rating",
        back_populates="rater",
        cascade="all, delete-orphan",
        lazy="dynamic",
        foreign_keys="Rating.rater_id",
    )
    ratings_received = db.relationship(
        "Rating",
        back_populates="ratee",
        cascade="all, delete-orphan",
        lazy="dynamic",
        foreign_keys="Rating.ratee_id",
    )
    notifications = db.relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan", lazy="dynamic"
    )
    saved_gigs = db.relationship(
        "SavedGig", back_populates="user", cascade="all, delete-orphan", lazy="dynamic"
    )
    feedback_entries = db.relationship(
        "Feedback", back_populates="user", cascade="all", lazy="dynamic"
    )
    audit_logs = db.relationship(
        "AuditLog", back_populates="user", cascade="all", lazy="dynamic"
    )

    def is_role(self, *roles: str) -> bool:
        """True when the user role matches any supplied role."""
        normalized = {role.lower() for role in roles}
        return self.role.lower() in normalized
