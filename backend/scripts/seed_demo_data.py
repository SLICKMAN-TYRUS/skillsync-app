#!/usr/bin/env python3
"""
Small demo data seeder for local development.

Creates a handful of gigs, applications, notifications, saved gigs and ratings
using the service layer so side-effects (notifications, audit logs) are produced.

Run:
  export FIREBASE_SERVICE_ACCOUNT=/full/path/to/backend/firebase_credentials.json
  source backend/.venv/bin/activate
  python backend/scripts/seed_demo_data.py

"""
from datetime import date, timedelta
import random

import os
import sys
# Ensure repo backend folder is on sys.path so `from app import ...` works even if PYTHONPATH is set oddly
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app, db
from app.services import (
    user_service,
    gig_service,
    admin_service,
    application_service,
    notification_service,
    saved_gigs_service,
    rating_service,
)


def get_uid_map():
    # Map seeded firebase UIDs to internal user objects
    uids = [
        "firebase-uid-student1",
        "firebase-uid-student2",
        "firebase-uid-student3",
        "firebase-uid-student4",
        "firebase-uid-student5",
        "firebase-uid-student6",
        "firebase-uid-provider1",
        "firebase-uid-provider2",
        "firebase-uid-provider3",
        "firebase-uid-admin1",
    ]
    users = {}
    for uid in uids:
        user = user_service.get_user_by_uid(uid)
        if user:
            users[uid] = user
    return users


def create_demo_gigs(providers):
    today = date.today()
    # expand to create 15 gigs with varied categories and locations
    categories = ["tutoring", "workshop", "design", "software", "photography", "data", "mobile", "career"]
    locations = ["Remote", "Boston, MA", "San Francisco, CA", "Austin, TX", "Seattle, WA", "New York, NY", "Chicago, IL"]
    created = []
    provider_list = list(providers.values())
    for i in range(15):
        gig_data = {
            "title": f"{random.choice(['Junior','Senior','Contract','Freelance','Part-time'])} {random.choice(['Developer','Designer','Manager','Photographer','Tutor','Writer'])} - Project {i+1}",
            "description": f"This is a demo gig number {i+1}. Looking for a skilled {random.choice(['developer','designer','marketer','photographer','tutor','writer'])} to help with short-term work.",
            "budget": float(random.choice([80,100,150,200,250,300,400,500])),
                "category": random.choice(categories),
                "location": random.choice(locations),
            "deadline": (today + timedelta(days=random.randint(5, 45))).isoformat(),
        }
        provider = provider_list[i % len(provider_list)]
        gig = gig_service.create_gig(provider.id, gig_data)
        created.append(gig)
    return created


def approve_all_gigs(gigs, admin):
    approved = []
    for gig in gigs:
        g = admin_service.approve_gig(gig.id, admin.id)
        approved.append(g)
    return approved


def create_applications(gigs, students, providers):
    created_apps = []
    student_list = list(students.values())
    for gig in gigs:
        # random 2-6 applicants to create a denser dataset
        applicants = random.sample(student_list, k=min(len(student_list), random.randint(2, 6)))
        for s in applicants:
            try:
                app = application_service.create_application(s.id, gig.id, notes=f"Interested — portfolio available.")
                # notify provider
                notification_service.notify_application_received(gig.provider_id, gig.id, app.id)
                created_apps.append(app)
            except Exception:
                continue
    # Select a candidate for the first gig to demonstrate provider acceptance
    if created_apps:
        first_app = created_apps[0]
        try:
            app = application_service.select_candidate(first_app.id, first_app.gig.provider_id)
            # notify student
            notification_service.notify_application_status_change(app.student_id, app.gig_id, app.id, app.status)
        except Exception:
            pass
    return created_apps


def create_saved_and_ratings(gigs, students):
    # some students save some gigs
    student_list = list(students.values())
    for i, gig in enumerate(gigs):
        student = student_list[i % len(student_list)]
        try:
            saved_gigs_service.save_gig(student.id, gig.id)
        except Exception:
            pass

    # For demo, mark first gig completed and add rating
    if gigs:
        first = gigs[0]
        try:
            from app.services.gig_service import update_gig_status

            update_gig_status(first.id, "completed")
            # create a rating by provider -> student if there is an accepted application
            apps = first.applications.limit(10).all()
            if apps:
                app = apps[0]
                try:
                    rating_service.create_rating(app.gig.provider_id, app.student_id, first.id, 5, "Great job on the event!")
                except Exception:
                    pass
        except Exception:
            pass


def run():
    app = create_app()
    with app.app_context():
        print("Seeding demo data...")
        users = get_uid_map()
        # separate providers, students, admin
        students = {k: v for k, v in users.items() if k.startswith("firebase-uid-student")}
        providers = {k: v for k, v in users.items() if k.startswith("firebase-uid-provider")}
        admin = users.get("firebase-uid-admin1")

        if not admin:
            print("Admin user not found — ensure create_firebase_users.py was run")

        gigs = create_demo_gigs(providers)
        print(f"Created {len(gigs)} gigs")

        approved = []
        if admin:
            approved = approve_all_gigs(gigs, admin)
            print(f"Approved {len(approved)} gigs")

        apps = create_applications(approved, students, providers)
        print(f"Created {len(apps)} applications")

        create_saved_and_ratings(approved, students)

        print("Seeding complete.")


if __name__ == "__main__":
    run()
