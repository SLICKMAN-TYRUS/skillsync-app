from datetime import datetime
from .. import db


class Application(db.Model):
    __tablename__ = "applications"

    STATUS_CHOICES = {
        "pending",
        "reviewing",
        "shortlisted",
        "accepted",
        "rejected",
        "completed",
        "withdrawn",
    }

    id = db.Column(db.Integer, primary_key=True)
    gig_id = db.Column(
        db.Integer, db.ForeignKey("gigs.id", ondelete="CASCADE"), nullable=False
    )
    student_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status = db.Column(db.String(50), default="pending")
    notes = db.Column(db.Text)
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    selected_at = db.Column(db.DateTime)

    gig = db.relationship("Gig", back_populates="applications")
    student = db.relationship(
        "User", back_populates="applications", foreign_keys=[student_id]
    )
    notifications = db.relationship(
        "Notification", back_populates="related_application", lazy="dynamic"
    )

    @classmethod
    def validate_status(cls, status: str) -> None:
        if status not in cls.STATUS_CHOICES:
            raise ValueError(
                f"Invalid application status '{status}'. Allowed: {', '.join(sorted(cls.STATUS_CHOICES))}."
            )
