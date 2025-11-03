from datetime import datetime
from .. import db


class Gig(db.Model):
    __tablename__ = "gigs"

    STATUS_CHOICES = {"open", "in_progress", "closed", "completed", "cancelled"}
    APPROVAL_CHOICES = {"pending", "approved", "rejected"}

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    budget = db.Column(db.Numeric(10, 2))
    category = db.Column(db.String(100))
    location = db.Column(db.String(255))
    provider_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    deadline = db.Column(db.Date)
    status = db.Column(db.String(50), default="open")
    approval_status = db.Column(db.String(50), default="pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    provider = db.relationship("User", back_populates="provided_gigs")
    applications = db.relationship(
        "Application",
        back_populates="gig",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    ratings = db.relationship(
        "Rating",
        back_populates="gig",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    saved_by = db.relationship(
        "SavedGig",
        back_populates="gig",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    notifications = db.relationship(
        "Notification", back_populates="related_gig", lazy="dynamic"
    )

    @classmethod
    def validate_status(cls, status: str) -> None:
        if status not in cls.STATUS_CHOICES:
            raise ValueError(
                f"Invalid status '{status}'. Allowed: {', '.join(sorted(cls.STATUS_CHOICES))}."
            )

    @classmethod
    def validate_approval_status(cls, approval_status: str) -> None:
        if approval_status not in cls.APPROVAL_CHOICES:
            raise ValueError(
                "Invalid approval_status '{}'. Allowed: {}.".format(
                    approval_status, ", ".join(sorted(cls.APPROVAL_CHOICES))
                )
            )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "budget": float(self.budget) if self.budget is not None else None,
            "category": self.category,
            "location": self.location,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "status": self.status,
            "approval_status": self.approval_status,
            "provider_id": self.provider_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
