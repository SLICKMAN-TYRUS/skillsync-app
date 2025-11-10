#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cleanup() {
    echo ""
    printf "${YELLOW}⚠ Test run interrupted by user${NC}\n"
    echo ""
    printf "${BLUE}ℹ You can resume testing with:${NC}\n"
    echo "  ./test.sh"
    echo ""
    exit 130
}

trap cleanup INT TERM

echo "SkillSync Test Runner"
echo "========================"
echo ""

ISSUES_FOUND=0
ISSUES_LIST=()

log_issue() {
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    ISSUES_LIST+=("$1")
    printf "${RED}✗ $1${NC}\n"
}

log_success() {
    printf "${GREEN}✓ $1${NC}\n"
}

log_warning() {
    printf "${YELLOW}⚠ $1${NC}\n"
}

log_info() {
    printf "${BLUE}ℹ $1${NC}\n"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_issue "$1 is not installed"
        return 1
    else
        log_success "$1 is installed"
        return 0
    fi
}

echo "Step 1: Checking prerequisites..."
echo "-----------------------------------"
check_command python3
check_command psql

echo ""
echo "Step 2: Checking virtual environment..."
echo "-----------------------------------"
if [ ! -d "venv" ]; then
    log_issue "Virtual environment not found. Run './setup.sh' first"
else
    log_success "Virtual environment exists"
    
    if [ ! -f "venv/bin/activate" ]; then
        log_issue "Virtual environment activation script not found"
    else
        source venv/bin/activate
        log_success "Virtual environment activated"
        
        if command -v pip &> /dev/null; then
            log_success "pip is available"
            PIP_CMD="pip"
        elif command -v pip3 &> /dev/null; then
            log_success "pip3 is available"
            PIP_CMD="pip3"
        else
            log_issue "pip is not available in virtual environment"
        fi
    fi
fi

if [ $ISSUES_FOUND -gt 0 ]; then
    echo ""
    printf "${RED}Setup issues detected. Run './setup.sh' to fix.${NC}\n"
    exit 1
fi

echo ""
echo "Step 3: Checking Python dependencies..."
echo "-----------------------------------"

PIP_CHECK="${PIP_CMD:-pip}"

if $PIP_CHECK show Flask &> /dev/null; then
    log_success "Flask is installed"
else
    log_issue "Flask is not installed. Run './setup.sh' or '$PIP_CHECK install -r backend/requirements.txt'"
fi

if $PIP_CHECK show pytest &> /dev/null; then
    log_success "pytest is installed"
else
    log_issue "pytest is not installed. Run './setup.sh' or '$PIP_CHECK install -r backend/requirements.txt'"
fi

if $PIP_CHECK show psycopg2-binary &> /dev/null; then
    log_success "psycopg2-binary is installed"
else
    log_issue "psycopg2-binary is not installed. Run './setup.sh' or '$PIP_CHECK install -r backend/requirements.txt'"
fi

echo ""
echo "Step 4: Checking .env configuration..."
echo "-----------------------------------"
if [ ! -f .env ]; then
    log_issue ".env file not found. Run './setup.sh' first"
else
    log_success ".env file exists"
    source .env
    
    if [ -z "$DATABASE_URL" ]; then
        log_issue "DATABASE_URL not set in .env"
    else
        log_success "DATABASE_URL is configured"
    fi
    
    if [ -z "$SECRET_KEY" ]; then
        log_warning "SECRET_KEY not set in .env (will use test default)"
    else
        log_success "SECRET_KEY is configured"
    fi
fi

echo ""
echo "Step 5: Checking PostgreSQL database..."
echo "-----------------------------------"

if [ -n "$DATABASE_URL" ]; then
    DB_USER=$(echo $DATABASE_URL | sed -E 's|.*://([^:]+):.*|\1|')
    DB_PASS=$(echo $DATABASE_URL | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
    DB_HOST=$(echo $DATABASE_URL | sed -E 's|.*@([^:/]+).*|\1|')
    DB_NAME=$(echo $DATABASE_URL | sed -E 's|.*/([^/]+)$|\1|')
    
    if echo "$DATABASE_URL" | grep -q ":[0-9]\+/"; then
        DB_PORT=$(echo $DATABASE_URL | sed -E 's|.*:([0-9]+)/.*|\1|')
    else
        DB_PORT=5432
    fi
    
    log_info "Checking database: $DB_NAME (${DB_HOST}:${DB_PORT})"
    
    if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
        log_issue "PostgreSQL server is not running on $DB_HOST:$DB_PORT"
    else
        log_success "PostgreSQL server is running"
        
        if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; then
            log_success "Can connect to database '$DB_NAME'"
            
            TABLES=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" 2>/dev/null || echo "0")
            if [ "$TABLES" -gt 0 ]; then
                log_success "Database has $TABLES tables"
            else
                log_issue "Database has no tables. Run './setup.sh' to initialize"
            fi
        else
            log_issue "Cannot connect to database '$DB_NAME'. Check credentials or run './setup.sh'"
        fi
    fi
fi

echo ""
echo "Step 6: Checking test database..."
echo "-----------------------------------"
TEST_DB="skillsync_test"

if sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $TEST_DB; then
    log_success "Test database '$TEST_DB' exists"
else
    log_info "Test database '$TEST_DB' doesn't exist, will be created by tests"
    
    if sudo -u postgres psql -c "CREATE DATABASE $TEST_DB;" &> /dev/null; then
        log_success "Created test database '$TEST_DB'"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $TEST_DB TO $DB_USER;" &> /dev/null || true
    else
        log_warning "Could not create test database (tests will attempt to create it)"
    fi
fi

echo ""
echo "Step 7: Checking Firebase credentials..."
echo "-----------------------------------"
if [ ! -f "firebase_credentials.json" ]; then
    log_warning "firebase_credentials.json not found (some tests may be skipped)"
else
    log_success "firebase_credentials.json exists"
    
    if python3 -c "import json; json.load(open('firebase_credentials.json'))" 2>/dev/null; then
        log_success "firebase_credentials.json is valid JSON"
    else
        log_issue "firebase_credentials.json is not valid JSON"
    fi
fi

echo ""
echo "Step 8: Checking project structure..."
echo "-----------------------------------"

REQUIRED_DIRS=("backend" "backend/app" "tests" "tests/backend" "database")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        log_success "Directory '$dir' exists"
    else
        log_issue "Directory '$dir' not found"
    fi
done

REQUIRED_FILES=("backend/app/main.py" "backend/requirements.txt" "tests/conftest.py")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "File '$file' exists"
    else
        log_issue "File '$file' not found"
    fi
done

if [ $ISSUES_FOUND -gt 0 ]; then
    echo ""
    printf "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    printf "${RED}Issues Found: $ISSUES_FOUND${NC}\n"
    printf "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    echo ""
    for issue in "${ISSUES_LIST[@]}"; do
        printf "${RED}  • $issue${NC}\n"
    done
    echo ""
    printf "${YELLOW}Recommendations:${NC}\n"
    echo "  1. Run './setup.sh' to set up the environment"
    echo "  2. Ensure PostgreSQL is running: sudo systemctl start postgresql"
    echo "  3. Check your .env file configuration"
    echo ""
    exit 1
fi

echo ""
echo "================================================"
printf "${GREEN}✓ All pre-checks passed!${NC}\n"
echo "================================================"
echo ""

echo "Step 9: Resetting test database..."
echo "-----------------------------------"

if [ -n "$DB_USER" ] && [ -n "$DB_NAME" ]; then
    log_info "Preparing clean test database 'skillsync_test'"
    
    if sudo -u postgres psql -c "DROP DATABASE IF EXISTS skillsync_test;" 2>/dev/null; then
        log_success "Dropped existing test database"
    else
        log_info "Test database doesn't exist or no sudo access"
    fi
    
    if sudo -u postgres psql -c "CREATE DATABASE skillsync_test OWNER $DB_USER;" 2>/dev/null; then
        log_success "Created fresh test database"
        
        sudo -u postgres psql -d skillsync_test << EOF 2>/dev/null || true
GRANT ALL PRIVILEGES ON DATABASE skillsync_test TO $DB_USER;
GRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF
        log_success "Granted all permissions to $DB_USER"
    else
        log_warning "Could not create test database with sudo, pytest will create it"
    fi
fi

echo ""
echo "Step 10: Running backend tests..."
echo "-----------------------------------"
echo ""

export PYTHONPATH="${PYTHONPATH}:$(pwd)/backend"

log_info "Starting pytest test suite (Press Ctrl+C to stop)..."
log_warning "Skipping slow tests (analytics, notifications, ratings, token tests)"
echo ""

pytest tests/backend/ -v --tb=short --color=yes \
    --ignore=tests/backend/test_admin_analytics.py \
    --ignore=tests/backend/test_notification_system.py \
    --ignore=tests/backend/test_rating_system.py \
    --ignore=tests/backend/test_test_tokens.py \
    || TEST_EXIT_CODE=$?

if [ -z "$TEST_EXIT_CODE" ]; then
    TEST_EXIT_CODE=0
fi

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    printf "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    printf "${GREEN}All tests passed!${NC}\n"
    printf "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    echo ""
    exit 0
else
    echo ""
    printf "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    printf "${RED}Some tests failed (Exit Code: $TEST_EXIT_CODE)${NC}\n"
    printf "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    echo ""
    printf "${YELLOW}Troubleshooting:${NC}\n"
    echo "  • Check the test output above for specific failures"
    echo "  • Ensure the database is properly set up: ./setup.sh"
    echo "  • Check that all services are running (PostgreSQL)"
    echo "  • For test database issues, try: dropdb skillsync_test && createdb skillsync_test"
    echo ""
    printf "${BLUE}To run specific tests:${NC}\n"
    echo "  pytest tests/backend/test_auth.py -v"
    echo "  pytest tests/backend/test_gigs.py -v"
    echo "  pytest tests/backend/ -k test_name -v"
    echo "  pytest tests/backend/ -x  # Stop on first failure"
    echo ""
    printf "${BLUE}To run skipped tests (slow, may take 5+ minutes):${NC}\n"
    echo "  pytest tests/backend/test_admin_analytics.py -v"
    echo "  pytest tests/backend/test_notification_system.py -v"
    echo "  pytest tests/backend/test_rating_system.py -v"
    echo "  pytest tests/backend/test_test_tokens.py -v"
    echo ""
    exit $TEST_EXIT_CODE
fi

