"""
API Documentation Generator for SkillSync Platform
Generates comprehensive OpenAPI/Swagger documentation with interactive explorer
"""

from typing import Dict, List, Any, Optional
from flask import Flask
import json


class APIDocumentationGenerator:
    """Generate comprehensive API documentation"""
    
    def __init__(self, app: Flask):
        self.app = app
        self.spec = {
            "openapi": "3.0.0",
            "info": {
                "title": "SkillSync API",
                "description": "Mobile-first gig platform for ALU students connecting students, providers, and admins",
                "version": "1.0.0",
                "contact": {
                    "name": "SkillSync API Support",
                    "email": "api-support@skillsync.com"
                },
                "license": {
                    "name": "MIT",
                    "url": "https://opensource.org/licenses/MIT"
                }
            },
            "servers": [
                {
                    "url": "http://localhost:5000/api",
                    "description": "Development server"
                },
                {
                    "url": "https://api.skillsync.com",
                    "description": "Production server"
                }
            ],
            "tags": self._get_api_tags(),
            "paths": {},
            "components": {
                "schemas": self._get_schemas(),
                "securitySchemes": self._get_security_schemes(),
                "responses": self._get_common_responses(),
                "parameters": self._get_common_parameters()
            },
            "security": [{"BearerAuth": []}]
        }
    
    def _get_api_tags(self) -> List[Dict]:
        """Define API tags for grouping endpoints"""
        return [
            {"name": "Authentication", "description": "User authentication and authorization"},
            {"name": "Users", "description": "User profile management"},
            {"name": "Gigs", "description": "Gig creation, browsing, and management"},
            {"name": "Applications", "description": "Gig application workflow"},
            {"name": "Ratings", "description": "Rating and feedback system"},
            {"name": "Notifications", "description": "Notification management and preferences"},
            {"name": "Admin", "description": "Administrative functions and analytics"},
            {"name": "Skills", "description": "Skills management for students"},
            {"name": "Recommendations", "description": "Gig recommendation system"},
            {"name": "Analytics", "description": "Platform analytics and metrics"},
            {"name": "System", "description": "System health and status"}
        ]
    
    def _get_schemas(self) -> Dict[str, Any]:
        """Define reusable schemas"""
        return {
            "User": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer", "description": "User ID"},
                    "uid": {"type": "string", "description": "Firebase UID"},
                    "name": {"type": "string", "description": "User's full name"},
                    "email": {"type": "string", "format": "email", "description": "User's email address"},
                    "role": {"type": "string", "enum": ["student", "provider", "admin"], "description": "User role"},
                    "profile_photo": {"type": "string", "description": "Profile photo URL"},
                    "location": {"type": "string", "description": "User's location"},
                    "bio": {"type": "string", "description": "User's biography"},
                    "average_rating": {"type": "number", "format": "float", "description": "Average rating received"},
                    "created_at": {"type": "string", "format": "date-time", "description": "Account creation timestamp"}
                },
                "required": ["id", "name", "role"]
            },
            "Gig": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer", "description": "Gig ID"},
                    "title": {"type": "string", "description": "Gig title"},
                    "description": {"type": "string", "description": "Detailed gig description"},
                    "budget": {"type": "number", "format": "float", "description": "Gig budget"},
                    "location": {"type": "string", "description": "Gig location"},
                    "category": {"type": "string", "description": "Gig category"},
                    "status": {"type": "string", "enum": ["open", "closed", "completed", "expired"], "description": "Gig status"},
                    "approval_status": {"type": "string", "enum": ["pending", "approved", "rejected"], "description": "Admin approval status"},
                    "deadline": {"type": "string", "format": "date-time", "description": "Gig deadline"},
                    "provider_id": {"type": "integer", "description": "Provider's user ID"},
                    "provider": {"$ref": "#/components/schemas/User"},
                    "created_at": {"type": "string", "format": "date-time", "description": "Creation timestamp"},
                    "updated_at": {"type": "string", "format": "date-time", "description": "Last update timestamp"}
                },
                "required": ["id", "title", "description", "provider_id", "status"]
            },
            "Application": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer", "description": "Application ID"},
                    "gig_id": {"type": "integer", "description": "Gig ID"},
                    "student_id": {"type": "integer", "description": "Student's user ID"},
                    "status": {"type": "string", "enum": ["pending", "accepted", "rejected", "completed", "withdrawn"], "description": "Application status"},
                    "notes": {"type": "string", "description": "Application notes from student"},
                    "applied_at": {"type": "string", "format": "date-time", "description": "Application timestamp"},
                    "selected_at": {"type": "string", "format": "date-time", "description": "Selection timestamp"},
                    "student": {"$ref": "#/components/schemas/User"},
                    "gig": {"$ref": "#/components/schemas/Gig"}
                },
                "required": ["id", "gig_id", "student_id", "status"]
            },
            "Rating": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer", "description": "Rating ID"},
                    "rater_id": {"type": "integer", "description": "Rater's user ID"},
                    "ratee_id": {"type": "integer", "description": "Ratee's user ID"},
                    "gig_id": {"type": "integer", "description": "Associated gig ID"},
                    "score": {"type": "integer", "minimum": 1, "maximum": 5, "description": "Rating score (1-5)"},
                    "comment": {"type": "string", "description": "Rating comment"},
                    "created_at": {"type": "string", "format": "date-time", "description": "Rating timestamp"},
                    "rater": {"$ref": "#/components/schemas/User"},
                    "ratee": {"$ref": "#/components/schemas/User"},
                    "moderation": {
                        "type": "object",
                        "properties": {
                            "is_flagged": {"type": "boolean"},
                            "flag_reason": {"type": "string"},
                            "moderation_status": {"type": "string", "enum": ["pending", "approved", "rejected"]},
                            "moderated_at": {"type": "string", "format": "date-time"},
                            "moderated_by": {"type": "integer"}
                        }
                    }
                },
                "required": ["id", "rater_id", "ratee_id", "gig_id", "score"]
            },
            "Notification": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer", "description": "Notification ID"},
                    "type": {"type": "string", "description": "Notification type"},
                    "title": {"type": "string", "description": "Notification title"},
                    "message": {"type": "string", "description": "Notification message"},
                    "read": {"type": "boolean", "description": "Read status"},
                    "related_gig_id": {"type": "integer", "description": "Related gig ID"},
                    "related_application_id": {"type": "integer", "description": "Related application ID"},
                    "created_at": {"type": "string", "format": "date-time", "description": "Creation timestamp"}
                },
                "required": ["id", "type", "title", "message", "read"]
            },
            "NotificationPreference": {
                "type": "object",
                "properties": {
                    "notification_type": {"type": "string", "description": "Type of notification"},
                    "email_enabled": {"type": "boolean", "description": "Email notifications enabled"},
                    "push_enabled": {"type": "boolean", "description": "Push notifications enabled"},
                    "in_app_enabled": {"type": "boolean", "description": "In-app notifications enabled"},
                    "updated_at": {"type": "string", "format": "date-time", "description": "Last update timestamp"}
                },
                "required": ["notification_type"]
            },
            "PaginatedResponse": {
                "type": "object",
                "properties": {
                    "items": {"type": "array", "description": "Array of items"},
                    "page": {"type": "integer", "description": "Current page number"},
                    "per_page": {"type": "integer", "description": "Items per page"},
                    "total": {"type": "integer", "description": "Total number of items"},
                    "pages": {"type": "integer", "description": "Total number of pages"}
                },
                "required": ["items", "page", "per_page", "total", "pages"]
            },
            "ErrorResponse": {
                "type": "object",
                "properties": {
                    "error": {"type": "string", "description": "Error message"},
                    "code": {"type": "integer", "description": "Error code"},
                    "details": {"type": "object", "description": "Additional error details"}
                },
                "required": ["error"]
            },
            "SuccessResponse": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Success message"},
                    "data": {"type": "object", "description": "Response data"}
                }
            }
        }
    
    def _get_security_schemes(self) -> Dict[str, Any]:
        """Define security schemes"""
        return {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": (
                    "Firebase JWT token or test token for authentication. "
                    "\n\n**Production**: Use Firebase ID tokens from Firebase Authentication. "
                    "\n\n**Development/Testing**: Use test tokens in the format 'test:<uid>:<role>' "
                    "(e.g., 'test:student1:student', 'test:provider1:provider', 'test:admin1:admin'). "
                    "Test tokens are automatically disabled in production. "
                    "\n\nSee /docs/TEST_TOKENS.md for complete documentation."
                )
            }
        }
    
    def _get_common_responses(self) -> Dict[str, Any]:
        """Define common responses"""
        return {
            "BadRequest": {
                "description": "Bad request",
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                    }
                }
            },
            "Unauthorized": {
                "description": "Unauthorized access",
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                    }
                }
            },
            "Forbidden": {
                "description": "Forbidden access",
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                    }
                }
            },
            "NotFound": {
                "description": "Resource not found",
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                    }
                }
            },
            "InternalServerError": {
                "description": "Internal server error",
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                    }
                }
            }
        }
    
    def _get_common_parameters(self) -> Dict[str, Any]:
        """Define common parameters"""
        return {
            "PageParam": {
                "name": "page",
                "in": "query",
                "description": "Page number for pagination",
                "schema": {"type": "integer", "minimum": 1, "default": 1}
            },
            "PerPageParam": {
                "name": "per_page",
                "in": "query",
                "description": "Number of items per page",
                "schema": {"type": "integer", "minimum": 1, "maximum": 100, "default": 20}
            },
            "SearchParam": {
                "name": "search",
                "in": "query",
                "description": "Search query string",
                "schema": {"type": "string"}
            }
        }
    
    def add_auth_endpoints(self):
        """Add authentication endpoints"""
        self.spec["paths"].update({
            "/auth/verify": {
                "post": {
                    "tags": ["Authentication"],
                    "summary": "Verify Firebase token",
                    "description": (
                        "Verify Firebase authentication token or test token. "
                        "\n\n**Development/Testing**: Use test tokens in format 'test:<uid>:<role>' "
                        "(e.g., 'test:student1:student', 'test:provider1:provider'). "
                        "Test tokens are automatically disabled in production. "
                        "\n\n**Production**: Use Firebase ID tokens from Firebase Authentication."
                    ),
                    "security": [],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "token": {
                                            "type": "string", 
                                            "description": "Firebase ID token or test token (format: test:<uid>:<role>)",
                                            "example": "test:student1:student"
                                        }
                                    },
                                    "required": ["token"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Token valid",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "status": {"type": "string"},
                                            "uid": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        },
                        "401": {"$ref": "#/components/responses/Unauthorized"}
                    }
                }
            },
            "/auth/set-role": {
                "post": {
                    "tags": ["Authentication"],
                    "summary": "Set user role",
                    "description": "Change a user's role (admin only)",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "user_uid": {"type": "string", "description": "User's Firebase UID"},
                                        "role": {"type": "string", "enum": ["student", "provider", "admin"]}
                                    },
                                    "required": ["user_uid", "role"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Role updated successfully",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "message": {"type": "string"},
                                            "user": {"$ref": "#/components/schemas/User"}
                                        }
                                    }
                                }
                            }
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"},
                        "403": {"$ref": "#/components/responses/Forbidden"}
                    }
                }
            },
            "/auth/me": {
                "get": {
                    "tags": ["Authentication"],
                    "summary": "Get current user",
                    "description": "Get authenticated user's profile with stats",
                    "responses": {
                        "200": {
                            "description": "User profile with statistics",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "allOf": [
                                            {"$ref": "#/components/schemas/User"},
                                            {
                                                "properties": {
                                                    "stats": {
                                                        "type": "object",
                                                        "properties": {
                                                            "provided_gigs": {"type": "integer"},
                                                            "applications": {"type": "integer"},
                                                            "notifications_unread": {"type": "integer"},
                                                            "average_rating": {"type": "number"}
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        "401": {"$ref": "#/components/responses/Unauthorized"}
                    }
                }
            }
        })
    
    def add_gig_endpoints(self):
        """Add gig management endpoints"""
        self.spec["paths"].update({
            "/gigs": {
                "get": {
                    "tags": ["Gigs"],
                    "summary": "Browse gigs",
                    "description": "Get list of gigs with filtering and pagination",
                    "parameters": [
                        {"$ref": "#/components/parameters/PageParam"},
                        {"$ref": "#/components/parameters/PerPageParam"},
                        {"$ref": "#/components/parameters/SearchParam"},
                        {
                            "name": "category",
                            "in": "query",
                            "description": "Filter by category",
                            "schema": {"type": "string"}
                        },
                        {
                            "name": "location",
                            "in": "query",
                            "description": "Filter by location",
                            "schema": {"type": "string"}
                        },
                        {
                            "name": "min_budget",
                            "in": "query",
                            "description": "Minimum budget filter",
                            "schema": {"type": "number"}
                        },
                        {
                            "name": "max_budget",
                            "in": "query",
                            "description": "Maximum budget filter",
                            "schema": {"type": "number"}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of gigs",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "allOf": [
                                            {"$ref": "#/components/schemas/PaginatedResponse"},
                                            {
                                                "properties": {
                                                    "items": {
                                                        "type": "array",
                                                        "items": {"$ref": "#/components/schemas/Gig"}
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                "post": {
                    "tags": ["Gigs"],
                    "summary": "Create gig",
                    "description": "Create a new gig (providers only)",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "title": {"type": "string"},
                                        "description": {"type": "string"},
                                        "budget": {"type": "number"},
                                        "location": {"type": "string"},
                                        "category": {"type": "string"},
                                        "deadline": {"type": "string", "format": "date-time"}
                                    },
                                    "required": ["title", "description"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "description": "Gig created successfully",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Gig"}
                                }
                            }
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"},
                        "403": {"$ref": "#/components/responses/Forbidden"}
                    }
                }
            },
            "/gigs/{gig_id}": {
                "get": {
                    "tags": ["Gigs"],
                    "summary": "Get gig details",
                    "description": "Get detailed information about a specific gig",
                    "parameters": [
                        {
                            "name": "gig_id",
                            "in": "path",
                            "required": True,
                            "description": "Gig ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Gig details",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Gig"}
                                }
                            }
                        },
                        "404": {"$ref": "#/components/responses/NotFound"}
                    }
                },
                "put": {
                    "tags": ["Gigs"],
                    "summary": "Update gig",
                    "description": "Update gig details (provider only)",
                    "parameters": [
                        {
                            "name": "gig_id",
                            "in": "path",
                            "required": True,
                            "description": "Gig ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "title": {"type": "string"},
                                        "description": {"type": "string"},
                                        "budget": {"type": "number"},
                                        "location": {"type": "string"},
                                        "category": {"type": "string"}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Gig updated",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Gig"}
                                }
                            }
                        },
                        "403": {"$ref": "#/components/responses/Forbidden"},
                        "404": {"$ref": "#/components/responses/NotFound"}
                    }
                },
                "delete": {
                    "tags": ["Gigs"],
                    "summary": "Delete gig",
                    "description": "Delete a gig (provider only)",
                    "parameters": [
                        {
                            "name": "gig_id",
                            "in": "path",
                            "required": True,
                            "description": "Gig ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "responses": {
                        "204": {"description": "Gig deleted successfully"},
                        "400": {"$ref": "#/components/responses/BadRequest"},
                        "403": {"$ref": "#/components/responses/Forbidden"}
                    }
                }
            },
            "/gigs/my-gigs": {
                "get": {
                    "tags": ["Gigs"],
                    "summary": "Get provider's gigs",
                    "description": "Get all gigs created by current provider",
                    "responses": {
                        "200": {
                            "description": "List of provider's gigs",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/Gig"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/gigs/analytics": {
                "get": {
                    "tags": ["Gigs"],
                    "summary": "Get provider analytics",
                    "description": "Get analytics for provider's gigs",
                    "responses": {
                        "200": {
                            "description": "Provider analytics",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "total_gigs": {"type": "integer"},
                                            "active_gigs": {"type": "integer"},
                                            "total_applications": {"type": "integer"},
                                            "completed_gigs": {"type": "integer"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/gigs/expiring-soon": {
                "get": {
                    "tags": ["Gigs"],
                    "summary": "Get expiring gigs",
                    "description": "Get gigs expiring soon (provider only)",
                    "parameters": [
                        {
                            "name": "days",
                            "in": "query",
                            "description": "Number of days ahead to check",
                            "schema": {"type": "integer", "default": 7}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of expiring gigs",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/Gig"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/gigs/mark-expired": {
                "post": {
                    "tags": ["Gigs"],
                    "summary": "Mark expired gigs",
                    "description": "Mark all expired gigs as expired (admin only)",
                    "responses": {
                        "200": {
                            "description": "Gigs marked as expired",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "expired_count": {"type": "integer"},
                                            "message": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/gigs/recommended": {
                "get": {
                    "tags": ["Recommendations"],
                    "summary": "Get recommended gigs",
                    "description": "Get personalized gig recommendations for student based on skills and history",
                    "parameters": [
                        {
                            "name": "limit",
                            "in": "query",
                            "description": "Number of recommendations (max 20)",
                            "schema": {"type": "integer", "default": 10, "maximum": 20}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of recommended gigs",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/Gig"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/gigs/{gig_id}/similar": {
                "get": {
                    "tags": ["Recommendations"],
                    "summary": "Get similar gigs",
                    "description": "Get gigs similar to the specified gig",
                    "parameters": [
                        {
                            "name": "gig_id",
                            "in": "path",
                            "required": True,
                            "description": "Gig ID",
                            "schema": {"type": "integer"}
                        },
                        {
                            "name": "limit",
                            "in": "query",
                            "description": "Number of similar gigs (max 10)",
                            "schema": {"type": "integer", "default": 5, "maximum": 10}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of similar gigs",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/Gig"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/gigs/trending": {
                "get": {
                    "tags": ["Recommendations"],
                    "summary": "Get trending gigs",
                    "description": "Get currently trending gigs based on application activity",
                    "parameters": [
                        {
                            "name": "limit",
                            "in": "query",
                            "description": "Number of trending gigs (max 20)",
                            "schema": {"type": "integer", "default": 10, "maximum": 20}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of trending gigs",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "gig": {"$ref": "#/components/schemas/Gig"},
                                                "application_count": {"type": "integer"},
                                                "trending_score": {"type": "number"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/gigs/recommendation-stats": {
                "get": {
                    "tags": ["Recommendations"],
                    "summary": "Get recommendation stats",
                    "description": "Get recommendation statistics for current student",
                    "responses": {
                        "200": {
                            "description": "Recommendation statistics",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "total_recommendations": {"type": "integer"},
                                            "applied_to_recommended": {"type": "integer"},
                                            "success_rate": {"type": "number"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/gigs/{gig_id}/status": {
                "patch": {
                    "tags": ["Gigs"],
                    "summary": "Update gig status",
                    "description": "Update gig status (provider only)",
                    "parameters": [
                        {
                            "name": "gig_id",
                            "in": "path",
                            "required": True,
                            "description": "Gig ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "status": {"type": "string", "enum": ["open", "closed", "completed", "expired"]}
                                    },
                                    "required": ["status"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Gig status updated",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Gig"}
                                }
                            }
                        }
                    }
                }
            },
            "/gigs/{gig_id}/applications": {
                "get": {
                    "tags": ["Gigs"],
                    "summary": "Get gig applications",
                    "description": "Get all applications for a specific gig (provider only)",
                    "parameters": [
                        {
                            "name": "gig_id",
                            "in": "path",
                            "required": True,
                            "description": "Gig ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of applications",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/Application"}
                                    }
                                }
                            }
                        },
                        "403": {"$ref": "#/components/responses/Forbidden"}
                    }
                }
            }
        })
    
    def add_user_endpoints(self):
        """Add user management endpoints"""
        self.spec["paths"].update({
            "/users/{user_id}": {
                "get": {
                    "tags": ["Users"],
                    "summary": "Get user profile",
                    "description": "Get user profile by ID",
                    "parameters": [
                        {
                            "name": "user_id",
                            "in": "path",
                            "required": True,
                            "description": "User ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "User profile",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/User"}
                                }
                            }
                        },
                        "404": {"$ref": "#/components/responses/NotFound"}
                    }
                }
            },
            "/users/profile": {
                "put": {
                    "tags": ["Users"],
                    "summary": "Update user profile",
                    "description": "Update current user's profile",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "name": {"type": "string"},
                                        "bio": {"type": "string"},
                                        "location": {"type": "string"},
                                        "profile_photo": {"type": "string"}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Profile updated",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/User"}
                                }
                            }
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"}
                    }
                }
            },
            "/users/gig-history": {
                "get": {
                    "tags": ["Users"],
                    "summary": "Get user gig history",
                    "description": "Get gig history for current student user",
                    "responses": {
                        "200": {
                            "description": "Gig history",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "completed_gigs": {"type": "array"},
                                            "total_earned": {"type": "number"},
                                            "gigs_count": {"type": "integer"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/users/saved-gigs": {
                "get": {
                    "tags": ["Users"],
                    "summary": "List saved gigs",
                    "description": "Get list of gigs saved by current user",
                    "responses": {
                        "200": {
                            "description": "List of saved gigs",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "id": {"type": "integer"},
                                                "user_id": {"type": "integer"},
                                                "gig_id": {"type": "integer"},
                                                "saved_at": {"type": "string", "format": "date-time"},
                                                "gig": {"$ref": "#/components/schemas/Gig"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "post": {
                    "tags": ["Users"],
                    "summary": "Save a gig",
                    "description": "Save a gig to favorites",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "gig_id": {"type": "integer"}
                                    },
                                    "required": ["gig_id"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "description": "Gig saved successfully",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "id": {"type": "integer"},
                                            "user_id": {"type": "integer"},
                                            "gig_id": {"type": "integer"},
                                            "saved_at": {"type": "string", "format": "date-time"}
                                        }
                                    }
                                }
                            }
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"}
                    }
                }
            },
            "/users/saved-gigs/{saved_gig_id}": {
                "delete": {
                    "tags": ["Users"],
                    "summary": "Remove saved gig",
                    "description": "Remove a gig from saved list",
                    "parameters": [
                        {
                            "name": "saved_gig_id",
                            "in": "path",
                            "required": True,
                            "description": "Saved gig ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "responses": {
                        "204": {"description": "Gig removed successfully"},
                        "400": {"$ref": "#/components/responses/BadRequest"}
                    }
                }
            },
            "/users/skills": {
                "get": {
                    "tags": ["Skills"],
                    "summary": "Get user skills",
                    "description": "Get skills for current student",
                    "responses": {
                        "200": {
                            "description": "List of skills",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "skill_name": {"type": "string"},
                                                "proficiency_level": {"type": "string"},
                                                "added_at": {"type": "string", "format": "date-time"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "post": {
                    "tags": ["Skills"],
                    "summary": "Add skill",
                    "description": "Add a skill to current student profile",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "skill_name": {"type": "string"},
                                        "proficiency_level": {"type": "string", "enum": ["beginner", "intermediate", "advanced", "expert"]}
                                    },
                                    "required": ["skill_name"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "description": "Skill added successfully",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "skill_name": {"type": "string"},
                                            "proficiency_level": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"}
                    }
                }
            },
            "/users/skills/{skill_name}": {
                "put": {
                    "tags": ["Skills"],
                    "summary": "Update skill",
                    "description": "Update proficiency level of a skill",
                    "parameters": [
                        {
                            "name": "skill_name",
                            "in": "path",
                            "required": True,
                            "description": "Skill name",
                            "schema": {"type": "string"}
                        }
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "proficiency_level": {"type": "string", "enum": ["beginner", "intermediate", "advanced", "expert"]}
                                    },
                                    "required": ["proficiency_level"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Skill updated",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "skill_name": {"type": "string"},
                                            "proficiency_level": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "delete": {
                    "tags": ["Skills"],
                    "summary": "Remove skill",
                    "description": "Remove a skill from student profile",
                    "parameters": [
                        {
                            "name": "skill_name",
                            "in": "path",
                            "required": True,
                            "description": "Skill name",
                            "schema": {"type": "string"}
                        }
                    ],
                    "responses": {
                        "204": {"description": "Skill removed successfully"}
                    }
                }
            },
            "/users/availability": {
                "put": {
                    "tags": ["Users"],
                    "summary": "Update availability",
                    "description": "Update student availability status",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "availability_status": {"type": "string", "enum": ["available", "busy", "unavailable"]}
                                    },
                                    "required": ["availability_status"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Availability updated",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "message": {"type": "string"},
                                            "status": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/users/skills/search": {
                "get": {
                    "tags": ["Skills"],
                    "summary": "Search skills",
                    "description": "Search available skills catalog",
                    "parameters": [
                        {
                            "name": "q",
                            "in": "query",
                            "description": "Search term",
                            "schema": {"type": "string"}
                        },
                        {
                            "name": "category",
                            "in": "query",
                            "description": "Filter by category",
                            "schema": {"type": "string"}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of skills",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "name": {"type": "string"},
                                                "category": {"type": "string"},
                                                "description": {"type": "string"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
    
    def add_application_endpoints(self):
        """Add application management endpoints"""
        self.spec["paths"].update({
            "/applications": {
                "post": {
                    "tags": ["Applications"],
                    "summary": "Apply to gig",
                    "description": "Submit application to a gig (student only)",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "gig_id": {"type": "integer"},
                                        "notes": {"type": "string"}
                                    },
                                    "required": ["gig_id"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "description": "Application submitted",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Application"}
                                }
                            }
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"}
                    }
                }
            },
            "/applications/my-applications": {
                "get": {
                    "tags": ["Applications"],
                    "summary": "Get my applications",
                    "description": "Get all applications submitted by current student",
                    "parameters": [
                        {
                            "name": "status",
                            "in": "query",
                            "description": "Filter by status",
                            "schema": {"type": "string", "enum": ["pending", "accepted", "rejected", "completed", "withdrawn"]}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of applications",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/Application"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/applications/{application_id}/select": {
                "patch": {
                    "tags": ["Applications"],
                    "summary": "Select applicant",
                    "description": "Accept an application (provider only)",
                    "parameters": [
                        {
                            "name": "application_id",
                            "in": "path",
                            "required": True,
                            "description": "Application ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Application accepted",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Application"}
                                }
                            }
                        },
                        "403": {"$ref": "#/components/responses/Forbidden"},
                        "404": {"$ref": "#/components/responses/NotFound"}
                    }
                }
            },
            "/applications/{application_id}/reject": {
                "patch": {
                    "tags": ["Applications"],
                    "summary": "Reject application",
                    "description": "Reject an application (provider only)",
                    "parameters": [
                        {
                            "name": "application_id",
                            "in": "path",
                            "required": True,
                            "description": "Application ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Application rejected",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Application"}
                                }
                            }
                        },
                        "403": {"$ref": "#/components/responses/Forbidden"}
                    }
                }
            },
            "/applications/{application_id}/withdraw": {
                "patch": {
                    "tags": ["Applications"],
                    "summary": "Withdraw application",
                    "description": "Withdraw own application (student only)",
                    "parameters": [
                        {
                            "name": "application_id",
                            "in": "path",
                            "required": True,
                            "description": "Application ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Application withdrawn",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "message": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/applications/bulk-update": {
                "patch": {
                    "tags": ["Applications"],
                    "summary": "Bulk update applications",
                    "description": "Update multiple applications at once (provider only)",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "gig_id": {"type": "integer"},
                                        "updates": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "application_id": {"type": "integer"},
                                                    "status": {"type": "string"}
                                                }
                                            }
                                        }
                                    },
                                    "required": ["gig_id", "updates"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Applications updated",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "message": {"type": "string"},
                                            "updated_applications": {
                                                "type": "array",
                                                "items": {"$ref": "#/components/schemas/Application"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
    
    def add_rating_endpoints(self):
        """Add rating system endpoints"""
        self.spec["paths"].update({
            "/ratings": {
                "post": {
                    "tags": ["Ratings"],
                    "summary": "Submit rating",
                    "description": "Submit a rating for a user after completing a gig",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "ratee_id": {"type": "integer"},
                                        "gig_id": {"type": "integer"},
                                        "score": {"type": "integer", "minimum": 1, "maximum": 5},
                                        "comment": {"type": "string"}
                                    },
                                    "required": ["ratee_id", "gig_id", "score"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "description": "Rating submitted",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Rating"}
                                }
                            }
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"}
                    }
                }
            },
            "/ratings/user/{user_id}": {
                "get": {
                    "tags": ["Ratings"],
                    "summary": "Get user ratings",
                    "description": "Get all ratings received by a user",
                    "parameters": [
                        {
                            "name": "user_id",
                            "in": "path",
                            "required": True,
                            "description": "User ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of ratings",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/Rating"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/ratings/user/{user_id}/analytics": {
                "get": {
                    "tags": ["Ratings"],
                    "summary": "Get rating analytics",
                    "description": "Get detailed rating analytics for a user",
                    "parameters": [
                        {
                            "name": "user_id",
                            "in": "path",
                            "required": True,
                            "description": "User ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Rating analytics",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "user_id": {"type": "integer"},
                                            "average_rating": {"type": "number"},
                                            "total_ratings_received": {"type": "integer"},
                                            "rating_distribution": {"type": "object"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/ratings/gig/{gig_id}/summary": {
                "get": {
                    "tags": ["Ratings"],
                    "summary": "Get gig rating summary",
                    "description": "Get rating summary for a specific gig",
                    "parameters": [
                        {
                            "name": "gig_id",
                            "in": "path",
                            "required": True,
                            "description": "Gig ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Gig rating summary",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "gig_id": {"type": "integer"},
                                            "average_rating": {"type": "number"},
                                            "total_ratings": {"type": "integer"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/ratings/platform/stats": {
                "get": {
                    "tags": ["Ratings"],
                    "summary": "Get platform rating stats",
                    "description": "Get platform-wide rating statistics (admin only)",
                    "responses": {
                        "200": {
                            "description": "Platform rating statistics",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "total_ratings": {"type": "integer"},
                                            "average_rating": {"type": "number"},
                                            "ratings_by_score": {"type": "object"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/ratings/moderation/pending": {
                "get": {
                    "tags": ["Ratings"],
                    "summary": "Get pending moderation ratings",
                    "description": "Get ratings flagged for moderation (admin only)",
                    "responses": {
                        "200": {
                            "description": "List of flagged ratings",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/Rating"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/ratings/{rating_id}/update": {
                "put": {
                    "tags": ["Ratings"],
                    "summary": "Update rating",
                    "description": "Update own rating within 24 hours",
                    "parameters": [
                        {
                            "name": "rating_id",
                            "in": "path",
                            "required": True,
                            "description": "Rating ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "score": {"type": "integer", "minimum": 1, "maximum": 5},
                                        "comment": {"type": "string"}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Rating updated",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Rating"}
                                }
                            }
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"}
                    }
                }
            },
            "/ratings/{rating_id}/flag": {
                "post": {
                    "tags": ["Ratings"],
                    "summary": "Flag rating",
                    "description": "Flag a rating for review",
                    "parameters": [
                        {
                            "name": "rating_id",
                            "in": "path",
                            "required": True,
                            "description": "Rating ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "reason": {"type": "string"}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Rating flagged",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Rating"}
                                }
                            }
                        }
                    }
                }
            }
        })
    
    def add_admin_endpoints(self):
        """Add admin endpoints"""
        self.spec["paths"].update({
            "/admin/gigs/pending": {
                "get": {
                    "tags": ["Admin"],
                    "summary": "Get pending gigs",
                    "description": "Get all gigs pending approval (admin only)",
                    "responses": {
                        "200": {
                            "description": "List of pending gigs",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/Gig"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/admin/gigs/{gig_id}/approve": {
                "patch": {
                    "tags": ["Admin"],
                    "summary": "Approve gig",
                    "description": "Approve a pending gig (admin only)",
                    "parameters": [
                        {
                            "name": "gig_id",
                            "in": "path",
                            "required": True,
                            "description": "Gig ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Gig approved",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Gig"}
                                }
                            }
                        }
                    }
                }
            },
            "/admin/gigs/{gig_id}/reject": {
                "patch": {
                    "tags": ["Admin"],
                    "summary": "Reject gig",
                    "description": "Reject a pending gig (admin only)",
                    "parameters": [
                        {
                            "name": "gig_id",
                            "in": "path",
                            "required": True,
                            "description": "Gig ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "reason": {"type": "string"}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Gig rejected",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Gig"}
                                }
                            }
                        }
                    }
                }
            },
            "/admin/users": {
                "get": {
                    "tags": ["Admin"],
                    "summary": "List all users",
                    "description": "Get paginated list of all users (admin only)",
                    "parameters": [
                        {"$ref": "#/components/parameters/PageParam"},
                        {"$ref": "#/components/parameters/PerPageParam"},
                        {
                            "name": "role",
                            "in": "query",
                            "description": "Filter by role",
                            "schema": {"type": "string", "enum": ["student", "provider", "admin"]}
                        },
                        {
                            "name": "search",
                            "in": "query",
                            "description": "Search users by name or email",
                            "schema": {"type": "string"}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Paginated list of users",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/PaginatedResponse"}
                                }
                            }
                        }
                    }
                }
            },
            "/admin/users/{user_id}/role": {
                "patch": {
                    "tags": ["Admin"],
                    "summary": "Change user role",
                    "description": "Change a user's role (admin only)",
                    "parameters": [
                        {
                            "name": "user_id",
                            "in": "path",
                            "required": True,
                            "description": "User ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "role": {"type": "string", "enum": ["student", "provider", "admin"]}
                                    },
                                    "required": ["role"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "User role updated",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/User"}
                                }
                            }
                        }
                    }
                }
            },
            "/admin/analytics/overview": {
                "get": {
                    "tags": ["Analytics"],
                    "summary": "Get system overview",
                    "description": "Get platform analytics overview (admin only)",
                    "responses": {
                        "200": {
                            "description": "System analytics",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "total_users": {"type": "integer"},
                                            "total_gigs": {"type": "integer"},
                                            "total_applications": {"type": "integer"},
                                            "platform_metrics": {"type": "object"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/admin/analytics/gigs": {
                "get": {
                    "tags": ["Analytics"],
                    "summary": "Get gig analytics",
                    "description": "Get detailed gig analytics (admin only)",
                    "responses": {
                        "200": {
                            "description": "Gig analytics",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "gigs_by_status": {"type": "object"},
                                            "gigs_by_category": {"type": "object"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/admin/analytics/users": {
                "get": {
                    "tags": ["Analytics"],
                    "summary": "Get user analytics",
                    "description": "Get detailed user analytics (admin only)",
                    "responses": {
                        "200": {
                            "description": "User analytics",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "users_by_role": {"type": "object"},
                                            "active_users": {"type": "integer"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/admin/ratings/flagged": {
                "get": {
                    "tags": ["Admin"],
                    "summary": "Get flagged ratings",
                    "description": "Get all flagged ratings for moderation (admin only)",
                    "responses": {
                        "200": {
                            "description": "List of flagged ratings",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/Rating"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/admin/ratings/{rating_id}/moderate": {
                "patch": {
                    "tags": ["Admin"],
                    "summary": "Moderate rating",
                    "description": "Approve or reject a flagged rating (admin only)",
                    "parameters": [
                        {
                            "name": "rating_id",
                            "in": "path",
                            "required": True,
                            "description": "Rating ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "action": {"type": "string", "enum": ["approve", "reject"]},
                                        "note": {"type": "string"}
                                    },
                                    "required": ["action"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Rating moderated",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Rating"}
                                }
                            }
                        }
                    }
                }
            }
        })
    
    def add_notification_endpoints(self):
        """Add notification endpoints"""
        self.spec["paths"].update({
            "/notifications": {
                "get": {
                    "tags": ["Notifications"],
                    "summary": "Get user notifications",
                    "description": "Get list of notifications for the current user",
                    "parameters": [
                        {
                            "name": "unread_only",
                            "in": "query",
                            "description": "Show only unread notifications",
                            "schema": {"type": "boolean", "default": False}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of notifications",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/Notification"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/notifications/{notification_id}/read": {
                "patch": {
                    "tags": ["Notifications"],
                    "summary": "Mark notification as read",
                    "description": "Mark a single notification as read",
                    "parameters": [
                        {
                            "name": "notification_id",
                            "in": "path",
                            "required": True,
                            "description": "Notification ID",
                            "schema": {"type": "integer"}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Notification marked as read",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Notification"}
                                }
                            }
                        }
                    }
                }
            },
            "/notifications/read-all": {
                "patch": {
                    "tags": ["Notifications"],
                    "summary": "Mark all notifications as read",
                    "description": "Mark all user's notifications as read",
                    "responses": {
                        "200": {
                            "description": "All notifications marked as read",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "updated": {"type": "integer", "description": "Number of notifications updated"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/notifications/preferences": {
                "get": {
                    "tags": ["Notifications"],
                    "summary": "Get notification preferences",
                    "description": "Get user's notification preferences",
                    "responses": {
                        "200": {
                            "description": "Notification preferences",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/NotificationPreference"}
                                    }
                                }
                            }
                        }
                    }
                },
                "put": {
                    "tags": ["Notifications"],
                    "summary": "Update notification preferences",
                    "description": "Update multiple notification preferences",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "preferences": {
                                            "type": "array",
                                            "items": {"$ref": "#/components/schemas/NotificationPreference"}
                                        }
                                    },
                                    "required": ["preferences"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Preferences updated successfully",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "message": {"type": "string"},
                                            "updated_count": {"type": "integer"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/notifications/preferences/{notification_type}": {
                "patch": {
                    "tags": ["Notifications"],
                    "summary": "Update single preference",
                    "description": "Update a specific notification type preference",
                    "parameters": [
                        {
                            "name": "notification_type",
                            "in": "path",
                            "required": True,
                            "description": "Notification type",
                            "schema": {"type": "string"}
                        }
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "email_enabled": {"type": "boolean"},
                                        "push_enabled": {"type": "boolean"},
                                        "in_app_enabled": {"type": "boolean"}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Preference updated",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/NotificationPreference"}
                                }
                            }
                        }
                    }
                }
            },
            "/notifications/summary": {
                "get": {
                    "tags": ["Notifications"],
                    "summary": "Get notification summary",
                    "description": "Get summary of user notifications",
                    "responses": {
                        "200": {
                            "description": "Notification summary",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "total_notifications": {"type": "integer"},
                                            "unread_count": {"type": "integer"},
                                            "by_type": {"type": "object"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/notifications/unread-count": {
                "get": {
                    "tags": ["Notifications"],
                    "summary": "Get unread notification count",
                    "description": "Get count of unread notifications",
                    "responses": {
                        "200": {
                            "description": "Unread count",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "unread_count": {"type": "integer"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/notifications/recent": {
                "get": {
                    "tags": ["Notifications"],
                    "summary": "Get recent notifications",
                    "description": "Get most recent notifications",
                    "parameters": [
                        {
                            "name": "limit",
                            "in": "query",
                            "description": "Number of notifications to retrieve (max 50)",
                            "schema": {"type": "integer", "default": 10, "maximum": 50}
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Recent notifications",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/Notification"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/notifications/bulk": {
                "post": {
                    "tags": ["Notifications"],
                    "summary": "Send bulk notifications",
                    "description": "Send notifications to multiple users (admin only)",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "user_ids": {"type": "array", "items": {"type": "integer"}},
                                        "notification_type": {"type": "string"},
                                        "title": {"type": "string"},
                                        "message": {"type": "string"},
                                        "email_template": {"type": "string"}
                                    },
                                    "required": ["user_ids", "notification_type", "title", "message"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Bulk notification sent",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "sent_count": {"type": "integer"},
                                            "failed_count": {"type": "integer"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
    
    def add_health_endpoint(self):
        """Add health check endpoint"""
        self.spec["paths"].update({
            "/health": {
                "get": {
                    "tags": ["System"],
                    "summary": "Health check",
                    "description": "Check if the API is running",
                    "security": [],
                    "responses": {
                        "200": {
                            "description": "System is healthy",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "status": {"type": "string", "example": "ok"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
    
    def generate_full_spec(self) -> Dict[str, Any]:
        """Generate complete API specification"""
        self.add_auth_endpoints()
        self.add_user_endpoints()
        self.add_gig_endpoints()
        self.add_application_endpoints()
        self.add_rating_endpoints()
        self.add_notification_endpoints()
        self.add_admin_endpoints()
        self.add_health_endpoint()
        
        return self.spec
    
    def save_to_file(self, file_path: str):
        """Save specification to JSON file"""
        with open(file_path, 'w') as f:
            json.dump(self.generate_full_spec(), f, indent=2)
    
    def get_swagger_ui_html(self) -> str:
        """Generate HTML for Swagger UI"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>SkillSync API Documentation</title>
            <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css" />
            <style>
                html {{
                    box-sizing: border-box;
                    overflow: -moz-scrollbars-vertical;
                    overflow-y: scroll;
                }}
                *, *:before, *:after {{
                    box-sizing: inherit;
                }}
                body {{
                    margin:0;
                    background: #fafafa;
                }}
            </style>
        </head>
        <body>
            <div id="swagger-ui"></div>
            <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js"></script>
            <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-standalone-preset.js"></script>
            <script>
                window.onload = function() {{
                    const ui = SwaggerUIBundle({{
                        url: '/api/docs/spec.json',
                        dom_id: '#swagger-ui',
                        deepLinking: true,
                        presets: [
                            SwaggerUIBundle.presets.apis,
                            SwaggerUIStandalonePreset
                        ],
                        plugins: [
                            SwaggerUIBundle.plugins.DownloadUrl
                        ],
                        layout: "StandaloneLayout"
                    }});
                }};
            </script>
        </body>
        </html>
        """


def create_api_docs_routes(app: Flask):
    """Create routes for API documentation"""
    doc_generator = APIDocumentationGenerator(app)
    
    @app.route('/api/docs')
    def api_docs():
        """Serve Swagger UI"""
        return doc_generator.get_swagger_ui_html()
    
    @app.route('/api/docs/spec.json')
    def api_spec():
        """Serve OpenAPI specification"""
        from flask import jsonify
        return jsonify(doc_generator.generate_full_spec())
    
    @app.route('/api/docs/redoc')
    def api_redoc():
        """Serve ReDoc documentation"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>SkillSync API Documentation</title>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
            <style>
                body {{ margin: 0; padding: 0; }}
            </style>
        </head>
        <body>
            <redoc spec-url='/api/docs/spec.json'></redoc>
            <script src="https://cdn.jsdelivr.net/npm/redoc@2.0.0/bundles/redoc.standalone.js"></script>
        </body>
        </html>
        """