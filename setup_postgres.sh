#!/bin/bash
# PostgreSQL Setup Script for Emotion Recognition System
# This script automates the database and user setup process

set -e  # Exit on any error

echo "🚀 Setting up PostgreSQL for Emotion Recognition System"
echo "======================================================"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Installing with Homebrew..."
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew is not installed. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    brew install postgresql@16
    brew services start postgresql@16
    
    # Add to PATH
    echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
    export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
else
    echo "✓ PostgreSQL is already installed"
fi

# Check if PostgreSQL service is running
if ! brew services list | grep postgresql | grep started &> /dev/null; then
    echo "🔄 Starting PostgreSQL service..."
    brew services start postgresql@16
    sleep 3
else
    echo "✓ PostgreSQL service is running"
fi

# Database configuration
DB_NAME="emotion_recognition_db"
DB_USER="emotion_user"
DB_PASSWORD="secure_password_123"

echo ""
echo "📊 Setting up database and user..."

# Create user and database
psql postgres << EOF
-- Drop database and user if they exist (for clean setup)
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;

-- Create user
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Create database
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to the database and grant schema permissions
\c $DB_NAME

GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

\q
EOF

echo "✓ Database and user created successfully!"

# Test the connection
echo ""
echo "🔍 Testing database connection..."
if psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT current_database(), current_user;" &> /dev/null; then
    echo "✓ Database connection test successful!"
else
    echo "❌ Database connection test failed!"
    exit 1
fi

echo ""
echo "🎉 PostgreSQL setup completed successfully!"
echo ""
echo "📋 Database Configuration:"
echo "   Database Name: $DB_NAME"
echo "   Username: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo "   Host: localhost"
echo "   Port: 5432"
echo ""
echo "🔗 Connection URL:"
echo "   postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo ""
echo "✅ Your .env file should contain:"
echo "   DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo ""
echo "🚀 Next steps:"
echo "   1. Verify your .env file has the correct DATABASE_URL"
echo "   2. Run: python init_db.py"
echo "   3. Start the Flask server: python run.py"
echo "   4. Start the React frontend: npm start"
