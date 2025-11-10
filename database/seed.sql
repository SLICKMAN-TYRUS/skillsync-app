INSERT INTO users (uid, name, email, role, profile_photo, location, bio, availability_status, average_rating)
VALUES
    ('firebase-uid-student1', 'Jane Student', 'jane.student@example.com', 'student', NULL, 'Kigali', 'Computer science student seeking part-time gigs.', 'available', 4.5),
    ('firebase-uid-provider1', 'Paul Provider', 'paul.provider@example.com', 'provider', NULL, 'Nairobi', 'Local business owner offering short-term opportunities.', 'available', 4.8),
    ('firebase-uid-admin1', 'Ava Admin', 'ava.admin@example.com', 'admin', NULL, 'Remote', 'Platform administrator.', 'available', 5.0),
    ('firebase-uid-student2', 'Alex Chen', 'alex.chen@example.com', 'student', NULL, 'Kampala', 'Engineering student with graphic design skills.', 'available', 4.2),
    ('firebase-uid-student3', 'Maria Silva', 'maria.silva@example.com', 'student', NULL, 'Kigali', 'Marketing major with social media expertise.', 'busy', 4.7),
    ('firebase-uid-student4', 'David Okonkwo', 'david.okonkwo@example.com', 'student', NULL, 'Lagos', 'Business student looking for consulting opportunities.', 'available', 4.0),
    ('firebase-uid-provider2', 'Sarah Tech', 'sarah.tech@example.com', 'provider', NULL, 'Nairobi', 'Tech startup founder seeking student developers.', 'available', 4.9),
    ('firebase-uid-provider3', 'John Events', 'john.events@example.com', 'provider', NULL, 'Kigali', 'Event planning company looking for creative students.', 'available', 4.6),
    ('firebase-uid-student5', 'Emma Watson', 'emma.watson@example.com', 'student', NULL, 'Remote', 'Data science student with Python expertise.', 'available', 4.8),
    ('firebase-uid-student6', 'Michael Brown', 'michael.brown@example.com', 'student', NULL, 'Dar es Salaam', 'Film student with video editing experience.', 'available', 4.3);

INSERT INTO gigs (title, description, budget, category, location, provider_id, deadline, status, approval_status)
VALUES
    ('Campus Event Photographer', 'Capture photos for the upcoming campus cultural festival. Need someone with professional equipment and experience.', 250.00, 'Photography', 'Kigali', 2, CURRENT_DATE + INTERVAL '14 days', 'open', 'approved'),
    ('React Native Tutor', 'Provide weekly tutoring sessions for a beginner React Native cohort. Must have strong communication skills.', 150.00, 'Tutoring', 'Remote', 2, CURRENT_DATE + INTERVAL '21 days', 'open', 'approved'),
    ('Social Media Manager', 'Manage Instagram and Twitter accounts for local coffee shop. Create engaging content and respond to comments.', 300.00, 'Marketing', 'Nairobi', 7, CURRENT_DATE + INTERVAL '30 days', 'open', 'approved'),
    ('Website Redesign', 'Redesign company website using modern UI/UX principles. Experience with Figma required.', 500.00, 'Design', 'Remote', 7, CURRENT_DATE + INTERVAL '45 days', 'open', 'approved'),
    ('Data Entry Assistant', 'Enter customer data into CRM system. Attention to detail is crucial.', 100.00, 'Administration', 'Kampala', 8, CURRENT_DATE + INTERVAL '7 days', 'open', 'pending'),
    ('Python Script Development', 'Create automation scripts for data processing tasks. Python and pandas experience required.', 400.00, 'Programming', 'Remote', 7, CURRENT_DATE + INTERVAL '20 days', 'open', 'approved'),
    ('Event Setup Crew', 'Help set up and tear down equipment for corporate event. Physical work required.', 80.00, 'Events', 'Kigali', 8, CURRENT_DATE + INTERVAL '5 days', 'open', 'approved'),
    ('Graphic Designer', 'Design promotional materials for new product launch. Portfolio review required.', 350.00, 'Design', 'Nairobi', 2, CURRENT_DATE + INTERVAL '15 days', 'closed', 'approved'),
    ('Content Writer', 'Write blog posts about technology trends. Must have excellent English writing skills.', 200.00, 'Writing', 'Remote', 7, CURRENT_DATE + INTERVAL '25 days', 'open', 'approved'),
    ('Mobile App Testing', 'Test new mobile app and report bugs. Experience with Android/iOS required.', 150.00, 'Testing', 'Remote', 7, CURRENT_DATE + INTERVAL '10 days', 'open', 'pending'),
    ('Language Translator', 'Translate marketing materials from English to French. Native French speaker preferred.', 180.00, 'Translation', 'Kigali', 8, CURRENT_DATE + INTERVAL '12 days', 'open', 'approved'),
    ('Video Editor', 'Edit promotional videos for YouTube channel. Experience with Premiere Pro or Final Cut.', 320.00, 'Video Production', 'Remote', 2, CURRENT_DATE + INTERVAL '18 days', 'open', 'approved');

INSERT INTO applications (gig_id, student_id, status, notes, applied_at)
VALUES
    (1, 1, 'accepted', 'Available weekends and evenings. Portfolio: example.com/jane', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (2, 1, 'pending', 'Completed several RN bootcamps; excited to help peers.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (3, 5, 'pending', 'Managed social media for university club with 5k followers.', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    (4, 4, 'rejected', 'Portfolio submitted. Available full-time.', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    (6, 9, 'accepted', 'Python developer with 2 years experience. GitHub: github.com/emma', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    (7, 6, 'pending', 'Strong and reliable. Have transportation.', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    (8, 4, 'accepted', 'Award-winning designer. Portfolio attached.', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    (9, 5, 'pending', 'Published writer with tech blog. Writing samples available.', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (11, 5, 'pending', 'Bilingual French/English speaker. Translation degree.', CURRENT_TIMESTAMP - INTERVAL '6 hours'),
    (12, 10, 'pending', 'Film student with professional editing experience.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (1, 4, 'rejected', 'Amateur photographer but very enthusiastic.', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    (3, 1, 'pending', 'Quick learner, willing to adapt to brand voice.', CURRENT_TIMESTAMP - INTERVAL '5 hours');

INSERT INTO skills (name, category)
VALUES
    ('Python', 'Programming'),
    ('JavaScript', 'Programming'),
    ('React', 'Programming'),
    ('React Native', 'Programming'),
    ('Node.js', 'Programming'),
    ('Graphic Design', 'Design'),
    ('UI/UX Design', 'Design'),
    ('Photography', 'Creative'),
    ('Video Editing', 'Creative'),
    ('Content Writing', 'Communication'),
    ('Social Media Marketing', 'Marketing'),
    ('SEO', 'Marketing'),
    ('Data Analysis', 'Analytics'),
    ('Excel', 'Office'),
    ('Project Management', 'Business'),
    ('French', 'Language'),
    ('Spanish', 'Language'),
    ('Public Speaking', 'Communication');

INSERT INTO student_skills (student_id, skill_id, proficiency_level)
VALUES
    (1, 2, 'advanced'),
    (1, 3, 'intermediate'),
    (1, 4, 'intermediate'),
    (4, 6, 'advanced'),
    (4, 7, 'advanced'),
    (5, 11, 'advanced'),
    (5, 10, 'advanced'),
    (5, 16, 'native'),
    (6, 15, 'intermediate'),
    (6, 14, 'advanced'),
    (9, 1, 'advanced'),
    (9, 13, 'advanced'),
    (10, 9, 'advanced'),
    (10, 8, 'intermediate');

INSERT INTO ratings (rater_id, ratee_id, gig_id, score, comment, moderation_status)
VALUES
    (2, 1, 1, 5, 'Outstanding professionalism and delivery. Photos exceeded expectations!', 'approved'),
    (7, 9, 6, 5, 'Excellent Python skills. Delivered clean, well-documented code.', 'approved'),
    (8, 4, 8, 4, 'Good design work but needed a few revisions. Overall satisfied.', 'approved'),
    (1, 2, 1, 5, 'Great client to work with. Clear communication and fair payment.', 'approved'),
    (9, 7, 6, 5, 'Perfect gig! Well-defined requirements and prompt payment.', 'approved'),
    (4, 8, 8, 4, 'Client was responsive but timeline was a bit tight.', 'approved');

INSERT INTO notifications (user_id, type, title, message, related_gig_id, related_application_id, read)
VALUES
    (1, 'application_update', 'Application Accepted', 'Congratulations! Your application for Campus Event Photographer has been accepted.', 1, 1, TRUE),
    (9, 'application_update', 'Application Accepted', 'Your application for Python Script Development has been accepted!', 6, 5, TRUE),
    (5, 'new_gig', 'New Gig Available', 'A new gig matching your skills: Social Media Manager', 3, NULL, FALSE),
    (6, 'application_submitted', 'Application Received', 'Your application for Event Setup Crew has been submitted.', 7, 6, FALSE),
    (4, 'application_update', 'Application Rejected', 'Thank you for applying to Website Redesign. We have selected another candidate.', 4, 4, TRUE),
    (10, 'new_gig', 'New Gig Available', 'Check out this new opportunity: Video Editor', 12, NULL, FALSE),
    (7, 'new_application', 'New Application', 'Emma Watson applied to Python Script Development', 6, 5, TRUE),
    (2, 'rating_received', 'New Rating', 'You received a 5-star rating from Jane Student', 1, NULL, FALSE);

INSERT INTO saved_gigs (user_id, gig_id, saved_at)
VALUES
    (1, 2, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    (1, 9, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (5, 11, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    (9, 4, CURRENT_TIMESTAMP - INTERVAL '5 days'),
    (10, 12, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
    (4, 3, CURRENT_TIMESTAMP - INTERVAL '1 day');

INSERT INTO feedback (user_id, category, message, status)
VALUES
    (1, 'feature_request', 'Please add calendar sync for upcoming gigs.', 'pending'),
    (5, 'bug_report', 'Search function not working properly on mobile.', 'pending'),
    (9, 'general', 'Love the platform! Very easy to use.', 'resolved'),
    (4, 'feature_request', 'Add ability to filter gigs by multiple categories at once.', 'pending'),
    (10, 'bug_report', 'Profile photo upload fails for large images.', 'pending');

INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
VALUES
    (3, 'gig_approved', 'gig', 1, '{"previous_status": "pending", "new_status": "approved"}'),
    (3, 'gig_approved', 'gig', 2, '{"previous_status": "pending", "new_status": "approved"}'),
    (3, 'user_suspended', 'user', 6, '{"reason": "violation of terms", "duration": "7 days"}'),
    (3, 'gig_approved', 'gig', 3, '{"previous_status": "pending", "new_status": "approved"}'),
    (2, 'application_accepted', 'application', 1, '{"student_id": 1, "gig_id": 1}'),
    (7, 'application_accepted', 'application', 5, '{"student_id": 9, "gig_id": 6}'),
    (8, 'application_rejected', 'application', 4, '{"student_id": 4, "gig_id": 4, "reason": "selected another candidate"}');

INSERT INTO notification_preferences (user_id, notification_type, email_enabled, push_enabled, in_app_enabled)
VALUES
    (1, 'new_gig', TRUE, TRUE, TRUE),
    (1, 'application_update', TRUE, TRUE, TRUE),
    (1, 'rating_received', TRUE, FALSE, TRUE),
    (9, 'new_gig', TRUE, TRUE, TRUE),
    (9, 'application_update', TRUE, TRUE, TRUE),
    (5, 'new_gig', FALSE, TRUE, TRUE),
    (5, 'application_update', TRUE, TRUE, TRUE);
