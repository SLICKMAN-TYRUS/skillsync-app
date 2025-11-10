from datetime import datetime
from .. import db


class Rating(db.Model):
    __tablename__ = "ratings"

    id = db.Column(db.Integer, primary_key=True)
    rater_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    ratee_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    gig_id = db.Column(
        db.Integer, db.ForeignKey("gigs.id", ondelete="CASCADE"), nullable=False
    )
    score = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Moderation fields
    is_flagged = db.Column(db.Boolean, default=False)
    flag_reason = db.Column(db.String(255))
    moderation_status = db.Column(db.String(50), default="pending")  # pending, approved, rejected
    moderated_at = db.Column(db.DateTime)
    moderated_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"))

    rater = db.relationship("User", foreign_keys=[rater_id], back_populates="ratings_given")
    ratee = db.relationship("User", foreign_keys=[ratee_id], back_populates="ratings_received")
    gig = db.relationship("Gig", back_populates="ratings")
    moderator = db.relationship("User", foreign_keys=[moderated_by])

    @staticmethod
    def validate_score(score: int) -> None:
        if score < 1 or score > 5:
            raise ValueError("Score must be an integer between 1 and 5")
