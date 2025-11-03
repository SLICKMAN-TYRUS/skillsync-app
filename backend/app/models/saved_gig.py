from datetime import datetime
from .. import db


class SavedGig(db.Model):
    __tablename__ = "saved_gigs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    gig_id = db.Column(
        db.Integer, db.ForeignKey("gigs.id", ondelete="CASCADE"), nullable=False
    )
    saved_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="saved_gigs")
    gig = db.relationship("Gig", back_populates="saved_by")

    __table_args__ = (
        db.UniqueConstraint("user_id", "gig_id", name="uq_saved_gigs_user_gig"),
    )
