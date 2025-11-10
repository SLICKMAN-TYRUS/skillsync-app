"""
Error tracking and structured logging system for SkillSync
"""

import logging
import traceback
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
from functools import wraps
from flask import Flask, request, g, current_app
from sqlalchemy.exc import SQLAlchemyError

from .. import db


class StructuredLogger:
    """Structured logging with JSON format for better parsing"""
    
    def __init__(self, name: str = 'skillsync'):
        self.logger = logging.getLogger(name)
        self.setup_handlers()
    
    def setup_handlers(self):
        """Set up logging handlers with JSON formatting"""
        if not self.logger.handlers:
            # Console handler
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.INFO)
            
            # File handler for errors
            if not os.path.exists('logs'):
                os.makedirs('logs')
            
            error_handler = logging.FileHandler('logs/errors.log')
            error_handler.setLevel(logging.ERROR)
            
            # Performance log handler
            perf_handler = logging.FileHandler('logs/performance.log')
            perf_handler.setLevel(logging.INFO)
            
            # JSON formatter
            formatter = JsonFormatter()
            console_handler.setFormatter(formatter)
            error_handler.setFormatter(formatter)
            perf_handler.setFormatter(formatter)
            
            self.logger.addHandler(console_handler)
            self.logger.addHandler(error_handler)
            self.logger.addHandler(perf_handler)
            self.logger.setLevel(logging.INFO)
    
    def log_event(self, level: str, event: str, **kwargs):
        """Log a structured event"""
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'event': event,
            'level': level.upper(),
            **kwargs
        }
        
        # Add request context if available
        if request:
            log_data.update({
                'request_id': getattr(g, 'request_id', 'unknown'),
                'method': request.method,
                'path': request.path,
                'remote_addr': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', 'unknown')
            })
        
        # Add user context if available
        if hasattr(g, 'current_user') and g.current_user:
            log_data.update({
                'user_id': g.current_user.id,
                'user_role': g.current_user.role
            })
        
        getattr(self.logger, level.lower())(json.dumps(log_data))
    
    def info(self, event: str, **kwargs):
        """Log info level event"""
        self.log_event('info', event, **kwargs)
    
    def warning(self, event: str, **kwargs):
        """Log warning level event"""
        self.log_event('warning', event, **kwargs)
    
    def error(self, event: str, error: Optional[Exception] = None, **kwargs):
        """Log error level event"""
        error_data = kwargs.copy()
        
        if error:
            error_data.update({
                'error_type': type(error).__name__,
                'error_message': str(error),
                'traceback': traceback.format_exc()
            })
        
        self.log_event('error', event, **error_data)
    
    def critical(self, event: str, error: Optional[Exception] = None, **kwargs):
        """Log critical level event"""
        error_data = kwargs.copy()
        
        if error:
            error_data.update({
                'error_type': type(error).__name__,
                'error_message': str(error),
                'traceback': traceback.format_exc()
            })
        
        self.log_event('critical', event, **error_data)


class JsonFormatter(logging.Formatter):
    """Custom JSON formatter for log records"""
    
    def format(self, record):
        if isinstance(record.msg, str) and record.msg.startswith('{'):
            # Already JSON formatted
            return record.msg
        
        # Convert standard log record to JSON
        log_data = {
            'timestamp': datetime.utcfromtimestamp(record.created).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        if record.exc_info:
            log_data['traceback'] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)


class ErrorTracker:
    """Track and analyze application errors"""
    
    def __init__(self, app: Flask = None):
        self.app = app
        self.logger = StructuredLogger('skillsync.errors')
        self.error_counts = {}
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Initialize error tracking with Flask app"""
        self.app = app
        
        # Register error handlers
        app.errorhandler(400)(self.handle_bad_request)
        app.errorhandler(401)(self.handle_unauthorized)
        app.errorhandler(403)(self.handle_forbidden)
        app.errorhandler(404)(self.handle_not_found)
        app.errorhandler(500)(self.handle_internal_error)
        app.errorhandler(SQLAlchemyError)(self.handle_database_error)
        app.errorhandler(Exception)(self.handle_generic_error)
    
    def track_error(self, error: Exception, context: Optional[Dict] = None):
        """Track an error occurrence"""
        error_type = type(error).__name__
        error_key = f"{error_type}:{str(error)}"
        
        # Count error occurrences
        self.error_counts[error_key] = self.error_counts.get(error_key, 0) + 1
        
        # Log the error with context
        self.logger.error(
            event='error_tracked',
            error=error,
            error_count=self.error_counts[error_key],
            context=context or {}
        )
    
    def handle_bad_request(self, error):
        """Handle 400 Bad Request errors"""
        self.logger.warning(
            event='bad_request',
            status_code=400,
            error_description=str(error)
        )
        
        return {
            'error': 'Bad Request',
            'message': 'The request could not be understood by the server',
            'status_code': 400
        }, 400
    
    def handle_unauthorized(self, error):
        """Handle 401 Unauthorized errors"""
        self.logger.warning(
            event='unauthorized_access',
            status_code=401,
            error_description=str(error)
        )
        
        return {
            'error': 'Unauthorized',
            'message': 'Authentication required',
            'status_code': 401
        }, 401
    
    def handle_forbidden(self, error):
        """Handle 403 Forbidden errors"""
        self.logger.warning(
            event='forbidden_access',
            status_code=403,
            error_description=str(error)
        )
        
        return {
            'error': 'Forbidden',
            'message': 'Access denied',
            'status_code': 403
        }, 403
    
    def handle_not_found(self, error):
        """Handle 404 Not Found errors"""
        self.logger.info(
            event='resource_not_found',
            status_code=404,
            requested_path=request.path if request else 'unknown'
        )
        
        return {
            'error': 'Not Found',
            'message': 'The requested resource was not found',
            'status_code': 404
        }, 404
    
    def handle_database_error(self, error):
        """Handle database-related errors"""
        # Roll back the session
        db.session.rollback()
        
        self.track_error(error, {
            'category': 'database',
            'query': getattr(error, 'statement', 'unknown'),
            'params': getattr(error, 'params', {})
        })
        
        return {
            'error': 'Database Error',
            'message': 'A database error occurred',
            'status_code': 500
        }, 500
    
    def handle_internal_error(self, error):
        """Handle 500 Internal Server errors"""
        # Roll back database session if error occurred during request
        try:
            db.session.rollback()
        except:
            pass
        
        self.track_error(error, {'category': 'internal'})
        
        return {
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred',
            'status_code': 500
        }, 500
    
    def handle_generic_error(self, error):
        """Handle any unhandled exceptions"""
        self.track_error(error, {'category': 'generic'})
        
        return {
            'error': 'Server Error',
            'message': 'An unexpected error occurred',
            'status_code': 500
        }, 500
    
    def get_error_summary(self) -> Dict[str, Any]:
        """Get summary of tracked errors"""
        if not self.error_counts:
            return {'total_errors': 0, 'error_types': {}}
        
        # Sort errors by frequency
        sorted_errors = sorted(
            self.error_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return {
            'total_errors': sum(self.error_counts.values()),
            'unique_error_types': len(self.error_counts),
            'most_frequent_errors': sorted_errors[:10],
            'error_types': dict(sorted_errors)
        }
    
    def reset_error_counts(self):
        """Reset error tracking counts"""
        self.error_counts = {}
        self.logger.info(event='error_counts_reset')


def error_handler(error_type: str = 'general'):
    """Decorator to handle and log errors in functions"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            logger = StructuredLogger()
            try:
                return func(*args, **kwargs)
            except Exception as e:
                logger.error(
                    event=f'{error_type}_error',
                    function=func.__name__,
                    error=e,
                    args=str(args)[:200],  # Limit args length
                    kwargs=str(kwargs)[:200]  # Limit kwargs length
                )
                raise
        return wrapper
    return decorator


def database_error_handler(operation: str):
    """Decorator specifically for database operations"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            logger = StructuredLogger()
            try:
                return func(*args, **kwargs)
            except SQLAlchemyError as e:
                # Roll back the session
                db.session.rollback()
                
                logger.error(
                    event='database_operation_failed',
                    operation=operation,
                    function=func.__name__,
                    error=e
                )
                raise
            except Exception as e:
                logger.error(
                    event='database_function_error',
                    operation=operation,
                    function=func.__name__,
                    error=e
                )
                raise
        return wrapper
    return decorator


def audit_action(action: str, resource_type: str):
    """Decorator to audit important actions"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            logger = StructuredLogger()
            start_time = datetime.utcnow()
            
            try:
                result = func(*args, **kwargs)
                
                # Log successful action
                logger.info(
                    event='action_completed',
                    action=action,
                    resource_type=resource_type,
                    function=func.__name__,
                    duration=(datetime.utcnow() - start_time).total_seconds()
                )
                
                return result
                
            except Exception as e:
                # Log failed action
                logger.error(
                    event='action_failed',
                    action=action,
                    resource_type=resource_type,
                    function=func.__name__,
                    error=e,
                    duration=(datetime.utcnow() - start_time).total_seconds()
                )
                raise
                
        return wrapper
    return decorator


class SecurityLogger:
    """Specialized logger for security events"""
    
    def __init__(self):
        self.logger = StructuredLogger('skillsync.security')
    
    def log_login_attempt(self, email: str, success: bool, failure_reason: Optional[str] = None):
        """Log login attempts"""
        self.logger.info(
            event='login_attempt',
            email=email,
            success=success,
            failure_reason=failure_reason,
            ip_address=request.remote_addr if request else 'unknown'
        )
    
    def log_permission_denied(self, required_permission: str, user_role: Optional[str] = None):
        """Log permission denied events"""
        self.logger.warning(
            event='permission_denied',
            required_permission=required_permission,
            user_role=user_role
        )
    
    def log_suspicious_activity(self, activity_type: str, details: Dict[str, Any]):
        """Log suspicious activities"""
        self.logger.warning(
            event='suspicious_activity',
            activity_type=activity_type,
            details=details
        )
    
    def log_data_access(self, resource_type: str, resource_id: Optional[int] = None, action: str = 'read'):
        """Log sensitive data access"""
        self.logger.info(
            event='data_access',
            resource_type=resource_type,
            resource_id=resource_id,
            action=action
        )