#!/usr/bin/env python3
"""Script to reset password for a user."""

from app import create_app, db
from app.models.user import User

def reset_password(username, new_password):
    app = create_app()
    with app.app_context():
        try:
            user = User.query.filter_by(username=username).first()
            if user:
                user.set_password(new_password)
                db.session.commit()
                print(f'✓ Password reset successfully for user: {username}')
                print(f'  New password: {new_password}')
                return True
            else:
                print(f'✗ User "{username}" not found')
                return False
        except Exception as e:
            print(f'✗ Error resetting password: {e}')
            db.session.rollback()
            return False

if __name__ == '__main__':
    # Reset password for hridaydevkar
    username = 'hridaydevkar'
    new_password = 'newpassword123'  # Change this to whatever you want
    
    print(f'Resetting password for user: {username}')
    reset_password(username, new_password)
