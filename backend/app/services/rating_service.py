from typing import List, Optional, Dict
from datetime import datetime, timedelta
from sqlalchemy import func, and_, desc, or_

from .. import db
from ..models import Application, Gig, Rating, User
from .exceptions import AuthorizationError, NotFoundError, ValidationError
from .gig_service import get_gig_by_id
from .user_service import get_user_by_id, update_user_average_rating


def get_rating_by_gig_and_users(gig_id: int, rater_id: int, ratee_id: int) -> Optional[Rating]:
    return Rating.query.filter_by(
        gig_id=gig_id, rater_id=rater_id, ratee_id=ratee_id
    ).first()


def _validate_rating_context(rater: User, ratee: User, gig_id: int) -> None:
    if rater.id == ratee.id:
        raise ValidationError("Users cannot rate themselves")

    gig = get_gig_by_id(gig_id)
    if gig.status != "completed":
        raise ValidationError("Ratings are only allowed after the gig is completed")

    # Ensure rater participated in the gig
    if rater.role == "provider":
        if ratee.role != "student":
            raise ValidationError("Providers can only rate students")
        # Provider rating student; ensure student was accepted
        selected_application = (
            Application.query.filter_by(gig_id=gig_id, student_id=ratee.id)
            .filter(Application.status.in_(("accepted", "completed")))
            .first()
        )
        if not selected_application:
            raise AuthorizationError("Provider can only rate the accepted student")
        if gig.provider_id != rater.id:
            raise AuthorizationError("Providers can only rate their own gigs")
    elif rater.role == "student":
        if ratee.role != "provider":
            raise ValidationError("Students can only rate providers")
        # Student rating provider; ensure they were accepted for the gig
        selected_application = (
            Application.query.filter_by(gig_id=gig_id, student_id=rater.id)
            .filter(Application.status.in_(("accepted", "completed")))
            .first()
        )
        if not selected_application:
            raise AuthorizationError("Only accepted students can rate the provider")
        if gig.provider_id != ratee.id:
            raise ValidationError("Student ratings must target the gig's provider")
    else:
        raise AuthorizationError("Only students and providers can issue ratings")


def create_rating(
    rater_id: int,
    ratee_id: int,
    gig_id: int,
    score: int,
    comment: str = "",
) -> Rating:
    rater = get_user_by_id(rater_id)
    ratee = get_user_by_id(ratee_id)
    _validate_rating_context(rater, ratee, gig_id)

    if get_rating_by_gig_and_users(gig_id, rater_id, ratee_id):
        raise ValidationError("A rating for this user and gig already exists")

    if score is None:
        raise ValidationError("Score is required")
    try:
        Rating.validate_score(score)
    except ValueError as exc:
        raise ValidationError(str(exc))

    rating = Rating(
        rater_id=rater_id,
        ratee_id=ratee_id,
        gig_id=gig_id,
        score=score,
        comment=comment,
    )
    db.session.add(rating)
    db.session.commit()
    update_user_average_rating(ratee_id)
    return rating


def get_user_ratings(user_id: int) -> List[Rating]:
    get_user_by_id(user_id)
    return Rating.query.filter_by(ratee_id=user_id).order_by(Rating.created_at.desc()).all()


def calculate_average_rating(user_id: int) -> float:
    user = update_user_average_rating(user_id)
    return float(user.average_rating or 0.0)


def get_rating_analytics(user_id: int) -> Dict:
    """Get comprehensive rating analytics for a user"""
    user = get_user_by_id(user_id)
    
    # Basic rating stats
    ratings_received = Rating.query.filter_by(ratee_id=user_id).all()
    ratings_given = Rating.query.filter_by(rater_id=user_id).all()
    
    total_ratings_received = len(ratings_received)
    total_ratings_given = len(ratings_given)
    
    # Calculate distribution of received ratings
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating in ratings_received:
        rating_distribution[rating.score] += 1
    
    # Calculate recent activity (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_ratings = Rating.query.filter(
        and_(
            Rating.ratee_id == user_id,
            Rating.created_at >= thirty_days_ago
        )
    ).count()
    
    # Calculate improvement trend (comparing last 30 days vs previous 30 days)
    sixty_days_ago = datetime.utcnow() - timedelta(days=60)
    recent_avg = db.session.query(func.avg(Rating.score)).filter(
        and_(
            Rating.ratee_id == user_id,
            Rating.created_at >= thirty_days_ago
        )
    ).scalar() or 0
    
    previous_avg = db.session.query(func.avg(Rating.score)).filter(
        and_(
            Rating.ratee_id == user_id,
            Rating.created_at >= sixty_days_ago,
            Rating.created_at < thirty_days_ago
        )
    ).scalar() or 0
    
    trend = "stable"
    if recent_avg > previous_avg:
        trend = "improving"
    elif recent_avg < previous_avg:
        trend = "declining"
    
    # Top recent reviews (with comments)
    top_reviews = Rating.query.filter(
        and_(
            Rating.ratee_id == user_id,
            Rating.comment.isnot(None),
            Rating.comment != ""
        )
    ).order_by(desc(Rating.score), desc(Rating.created_at)).limit(5).all()
    
    return {
        "user_id": user_id,
        "average_rating": float(user.average_rating or 0.0),
        "total_ratings_received": total_ratings_received,
        "total_ratings_given": total_ratings_given,
        "rating_distribution": rating_distribution,
        "recent_activity": {
            "ratings_last_30_days": recent_ratings,
            "average_last_30_days": round(float(recent_avg), 2),
            "trend": trend
        },
        "top_reviews": [
            {
                "score": review.score,
                "comment": review.comment,
                "created_at": review.created_at.isoformat(),
                "rater_name": review.rater.name if review.rater else "Anonymous"
            }
            for review in top_reviews
        ]
    }


def get_gig_rating_summary(gig_id: int) -> Dict:
    """Get rating summary for a specific gig"""
    gig = get_gig_by_id(gig_id)
    
    # Get all ratings for this gig
    gig_ratings = Rating.query.filter_by(gig_id=gig_id).all()
    
    if not gig_ratings:
        return {
            "gig_id": gig_id,
            "total_ratings": 0,
            "average_rating": 0.0,
            "provider_rating": None,
            "student_rating": None
        }
    
    # Separate provider and student ratings
    provider_ratings = [r for r in gig_ratings if r.ratee.role == "provider"]
    student_ratings = [r for r in gig_ratings if r.ratee.role == "student"]
    
    total_ratings = len(gig_ratings)
    average_rating = sum(r.score for r in gig_ratings) / total_ratings
    
    provider_rating = None
    if provider_ratings:
        provider_rating = {
            "score": provider_ratings[0].score,
            "comment": provider_ratings[0].comment,
            "rater_name": provider_ratings[0].rater.name
        }
    
    student_rating = None
    if student_ratings:
        student_rating = {
            "score": student_ratings[0].score,
            "comment": student_ratings[0].comment,
            "rater_name": student_ratings[0].rater.name
        }
    
    return {
        "gig_id": gig_id,
        "total_ratings": total_ratings,
        "average_rating": round(average_rating, 2),
        "provider_rating": provider_rating,
        "student_rating": student_rating
    }


def get_platform_rating_stats() -> Dict:
    """Get platform-wide rating statistics (admin only)"""
    total_ratings = Rating.query.count()
    
    if total_ratings == 0:
        return {
            "total_ratings": 0,
            "average_platform_rating": 0.0,
            "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            "monthly_trends": []
        }
    
    # Overall platform average
    platform_avg = db.session.query(func.avg(Rating.score)).scalar()
    
    # Rating distribution
    distribution_query = db.session.query(
        Rating.score,
        func.count(Rating.id)
    ).group_by(Rating.score).all()
    
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for score, count in distribution_query:
        rating_distribution[score] = count
    
    # Monthly trends (last 12 months)
    monthly_trends = []
    for i in range(12):
        month_start = datetime.utcnow().replace(day=1) - timedelta(days=30 * i)
        month_end = month_start + timedelta(days=30)
        
        month_ratings = Rating.query.filter(
            and_(
                Rating.created_at >= month_start,
                Rating.created_at < month_end
            )
        ).all()
        
        if month_ratings:
            month_avg = sum(r.score for r in month_ratings) / len(month_ratings)
            monthly_trends.append({
                "month": month_start.strftime("%Y-%m"),
                "average_rating": round(month_avg, 2),
                "total_ratings": len(month_ratings)
            })
    
    monthly_trends.reverse()  # Show oldest to newest
    
    return {
        "total_ratings": total_ratings,
        "average_platform_rating": round(float(platform_avg), 2),
        "rating_distribution": rating_distribution,
        "monthly_trends": monthly_trends
    }


def get_ratings_pending_moderation() -> List[Rating]:
    """Get ratings that need moderation (admin only)"""
    return Rating.query.filter(
        or_(
            Rating.is_flagged == True,
            and_(
                Rating.moderation_status == "pending",
                Rating.score <= 2,
                Rating.comment.isnot(None),
                Rating.comment != ""
            )
        )
    ).order_by(desc(Rating.created_at)).all()


def flag_rating_for_review(rating_id: int, reason: str) -> Rating:
    """Flag a rating for admin review"""
    rating = Rating.query.get(rating_id)
    if not rating:
        raise NotFoundError(f"Rating with id {rating_id} not found")
    
    rating.is_flagged = True
    rating.flag_reason = reason
    rating.moderation_status = "pending"
    
    db.session.commit()
    return rating
