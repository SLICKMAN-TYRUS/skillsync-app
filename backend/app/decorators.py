from functools import wraps
from flask import request, jsonify, current_app, g
from typing import Iterable, Optional

from .services.auth_service import verify_token
from .models import User


def _extract_bearer_token() -> Optional[str]:
    auth_header = request.headers.get("Authorization", "")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    return None


def token_required(auto_create_user: bool = False):
    """Decorator that ensures a valid Firebase/test token is supplied.

    Sets `g.current_user` to the matched `User` instance (or None if not found and auto_create_user=False).
    If authentication fails, responds with 401.
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            token = _extract_bearer_token()
            decoded = verify_token(token)
            if not decoded:
                return jsonify({"error": "Unauthorized"}), 401

            uid = decoded.get("uid")
            if not uid:
                return jsonify({"error": "Unauthorized"}), 401

            # Attach user to flask.g
            try:
                user = User.query.filter_by(uid=uid).one_or_none()
            except Exception:
                user = None

            if not user and auto_create_user:
                # minimal provisioning: require at least email and role if present
                name = decoded.get("name") or decoded.get("email") or ""
                email = decoded.get("email") or f"{uid}@example.com"
                role = decoded.get("role") or "student"
                user = User(uid=uid, name=name, email=email, role=role)
                from .. import db

                db.session.add(user)
                db.session.commit()

            if not user:
                # No local user found; treat as unauthorized
                return jsonify({"error": "User not found"}), 401

            g.current_user = user
            g.auth_claims = decoded
            return f(*args, **kwargs)

        return wrapper

    return decorator


def roles_required(*roles: Iterable[str]):
    """Decorator that requires the current user to have at least one of the supplied roles.

    Must be used after `token_required` so `g.current_user` is set.
    """
    normalized = {r.lower() for r in roles}

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if not user:
                return jsonify({"error": "Unauthorized"}), 401
            if user.role.lower() not in normalized:
                return jsonify({"error": "Forbidden"}), 403
            return f(*args, **kwargs)

        return wrapper

    return decorator
