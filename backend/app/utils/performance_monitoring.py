"""
Performance monitoring and response time tracking middleware
"""

import time
import logging
from functools import wraps
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from flask import Flask, request, g, jsonify
from sqlalchemy import text
import psutil
import sys

from .. import db


class PerformanceMonitor:
    """Performance monitoring and metrics collection"""
    
    def __init__(self, app: Flask = None):
        self.app = app
        self.metrics = {}
        self.slow_query_threshold = 1.0  # seconds
        self.slow_request_threshold = 2.0  # seconds
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Initialize performance monitoring with Flask app"""
        self.app = app
        
        # Set up logging
        self.setup_logging()
        
        # Register middleware
        app.before_request(self.before_request)
        app.after_request(self.after_request)
        
        # Register error handlers
        app.teardown_appcontext(self.teardown_db)
        
        # Create performance metrics endpoints
        self.register_performance_routes(app)
    
    def setup_logging(self):
        """Set up performance logging"""
        # Configure performance logger
        self.perf_logger = logging.getLogger('skillsync.performance')
        self.perf_logger.setLevel(logging.INFO)
        
        # Create handler if it doesn't exist
        if not self.perf_logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.perf_logger.addHandler(handler)
    
    def before_request(self):
        """Called before each request"""
        g.start_time = time.time()
        g.request_id = f"{int(time.time()*1000)}-{id(request)}"
        
        # Log incoming request
        self.perf_logger.info(
            f"Request started: {request.method} {request.path} "
            f"[{g.request_id}] from {request.remote_addr}"
        )
    
    def after_request(self, response):
        """Called after each request"""
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            
            # Log request completion
            self.perf_logger.info(
                f"Request completed: {request.method} {request.path} "
                f"[{g.request_id}] - Status: {response.status_code} "
                f"Duration: {duration:.3f}s"
            )
            
            # Track slow requests
            if duration > self.slow_request_threshold:
                self.perf_logger.warning(
                    f"Slow request detected: {request.method} {request.path} "
                    f"[{g.request_id}] - Duration: {duration:.3f}s"
                )
            
            # Store metrics
            self.store_request_metrics(request, response, duration)
        
        return response
    
    def teardown_db(self, error):
        """Handle database teardown and log any errors"""
        if error:
            self.perf_logger.error(f"Database error in request [{getattr(g, 'request_id', 'unknown')}]: {error}")
    
    def store_request_metrics(self, request, response, duration):
        """Store request metrics for analysis"""
        endpoint = request.endpoint or 'unknown'
        method = request.method
        status_code = response.status_code
        
        # Initialize endpoint metrics if not exists
        if endpoint not in self.metrics:
            self.metrics[endpoint] = {
                'total_requests': 0,
                'total_duration': 0.0,
                'min_duration': float('inf'),
                'max_duration': 0.0,
                'status_codes': {},
                'slow_requests': 0,
                'error_requests': 0,
                'methods': {}
            }
        
        endpoint_metrics = self.metrics[endpoint]
        
        # Update metrics
        endpoint_metrics['total_requests'] += 1
        endpoint_metrics['total_duration'] += duration
        endpoint_metrics['min_duration'] = min(endpoint_metrics['min_duration'], duration)
        endpoint_metrics['max_duration'] = max(endpoint_metrics['max_duration'], duration)
        
        # Status code tracking
        status_str = str(status_code)
        endpoint_metrics['status_codes'][status_str] = endpoint_metrics['status_codes'].get(status_str, 0) + 1
        
        # Method tracking
        endpoint_metrics['methods'][method] = endpoint_metrics['methods'].get(method, 0) + 1
        
        # Slow request tracking
        if duration > self.slow_request_threshold:
            endpoint_metrics['slow_requests'] += 1
        
        # Error tracking
        if status_code >= 400:
            endpoint_metrics['error_requests'] += 1
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics"""
        metrics_summary = {}
        
        for endpoint, metrics in self.metrics.items():
            if metrics['total_requests'] > 0:
                avg_duration = metrics['total_duration'] / metrics['total_requests']
                error_rate = (metrics['error_requests'] / metrics['total_requests']) * 100
                slow_request_rate = (metrics['slow_requests'] / metrics['total_requests']) * 100
                
                metrics_summary[endpoint] = {
                    'total_requests': metrics['total_requests'],
                    'average_duration': round(avg_duration, 3),
                    'min_duration': round(metrics['min_duration'], 3),
                    'max_duration': round(metrics['max_duration'], 3),
                    'error_rate': round(error_rate, 2),
                    'slow_request_rate': round(slow_request_rate, 2),
                    'status_codes': metrics['status_codes'],
                    'methods': metrics['methods']
                }
        
        return metrics_summary
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get system resource metrics"""
        try:
            # CPU and Memory
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Database connection pool info
            db_pool_info = self.get_db_pool_info()
            
            return {
                'cpu': {
                    'percent': cpu_percent,
                    'count': psutil.cpu_count()
                },
                'memory': {
                    'total': memory.total,
                    'available': memory.available,
                    'percent': memory.percent,
                    'used': memory.used
                },
                'disk': {
                    'total': disk.total,
                    'used': disk.used,
                    'free': disk.free,
                    'percent': (disk.used / disk.total) * 100
                },
                'database': db_pool_info,
                'python': {
                    'version': sys.version,
                    'executable': sys.executable
                }
            }
        except Exception as e:
            self.perf_logger.error(f"Error getting system metrics: {e}")
            return {"error": str(e)}
    
    def get_db_pool_info(self) -> Dict[str, Any]:
        """Get database connection pool information"""
        try:
            engine = db.engine
            pool = engine.pool
            
            return {
                'pool_size': pool.size(),
                'checked_in': pool.checkedin(),
                'checked_out': pool.checkedout(),
                'overflow': pool.overflow(),
                'invalid': pool.invalid()
            }
        except Exception as e:
            return {"error": f"Could not get DB pool info: {e}"}
    
    def get_slow_queries(self, limit: int = 10) -> Dict[str, Any]:
        """Get information about slow database queries"""
        # This would typically integrate with database query logging
        # For now, return placeholder data
        return {
            "slow_queries": [],
            "note": "Slow query tracking requires database-level configuration"
        }
    
    def reset_metrics(self):
        """Reset all collected metrics"""
        self.metrics = {}
        self.perf_logger.info("Performance metrics reset")
    
    def register_performance_routes(self, app: Flask):
        """Register performance monitoring endpoints"""
        
        @app.route('/api/monitoring/performance')
        def get_performance_metrics():
            """Get current performance metrics"""
            if not getattr(g, 'current_user', None) or not g.current_user.is_role('admin'):
                return jsonify({"error": "Admin access required"}), 403
            
            return jsonify(self.get_performance_metrics())
        
        @app.route('/api/monitoring/system')
        def get_system_metrics():
            """Get system resource metrics"""
            if not getattr(g, 'current_user', None) or not g.current_user.is_role('admin'):
                return jsonify({"error": "Admin access required"}), 403
            
            return jsonify(self.get_system_metrics())
        
        @app.route('/api/monitoring/health')
        def health_check():
            """Simple health check endpoint"""
            try:
                # Test database connection
                db.session.execute(text('SELECT 1'))
                db_status = "healthy"
            except Exception as e:
                db_status = f"unhealthy: {str(e)}"
            
            return jsonify({
                "status": "healthy" if db_status == "healthy" else "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "database": db_status,
                "uptime": time.time() - getattr(app, '_start_time', time.time())
            })
        
        @app.route('/api/monitoring/metrics/reset', methods=['POST'])
        def reset_performance_metrics():
            """Reset performance metrics (admin only)"""
            if not getattr(g, 'current_user', None) or not g.current_user.is_role('admin'):
                return jsonify({"error": "Admin access required"}), 403
            
            self.reset_metrics()
            return jsonify({"message": "Performance metrics reset successfully"})


def performance_timer(operation_name: str):
    """Decorator to time specific operations"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                logger = logging.getLogger('skillsync.performance')
                logger.info(f"Operation '{operation_name}' completed in {duration:.3f}s")
                
                # Log slow operations
                if duration > 1.0:  # More than 1 second
                    logger.warning(f"Slow operation detected: '{operation_name}' took {duration:.3f}s")
        
        return wrapper
    return decorator


def database_query_timer(query_name: str):
    """Decorator specifically for timing database queries"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                logger = logging.getLogger('skillsync.performance.database')
                logger.info(f"Database query '{query_name}' completed in {duration:.3f}s")
                
                # Log slow queries
                if duration > 0.5:  # More than 500ms
                    logger.warning(f"Slow database query: '{query_name}' took {duration:.3f}s")
        
        return wrapper
    return decorator


class DatabasePerformanceMonitor:
    """Monitor database performance and query execution"""
    
    def __init__(self, db_session):
        self.db_session = db_session
        self.query_log = []
        self.slow_query_threshold = 0.5  # 500ms
    
    def log_query(self, query: str, duration: float, params: Optional[Dict] = None):
        """Log a database query with its execution time"""
        query_info = {
            'query': query,
            'duration': duration,
            'timestamp': datetime.utcnow(),
            'params': params or {}
        }
        
        self.query_log.append(query_info)
        
        # Keep only last 1000 queries
        if len(self.query_log) > 1000:
            self.query_log = self.query_log[-1000:]
        
        # Log slow queries
        if duration > self.slow_query_threshold:
            logger = logging.getLogger('skillsync.performance.database')
            logger.warning(f"Slow query detected ({duration:.3f}s): {query[:100]}...")
    
    def get_slow_queries(self, limit: int = 10) -> List[Dict]:
        """Get the slowest recent queries"""
        slow_queries = [q for q in self.query_log if q['duration'] > self.slow_query_threshold]
        slow_queries.sort(key=lambda x: x['duration'], reverse=True)
        return slow_queries[:limit]
    
    def get_query_stats(self) -> Dict[str, Any]:
        """Get statistics about recent queries"""
        if not self.query_log:
            return {"total_queries": 0}
        
        durations = [q['duration'] for q in self.query_log]
        slow_queries = [q for q in self.query_log if q['duration'] > self.slow_query_threshold]
        
        return {
            "total_queries": len(self.query_log),
            "average_duration": sum(durations) / len(durations),
            "max_duration": max(durations),
            "min_duration": min(durations),
            "slow_queries_count": len(slow_queries),
            "slow_query_percentage": (len(slow_queries) / len(self.query_log)) * 100 if self.query_log else 0
        }