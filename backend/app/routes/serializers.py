def user_to_dict(user, include_email: bool = False) -> dict:
    if not user:
        return {}
    data = {
        "id": user.id,
        "uid": user.uid,
        "name": user.name,
        "role": user.role,
        "profile_photo": user.profile_photo,
        "location": user.location,
        "bio": user.bio,
        "average_rating": float(user.average_rating or 0.0),
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }
    if include_email:
        data["email"] = user.email
    return data


def gig_to_dict(gig, include_provider: bool = True) -> dict:
    data = gig.to_dict()

    provider_obj = getattr(gig, "provider", None)
    if include_provider and provider_obj:
        data["provider"] = user_to_dict(provider_obj, include_email=False)

    data["provider_name"] = provider_obj.name if provider_obj else None
    data["provider_profile_photo"] = (
        provider_obj.profile_photo if provider_obj else None
    )
    data["provider_average_rating"] = (
        float(provider_obj.average_rating or 0.0) if provider_obj else 0.0
    )

    ratings_rel = getattr(gig, "ratings", None)
    rating_items = []
    if ratings_rel is not None:
        try:
            rating_items = ratings_rel.all()
        except AttributeError:
            rating_items = ratings_rel
    rating_scores = [rating.score for rating in rating_items if rating.score is not None]
    if rating_scores:
        data["rating_average"] = round(sum(rating_scores) / len(rating_scores), 2)
        data["rating_count"] = len(rating_scores)
    else:
        data["rating_average"] = 0.0
        data["rating_count"] = 0

    applications_rel = getattr(gig, "applications", None)
    application_count = 0
    if applications_rel is not None:
        if hasattr(applications_rel, "count"):
            application_count = applications_rel.count()
        else:
            application_count = len(applications_rel)
    data["application_count"] = application_count

    data["price"] = data.get("budget")
    data["duration_label"] = None
    if gig.deadline:
        data["deadline_display"] = gig.deadline.strftime("%b %d, %Y")
        data["duration_label"] = f"Due {data['deadline_display']}"
    else:
        data["deadline_display"] = None
    return data


def application_to_dict(
    application,
    include_gig: bool = False,
    include_student: bool = False,
) -> dict:
    data = {
        "id": application.id,
        "gig_id": application.gig_id,
        "student_id": application.student_id,
        "status": application.status,
        "notes": application.notes,
        "applied_at": application.applied_at.isoformat()
        if application.applied_at
        else None,
        "selected_at": application.selected_at.isoformat()
        if application.selected_at
        else None,
    }
    if include_gig and getattr(application, "gig", None):
        data["gig"] = gig_to_dict(application.gig)
    if include_student and getattr(application, "student", None):
        data["student"] = user_to_dict(application.student, include_email=False)
    return data


def saved_gig_to_dict(saved_gig) -> dict:
    data = {
        "id": saved_gig.id,
        "gig_id": saved_gig.gig_id,
        "user_id": saved_gig.user_id,
        "saved_at": saved_gig.saved_at.isoformat() if saved_gig.saved_at else None,
    }
    if getattr(saved_gig, "gig", None):
        data["gig"] = gig_to_dict(saved_gig.gig)
    return data


def notification_to_dict(notification) -> dict:
    return {
        "id": notification.id,
        "type": notification.type,
        "title": notification.title,
        "message": notification.message,
        "read": notification.read,
        "related_gig_id": notification.related_gig_id,
        "related_application_id": notification.related_application_id,
        "created_at": notification.created_at.isoformat()
        if notification.created_at
        else None,
    }


def rating_to_dict(
    rating,
    include_rater: bool = False,
    include_ratee: bool = False,
    include_moderation: bool = False,
) -> dict:
    data = {
        "id": rating.id,
        "rater_id": rating.rater_id,
        "ratee_id": rating.ratee_id,
        "gig_id": rating.gig_id,
        "score": rating.score,
        "comment": rating.comment,
        "created_at": rating.created_at.isoformat()
        if rating.created_at
        else None,
    }
    if include_rater and getattr(rating, "rater", None):
        data["rater"] = user_to_dict(rating.rater, include_email=False)
    if include_ratee and getattr(rating, "ratee", None):
        data["ratee"] = user_to_dict(rating.ratee, include_email=False)
    if include_moderation:
        data["moderation"] = {
            "is_flagged": getattr(rating, "is_flagged", False),
            "flag_reason": getattr(rating, "flag_reason", None),
            "moderation_status": getattr(rating, "moderation_status", "pending"),
            "moderated_at": rating.moderated_at.isoformat() if getattr(rating, "moderated_at", None) else None,
            "moderated_by": rating.moderated_by if getattr(rating, "moderated_by", None) else None,
        }
    return data
