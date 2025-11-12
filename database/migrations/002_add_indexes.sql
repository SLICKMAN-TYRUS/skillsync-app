-- Indexes for users table
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_uid ON users (uid);
CREATE INDEX idx_users_role ON users (role);

-- Indexes for gigs table
CREATE INDEX idx_gigs_provider_id ON gigs (provider_id);
CREATE INDEX idx_gigs_status ON gigs (status);
CREATE INDEX idx_gigs_approval_status ON gigs (approval_status);
CREATE INDEX idx_gigs_category ON gigs (category);
CREATE INDEX idx_gigs_created_at ON gigs (created_at DESC);
CREATE INDEX idx_gigs_deadline ON gigs (deadline);

-- Indexes for applications table
CREATE INDEX idx_applications_gig_id ON applications (gig_id);
CREATE INDEX idx_applications_student_id ON applications (student_id);
CREATE INDEX idx_applications_status ON applications (status);
CREATE INDEX idx_applications_applied_at ON applications (applied_at DESC);

-- Indexes for ratings table
CREATE INDEX idx_ratings_rater_id ON ratings (rater_id);
CREATE INDEX idx_ratings_ratee_id ON ratings (ratee_id);
CREATE INDEX idx_ratings_gig_id ON ratings (gig_id);
CREATE INDEX idx_ratings_moderation_status ON ratings (moderation_status);
CREATE INDEX idx_ratings_is_flagged ON ratings (is_flagged);

-- Indexes for notifications table
CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_read ON notifications (read);
CREATE INDEX idx_notifications_type ON notifications (type);
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);

-- Indexes for saved_gigs table
CREATE INDEX idx_saved_gigs_user_id ON saved_gigs (user_id);
CREATE INDEX idx_saved_gigs_gig_id ON saved_gigs (gig_id);

-- Indexes for student_skills table
CREATE INDEX idx_student_skills_student_id ON student_skills (student_id);
CREATE INDEX idx_student_skills_skill_id ON student_skills (skill_id);

-- Indexes for skills table
CREATE INDEX idx_skills_category ON skills (category);

-- Indexes for feedback table
CREATE INDEX idx_feedback_status ON feedback (status);
CREATE INDEX idx_feedback_category ON feedback (category);
CREATE INDEX idx_feedback_user_id ON feedback (user_id);

-- Indexes for audit_logs table
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs (resource_type);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- Indexes for email_queue table
CREATE INDEX idx_email_queue_status ON email_queue (status);
CREATE INDEX idx_email_queue_user_id ON email_queue (user_id);

-- Indexes for push_notifications table
CREATE INDEX idx_push_notifications_status ON push_notifications (status);
CREATE INDEX idx_push_notifications_user_id ON push_notifications (user_id);

-- Composite indexes for common queries
CREATE INDEX idx_gigs_status_approval ON gigs (status, approval_status);
CREATE INDEX idx_applications_gig_status ON applications (gig_id, status);
CREATE INDEX idx_notifications_user_read ON notifications (user_id, read);