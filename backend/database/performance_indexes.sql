-- Performance optimization indexes for SkillSync database
-- Run these after the main schema to improve query performance

-- Indexes for Users table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_average_rating ON users(average_rating);

-- Indexes for Gigs table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_provider_id ON gigs(provider_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_status ON gigs(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_approval_status ON gigs(approval_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_category ON gigs(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_location ON gigs(location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_budget ON gigs(budget);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_created_at ON gigs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_deadline ON gigs(deadline);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_updated_at ON gigs(updated_at);

-- Composite indexes for common gig queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_status_approval ON gigs(status, approval_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_category_status ON gigs(category, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_location_status ON gigs(location, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_provider_status ON gigs(provider_id, status);

-- Indexes for Applications table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_gig_id ON applications(gig_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_student_id ON applications(student_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);

-- Composite indexes for applications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_student_status ON applications(student_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_gig_status ON applications(gig_id, status);

-- Indexes for Ratings table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_gig_id ON ratings(gig_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_score ON ratings(score);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_created_at ON ratings(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_moderation_status ON ratings(moderation_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_is_flagged ON ratings(is_flagged);

-- Composite indexes for ratings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_ratee_created ON ratings(ratee_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_gig_ratee ON ratings(gig_id, ratee_id);

-- Indexes for Notifications table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_related_gig_id ON notifications(related_gig_id);

-- Composite indexes for notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type);

-- Indexes for Notification Preferences table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_preferences_type ON notification_preferences(notification_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_preferences_updated_at ON notification_preferences(updated_at);

-- Indexes for Email Queue table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_queue_user_id ON email_queue(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_queue_attempts ON email_queue(attempts);

-- Composite index for email queue processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_queue_status_created ON email_queue(status, created_at);

-- Indexes for Push Notifications table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_notifications_user_id ON push_notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_notifications_status ON push_notifications(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_notifications_created_at ON push_notifications(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_notifications_platform ON push_notifications(platform);

-- Composite index for push notification processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_notifications_status_created ON push_notifications(status, created_at);

-- Indexes for Saved Gigs table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_gigs_user_id ON saved_gigs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_gigs_gig_id ON saved_gigs(gig_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_gigs_saved_at ON saved_gigs(saved_at);

-- Indexes for Skills table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skills_category ON skills(category);

-- Indexes for Student Skills table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_skills_student_id ON student_skills(student_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_skills_skill_id ON student_skills(skill_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_skills_proficiency ON student_skills(proficiency_level);

-- Indexes for Audit Logs table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Composite indexes for audit logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource_type_id ON audit_logs(resource_type, resource_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at);

-- Indexes for Feedback table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- Full-text search indexes (PostgreSQL specific)
-- These enable efficient text search on gig titles and descriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_title_fulltext ON gigs USING gin(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_description_fulltext ON gigs USING gin(to_tsvector('english', description));

-- Partial indexes for better performance on specific conditions
-- Index only for active, approved gigs (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gigs_active_approved 
    ON gigs(created_at, budget) 
    WHERE status = 'open' AND approval_status = 'approved';

-- Index only for unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread 
    ON notifications(user_id, created_at) 
    WHERE read = false;

-- Index only for pending applications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_pending 
    ON applications(gig_id, applied_at) 
    WHERE status = 'pending';

-- Index only for flagged ratings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_flagged 
    ON ratings(created_at, score) 
    WHERE is_flagged = true;

-- Index only for pending email queue items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_queue_pending 
    ON email_queue(created_at) 
    WHERE status = 'pending';

-- Index only for pending push notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_notifications_pending 
    ON push_notifications(created_at) 
    WHERE status = 'pending';

-- Analyze tables to update statistics after creating indexes
ANALYZE users;
ANALYZE gigs;
ANALYZE applications;
ANALYZE ratings;
ANALYZE notifications;
ANALYZE notification_preferences;
ANALYZE email_queue;
ANALYZE push_notifications;
ANALYZE saved_gigs;
ANALYZE skills;
ANALYZE student_skills;
ANALYZE audit_logs;
ANALYZE feedback;

-- Comments explaining index purposes
COMMENT ON INDEX idx_gigs_active_approved IS 'Optimizes queries for browsing active, approved gigs';
COMMENT ON INDEX idx_notifications_unread IS 'Optimizes queries for unread notifications count and retrieval';
COMMENT ON INDEX idx_applications_pending IS 'Optimizes queries for pending applications on gigs';
COMMENT ON INDEX idx_ratings_flagged IS 'Optimizes moderation queries for flagged ratings';
COMMENT ON INDEX idx_gigs_title_fulltext IS 'Enables full-text search on gig titles';
COMMENT ON INDEX idx_gigs_description_fulltext IS 'Enables full-text search on gig descriptions';