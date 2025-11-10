"""
Shared test configuration and fixtures for SkillSync tests
"""
import pytest
import sys
import os

# Add backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

# Override DATABASE_URL for tests before importing app (use unix socket)
os.environ['DATABASE_URL'] = 'postgresql:///skillsync_test'

from app import create_app, db
from app.config import Config

class TestConfig:
    TESTING = True
    # Use a separate test database
    SQLALCHEMY_DATABASE_URI = 'postgresql:///skillsync_test'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WTF_CSRF_ENABLED = False
    SECRET_KEY = 'test-secret-key'
    FIREBASE_CREDENTIALS_PATH = 'firebase_credentials.json'

@pytest.fixture(scope='session')
def app():
    """Create test Flask application"""
    app = create_app()
    app.config.from_object(TestConfig)
    
    with app.app_context():
        # Create all tables
        db.create_all()
        yield app
        # Clean up after all tests
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture
def db_session(app):
    """Create database session for tests"""
    with app.app_context():
        yield db.session
        # Clean up data after each test
        db.session.rollback()
        # Remove all data but keep tables
        for table in reversed(db.metadata.sorted_tables):
            db.session.execute(table.delete())
        db.session.commit()

@pytest.fixture
def sample_user(db_session):
    """Create a sample user for testing"""
    from app.models import User
    user = User(
        uid='test-uid-123',
        email='test@example.com',
        role='student'
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def sample_data(app, db_session):
    """Create comprehensive sample data for testing"""
    from app.models import User, Gig, Application, Rating
    from datetime import datetime, timedelta
    
    # Create users
    admin = User(
        uid="admin_123",
        name="Admin User",
        email="admin@test.com", 
        role="admin"
    )
    provider = User(
        uid="provider_456",
        name="Provider User",
        email="provider@test.com",
        role="provider"
    )
    student = User(
        uid="student_789", 
        name="Student User",
        email="student@test.com",
        role="student"
    )
    
    db_session.add_all([admin, provider, student])
    db_session.commit()
    
    # Create gigs
    gig1 = Gig(
        title="Web Development",
        description="Build a website",
        budget=1000.0,
        location="Remote",
        category="development",
        status="open",
        provider_id=provider.id,
        approval_status="approved"
    )
    
    gig2 = Gig(
        title="Data Analysis", 
        description="Analyze sales data",
        budget=500.0,
        location="Office",
        category="analytics",
        status="completed",
        provider_id=provider.id,
        approval_status="approved"
    )
    
    db_session.add_all([gig1, gig2])
    db_session.commit()
    
    # Create application
    application = Application(
        gig_id=gig1.id,
        student_id=student.id,
        status="accepted",
        notes="I'm interested"
    )
    
    db_session.add(application)
    db_session.commit()
    
    return {
        'admin': admin,
        'provider': provider,
        'student': student,
        'gig1': gig1,
        'gig2': gig2,
        'application': application
    }

@pytest.fixture
def sample_users(app, db_session):
    """Create sample users for rating tests"""
    from app.models import User
    
    student = User(
        uid="test_student_123",
        name="John Student",
        email="student@test.com",
        role="student"
    )
    provider = User(
        uid="test_provider_456", 
        name="Jane Provider",
        email="provider@test.com",
        role="provider"
    )
    admin = User(
        uid="test_admin_789",
        name="Admin User", 
        email="admin@test.com",
        role="admin"
    )
    
    db_session.add_all([student, provider, admin])
    db_session.commit()
    
    return {
        "student": student,
        "provider": provider,
        "admin": admin
    }

@pytest.fixture  
def sample_gig(app, db_session, sample_users):
    """Create sample gig for rating tests"""
    from app.models import Gig
    
    gig = Gig(
        title="Sample Gig",
        description="A test gig",
        budget=500.0,
        category="development",
        status="completed",
        provider_id=sample_users["provider"].id,
        approval_status="approved"
    )
    
    db_session.add(gig)
    db_session.commit()
    return gig

@pytest.fixture
def sample_application(app, db_session, sample_gig, sample_users):
    """Create sample application for rating tests"""
    from app.models import Application
    
    application = Application(
        gig_id=sample_gig.id,
        student_id=sample_users["student"].id,
        status="completed",
        notes="Application for test gig"
    )
    
    db_session.add(application)
    db_session.commit()
    return application