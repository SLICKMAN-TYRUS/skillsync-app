-- Sample users
INSERT INTO users (uid, name, email, role, profile_photo, location, bio)
VALUES
    ('firebase-uid-student', 'Jane Student', 'jane.student@example.com', 'student', NULL, 'Kigali', 'Computer science student seeking part-time gigs.'),
    ('firebase-uid-provider', 'Paul Provider', 'paul.provider@example.com', 'provider', NULL, 'Nairobi', 'Local business owner offering short-term opportunities.'),
    ('firebase-uid-admin', 'Ava Admin', 'ava.admin@example.com', 'admin', NULL, 'Remote', 'Platform administrator.');

-- Sample gigs
INSERT INTO gigs (title, description, budget, category, location, provider_id, deadline, status, approval_status)
VALUES
    ('Campus Event Photographer', 'Capture photos for the upcoming campus cultural festival.', 250.00, 'Photography', 'Kigali', 2, CURRENT_DATE + INTERVAL '14 days', 'open', 'approved'),
    ('React Native Tutor', 'Provide weekly tutoring sessions for a beginner React Native cohort.', 150.00, 'Tutoring', 'Remote', 2, CURRENT_DATE + INTERVAL '21 days', 'open', 'approved');

-- Sample applications
INSERT INTO applications (gig_id, student_id, status, notes)
VALUES
    (1, 1, 'pending', 'Available weekends and evenings. Portfolio: example.com/jane'),
    (2, 1, 'pending', 'Completed several RN bootcamps; excited to help peers.');

-- Sample ratings
INSERT INTO ratings (rater_id, ratee_id, gig_id, score, comment)
VALUES
    (2, 1, 1, 5, 'Outstanding professionalism and delivery.');

-- Sample notifications
INSERT INTO notifications (user_id, type, title, message, related_gig_id)
VALUES
    (1, 'gig_update', 'Gig approved', 'Your application is under review for Campus Event Photographer.', 1);

-- Sample saved gig
INSERT INTO saved_gigs (user_id, gig_id)
VALUES
    (1, 2);

-- Sample feedback
INSERT INTO feedback (user_id, category, message)
VALUES
    (1, 'feature_request', 'Please add calendar sync for upcoming gigs.');

-- Sample audit log
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
VALUES
    (3, 'gig_approved', 'gig', 1, '{"previous_status": "pending", "new_status": "approved"}');
