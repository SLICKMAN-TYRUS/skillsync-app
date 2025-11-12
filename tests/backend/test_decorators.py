import json


def test_token_required_decorator_creates_context(client, db_session):
    # Register a temporary protected route on the app
    from app import db
    from flask import g
    from app.decorators import token_required
    from app.models import User

    # Ensure a user exists for the test uid
    user = User(uid="student1", name="Student One", email="student1@example.com", role="student")
    db_session.add(user)
    db_session.commit()

    app = client.application

    @app.route('/__test/protected')
    @token_required()
    def protected():
        return {"uid": g.current_user.uid}, 200

    # Use test token format directly for auth header
    token = f"test:student1:student"
    headers = {"Authorization": f"Bearer {token}"}

    rv = client.get('/__test/protected', headers=headers)
    assert rv.status_code == 200
    data = rv.get_json()
    assert data['uid'] == 'student1'


def test_roles_required_forbidden(client, db_session):
    from app import db
    from flask import g
    from app.decorators import token_required, roles_required
    from app.models import User

    # Create a provider user
    user = User(uid="provider1", name="Provider", email="provider1@example.com", role="provider")
    db_session.add(user)
    db_session.commit()

    app = client.application

    @app.route('/__test/admin-only')
    @token_required()
    @roles_required('admin')
    def admin_only():
        return {"ok": True}, 200

    # Use test token format directly for auth header
    token = f"test:provider1:provider"
    headers = {"Authorization": f"Bearer {token}"}

    rv = client.get('/__test/admin-only', headers=headers)
    assert rv.status_code == 403
