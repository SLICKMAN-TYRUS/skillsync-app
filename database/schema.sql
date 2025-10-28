CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uid VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL
);

CREATE TABLE gigs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    provider_id INTEGER REFERENCES users(id),
    deadline DATE,
    status VARCHAR(50)
);

CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    gig_id INTEGER REFERENCES gigs(id),
    student_id INTEGER REFERENCES users(id),
    status VARCHAR(50),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    rater_id INTEGER REFERENCES users(id),
    ratee_id INTEGER REFERENCES users(id),
    gig_id INTEGER REFERENCES gigs(id),
    score INTEGER CHECK (score BETWEEN 1 AND 5),
    comment TEXT
);