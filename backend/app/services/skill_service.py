from typing import Dict, List, Optional
from .. import db
from ..models import Skill, StudentSkill, User
from .exceptions import NotFoundError, ValidationError
from .user_service import get_user_by_id


def create_skill(name: str, category: Optional[str] = None) -> Skill:
    """Create a new skill"""
    existing = Skill.query.filter_by(name=name.lower()).first()
    if existing:
        raise ValidationError(f"Skill '{name}' already exists")
    
    skill = Skill(name=name.lower(), category=category)
    db.session.add(skill)
    db.session.commit()
    return skill


def get_skill_by_name(name: str) -> Optional[Skill]:
    """Get skill by name"""
    return Skill.query.filter_by(name=name.lower()).first()


def get_or_create_skill(name: str, category: Optional[str] = None) -> Skill:
    """Get existing skill or create new one"""
    skill = get_skill_by_name(name)
    if not skill:
        skill = create_skill(name, category)
    return skill


def add_student_skill(student_id: int, skill_name: str, proficiency_level: str = "beginner") -> StudentSkill:
    """Add a skill to a student"""
    user = get_user_by_id(student_id)
    if not user.is_role("student"):
        raise ValidationError("Only students can have skills")
    
    try:
        StudentSkill.validate_proficiency_level(proficiency_level)
    except ValueError as e:
        raise ValidationError(str(e))
    
    skill = get_or_create_skill(skill_name)
    
    # Check if student already has this skill
    existing = StudentSkill.query.filter_by(
        student_id=student_id, skill_id=skill.id
    ).first()
    
    if existing:
        raise ValidationError(f"Student already has skill '{skill_name}'")
    
    student_skill = StudentSkill(
        student_id=student_id,
        skill_id=skill.id,
        proficiency_level=proficiency_level
    )
    
    db.session.add(student_skill)
    db.session.commit()
    return student_skill


def update_student_skill(student_id: int, skill_name: str, proficiency_level: str) -> StudentSkill:
    """Update a student's skill proficiency level"""
    try:
        StudentSkill.validate_proficiency_level(proficiency_level)
    except ValueError as e:
        raise ValidationError(str(e))
    
    skill = get_skill_by_name(skill_name)
    if not skill:
        raise NotFoundError(f"Skill '{skill_name}' not found")
    
    student_skill = StudentSkill.query.filter_by(
        student_id=student_id, skill_id=skill.id
    ).first()
    
    if not student_skill:
        raise NotFoundError(f"Student does not have skill '{skill_name}'")
    
    student_skill.proficiency_level = proficiency_level
    db.session.commit()
    return student_skill


def remove_student_skill(student_id: int, skill_name: str) -> None:
    """Remove a skill from a student"""
    skill = get_skill_by_name(skill_name)
    if not skill:
        raise NotFoundError(f"Skill '{skill_name}' not found")
    
    student_skill = StudentSkill.query.filter_by(
        student_id=student_id, skill_id=skill.id
    ).first()
    
    if not student_skill:
        raise NotFoundError(f"Student does not have skill '{skill_name}'")
    
    db.session.delete(student_skill)
    db.session.commit()


def get_student_skills(student_id: int) -> List[StudentSkill]:
    """Get all skills for a student"""
    return StudentSkill.query.filter_by(student_id=student_id).all()


def get_all_skills(category: Optional[str] = None) -> List[Skill]:
    """Get all skills, optionally filtered by category"""
    query = Skill.query
    if category:
        query = query.filter_by(category=category)
    return query.order_by(Skill.name).all()


def search_skills(search_term: str) -> List[Skill]:
    """Search skills by name"""
    return Skill.query.filter(
        Skill.name.ilike(f"%{search_term.lower()}%")
    ).order_by(Skill.name).all()


def update_student_availability(student_id: int, availability_status: str) -> None:
    """Update student's availability status"""
    valid_statuses = {"available", "busy", "not_available"}
    if availability_status not in valid_statuses:
        raise ValidationError(
            f"Invalid availability status. Allowed: {', '.join(sorted(valid_statuses))}"
        )
    
    user = get_user_by_id(student_id)
    if not user.is_role("student"):
        raise ValidationError("Only students can set availability status")
    
    # Since we don't have a Student model yet, we'll store this in the user table for now
    # This would need to be updated once proper Student model is created
    user.availability_status = availability_status
    db.session.commit()