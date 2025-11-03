class ServiceError(Exception):
    """Base service-layer exception with an HTTP-aware status code."""

    status_code = 400
    message = "Service error"

    def __init__(self, message=None, status_code=None):
        if message is not None:
            self.message = message
        if status_code is not None:
            self.status_code = status_code
        super().__init__(self.message)


class NotFoundError(ServiceError):
    status_code = 404
    message = "Resource not found"


class ValidationError(ServiceError):
    status_code = 400
    message = "Validation failed"


class AuthorizationError(ServiceError):
    status_code = 403
    message = "Not authorized"


class AuthenticationError(ServiceError):
    status_code = 401
    message = "Authentication required"
