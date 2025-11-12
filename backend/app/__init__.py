from flask import Flask, jsonify
from .config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from .services.exceptions import ServiceError
from .firebase import init_firebase_app

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    db.init_app(app)

    # Initialize Firebase Admin SDK (if credentials are available via env)
    try:
        init_firebase_app(app)
    except Exception:
        # init_firebase_app logs internally; don't block app startup if Firebase not configured
        app.logger.info("Firebase Admin SDK not initialized or not configured")

    # Register Blueprints
    from .routes.auth_routes import auth_bp
    from .routes.gig_routes import gig_bp
    from .routes.user_routes import user_bp
    from .routes.admin_routes import admin_bp
    from .routes.application_routes import application_bp
    from .routes.rating_routes import rating_bp
    from .routes.notification_routes import notification_bp
    from .routes.health_routes import health_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(gig_bp, url_prefix="/api/gigs")
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(application_bp, url_prefix="/api/applications")
    app.register_blueprint(rating_bp, url_prefix="/api/ratings")
    app.register_blueprint(notification_bp, url_prefix="/api/notifications")
    app.register_blueprint(health_bp, url_prefix="/api/health")

    @app.errorhandler(ServiceError)
    def handle_service_error(error: ServiceError):
        response = {"error": error.message, "status": error.status_code}
        return jsonify(response), error.status_code

    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        response = {"error": error.description, "status": error.code}
        return jsonify(response), error.code

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        app.logger.exception("Unhandled exception", exc_info=error)
        response = {"error": "Internal server error", "status": 500}
        return jsonify(response), 500

    from .utils.api_documentation import create_api_docs_routes
    create_api_docs_routes(app)

    return app
