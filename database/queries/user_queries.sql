
SELECT 
    u.id,
    u.uid,
    u.name,
    u.email,
    u.role,
    u.location,
    u.availability_status,
    u.average_rating,
    u.created_at,
    COUNT(DISTINCT CASE WHEN u.role = 'student' THEN a.id END) as total_applications,
    COUNT(DISTINCT CASE WHEN u.role = 'provider' THEN g.id END) as total_gigs_posted,
    COUNT(DISTINCT r1.id) as ratings_given,
    COUNT(DISTINCT r2.id) as ratings_received
FROM users u
LEFT JOIN applications a ON u.id = a.student_id
LEFT JOIN gigs g ON u.id = g.provider_id
LEFT JOIN ratings r1 ON u.id = r1.rater_id
LEFT JOIN ratings r2 ON u.id = r2.ratee_id
GROUP BY u.id
ORDER BY u.created_at DESC;

-- Get user activity summary
SELECT 
    u.id,
    u.name,
    u.role,
    COUNT(DISTINCT al.id) as total_actions,
    MAX(al.created_at) as last_activity,
    COUNT(DISTINCT CASE WHEN al.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN al.id END) as actions_last_7_days
FROM users u
LEFT JOIN audit_logs al ON u.id = al.user_id
GROUP BY u.id, u.name, u.role
ORDER BY last_activity DESC NULLS LAST;

-- Suspend a user (example)
-- UPDATE users SET availability_status = 'suspended' WHERE id = ?;
-- INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
-- VALUES (?, 'user_suspended', 'user', ?, '{"reason": "violation of terms", "duration": "7 days"}');

-- ===========================================
-- GIG MODERATION QUERIES
-- ===========================================

-- Get all pending gigs for approval
SELECT 
    g.id,
    g.title,
    g.description,
    g.budget,
    g.category,
    g.location,
    g.deadline,
    g.created_at,
    u.name as provider_name,
    u.email as provider_email,
    u.average_rating as provider_rating
FROM gigs g
JOIN users u ON g.provider_id = u.id
WHERE g.approval_status = 'pending'
ORDER BY g.created_at ASC;

-- Approve a gig
-- UPDATE gigs SET approval_status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?;
-- INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
-- VALUES (?, 'gig_approved', 'gig', ?, '{"previous_status": "pending", "new_status": "approved"}');

-- Reject a gig
-- UPDATE gigs SET approval_status = 'rejected', status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?;
-- INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
-- VALUES (?, 'gig_rejected', 'gig', ?, '{"previous_status": "pending", "new_status": "rejected", "reason": "?"}');

-- Get gigs by approval status
SELECT 
    approval_status,
    COUNT(*) as count,
    AVG(budget) as avg_budget
FROM gigs
GROUP BY approval_status;

-- ===========================================
-- RATINGS MODERATION QUERIES
-- ===========================================

-- Get all flagged ratings
SELECT 
    r.id,
    r.score,
    r.comment,
    r.flag_reason,
    r.moderation_status,
    r.created_at,
    rater.name as rater_name,
    ratee.name as ratee_name,
    g.title as gig_title
FROM ratings r
JOIN users rater ON r.rater_id = rater.id
JOIN users ratee ON r.ratee_id = ratee.id
JOIN gigs g ON r.gig_id = g.id
WHERE r.is_flagged = TRUE AND r.moderation_status = 'pending'
ORDER BY r.created_at DESC;

-- Approve a flagged rating
-- UPDATE ratings 
-- SET moderation_status = 'approved', moderated_at = CURRENT_TIMESTAMP, moderated_by = ?
-- WHERE id = ?;

-- Remove a flagged rating
-- UPDATE ratings 
-- SET moderation_status = 'removed', moderated_at = CURRENT_TIMESTAMP, moderated_by = ?
-- WHERE id = ?;

-- ===========================================
-- PLATFORM STATISTICS
-- ===========================================

-- Get overall platform statistics
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
    (SELECT COUNT(*) FROM users WHERE role = 'provider') as total_providers,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
    (SELECT COUNT(*) FROM gigs) as total_gigs,
    (SELECT COUNT(*) FROM gigs WHERE status = 'open') as open_gigs,
    (SELECT COUNT(*) FROM gigs WHERE approval_status = 'pending') as pending_approval,
    (SELECT COUNT(*) FROM applications) as total_applications,
    (SELECT COUNT(*) FROM ratings) as total_ratings,
    (SELECT AVG(score) FROM ratings WHERE moderation_status = 'approved') as avg_platform_rating,
    (SELECT COUNT(*) FROM ratings WHERE is_flagged = TRUE AND moderation_status = 'pending') as flagged_ratings_pending;

-- Get daily activity statistics (last 30 days)
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT CASE WHEN resource_type = 'user' THEN resource_id END) as new_users,
    COUNT(DISTINCT CASE WHEN resource_type = 'gig' THEN resource_id END) as new_gigs,
    COUNT(DISTINCT CASE WHEN resource_type = 'application' THEN resource_id END) as new_applications
FROM audit_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Get category distribution
SELECT 
    category,
    COUNT(*) as gig_count,
    AVG(budget) as avg_budget,
    COUNT(DISTINCT provider_id) as unique_providers
FROM gigs
WHERE approval_status = 'approved'
GROUP BY category
ORDER BY gig_count DESC;

-- ===========================================
-- FEEDBACK MANAGEMENT
-- ===========================================

-- Get all pending feedback
SELECT 
    f.id,
    f.category,
    f.message,
    f.status,
    f.created_at,
    u.name as user_name,
    u.email as user_email,
    u.role as user_role
FROM feedback f
LEFT JOIN users u ON f.user_id = u.id
WHERE f.status = 'pending'
ORDER BY f.created_at ASC;

-- Update feedback status
-- UPDATE feedback SET status = 'resolved' WHERE id = ?;

-- Get feedback by category
SELECT 
    category,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count
FROM feedback
GROUP BY category
ORDER BY count DESC;

-- ===========================================
-- AUDIT LOG QUERIES
-- ===========================================

-- Get recent audit logs
SELECT 
    al.id,
    al.action,
    al.resource_type,
    al.resource_id,
    al.details,
    al.created_at,
    u.name as user_name,
    u.email as user_email
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 100;

-- Get audit logs for specific user
SELECT 
    al.id,
    al.action,
    al.resource_type,
    al.resource_id,
    al.details,
    al.created_at
FROM audit_logs al
WHERE al.user_id = ?
ORDER BY al.created_at DESC;

-- Get audit logs for specific resource
SELECT 
    al.id,
    al.action,
    al.details,
    al.created_at,
    u.name as user_name
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.resource_type = ? AND al.resource_id = ?
ORDER BY al.created_at DESC;

-- ===========================================
-- NOTIFICATION MANAGEMENT
-- ===========================================

-- Get notification statistics
SELECT 
    type,
    COUNT(*) as total_sent,
    COUNT(CASE WHEN read = TRUE THEN 1 END) as read_count,
    COUNT(CASE WHEN read = FALSE THEN 1 END) as unread_count,
    ROUND(100.0 * COUNT(CASE WHEN read = TRUE THEN 1 END) / COUNT(*), 2) as read_percentage
FROM notifications
GROUP BY type
ORDER BY total_sent DESC;

-- Get email queue status
SELECT 
    status,
    COUNT(*) as count,
    AVG(attempts) as avg_attempts
FROM email_queue
GROUP BY status;

-- Clean up old sent notifications (example - older than 90 days)
-- DELETE FROM notifications WHERE read = TRUE AND created_at < CURRENT_DATE - INTERVAL '90 days';