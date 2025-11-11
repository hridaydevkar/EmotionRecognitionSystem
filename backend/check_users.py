#!/usr/bin/env python3
"""Script to check existing users in the database."""

from app import create_app, db
from app.models.user import User

def check_users():
    app = create_app()
    with app.app_context():
        try:
            users = User.query.all()
            if users:
                print('Existing users:')
                for user in users:
                    print(f'  - Username: {user.username}, Email: {user.email}')
            else:
                print('No users found in database.')
                print('You can either:')
                print('1. Run: python init_db.py to create sample data')
                print('2. Register a new user through the frontend')
        except Exception as e:
            print(f'Error checking users: {e}')
            print('Database might not be initialized. Run: python init_db.py')

if __name__ == '__main__':
    check_users()
