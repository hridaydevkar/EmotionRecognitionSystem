#!/usr/bin/env python3
"""
Clear all users from the database
This script deletes all user accounts from the Emotion Recognition System database
"""

import os
import sys
from dotenv import load_dotenv

# Add the parent directory to the path so we can import our app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User

# Load environment variables
load_dotenv()

def clear_all_users():
    """Delete all users from the database."""
    try:
        app = create_app()
        with app.app_context():
            # Get count of users before deletion
            user_count = User.query.count()
            
            if user_count == 0:
                print("✓ No users found in database. Already clean!")
                return True
            
            print(f"⚠️  Found {user_count} user(s) in database")
            print("Deleting all users and related data...")
            
            # Get all users
            users = User.query.all()
            
            # Delete each user individually (cascade will handle related records)
            for user in users:
                db.session.delete(user)
            
            # Commit the changes
            db.session.commit()
            
            print(f"✓ Successfully deleted {user_count} user(s)")
            print("✓ All related emotion records and sessions also deleted")
            print("✓ Database is now clean!")
            return True
            
    except Exception as e:
        print(f"✗ Error clearing users: {e}")
        try:
            db.session.rollback()
        except:
            pass
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Clearing All Users from Database")
    print("=" * 60)
    
    clear_all_users()
    
    print("=" * 60)
