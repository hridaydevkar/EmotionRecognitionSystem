#!/usr/bin/env python3
"""
Database initialization script for Emotion Recognition System.
This script creates all database tables and sets up the initial schema.
"""

import os
import sys
from dotenv import load_dotenv
import uuid

# Add the parent directory to the path so we can import our app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db

# Load environment variables
load_dotenv()

def check_database_connection():
    """Check if the database is accessible."""
    try:
        app = create_app()
        with app.app_context():
            # Try to connect to the database
            db.engine.connect()
            print("✓ Database connection successful!")
            return True
            
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        print("\nTroubleshooting steps:")
        print("1. Make sure PostgreSQL is running: brew services start postgresql@16")
        print("2. Check if the database and user exist (see POSTGRESQL_SETUP.md)")
        print("3. Verify your DATABASE_URL in .env file")
        return False

def create_tables():
    """Create all database tables."""
    try:
        app = create_app()
        with app.app_context():
            print("Creating database tables...")
            
            # Create all tables
            db.create_all()
            
            print("✓ Database tables created successfully!")
            
            # Verify tables were created
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            
            if tables:
                print("\n📋 Created tables:")
                for table in tables:
                    print(f"   - {table}")
            else:
                print("⚠️  No tables found. This might indicate an issue.")
            
            return True
            
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        return False

def create_sample_data():
    """Create some sample data for testing."""
    try:
        app = create_app()
        with app.app_context():
            from app.models.user import User
            from app.models.emotion import EmotionRecord, EmotionSession
            from datetime import datetime, timedelta, UTC
            import json
            
            print("\nCreating sample data...")
            
            # Check if sample user already exists
            existing_user = User.query.filter_by(username='demo_user').first()
            if existing_user:
                print("Sample data already exists. Skipping creation.")
                return True
            
            # Create a sample user
            sample_user = User(
                username='demo_user',
                email='demo@example.com',
                password='demo123'  # Use plain password, not hashed
            )
            
            db.session.add(sample_user)
            db.session.flush()  # Get the user ID
            
            # Create a sample emotion session
            sample_session = EmotionSession(
                user_id=sample_user.id,
                session_id=str(uuid.uuid4()),
                start_time=datetime.now(UTC) - timedelta(minutes=10),
                end_time=datetime.now(UTC),
                total_detections=3
            )
            
            db.session.add(sample_session)
            db.session.flush()  # Get the session ID
            
            # Create sample emotion records
            sample_emotions = [
                {
                    'emotions_json': {'happy': 0.85, 'neutral': 0.15},
                    'confidence_scores': {'happy': 0.85, 'neutral': 0.15},
                    'timestamp': datetime.now(UTC) - timedelta(minutes=8)
                },
                {
                    'emotions_json': {'neutral': 0.72, 'happy': 0.28},
                    'confidence_scores': {'neutral': 0.72, 'happy': 0.28},
                    'timestamp': datetime.now(UTC) - timedelta(minutes=5)
                },
                {
                    'emotions_json': {'surprised': 0.68, 'neutral': 0.32},
                    'confidence_scores': {'surprised': 0.68, 'neutral': 0.32},
                    'timestamp': datetime.now(UTC) - timedelta(minutes=2)
                },
            ]
            
            for emotion_data in sample_emotions:
                emotion_record = EmotionRecord(
                    user_id=sample_user.id,
                    session_id=sample_session.session_id,
                    emotions_json=emotion_data['emotions_json'],
                    confidence_scores=emotion_data['confidence_scores'],
                    timestamp=emotion_data['timestamp']
                )
                db.session.add(emotion_record)
            
            db.session.commit()
            print("✓ Sample data created successfully!")
            print("   - Sample user: demo_user / demo123")
            print("   - Sample emotion records added")
            
            return True
            
    except Exception as e:
        print(f"✗ Error creating sample data: {e}")
        db.session.rollback()
        return False

def main():
    """Main initialization function."""
    print("🚀 Initializing Emotion Recognition System Database")
    print("=" * 55)
    
    # Step 1: Check database connection
    if not check_database_connection():
        print("\n❌ Database initialization failed!")
        print("Please follow the setup instructions in POSTGRESQL_SETUP.md")
        sys.exit(1)
    
    # Step 2: Create tables
    if not create_tables():
        print("\n❌ Table creation failed!")
        sys.exit(1)
    
    # Step 3: Create sample data
    if not create_sample_data():
        print("\n⚠️  Sample data creation failed, but core setup is complete.")
    
    print("\n🎉 Database initialization completed successfully!")
    print("\nNext steps:")
    print("1. Start the Flask backend: python run.py")
    print("2. Start the React frontend: npm start")
    print("3. Visit http://localhost:4000 to access the application")
    print("4. Use demo_user / demo123 to test the application")

if __name__ == '__main__':
    main()