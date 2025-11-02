from datetime import datetime
from .. import db


class Feedback(db.Model):
    __tablename__ = "feedback"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    category = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default="pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="feedback_entries")
