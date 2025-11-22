# Frontend → Backend API Mapping

This file lists frontend screens and the backend endpoints they use. Use these when wiring UI flows or building curl examples for the demo.

Notes:
- All protected endpoints require `Authorization: Bearer <TOKEN>` header. For development you can use `Bearer test:<uid>:<role>` (dev tokens) or real Firebase ID tokens when frontend is configured with the correct Firebase web-app.
- Base API path: `/api` (e.g., `http://127.0.0.1:5000/api`)

---

## Auth screens (Login / Sign Up)

- POST `/api/auth/verify`
  - Body: `{ "token": "<id_token>" }`
  - Response: `{ status: 'verified', uid: '...' }` or 401
- GET `/api/auth/me`
  - Header: `Authorization: Bearer <token>`
  - Response: user profile object
- POST `/api/auth/set-role` (admin-only)
  - Header: `Authorization: Bearer <admin_token>`
  - Body: `{ "user_uid": "<uid>", "role": "student|provider|admin" }`

## Student Home / Gigs listing (`GigsScreen`, `Home`)

- GET `/api/gigs`
  - Query params: `search`, `category`, `location`, `page`, `per_page`, `sort_by`, etc.
  - Response: `{ items: [ ...gig ], page, per_page, total, pages }`
- GET `/api/gigs/recommended` (student-only)
  - Header: `Authorization: Bearer <student_token>`
  - Query params: `limit` (default 10)
  - Response: `[ ...gig ]`
- GET `/api/gigs/trending`
  - Query params: `limit`
  - Response: `[ ...gig ]`
- GET `/api/gigs/<gig_id>`
  - Response: gig object
- GET `/api/gigs/<gig_id>/similar`
  - Response: `[ ...gig ]`

## Gig Actions (Apply / Save / My gigs)

- POST `/api/applications` (student-only)
  - Body: `{ "gig_id": <id>, "notes": "..." }`
  - Response: created application object (201)
- GET `/api/applications/my-applications` (student-only)
  - Response: `[ ...application ]`
- POST `/api/users/saved-gigs` (authenticated)
  - Body: `{ "gig_id": <id> }` → 201 created
- GET `/api/users/saved-gigs` (authenticated)
  - Response: `[ ...saved_gig ]`
- DELETE `/api/users/saved-gigs/<saved_gig_id>`
  - Response: 204

## Provider screens (Post Gig / Manage Applications)

- POST `/api/gigs` (provider-only)
  - Body: gig payload `{ title, description, budget?, category?, deadline?, location? }`
  - Response: created gig (201)
- GET `/api/gigs/my-gigs` (provider-only)
  - Response: `[ ...gig ]`
- GET `/api/gigs/<gig_id>/applications` (provider-only)
  - Response: `[ ...application ]`
- PATCH `/api/applications/<application_id>/select` (provider-only)
  - Response: updated application
- PATCH `/api/applications/<application_id>/reject` (provider-only)
  - Response: updated application
- PATCH `/api/applications/bulk-update` (provider-only)
  - Body: `{ gig_id, updates: [ { application_id, status } ] }`

## Provider analytics / expiring gigs

- GET `/api/gigs/analytics` (provider-only) → provider analytics
- GET `/api/gigs/expiring-soon` (provider-only) → list of gigs

## User profile

- GET `/api/users/profile` (authenticated via `/api/auth/me`) or GET `/api/users/<user_id>` (authenticated)
- PUT `/api/users/profile` (authenticated)
  - Body: subset of `{ name, bio, location, profile_photo }`
  - Response: updated user object
- GET `/api/users/skills` (student-only)
- POST `/api/users/skills` (student-only) — add skill
  - Body: `{ skill_name, proficiency_level? }` → 201
- PUT `/api/users/skills/<skill_name>` (student-only)
  - Body: `{ proficiency_level }`
- DELETE `/api/users/skills/<skill_name>`

## Notifications

- GET `/api/notifications` (authenticated)
  - Query: `unread_only=true`
- PATCH `/api/notifications/<id>/read`
- PATCH `/api/notifications/read-all`
- GET `/api/notifications/preferences` (authenticated)
- PUT `/api/notifications/preferences` (authenticated)
- PATCH `/api/notifications/preferences/<notification_type>` (authenticated)
- GET `/api/notifications/unread-count` (authenticated)

## Ratings

- POST `/api/ratings` (authenticated students/providers)
  - Body: `{ ratee_id, gig_id, score, comment? }` → 201
- GET `/api/ratings/user/<user_id>`
- GET `/api/ratings/gig/<gig_id>/summary`

## Admin

- GET `/api/admin/*` endpoints (see backend admin_routes.py)
  - e.g., user management, analytics, system logs
- POST `/api/gigs/mark-expired` (admin-only)
- POST `/api/notifications/bulk` (admin-only)

---

If you want, I can:
- Generate curl examples for each important flow (sign-up, sign-in, post gig, apply, approve) using dev tokens to quickly exercise flows,
- Or start wiring any missing frontend calls to match these endpoints.

