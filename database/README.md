# Database Documentation

## Overview
This database powers a gig platform that connects students with short-term opportunities. The platform supports three user roles: students, providers (who post gigs), and administrators.

## Database Schema

### Core Tables

#### users
Stores information about all platform users (students, providers, and admins).

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| uid | VARCHAR(128) | Firebase UID (unique) |
| name | VARCHAR(120) | User's full name |
| email | VARCHAR(120) | User's email (unique) |
| role | VARCHAR(50) | User role: 'student', 'provider', or 'admin' |
| profile_photo | VARCHAR(255) | URL to profile photo |
| location | VARCHAR(255) | User's location |
| bio | TEXT | User biography |
| availability_status | VARCHAR(50) | 'available', 'busy', or 'suspended' |
| created_at | TIMESTAMP | Account creation date |
| average_rating | DECIMAL(3,2) | Average rating (0.00-5.00) |

#### gigs
Stores all gig postings on the platform.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| title | VARCHAR(255) | Gig title |
| description | TEXT | Detailed description |
| budget | DECIMAL(10,2) | Payment amount |
| category | VARCHAR(100) | Gig category |
| location | VARCHAR(255) | Where the gig takes place |
| provider_id | INTEGER | Foreign key to users table |
| deadline | DATE | Application or completion deadline |
| status | VARCHAR(50) | 'open' or 'closed' |
| approval_status | VARCHAR(50) | 'pending', 'approved', or 'rejected' |
| created_at | TIMESTAMP | When gig was posted |
| updated_at | TIMESTAMP | Last update time |

#### applications
Tracks student applications to gigs.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| gig_id | INTEGER | Foreign key to gigs |
| student_id | INTEGER | Foreign key to users |
| status | VARCHAR(50) | 'pending', 'accepted', or 'rejected' |
| notes | TEXT | Application cover letter/notes |
| applied_at | TIMESTAMP | When application was submitted |
| selected_at | TIMESTAMP | When accepted (if applicable) |

**Constraint**: Unique combination of (gig_id, student_id) - prevents duplicate applications.

#### ratings
Stores ratings and reviews between users.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| rater_id | INTEGER | User giving the rating |
| ratee_id | INTEGER | User receiving the rating |
| gig_id | INTEGER | Related gig |
| score | INTEGER | Rating score (1-5) |
| comment | TEXT | Review text |
| created_at | TIMESTAMP | When rating was posted |
| is_flagged | BOOLEAN | Whether rating was flagged |
| flag_reason | VARCHAR(255) | Reason for flagging |
| moderation_status | VARCHAR(50) | 'pending', 'approved', or 'removed' |
| moderated_at | TIMESTAMP | When moderated |
| moderated_by | INTEGER | Admin who moderated |

**Constraint**: Unique combination of (rater_id, ratee_id, gig_id) - one rating per gig relationship.

### Supporting Tables

#### skills
Master list of skills available on the platform.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | Skill name (unique) |
| category | VARCHAR(50) | Skill category |
| created_at | TIMESTAMP | When skill was added |

#### student_skills
Junction table linking students to their skills.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| student_id | INTEGER | Foreign key to users |
| skill_id | INTEGER | Foreign key to skills |
| proficiency_level | VARCHAR(20) | 'beginner', 'intermediate', 'advanced', 'native' |
| created_at | TIMESTAMP | When skill was added |

**Constraint**: Unique combination of (student_id, skill_id).

#### notifications
In-app notifications for users.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Recipient user |
| type | VARCHAR(50) | Notification type |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Notification message |
| read | BOOLEAN | Whether notification was read |
| related_gig_id | INTEGER | Optional gig reference |
| related_application_id | INTEGER | Optional application reference |
| created_at | TIMESTAMP | When notification was created |

#### saved_gigs
Tracks gigs that users have bookmarked.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | User who saved the gig |
| gig_id | INTEGER | Gig that was saved |
| saved_at | TIMESTAMP | When gig was saved |

**Constraint**: Unique combination of (user_id, gig_id).

#### feedback
User feedback submitted to the platform.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | User who submitted feedback |
| category | VARCHAR(100) | Feedback category |
| message | TEXT | Feedback content |
| status | VARCHAR(50) | 'pending' or 'resolved' |
| created_at | TIMESTAMP | When feedback was submitted |

#### audit_logs
Tracks important actions on the platform for security and debugging.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | User who performed action |
| action | VARCHAR(100) | Action type |
| resource_type | VARCHAR(50) | Type of resource affected |
| resource_id | INTEGER | ID of affected resource |
| details | JSONB | Additional action details |
| created_at | TIMESTAMP | When action occurred |

#### notification_preferences
User preferences for different notification types.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | User |
| notification_type | VARCHAR(50) | Type of notification |
| email_enabled | BOOLEAN | Whether to send emails |
| push_enabled | BOOLEAN | Whether to send push notifications |
| in_app_enabled | BOOLEAN | Whether to show in-app |
| created_at | TIMESTAMP | When preference was created |
| updated_at | TIMESTAMP | Last update time |

**Constraint**: Unique combination of (user_id, notification_type).

#### email_queue
Queue for outbound emails.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Recipient user |
| email_address | VARCHAR(255) | Recipient email |
| subject | VARCHAR(255) | Email subject |
| body | TEXT | Email body |
| template | VARCHAR(100) | Email template name |
| template_data | JSONB | Template variables |
| status | VARCHAR(20) | 'pending', 'sent', or 'failed' |
| attempts | INTEGER | Send attempts |
| last_attempt | TIMESTAMP | Last send attempt |
| created_at | TIMESTAMP | When queued |
| sent_at | TIMESTAMP | When successfully sent |

#### push_notifications
Queue for push notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Recipient user |
| device_token | VARCHAR(255) | Device push token |
| platform | VARCHAR(20) | 'ios' or 'android' |
| title | VARCHAR(255) | Notification title |
| body | TEXT | Notification body |
| data | JSONB | Additional payload data |
| status | VARCHAR(20) | 'pending', 'sent', or 'failed' |
| attempts | INTEGER | Send attempts |
| last_attempt | TIMESTAMP | Last send attempt |
| created_at | TIMESTAMP | When queued |
| sent_at | TIMESTAMP | When successfully sent |

## Setup Instructions

### Prerequisites
- PostgreSQL 12 or higher
- Database connection credentials

### Database Creation

1. **Create the database:**
   ```bash
   createdb gig_platform
   ```

2. **Run migrations in order:**
   ```bash
   psql -d gig_platform -f migrations/001_create_tables.sql
   psql -d gig_platform -f migrations/002_add_indexes.sql
   ```

3. **Load seed data (development/testing only):**
   ```bash
   psql -d gig_platform -f seed.sql
   ```

### GitHub Codespaces Setup

1. **Start PostgreSQL service:**
   ```bash
   sudo service postgresql start
   ```

2. **Create database user (if needed):**
   ```bash
   sudo -u postgres createuser -s $USER
   ```

3. **Run setup:**
   ```bash
   createdb gig_platform
   psql -d gig_platform -f migrations/001_create_tables.sql
   psql -d gig_platform -f migrations/002_add_indexes.sql
   psql -d gig_platform -f seed.sql
   ```

## Query Files

The `queries/` directory contains organized SQL queries for common operations:

### admin_queries.sql
- User management and moderation
- Gig approval workflows
- Rating moderation
- Platform statistics and analytics
- Feedback management
- Audit log queries

### gig_queries.sql
- Gig discovery and search
- Filtering by category, budget, location
- Skill-based recommendations
- Gig creation and management
- Application submission and tracking
- Saved gigs management
- Gig analytics

### user_queries.sql
- User profile management
- Skills management (add, update, remove)
- Ratings and reviews
- Notifications (create, read, mark as read)
- Notification preferences
- User statistics and dashboard data
- User search and discovery

## Indexes

The database includes optimized indexes for common query patterns:

- **User lookups**: email, uid, role
- **Gig searches**: status, category, provider_id, approval_status, deadline
- **Applications**: gig_id, student_id, status
- **Ratings**: rater_id, ratee_id, gig_id, moderation status
- **Notifications**: user_id, read status, type
- **Time-based queries**: created_at, applied_at, deadline

## Common Workflows

### Student applies to a gig:
1. Insert into `applications` table
2. Create notification for provider in `notifications` table
3. Log action in `audit_logs`

### Provider accepts application:
1. Update application status to 'accepted'
2. Create notification for student
3. Log action in `audit_logs`

### User submits rating:
1. Insert into `ratings` table (status: 'pending')
2. Admin reviews and approves
3. Recalculate user's average_rating
4. Create notification for rated user

### Admin approves gig:
1. Update gig approval_status to 'approved'
2. Log action in `audit_logs`
3. Optionally notify relevant students with matching skills

## Maintenance

### Regular cleanup tasks:

```sql
-- Delete old read notifications (90+ days)
DELETE FROM notifications 
WHERE read = TRUE 
  AND created_at < CURRENT_DATE - INTERVAL '90 days';

-- Archive old audit logs (1+ year)
-- (Implement archival strategy based on your needs)

-- Clean up failed email/push attempts (7+ days)
DELETE FROM email_queue 
WHERE status = 'failed' 
  AND created_at < CURRENT_DATE - INTERVAL '7 days';
```

### Performance monitoring:

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries (requires pg_stat_statements extension)
-- SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

## Security Considerations

- All user passwords should be handled by Firebase Authentication (not stored in database)
- Use parameterized queries to prevent SQL injection
- Implement row-level security for multi-tenant access
- Regularly backup the database
- Encrypt sensitive data at rest
- Use SSL/TLS for database connections in production

## Support

For database-related issues or questions, refer to:
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Project repository issues page