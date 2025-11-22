from functools import wraps
from typing import Iterable, Union
from flask import g, request
from .auth_service import verify_token
from .exceptions import AuthenticationError, AuthorizationError
from .user_service import get_user_by_uid


def _extract_bearer_token() -> str:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    return ""


def require_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        from .user_service import create_user_from_token
        
        token = _extract_bearer_token()
        decoded = verify_token(token)
        if not decoded:
            raise AuthenticationError("Invalid or missing authentication token")
        uid = decoded.get("uid")
        if not uid:
            raise AuthenticationError("Token payload missing uid")
        
        user = get_user_by_uid(uid)
        if not user:
            # Auto-create user from token if doesn't exist
            try:
                user = create_user_from_token(decoded)
            except Exception as e:
                raise AuthenticationError(f"Failed to create user: {str(e)}")
 
        g.current_user = user
        return func(*args, **kwargs)

    return wrapper


def require_role(roles: Union[str, Iterable[str]]):
    if isinstance(roles, str):
        roles = [roles]
    normalized = {role.lower() for role in roles}

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_user = getattr(g, "current_user", None)
            if not current_user:
                raise AuthenticationError("Authentication required before role check")
            if current_user.role.lower() not in normalized:
                raise AuthorizationError(
                    f"Requires one of the roles: {', '.join(sorted(normalized))}"
                )
            return func(*args, **kwargs)

        return wrapper

    return decorator
