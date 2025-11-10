from datetime import datetime
from typing import Dict, List
from .. import db
from ..models import Application, Gig
from .exceptions import AuthorizationError, NotFoundError, ValidationError
from .gig_service import get_gig_by_id


def create_application(student_id: int, gig_id: int, notes: str = "") -> Application:
    gig = get_gig_by_id(gig_id)
    if gig.approval_status != "approved" or gig.status != "open":
        raise ValidationError("Applications are only allowed for open, approved gigs")

    existing = Application.query.filter_by(gig_id=gig_id, student_id=student_id).first()
    if existing:
        raise ValidationError("Student has already applied to this gig")

    application = Application(
        gig_id=gig_id, student_id=student_id, notes=notes, status="pending"
    )
    db.session.add(application)
    db.session.commit()
    return application


def get_application_by_id(application_id: int) -> Application:
    application = Application.query.get(application_id)
    if not application:
        raise NotFoundError(f"Application with id {application_id} not found")
    return application


def get_student_applications(student_id: int) -> List[Application]:
    return (
        Application.query.filter_by(student_id=student_id)
        .order_by(Application.applied_at.desc())
        .all()
    )


def get_gig_applications(gig_id: int) -> List[Application]:
    return (
        Application.query.filter_by(gig_id=gig_id)
        .order_by(Application.applied_at.desc())
        .all()
    )


def select_candidate(application_id: int, provider_id: int) -> Application:
    application = get_application_by_id(application_id)
    gig = application.gig
    if gig.provider_id != provider_id:
        raise AuthorizationError("You can only select candidates for your own gigs")

    try:
        Application.validate_status("accepted")
    except ValueError as exc:
        raise ValidationError(str(exc))

    application.status = "accepted"
    application.selected_at = datetime.utcnow()
    gig.status = "in_progress"

    # Mark other applications as rejected
    Application.query.filter(
        Application.gig_id == gig.id, Application.id != application.id
    ).update({Application.status: "rejected"}, synchronize_session=False)

    db.session.commit()
    return application


def update_application_status(application_id: int, new_status: str) -> Application:
    application = get_application_by_id(application_id)
    try:
        Application.validate_status(new_status)
    except ValueError as exc:
        raise ValidationError(str(exc))

    application.status = new_status
    if new_status == "accepted" and not application.selected_at:
        application.selected_at = datetime.utcnow()
    db.session.commit()
    return application


def withdraw_application(application_id: int, student_id: int) -> None:
    """Allow a student to withdraw their application"""
    application = get_application_by_id(application_id)
    
    if application.student_id != student_id:
        raise AuthorizationError("You can only withdraw your own applications")
    
    if application.status in ("accepted", "completed"):
        raise ValidationError("Cannot withdraw an accepted or completed application")
    
    if application.status == "withdrawn":
        raise ValidationError("Application is already withdrawn")
    
    application.status = "withdrawn"
    db.session.commit()


def bulk_update_applications(gig_id: int, provider_id: int, updates: List[Dict]) -> List[Application]:
    """Update multiple applications at once for a provider"""
    gig = get_gig_by_id(gig_id)
    if gig.provider_id != provider_id:
        raise AuthorizationError("You can only update applications for your own gigs")
    
    updated_applications = []
    
    for update in updates:
        application_id = update.get("application_id")
        new_status = update.get("status")
        
        if not application_id or not new_status:
            continue
        
        try:
            application = get_application_by_id(application_id)
            if application.gig_id != gig_id:
                continue  # Skip applications not for this gig
            
            Application.validate_status(new_status)
            application.status = new_status
            if new_status == "accepted" and not application.selected_at:
                application.selected_at = datetime.utcnow()
            
            updated_applications.append(application)
        except (NotFoundError, ValidationError):
            continue  # Skip invalid updates
    
    if updated_applications:
        db.session.commit()
    
    return updated_applications
