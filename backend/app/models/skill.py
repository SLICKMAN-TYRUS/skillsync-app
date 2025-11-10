from datetime import datetime
from .. import db


class Skill(db.Model):
    __tablename__ = "skills"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    category = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student_skills = db.relationship(
        "StudentSkill", back_populates="skill", cascade="all, delete-orphan", lazy="dynamic"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class StudentSkill(db.Model):
    __tablename__ = "student_skills"

    PROFICIENCY_LEVELS = {"beginner", "intermediate", "advanced", "expert"}

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    skill_id = db.Column(
        db.Integer, db.ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    proficiency_level = db.Column(db.String(20), default="beginner")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    skill = db.relationship("Skill", back_populates="student_skills")
    student = db.relationship("User", back_populates="skills")

    @classmethod
    def validate_proficiency_level(cls, level: str) -> None:
        if level not in cls.PROFICIENCY_LEVELS:
            raise ValueError(
                f"Invalid proficiency level '{level}'. Allowed: {', '.join(sorted(cls.PROFICIENCY_LEVELS))}."
            )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "student_id": self.student_id,
            "skill": self.skill.to_dict() if self.skill else None,
            "proficiency_level": self.proficiency_level,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }