from datetime import datetime
from .. import db


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(50), nullable=False)
    resource_id = db.Column(db.Integer, nullable=False)
    details = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="audit_logs")
