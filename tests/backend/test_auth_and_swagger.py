import pytest
from flask import Flask

def test_app_creation():
    from backend.app import create_app
    app = create_app()
    assert app is not None
    assert isinstance(app, Flask)

def test_blueprints_registered():
    from backend.app import create_app
    app = create_app()
    expected_blueprints = ['auth', 'gigs', 'users', 'admin', 'applications', 'ratings', 'notifications', 'health']
    for blueprint in expected_blueprints:
        assert blueprint in app.blueprints, f"Blueprint {blueprint} not registered"

def test_swagger_routes_registered():
    from backend.app import create_app
    app = create_app()
    
    routes = [str(rule) for rule in app.url_map.iter_rules()]
    
    assert '/api/docs' in routes, "Swagger UI route not registered"
    assert '/api/docs/spec.json' in routes, "OpenAPI spec route not registered"
    assert '/api/docs/redoc' in routes, "ReDoc route not registered"

def test_health_endpoint():
    from backend.app import create_app
    app = create_app()
    client = app.test_client()
    
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.get_json() == {'status': 'ok'}

def test_swagger_ui_accessible():
    from backend.app import create_app
    app = create_app()
    client = app.test_client()
    
    response = client.get('/api/docs')
    assert response.status_code == 200
    assert b'swagger-ui' in response.data.lower()

def test_openapi_spec_generated():
    from backend.app import create_app
    app = create_app()
    client = app.test_client()
    
    response = client.get('/api/docs/spec.json')
    assert response.status_code == 200
    
    spec = response.get_json()
    assert spec.get('openapi') == '3.0.0'
    assert spec['info']['title'] == 'SkillSync API'
    assert len(spec.get('paths', {})) > 0
    assert len(spec.get('tags', [])) > 0

def test_auth_verify_endpoint():
    from backend.app import create_app
    app = create_app()
    client = app.test_client()
    
    response = client.post('/api/auth/verify', json={'token': 'test:user123:student'})
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'verified'
    assert data['uid'] == 'user123'

def test_auth_required_without_token():
    from backend.app import create_app
    app = create_app()
    client = app.test_client()
    
    response = client.get('/api/auth/me')
    assert response.status_code == 401
    data = response.get_json()
    assert 'error' in data

def test_test_token_format():
    from backend.app.services.auth_service import verify_token
    
    result = verify_token('test:user123:student')
    assert result is not None
    assert result['uid'] == 'user123'
    assert result['role'] == 'student'
    assert result['email'] == 'user123@example.com'

def test_test_token_default_role():
    from backend.app.services.auth_service import verify_token
    
    result = verify_token('test:user456')
    assert result is not None
    assert result['uid'] == 'user456'
    assert result['role'] == 'student'

def test_test_token_provider_role():
    from backend.app.services.auth_service import verify_token
    
    result = verify_token('test:provider123:provider')
    assert result is not None
    assert result['role'] == 'provider'

def test_test_token_admin_role():
    from backend.app.services.auth_service import verify_token
    
    result = verify_token('test:admin789:admin')
    assert result is not None
    assert result['role'] == 'admin'

def test_invalid_token():
    from backend.app.services.auth_service import verify_token
    
    result = verify_token('invalid_token')
    assert result is None

def test_empty_token():
    from backend.app.services.auth_service import verify_token
    
    result = verify_token('')
    assert result is None
    
    result = verify_token(None)
    assert result is None

def test_api_documentation_endpoints():
    from backend.app import create_app
    app = create_app()
    client = app.test_client()
    
    endpoints = [
        '/api/docs',
        '/api/docs/spec.json',
        '/api/docs/redoc'
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        assert response.status_code == 200, f"Endpoint {endpoint} failed with status {response.status_code}"

