#!/bin/bash

set -e

echo "🚀 SkillSync Setup Script"
echo "=========================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_command() {
    if ! command -v $1 &> /dev/null; then
        printf "${RED}✗ $1 is not installed${NC}\n"
        return 1
    else
        printf "${GREEN}✓ $1 is installed${NC}\n"
        return 0
    fi
}

echo "Step 1: Checking prerequisites..."
echo "-----------------------------------"
MISSING_DEPS=0

check_command python3 || MISSING_DEPS=1
check_command psql || MISSING_DEPS=1
check_command pip3 || MISSING_DEPS=1

if [ $MISSING_DEPS -eq 1 ]; then
    printf "${RED}Please install missing dependencies and run again${NC}\n"
    exit 1
fi

echo ""
echo "Step 2: Checking .env file..."
echo "-----------------------------------"
if [ ! -f .env ]; then
    printf "${YELLOW}⚠ .env file not found${NC}\n"
    echo "Creating .env file from template..."
    
    cat > .env << 'EOF'
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-this-in-production
DATABASE_URL=postgresql://tester:testpass@localhost:5432/skillsync
FIREBASE_CREDENTIALS_PATH=firebase_credentials.json
EOF
    
    printf "${GREEN}✓ .env file created. Please update with your actual values!${NC}\n"
    printf "${YELLOW}  Especially check DATABASE_URL and FIREBASE_CREDENTIALS_PATH${NC}\n"
else
    printf "${GREEN}✓ .env file exists${NC}\n"
fi

source .env

DB_USER=$(echo $DATABASE_URL | sed -E 's|.*://([^:]+):.*|\1|')
DB_PASS=$(echo $DATABASE_URL | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo $DATABASE_URL | sed -E 's|.*@([^:/]+).*|\1|')
DB_NAME=$(echo $DATABASE_URL | sed -E 's|.*/([^/]+)$|\1|')

if echo "$DATABASE_URL" | grep -q ":[0-9]\+/"; then
    DB_PORT=$(echo $DATABASE_URL | sed -E 's|.*:([0-9]+)/.*|\1|')
else
    DB_PORT=5432
fi

echo ""
echo "Step 3: Setting up Python virtual environment..."
echo "-----------------------------------"
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    printf "${GREEN}✓ Virtual environment created${NC}\n"
else
    printf "${GREEN}✓ Virtual environment already exists${NC}\n"
fi

source venv/bin/activate
printf "${GREEN}✓ Virtual environment activated${NC}\n"

echo ""
echo "Step 4: Installing Python dependencies..."
echo "-----------------------------------"
pip install -q --upgrade pip
pip install -q -r backend/requirements.txt
printf "${GREEN}✓ Python dependencies installed${NC}\n"

echo ""
echo "Step 5: Setting up PostgreSQL database..."
echo "-----------------------------------"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST"
echo ""

DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")
if [ "$DB_EXISTS" = "1" ]; then
    printf "${YELLOW}⚠ Database '$DB_NAME' already exists${NC}\n"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
        sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
        printf "${GREEN}✓ Existing database dropped${NC}\n"
    else
        echo "Keeping existing database..."
    fi
fi

USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null || echo "0")
if [ "$USER_EXISTS" != "1" ]; then
    echo "Creating database user '$DB_USER'..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
    printf "${GREEN}✓ Database user created${NC}\n"
else
    printf "${GREEN}✓ Database user already exists${NC}\n"
fi

DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")
if [ "$DB_EXISTS" != "1" ]; then
    echo "Creating database '$DB_NAME'..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null
    printf "${GREEN}✓ Database created${NC}\n"
else
    printf "${GREEN}✓ Database already exists${NC}\n"
fi

echo "Granting permissions..."
sudo -u postgres psql -d $DB_NAME << EOF
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF
printf "${GREEN}✓ Permissions granted${NC}\n"

echo ""
echo "Step 6: Creating database schema..."
echo "-----------------------------------"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/schema.sql > /dev/null
printf "${GREEN}✓ Database schema created${NC}\n"

echo "Granting permissions on tables..."
sudo -u postgres psql -d $DB_NAME << EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
EOF
printf "${GREEN}✓ Table permissions granted${NC}\n"

echo ""
echo "Step 7: Seeding database with test data..."
echo "-----------------------------------"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/seed.sql > /dev/null
printf "${GREEN}✓ Database seeded with test data${NC}\n"

echo ""
echo "Step 8: Verifying setup..."
echo "-----------------------------------"
USER_COUNT=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM users;")
GIG_COUNT=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM gigs;")
APP_COUNT=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM applications;")

printf "${GREEN}✓ Users: $USER_COUNT${NC}\n"
printf "${GREEN}✓ Gigs: $GIG_COUNT${NC}\n"
printf "${GREEN}✓ Applications: $APP_COUNT${NC}\n"

echo ""
echo "Step 9: Testing backend server..."
echo "-----------------------------------"
echo "Starting Flask server in background..."
./run &
SERVER_PID=$!
sleep 5

if kill -0 $SERVER_PID 2>/dev/null; then
    printf "${GREEN}✓ Server started successfully (PID: $SERVER_PID)${NC}\n"
    
    echo "Testing API endpoints..."
    
    HEALTH_RESPONSE=$(curl -s http://localhost:5000/api/health)
    if echo $HEALTH_RESPONSE | grep -q "healthy"; then
        printf "${GREEN}✓ Health check endpoint working${NC}\n"
    else
        printf "${RED}✗ Health check endpoint failed${NC}\n"
    fi
    
    GIGS_RESPONSE=$(curl -s http://localhost:5000/api/gigs)
    if echo $GIGS_RESPONSE | grep -q "items"; then
        printf "${GREEN}✓ Gigs endpoint working${NC}\n"
    else
        printf "${RED}✗ Gigs endpoint failed${NC}\n"
    fi
    
    echo ""
    echo "Stopping test server..."
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    printf "${GREEN}✓ Server stopped${NC}\n"
else
    printf "${RED}✗ Failed to start server${NC}\n"
fi

echo ""
echo "================================================"
printf "${GREEN}✅ Setup completed successfully!${NC}\n"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Start the backend server:"
printf "   ${BLUE}./run${NC}\n"
echo ""
echo "2. Access the API documentation:"
printf "   ${BLUE}http://localhost:5000/api/docs${NC}\n"
echo ""
echo "3. Test the API:"
printf "   ${BLUE}curl http://localhost:5000/api/health${NC}\n"
echo ""
echo "4. Run tests:"
printf "   ${BLUE}./test.sh${NC}\n"
echo ""
echo "For more information, see README.md"
echo ""

