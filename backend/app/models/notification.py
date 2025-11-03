from datetime import datetime
from .. import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)
    related_gig_id = db.Column(
        db.Integer, db.ForeignKey("gigs.id", ondelete="SET NULL"), nullable=True
    )
    related_application_id = db.Column(
        db.Integer, db.ForeignKey("applications.id", ondelete="SET NULL"), nullable=True
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="notifications")
    related_gig = db.relationship("Gig", back_populates="notifications")
    related_application = db.relationship(
        "Application", back_populates="notifications"
    )
