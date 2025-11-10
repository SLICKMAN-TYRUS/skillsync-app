"""
Comprehensive tests for admin analytics and dashboard functionality
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import patch

from app.models import User, Gig, Application, Rating, AuditLog
from app.services.admin_service import (
    get_system_analytics,
    get_gig_analytics,
    get_user_analytics,
    get_platform_health_metrics,
    get_revenue_analytics,
    get_user_engagement_analytics,
    approve_gig,
    reject_gig,
    update_user_role,
    moderate_rating
)
from app.services.exceptions import ValidationError, AuthorizationError, NotFoundError


@pytest.fixture
def admin_sample_data(db_session):
    """Create sample data for analytics testing"""
    # Create users
    admin = User(
        uid="admin_123",
        name="Admin User",
        email="admin@test.com",
        role="admin",
        average_rating=0.0
    )
    provider = User(
        uid="provider_456", 
        name="Provider User",
        email="provider@test.com",
        role="provider",
        average_rating=4.5
    )
    student = User(
        uid="student_789",
        name="Student User", 
        email="student@test.com",
        role="student",
        average_rating=4.2
    )
    
    db_session.add_all([admin, provider, student])
    db_session.commit()
    
    # Create gigs
    gigs = []
    for i in range(5):
        gig = Gig(
            title=f"Test Gig {i}",
            description=f"Description for gig {i}",
            budget=100.0 + (i * 50),
            provider_id=provider.id,
            status="open" if i < 3 else "completed",
            approval_status="approved",
            category="tutoring" if i % 2 == 0 else "design"
        )
        gigs.append(gig)
        db_session.add(gig)
    
    db_session.commit()
    
    # Create applications
    applications = []
    for i, gig in enumerate(gigs[:3]):  # Applications for first 3 gigs
        app = Application(
            gig_id=gig.id,
            student_id=student.id,
            status="pending" if i < 2 else "accepted",
            notes=f"Application for gig {i}"
        )
        applications.append(app)
        db_session.add(app)
    
    db_session.commit()
    
    # Create ratings
    for gig in gigs[3:]:  # Ratings for completed gigs
        rating = Rating(
            rater_id=provider.id,
            ratee_id=student.id,
            gig_id=gig.id,
            score=5,
            comment="Excellent work!"
        )
        db_session.add(rating)
    
    db_session.commit()
    
    return {
        "admin": admin,
        "provider": provider,
        "student": student,
        "gigs": gigs,
        "applications": applications
    }


class TestSystemAnalytics:
    """Test basic system analytics functionality"""
    
    def test_get_system_analytics(self, admin_sample_data):
        """Test basic system analytics retrieval"""
        analytics = get_system_analytics()
        
        # Test structure
        assert "active_gigs_count" in analytics
        assert "completed_gigs_count" in analytics
        assert "total_students" in analytics
        assert "total_providers" in analytics
        assert "total_admins" in analytics
        assert "new_users_this_month" in analytics
        assert "new_users_last_month" in analytics
        assert "platform_average_rating" in analytics
        assert "total_applications" in analytics
        
        # Test values based on sample data
        assert analytics["active_gigs_count"] >= 3  # 3 open gigs
        assert analytics["completed_gigs_count"] >= 2  # 2 completed gigs
        assert analytics["total_students"] >= 1
        assert analytics["total_providers"] >= 1
        assert analytics["total_admins"] >= 1
        assert analytics["total_applications"] >= 3
    
    def test_get_gig_analytics(self, admin_sample_data):
        """Test gig-specific analytics"""
        analytics = get_gig_analytics()
        
        # Test structure
        assert "status_breakdown" in analytics
        assert "category_breakdown" in analytics
        assert "average_completion_days" in analytics
        assert "top_categories" in analytics
        
        # Test values
        assert "open" in analytics["status_breakdown"]
        assert "completed" in analytics["status_breakdown"]
        assert analytics["status_breakdown"]["open"] >= 3
        assert analytics["status_breakdown"]["completed"] >= 2
        
        # Test category breakdown
        assert "tutoring" in analytics["category_breakdown"]
        assert "design" in analytics["category_breakdown"]
        
        # Test top categories format
        assert isinstance(analytics["top_categories"], list)
        if analytics["top_categories"]:
            assert "category" in analytics["top_categories"][0]
            assert "count" in analytics["top_categories"][0]
    
    def test_get_user_analytics(self, admin_sample_data):
        """Test user analytics"""
        analytics = get_user_analytics()
        
        # Test structure
        assert "user_growth" in analytics
        assert "users_by_role" in analytics
        assert "most_active_providers" in analytics
        assert "most_active_students" in analytics
        
        # Test users by role
        assert "student" in analytics["users_by_role"]
        assert "provider" in analytics["users_by_role"]
        assert "admin" in analytics["users_by_role"]
        
        # Test user growth format
        assert isinstance(analytics["user_growth"], list)
        
        # Test active users format
        assert isinstance(analytics["most_active_providers"], list)
        assert isinstance(analytics["most_active_students"], list)


class TestPlatformHealthMetrics:
    """Test platform health monitoring"""
    
    @pytest.fixture
    def recent_activity_data(self, db_session):
        """Create data with specific timestamps for health testing"""
        now = datetime.utcnow()
        yesterday = now - timedelta(days=1)
        week_ago = now - timedelta(days=7)
        
        # Create users with specific creation times
        users = []
        for i, created_time in enumerate([yesterday, week_ago, now]):
            user = User(
                uid=f"health_user_{i}",
                name=f"Health User {i}",
                email=f"health{i}@test.com",
                role="student" if i % 2 == 0 else "provider",
                average_rating=4.0,
                created_at=created_time
            )
            users.append(user)
            db_session.add(user)
        
        db_session.commit()
        
        # Create gigs with specific timestamps
        provider = next(u for u in users if u.role == "provider")
        gigs = []
        for i, created_time in enumerate([yesterday, week_ago]):
            gig = Gig(
                title=f"Health Gig {i}",
                description=f"Health gig description {i}",
                budget=150.0,
                provider_id=provider.id,
                status="open",
                approval_status="approved",
                created_at=created_time
            )
            gigs.append(gig)
            db_session.add(gig)
        
        db_session.commit()
        
        # Create applications with timestamps
        student = next(u for u in users if u.role == "student")
        for i, (gig, applied_time) in enumerate(zip(gigs, [yesterday, week_ago])):
            app = Application(
                gig_id=gig.id,
                student_id=student.id,
                status="pending",
                applied_at=applied_time
            )
            db_session.add(app)
        
        db_session.commit()
        
        return {"users": users, "gigs": gigs}
    
    def test_get_platform_health_metrics(self, recent_activity_data):
        """Test platform health metrics calculation"""
        metrics = get_platform_health_metrics()
        
        # Test structure
        assert "user_metrics" in metrics
        assert "gig_metrics" in metrics
        assert "engagement_metrics" in metrics
        assert "moderation_metrics" in metrics
        
        # Test user metrics
        user_metrics = metrics["user_metrics"]
        assert "new_users_today" in user_metrics
        assert "new_users_week" in user_metrics
        assert "total_users" in user_metrics
        
        # Test gig metrics
        gig_metrics = metrics["gig_metrics"]
        assert "gigs_created_today" in gig_metrics
        assert "gigs_created_week" in gig_metrics
        assert "pending_approval" in gig_metrics
        assert "total_gigs" in gig_metrics
        
        # Test engagement metrics
        engagement_metrics = metrics["engagement_metrics"]
        assert "applications_today" in engagement_metrics
        assert "applications_week" in engagement_metrics
        assert "total_applications" in engagement_metrics
        
        # Test moderation metrics
        moderation_metrics = metrics["moderation_metrics"]
        assert "pending_gigs" in moderation_metrics
        assert "recent_audit_actions" in moderation_metrics
    
    def test_get_revenue_analytics(self, sample_data):
        """Test revenue analytics calculation"""
        analytics = get_revenue_analytics()
        
        # Test structure
        assert "total_revenue" in analytics
        assert "average_gig_value" in analytics
        assert "commission_earned" in analytics
        assert "transactions_count" in analytics
        assert "commission_rate" in analytics
        assert "currency" in analytics
        
        # Test data types
        assert isinstance(analytics["total_revenue"], (int, float))
        assert isinstance(analytics["commission_rate"], (int, float))
        assert analytics["currency"] == "USD"
    
    def test_get_user_engagement_analytics(self, sample_data):
        """Test user engagement analytics"""
        analytics = get_user_engagement_analytics()
        
        # Test structure
        assert "user_distribution" in analytics
        assert "engagement_rates" in analytics
        assert "top_performers" in analytics
        
        # Test user distribution
        distribution = analytics["user_distribution"]
        assert "total_users" in distribution
        assert "students" in distribution
        assert "providers" in distribution
        assert "student_percentage" in distribution
        assert "provider_percentage" in distribution
        
        # Test engagement rates
        rates = analytics["engagement_rates"]
        assert "application_success_rate" in rates
        assert "gig_completion_rate" in rates
        assert "average_applications_per_gig" in rates
        
        # Test top performers
        performers = analytics["top_performers"]
        assert "most_active_providers" in performers
        assert "most_active_students" in performers
        assert isinstance(performers["most_active_providers"], list)
        assert isinstance(performers["most_active_students"], list)


class TestAdminActions:
    """Test admin actions and their audit logging"""
    
    @pytest.fixture
    def admin_test_data(self, db_session):
        """Create data for admin action testing"""
        admin = User(
            uid="test_admin",
            name="Test Admin",
            email="admin@test.com",
            role="admin",
            average_rating=0.0
        )
        provider = User(
            uid="test_provider",
            name="Test Provider",
            email="provider@test.com",
            role="provider",
            average_rating=0.0
        )
        student = User(
            uid="test_student",
            name="Test Student",
            email="student@test.com",
            role="student",
            average_rating=0.0
        )
        
        db_session.add_all([admin, provider, student])
        db_session.commit()
        
        # Create pending gig
        gig = Gig(
            title="Pending Test Gig",
            description="Test gig for approval",
            budget=200.0,
            provider_id=provider.id,
            status="open",
            approval_status="pending"
        )
        db_session.add(gig)
        db_session.commit()
        
        return {
            "admin": admin,
            "provider": provider,
            "student": student,
            "gig": gig
        }
    
    def test_approve_gig(self, db_session, admin_test_data):
        """Test gig approval by admin"""
        admin = admin_test_data["admin"]
        gig = admin_test_data["gig"]
        
        approved_gig = approve_gig(gig.id, admin.id)
        
        assert approved_gig.approval_status == "approved"
        assert approved_gig.status == "open"
        
        # Check audit log was created
        audit_logs = AuditLog.query.filter_by(
            user_id=admin.id,
            action="gig_approved",
            resource_type="gig",
            resource_id=gig.id
        ).all()
        assert len(audit_logs) == 1
    
    def test_reject_gig(self, db_session, admin_test_data):
        """Test gig rejection by admin"""
        admin = admin_test_data["admin"]
        gig = admin_test_data["gig"]
        
        rejected_gig = reject_gig(gig.id, admin.id, "Not suitable for platform")
        
        assert rejected_gig.approval_status == "rejected"
        assert rejected_gig.status == "closed"
        
        # Check audit log
        audit_logs = AuditLog.query.filter_by(
            user_id=admin.id,
            action="gig_rejected",
            resource_type="gig",
            resource_id=gig.id
        ).all()
        assert len(audit_logs) == 1
        assert audit_logs[0].details["reason"] == "Not suitable for platform"
    
    def test_update_user_role(self, db_session, admin_test_data):
        """Test user role update by admin"""
        admin = admin_test_data["admin"]
        student = admin_test_data["student"]
        
        updated_user = update_user_role(student.id, "provider", admin.id)
        
        assert updated_user.role == "provider"
        
        # Check audit log
        audit_logs = AuditLog.query.filter_by(
            user_id=admin.id,
            action="user_role_changed",
            resource_type="user",
            resource_id=student.id
        ).all()
        assert len(audit_logs) == 1
        assert audit_logs[0].details["previous_role"] == "student"
        assert audit_logs[0].details["new_role"] == "provider"
    
    def test_update_user_role_invalid_role(self, admin_test_data):
        """Test user role update with invalid role"""
        admin = admin_test_data["admin"]
        student = admin_test_data["student"]
        
        with pytest.raises(ValidationError, match="Invalid role supplied"):
            update_user_role(student.id, "invalid_role", admin.id)
    
    def test_non_admin_cannot_perform_admin_actions(self, admin_test_data):
        """Test that non-admin users cannot perform admin actions"""
        provider = admin_test_data["provider"]
        gig = admin_test_data["gig"]
        student = admin_test_data["student"]
        
        # Provider trying to approve gig
        with pytest.raises(AuthorizationError, match="Administrator privileges required"):
            approve_gig(gig.id, provider.id)
        
        # Provider trying to change user role
        with pytest.raises(AuthorizationError, match="Administrator privileges required"):
            update_user_role(student.id, "admin", provider.id)


class TestAnalyticsEdgeCases:
    """Test analytics with edge cases and empty data"""
    
    def test_analytics_with_no_data(self, db_session):
        """Test analytics functions with empty database"""
        # Create minimal admin user for testing
        admin = User(
            uid="empty_admin",
            name="Empty Admin",
            email="empty@test.com",
            role="admin",
            average_rating=0.0
        )
        db_session.add(admin)
        db_session.commit()
        
        # Test system analytics with no data
        analytics = get_system_analytics()
        assert analytics["active_gigs_count"] == 0
        assert analytics["completed_gigs_count"] == 0
        assert analytics["total_applications"] == 0
        
        # Test gig analytics with no gigs
        gig_analytics = get_gig_analytics()
        assert gig_analytics["status_breakdown"] == {}
        assert gig_analytics["average_completion_days"] == 0.0
        assert gig_analytics["top_categories"] == []
        
        # Test user analytics
        user_analytics = get_user_analytics()
        assert "admin" in user_analytics["users_by_role"]
        assert user_analytics["most_active_providers"] == []
        assert user_analytics["most_active_students"] == []
    
    def test_revenue_analytics_no_completed_gigs(self, db_session):
        """Test revenue analytics with no completed gigs"""
        # Create user and open gig (not completed)
        provider = User(
            uid="revenue_provider",
            name="Revenue Provider",
            email="revenue@test.com",
            role="provider",
            average_rating=0.0
        )
        db_session.add(provider)
        db_session.commit()
        
        gig = Gig(
            title="Open Gig",
            description="Not completed yet",
            budget=100.0,
            provider_id=provider.id,
            status="open",  # Not completed
            approval_status="approved"
        )
        db_session.add(gig)
        db_session.commit()
        
        revenue_analytics = get_revenue_analytics()
        
        # Should return zero values for no completed gigs
        assert revenue_analytics["total_revenue"] == 0.0
        assert revenue_analytics["average_gig_value"] == 0.0
        assert revenue_analytics["commission_earned"] == 0.0
        assert revenue_analytics["transactions_count"] == 0
    
    def test_platform_health_with_minimal_data(self):
        """Test platform health metrics with minimal data"""
        metrics = get_platform_health_metrics()
        
        # Should not crash with empty/minimal data
        assert "user_metrics" in metrics
        assert "gig_metrics" in metrics
        assert "engagement_metrics" in metrics
        assert "moderation_metrics" in metrics
        
        # All values should be numeric (not None)
        for metric_group in metrics.values():
            for value in metric_group.values():
                assert isinstance(value, (int, float))


class TestAnalyticsPermissions:
    """Test analytics access permissions"""
    
    @pytest.fixture
    def users_different_roles(self, db_session):
        """Create users with different roles"""
        admin = User(
            uid="perm_admin",
            name="Permission Admin",
            email="admin@perm.com",
            role="admin",
            average_rating=0.0
        )
        provider = User(
            uid="perm_provider",
            name="Permission Provider",
            email="provider@perm.com",
            role="provider",
            average_rating=0.0
        )
        student = User(
            uid="perm_student",
            name="Permission Student",
            email="student@perm.com",
            role="student",
            average_rating=0.0
        )
        
        db_session.add_all([admin, provider, student])
        db_session.commit()
        return {"admin": admin, "provider": provider, "student": student}
    
    def test_admin_access_to_analytics(self, users_different_roles):
        """Test that admin can access all analytics"""
        admin = users_different_roles["admin"]
        
        # These should not raise exceptions for admin
        analytics = get_system_analytics()
        assert analytics is not None
        
        health_metrics = get_platform_health_metrics()
        assert health_metrics is not None
        
        revenue_analytics = get_revenue_analytics()
        assert revenue_analytics is not None