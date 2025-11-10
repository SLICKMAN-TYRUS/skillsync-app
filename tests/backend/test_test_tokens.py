import pytest
from app import create_app, db
from app.models.user import User
from app.services.auth_service import verify_token
from helpers import (
    create_test_token,
    create_auth_header,
    get_student_headers,
    get_provider_headers,
    get_admin_headers,
)


@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['ALLOW_TEST_TOKENS'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


class TestTokenVerification:
    
    def test_verify_basic_test_token(self, app):
        with app.app_context():
            token = "test:user123"
            result = verify_token(token)
            
            assert result is not None
            assert result["uid"] == "user123"
            assert result["role"] == "student"
            assert result["email"] == "user123@example.com"
            assert result["name"] == "Test User user123"
    
    def test_verify_test_token_with_role(self, app):
        with app.app_context():
            token = "test:provider456:provider"
            result = verify_token(token)
            
            assert result is not None
            assert result["uid"] == "provider456"
            assert result["role"] == "provider"
            assert result["email"] == "provider456@example.com"
    
    def test_verify_test_token_admin_role(self, app):
        with app.app_context():
            token = "test:admin789:admin"
            result = verify_token(token)
            
            assert result is not None
            assert result["uid"] == "admin789"
            assert result["role"] == "admin"
    
    def test_verify_invalid_token(self, app):
        with app.app_context():
            result = verify_token("invalid-token")
            assert result is None
    
    def test_verify_empty_token(self, app):
        with app.app_context():
            result = verify_token("")
            assert result is None
    
    def test_verify_none_token(self, app):
        with app.app_context():
            result = verify_token(None)
            assert result is None
    
    def test_test_tokens_disabled_in_production(self):
        app = create_app()
        app.config['ALLOW_TEST_TOKENS'] = False
        
        with app.app_context():
            token = "test:user123:student"
            result = verify_token(token)
            assert result is None


class TestAuthenticationEndpoints:
    
    def test_auth_verify_endpoint_with_test_token(self, client):
        response = client.post('/api/auth/verify', json={
            'token': 'test:testuser:student'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'verified'
        assert data['uid'] == 'testuser'
    
    def test_auth_me_endpoint_with_test_token(self, client):
        headers = get_student_headers("student123")
        
        response = client.get('/api/auth/me', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['uid'] == 'student123'
        assert data['role'] == 'student'
        assert 'email' in data


class TestRoleBasedAccess:
    
    def test_student_can_access_student_endpoint(self, client):
        headers = get_student_headers()
        response = client.get('/api/gigs', headers=headers)
        assert response.status_code == 200
    
    def test_provider_can_create_gig(self, client):
        headers = get_provider_headers()
        
        response = client.post('/api/gigs', headers=headers, json={
            'title': 'Test Gig',
            'description': 'Test description',
            'pay_amount': 100.0,
            'location': 'Campus',
            'gig_type': 'one-time',
            'category': 'tutoring'
        })
        
        assert response.status_code in [200, 201]
    
    def test_student_cannot_create_gig(self, client):
        headers = get_student_headers()
        
        response = client.post('/api/gigs', headers=headers, json={
            'title': 'Test Gig',
            'description': 'Test description',
            'pay_amount': 100.0,
            'location': 'Campus',
            'gig_type': 'one-time',
            'category': 'tutoring'
        })
        
        assert response.status_code == 403
    
    def test_admin_can_access_admin_endpoints(self, client):
        headers = get_admin_headers()
        response = client.get('/api/admin/analytics/overview', headers=headers)
        assert response.status_code == 200
    
    def test_student_cannot_access_admin_endpoints(self, client):
        headers = get_student_headers()
        response = client.get('/api/admin/analytics/overview', headers=headers)
        assert response.status_code == 403


class TestUserAutoCreation:
    
    def test_user_auto_created_from_test_token(self, client):
        headers = create_auth_header("newuser123", "student")
        
        response = client.get('/api/auth/me', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['uid'] == 'newuser123'
        assert data['role'] == 'student'
        assert data['name'] == 'Test User newuser123'
    
    def test_provider_auto_created_from_test_token(self, client):
        headers = create_auth_header("newprovider456", "provider")
        
        response = client.get('/api/auth/me', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['uid'] == 'newprovider456'
        assert data['role'] == 'provider'


class TestHelperFunctions:
    
    def test_create_test_token(self):
        token = create_test_token("user1", "student")
        assert token == "test:user1:student"
    
    def test_create_auth_header(self):
        headers = create_auth_header("user1", "admin")
        assert headers["Authorization"] == "Bearer test:user1:admin"
    
    def test_get_student_headers(self):
        headers = get_student_headers("mystudent")
        assert "Bearer test:mystudent:student" in headers["Authorization"]
    
    def test_get_provider_headers(self):
        headers = get_provider_headers("myprovider")
        assert "Bearer test:myprovider:provider" in headers["Authorization"]
    
    def test_get_admin_headers(self):
        headers = get_admin_headers("myadmin")
        assert "Bearer test:myadmin:admin" in headers["Authorization"]


class TestCrossEndpointTestTokens:
    
    def test_test_tokens_work_in_gig_routes(self, client):
        headers = get_provider_headers("provider1")
        
        create_response = client.post('/api/gigs', headers=headers, json={
            'title': 'Test Gig',
            'description': 'Description',
            'pay_amount': 50.0,
            'location': 'Campus',
            'gig_type': 'one-time',
            'category': 'tutoring'
        })
        assert create_response.status_code in [200, 201]
    
    def test_test_tokens_work_in_user_routes(self, client):
        headers = get_student_headers("student1")
        response = client.get('/api/users/me', headers=headers)
        assert response.status_code == 200
    
    def test_test_tokens_work_in_notification_routes(self, client):
        headers = get_student_headers("student1")
        response = client.get('/api/notifications', headers=headers)
        assert response.status_code == 200
    
    def test_test_tokens_work_in_application_routes(self, client):
        headers = get_student_headers("student1")
        response = client.get('/api/applications/my-applications', headers=headers)
        assert response.status_code == 200
    
    def test_test_tokens_work_in_rating_routes(self, client):
        headers = get_student_headers("student1")
        response = client.get('/api/ratings/received', headers=headers)
        assert response.status_code == 200


class TestMultipleUsers:
    
    def test_multiple_students_with_different_tokens(self, client):
        student1_headers = get_student_headers("student1")
        student2_headers = get_student_headers("student2")
        
        response1 = client.get('/api/auth/me', headers=student1_headers)
        response2 = client.get('/api/auth/me', headers=student2_headers)
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.get_json()
        data2 = response2.get_json()
        
        assert data1['uid'] == 'student1'
        assert data2['uid'] == 'student2'
        assert data1['uid'] != data2['uid']
    
    def test_different_roles_have_different_permissions(self, client):
        student_headers = get_student_headers()
        provider_headers = get_provider_headers()
        admin_headers = get_admin_headers()
        
        student_response = client.get('/api/admin/analytics/overview', headers=student_headers)
        provider_response = client.get('/api/admin/analytics/overview', headers=provider_headers)
        admin_response = client.get('/api/admin/analytics/overview', headers=admin_headers)
        
        assert student_response.status_code == 403
        assert provider_response.status_code == 403
        assert admin_response.status_code == 200


