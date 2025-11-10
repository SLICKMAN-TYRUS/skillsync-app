"""
Comprehensive tests for the enhanced rating and feedback system
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import patch

from app.models import User, Gig, Application, Rating
from app.services.rating_service import (
    create_rating,
    get_rating_analytics,
    get_gig_rating_summary,
    get_platform_rating_stats,
    flag_rating_for_review,
    get_ratings_pending_moderation,
    calculate_average_rating
)
from app.services.exceptions import ValidationError, AuthorizationError, NotFoundError


class TestRatingSystem:
    """Test the enhanced rating system functionality"""
    
    @pytest.fixture
    def sample_users(self, db_session):
        """Create sample users for testing"""
        student = User(
            uid="test_student_123",
            name="John Student",
            email="student@test.com",
            role="student",
            average_rating=0.0
        )
        provider = User(
            uid="test_provider_456",
            name="Jane Provider", 
            email="provider@test.com",
            role="provider",
            average_rating=0.0
        )
        admin = User(
            uid="test_admin_789",
            name="Admin User",
            email="admin@test.com", 
            role="admin",
            average_rating=0.0
        )
        
        db_session.add_all([student, provider, admin])
        db_session.commit()
        return {"student": student, "provider": provider, "admin": admin}
    
    @pytest.fixture
    def sample_gig(self, db_session, sample_users):
        """Create a sample completed gig"""
        gig = Gig(
            title="Test Gig",
            description="Test gig description",
            budget=100.0,
            provider_id=sample_users["provider"].id,
            status="completed",
            approval_status="approved"
        )
        db_session.add(gig)
        db_session.commit()
        return gig
    
    @pytest.fixture
    def sample_application(self, db_session, sample_gig, sample_users):
        """Create a sample accepted application"""
        application = Application(
            gig_id=sample_gig.id,
            student_id=sample_users["student"].id,
            status="accepted",
            notes="Test application"
        )
        db_session.add(application)
        db_session.commit()
        return application
    
    def test_create_rating_success(self, db_session, sample_users, sample_gig, sample_application):
        """Test successful rating creation"""
        # Provider rating student
        rating = create_rating(
            rater_id=sample_users["provider"].id,
            ratee_id=sample_users["student"].id,
            gig_id=sample_gig.id,
            score=5,
            comment="Excellent work!"
        )
        
        assert rating.id is not None
        assert rating.score == 5
        assert rating.comment == "Excellent work!"
        assert rating.rater_id == sample_users["provider"].id
        assert rating.ratee_id == sample_users["student"].id
    
    def test_create_rating_invalid_score(self, sample_users, sample_gig, sample_application):
        """Test rating creation with invalid score"""
        with pytest.raises(ValidationError, match="Score must be an integer between 1 and 5"):
            create_rating(
                rater_id=sample_users["provider"].id,
                ratee_id=sample_users["student"].id,
                gig_id=sample_gig.id,
                score=6,  # Invalid score
                comment="Test"
            )
    
    def test_create_rating_self_rating(self, sample_users, sample_gig):
        """Test that users cannot rate themselves"""
        with pytest.raises(ValidationError, match="Users cannot rate themselves"):
            create_rating(
                rater_id=sample_users["student"].id,
                ratee_id=sample_users["student"].id,  # Same user
                gig_id=sample_gig.id,
                score=5,
                comment="Test"
            )
    
    def test_create_rating_incomplete_gig(self, db_session, sample_users, sample_application):
        """Test rating creation for incomplete gig"""
        # Change gig status to open
        sample_application.gig.status = "open"
        db_session.commit()
        
        with pytest.raises(ValidationError, match="Ratings are only allowed after the gig is completed"):
            create_rating(
                rater_id=sample_users["provider"].id,
                ratee_id=sample_users["student"].id,
                gig_id=sample_application.gig.id,
                score=5,
                comment="Test"
            )
    
    def test_duplicate_rating_prevention(self, sample_users, sample_gig, sample_application):
        """Test prevention of duplicate ratings"""
        # Create first rating
        create_rating(
            rater_id=sample_users["provider"].id,
            ratee_id=sample_users["student"].id,
            gig_id=sample_gig.id,
            score=5,
            comment="First rating"
        )
        
        # Attempt to create duplicate rating
        with pytest.raises(ValidationError, match="A rating for this user and gig already exists"):
            create_rating(
                rater_id=sample_users["provider"].id,
                ratee_id=sample_users["student"].id,
                gig_id=sample_gig.id,
                score=4,
                comment="Duplicate rating"
            )
    
    def test_rating_analytics(self, db_session, sample_users, sample_gig, sample_application):
        """Test rating analytics functionality"""
        # Create multiple ratings for analytics
        ratings_data = [
            {"score": 5, "comment": "Excellent work!"},
            {"score": 4, "comment": "Good job"},
            {"score": 5, "comment": "Outstanding"},
        ]
        
        for i, rating_data in enumerate(ratings_data):
            # Create additional gigs and applications for each rating
            gig = Gig(
                title=f"Test Gig {i+2}",
                description="Test description",
                budget=100.0,
                provider_id=sample_users["provider"].id,
                status="completed",
                approval_status="approved"
            )
            db_session.add(gig)
            db_session.commit()
            
            application = Application(
                gig_id=gig.id,
                student_id=sample_users["student"].id,
                status="accepted",
                notes="Test application"
            )
            db_session.add(application)
            db_session.commit()
            
            create_rating(
                rater_id=sample_users["provider"].id,
                ratee_id=sample_users["student"].id,
                gig_id=gig.id,
                score=rating_data["score"],
                comment=rating_data["comment"]
            )
        
        # Test analytics
        analytics = get_rating_analytics(sample_users["student"].id)
        
        assert analytics["user_id"] == sample_users["student"].id
        assert analytics["total_ratings_received"] == 3
        assert analytics["average_rating"] > 0
        assert "rating_distribution" in analytics
        assert "recent_activity" in analytics
        assert "top_reviews" in analytics
    
    def test_gig_rating_summary(self, sample_users, sample_gig, sample_application):
        """Test gig rating summary functionality"""
        # Create ratings from both perspectives
        provider_rating = create_rating(
            rater_id=sample_users["provider"].id,
            ratee_id=sample_users["student"].id,
            gig_id=sample_gig.id,
            score=5,
            comment="Great student!"
        )
        
        student_rating = create_rating(
            rater_id=sample_users["student"].id,
            ratee_id=sample_users["provider"].id,
            gig_id=sample_gig.id,
            score=4,
            comment="Good provider!"
        )
        
        summary = get_gig_rating_summary(sample_gig.id)
        
        assert summary["gig_id"] == sample_gig.id
        assert summary["total_ratings"] == 2
        assert summary["average_rating"] == 4.5
        assert summary["provider_rating"]["score"] == 4
        assert summary["student_rating"]["score"] == 5
    
    def test_platform_rating_stats(self, sample_users, sample_gig, sample_application):
        """Test platform-wide rating statistics"""
        # Create some ratings for stats
        create_rating(
            rater_id=sample_users["provider"].id,
            ratee_id=sample_users["student"].id,
            gig_id=sample_gig.id,
            score=5,
            comment="Great work!"
        )
        
        stats = get_platform_rating_stats()
        
        assert "total_ratings" in stats
        assert "average_platform_rating" in stats
        assert "rating_distribution" in stats
        assert "monthly_trends" in stats
        assert stats["total_ratings"] >= 1
    
    def test_flag_rating_for_review(self, db_session, sample_users, sample_gig, sample_application):
        """Test rating flagging functionality"""
        rating = create_rating(
            rater_id=sample_users["provider"].id,
            ratee_id=sample_users["student"].id,
            gig_id=sample_gig.id,
            score=1,
            comment="Inappropriate content"
        )
        
        flagged_rating = flag_rating_for_review(rating.id, "Inappropriate language")
        
        assert flagged_rating.is_flagged is True
        assert flagged_rating.flag_reason == "Inappropriate language"
        assert flagged_rating.moderation_status == "pending"
    
    def test_get_ratings_pending_moderation(self, db_session, sample_users, sample_gig, sample_application):
        """Test getting ratings pending moderation"""
        # Create a low-score rating that should be flagged
        rating = create_rating(
            rater_id=sample_users["provider"].id,
            ratee_id=sample_users["student"].id,
            gig_id=sample_gig.id,
            score=1,
            comment="Bad experience"
        )
        
        pending_ratings = get_ratings_pending_moderation()
        
        # Should include the low-score rating
        rating_ids = [r.id for r in pending_ratings]
        assert rating.id in rating_ids
    
    def test_calculate_average_rating(self, db_session, sample_users, sample_gig, sample_application):
        """Test average rating calculation"""
        # Create multiple ratings
        create_rating(
            rater_id=sample_users["provider"].id,
            ratee_id=sample_users["student"].id,
            gig_id=sample_gig.id,
            score=4,
            comment="Good work"
        )
        
        average = calculate_average_rating(sample_users["student"].id)
        assert average == 4.0
        
        # Verify user's average rating was updated
        db_session.refresh(sample_users["student"])
        assert float(sample_users["student"].average_rating) == 4.0


class TestRatingModeration:
    """Test rating moderation functionality"""
    
    @pytest.fixture
    def flagged_rating(self, db_session, sample_users, sample_gig, sample_application):
        """Create a flagged rating for testing"""
        rating = create_rating(
            rater_id=sample_users["provider"].id,
            ratee_id=sample_users["student"].id,
            gig_id=sample_gig.id,
            score=1,
            comment="Inappropriate content"
        )
        
        return flag_rating_for_review(rating.id, "Offensive language")
    
    def test_flag_nonexistent_rating(self):
        """Test flagging a non-existent rating"""
        with pytest.raises(NotFoundError):
            flag_rating_for_review(99999, "Test reason")
    
    def test_moderation_workflow(self, flagged_rating):
        """Test the moderation workflow"""
        assert flagged_rating.is_flagged is True
        assert flagged_rating.flag_reason == "Offensive language"
        assert flagged_rating.moderation_status == "pending"
        
        # Rating should appear in pending moderation list
        pending = get_ratings_pending_moderation()
        pending_ids = [r.id for r in pending]
        assert flagged_rating.id in pending_ids


class TestRatingValidation:
    """Test rating validation and edge cases"""
    
    def test_empty_comment_allowed(self, sample_users, sample_gig, sample_application):
        """Test that empty comments are allowed"""
        rating = create_rating(
            rater_id=sample_users["provider"].id,
            ratee_id=sample_users["student"].id,
            gig_id=sample_gig.id,
            score=5,
            comment=""  # Empty comment
        )
        
        assert rating.comment == ""
        assert rating.score == 5
    
    def test_none_score_validation(self, sample_users, sample_gig, sample_application):
        """Test validation for None score"""
        with pytest.raises(ValidationError, match="Score is required"):
            create_rating(
                rater_id=sample_users["provider"].id,
                ratee_id=sample_users["student"].id,
                gig_id=sample_gig.id,
                score=None,
                comment="Test"
            )
    
    def test_boundary_scores(self, db_session, sample_users, sample_gig, sample_application):
        """Test boundary score values"""
        # Test minimum valid score
        rating1 = create_rating(
            rater_id=sample_users["provider"].id,
            ratee_id=sample_users["student"].id,
            gig_id=sample_gig.id,
            score=1,
            comment="Minimum score"
        )
        assert rating1.score == 1
        
        # Create new gig for second rating
        from app.models import Gig, Application
        gig2 = Gig(
            title="Test Gig 2",
            description="Test description",
            budget=100.0,
            provider_id=sample_users["provider"].id,
            status="completed",
            approval_status="approved"
        )
        db_session.add(gig2)
        db_session.commit()
        
        app2 = Application(
            gig_id=gig2.id,
            student_id=sample_users["student"].id,
            status="accepted",
            notes="Test"
        )
        db_session.add(app2)
        db_session.commit()
        
        # Test maximum valid score
        rating2 = create_rating(
            rater_id=sample_users["provider"].id,
            ratee_id=sample_users["student"].id,
            gig_id=gig2.id,
            score=5,
            comment="Maximum score"
        )
        assert rating2.score == 5