#!/usr/bin/env bash
set -euo pipefail

# Usage: sudo ./scripts/db_init.sh
# This script creates the Postgres role and databases used by SkillSync and applies schema and seed SQL.

ROLE_NAME=${ROLE_NAME:-skillsync_user}
ROLE_PWD=${ROLE_PWD:-change_me_secure}
MAIN_DB=${MAIN_DB:-skillsync}
TEST_DB=${TEST_DB:-skillsync_test}

echo "Creating Postgres role and databases (role=${ROLE_NAME})"

# Create role if it doesn't exist
EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${ROLE_NAME}'")
if [ "${EXISTS}" != "1" ]; then
  echo "Creating role ${ROLE_NAME}"
  sudo -u postgres psql -c "CREATE ROLE ${ROLE_NAME} WITH LOGIN PASSWORD '${ROLE_PWD}';"
else
  echo "Role ${ROLE_NAME} already exists"
fi

# Create main DB if missing
EXISTS_DB=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${MAIN_DB}'")
if [ "${EXISTS_DB}" != "1" ]; then
  echo "Creating database ${MAIN_DB}"
  sudo -u postgres psql -c "CREATE DATABASE ${MAIN_DB} OWNER ${ROLE_NAME};"
else
  echo "Database ${MAIN_DB} already exists"
fi

# Create test DB if missing
EXISTS_DB=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${TEST_DB}'")
if [ "${EXISTS_DB}" != "1" ]; then
  echo "Creating database ${TEST_DB}"
  sudo -u postgres psql -c "CREATE DATABASE ${TEST_DB} OWNER ${ROLE_NAME};"
else
  echo "Database ${TEST_DB} already exists"
fi

# Apply schema to main DB
echo "Applying schema to ${MAIN_DB}"
sudo -u postgres psql -d ${MAIN_DB} -f database/schema.sql

# Optionally apply seed if present
if [ -f database/seed.sql ]; then
  echo "Applying seed to ${MAIN_DB}"
  sudo -u postgres psql -d ${MAIN_DB} -f database/seed.sql
fi

# Apply schema to test DB
echo "Applying schema to ${TEST_DB}"
sudo -u postgres psql -d ${TEST_DB} -f database/schema.sql

# Optionally seed test DB
if [ -f database/seed.sql ]; then
  echo "Applying seed to ${TEST_DB}"
  sudo -u postgres psql -d ${TEST_DB} -f database/seed.sql
fi

echo "DB init complete."
