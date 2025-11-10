from typing import List, Dict
from sqlalchemy import and_, or_, func
from .. import db
from ..models import Gig, User, StudentSkill, Application
from .exceptions import ValidationError
from .user_service import get_user_by_id


def get_recommended_gigs_for_student(student_id: int, limit: int = 10) -> List[Gig]:
    """Get recommended gigs for a student based on their skills and activity"""
    student = get_user_by_id(student_id)
    if not student.is_role("student"):
        raise ValidationError("Only students can get gig recommendations")
    
    # Get student's skills
    student_skills = db.session.query(StudentSkill.skill_id).filter_by(
        student_id=student_id
    ).subquery()
    
    # Get skills as strings for text matching
    skill_names = db.session.query(StudentSkill).join("skill").filter_by(
        student_id=student_id
    ).all()
    
    # Start with base query for approved, open gigs
    base_query = Gig.query.filter(
        and_(
            Gig.approval_status == "approved",
            Gig.status == "open"
        )
    )
    
    # Exclude gigs the student has already applied to
    applied_gig_ids = db.session.query(Application.gig_id).filter_by(
        student_id=student_id
    ).subquery()
    
    base_query = base_query.filter(
        ~Gig.id.in_(applied_gig_ids)
    )
    
    recommended_gigs = []
    
    # 1. Skills-based matching (highest priority)
    if skill_names:
        skill_patterns = [f"%{skill.skill.name}%" for skill in skill_names]
        skills_query = base_query.filter(
            or_(
                *[Gig.title.ilike(pattern) for pattern in skill_patterns],
                *[Gig.description.ilike(pattern) for pattern in skill_patterns]
            )
        ).order_by(Gig.created_at.desc()).limit(limit // 2)
        
        recommended_gigs.extend(skills_query.all())
    
    # 2. Location-based matching
    if student.location:
        location_query = base_query.filter(
            Gig.location.ilike(f"%{student.location}%")
        ).filter(
            ~Gig.id.in_([gig.id for gig in recommended_gigs])
        ).order_by(Gig.created_at.desc()).limit(limit // 4)
        
        recommended_gigs.extend(location_query.all())
    
    # 3. Fill remaining slots with recent gigs
    remaining_slots = limit - len(recommended_gigs)
    if remaining_slots > 0:
        recent_query = base_query.filter(
            ~Gig.id.in_([gig.id for gig in recommended_gigs])
        ).order_by(Gig.created_at.desc()).limit(remaining_slots)
        
        recommended_gigs.extend(recent_query.all())
    
    return recommended_gigs[:limit]


def get_similar_gigs(gig_id: int, limit: int = 5) -> List[Gig]:
    """Get gigs similar to the given gig based on category and keywords"""
    from .gig_service import get_gig_by_id
    
    reference_gig = get_gig_by_id(gig_id)
    
    # Base query for approved, open gigs excluding the reference gig
    query = Gig.query.filter(
        and_(
            Gig.approval_status == "approved",
            Gig.status == "open",
            Gig.id != gig_id
        )
    )
    
    similar_gigs = []
    
    # 1. Same category
    if reference_gig.category:
        category_query = query.filter(
            Gig.category.ilike(f"%{reference_gig.category}%")
        ).order_by(Gig.created_at.desc()).limit(limit // 2)
        
        similar_gigs.extend(category_query.all())
    
    # 2. Similar keywords in title/description
    # Extract potential keywords from title (simple approach)
    title_words = reference_gig.title.lower().split()
    important_words = [word for word in title_words if len(word) > 3]
    
    if important_words:
        keyword_patterns = [f"%{word}%" for word in important_words[:3]]  # Top 3 words
        keyword_query = query.filter(
            or_(
                *[Gig.title.ilike(pattern) for pattern in keyword_patterns],
                *[Gig.description.ilike(pattern) for pattern in keyword_patterns]
            )
        ).filter(
            ~Gig.id.in_([gig.id for gig in similar_gigs])
        ).order_by(Gig.created_at.desc()).limit(limit // 2)
        
        similar_gigs.extend(keyword_query.all())
    
    # 3. Same location
    if reference_gig.location:
        location_query = query.filter(
            Gig.location.ilike(f"%{reference_gig.location}%")
        ).filter(
            ~Gig.id.in_([gig.id for gig in similar_gigs])
        ).order_by(Gig.created_at.desc()).limit(limit // 4)
        
        similar_gigs.extend(location_query.all())
    
    # 4. Fill remaining with recent gigs
    remaining_slots = limit - len(similar_gigs)
    if remaining_slots > 0:
        recent_query = query.filter(
            ~Gig.id.in_([gig.id for gig in similar_gigs])
        ).order_by(Gig.created_at.desc()).limit(remaining_slots)
        
        similar_gigs.extend(recent_query.all())
    
    return similar_gigs[:limit]


def get_trending_gigs(limit: int = 10) -> List[Dict]:
    """Get trending gigs based on application count and recency"""
    # Get gigs with application counts
    trending_query = db.session.query(
        Gig,
        func.count(Application.id).label('application_count')
    ).outerjoin(Application).filter(
        and_(
            Gig.approval_status == "approved",
            Gig.status == "open"
        )
    ).group_by(Gig.id).order_by(
        func.count(Application.id).desc(),
        Gig.created_at.desc()
    ).limit(limit)
    
    results = []
    for gig, app_count in trending_query.all():
        gig_dict = gig.to_dict()
        gig_dict['application_count'] = app_count
        gig_dict['trending_score'] = app_count * 2 + (
            1 if gig.created_at and gig.created_at.date() >= db.func.current_date() - db.text("interval '7 days'") else 0
        )
        results.append(gig_dict)
    
    return results


def get_student_recommendation_stats(student_id: int) -> Dict:
    """Get statistics about recommendations for a student"""
    student = get_user_by_id(student_id)
    if not student.is_role("student"):
        raise ValidationError("Only students can get recommendation stats")
    
    # Count total available gigs
    total_gigs = Gig.query.filter(
        and_(
            Gig.approval_status == "approved",
            Gig.status == "open"
        )
    ).count()
    
    # Count gigs already applied to
    applied_count = Application.query.filter_by(student_id=student_id).count()
    
    # Count skills-based matches
    student_skills = db.session.query(StudentSkill).join("skill").filter_by(
        student_id=student_id
    ).all()
    
    skill_matches = 0
    if student_skills:
        skill_patterns = [f"%{skill.skill.name}%" for skill in student_skills]
        skill_matches = Gig.query.filter(
            and_(
                Gig.approval_status == "approved",
                Gig.status == "open",
                or_(
                    *[Gig.title.ilike(pattern) for pattern in skill_patterns],
                    *[Gig.description.ilike(pattern) for pattern in skill_patterns]
                )
            )
        ).count()
    
    return {
        "total_available_gigs": total_gigs,
        "applied_gigs": applied_count,
        "skill_based_matches": skill_matches,
        "recommendation_score": skill_matches / max(total_gigs, 1) * 100,
        "skills_count": len(student_skills)
    }