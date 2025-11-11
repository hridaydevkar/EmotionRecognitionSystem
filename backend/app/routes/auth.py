from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.utils.validators import validate_email, validate_password, validate_username
from app.utils.responses import success_response, error_response
import uuid

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate input data
        if not data:
            return error_response('No data provided', 400)
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validation
        if not validate_username(username):
            return error_response('Username must be 3-80 characters and contain only letters, numbers, and underscores', 400)
        
        if not validate_email(email):
            return error_response('Invalid email address', 400)
        
        if not validate_password(password):
            return error_response('Password must be at least 6 characters', 400)
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return error_response('Username already exists', 409)
        
        if User.query.filter_by(email=email).first():
            return error_response('Email already exists', 409)
        
        # Create new user
        user = User(username=username, email=email, password=password)
        db.session.add(user)
        db.session.commit()
        
        return success_response(
            'User registered successfully', 
            {'user': user.to_dict()}, 
            201
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Registration failed: {str(e)}', 500)

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response('No data provided', 400)
        
        # Accept either username or email for login
        username_or_email = data.get('username', '').strip() or data.get('email', '').strip()
        password = data.get('password', '')
        
        if not username_or_email or not password:
            return error_response('Username/email and password are required', 400)
        
        # Find user by username or email
        user = None
        if '@' in username_or_email:
            # Looks like email
            user = User.query.filter_by(email=username_or_email.lower()).first()
        else:
            # Looks like username
            user = User.query.filter_by(username=username_or_email).first()
        
        if not user or not user.check_password(password):
            return error_response('Invalid username/email or password', 401)
        
        if not user.is_active:
            return error_response('Account is deactivated', 401)
        
        # Create JWT token
        access_token = create_access_token(identity=str(user.id))
        
        return success_response(
            'Login successful',
            {
                'access_token': access_token,
                'user': user.to_dict()
            }
        )
        
    except Exception as e:
        return error_response(f'Login failed: {str(e)}', 500)

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (token invalidation handled on frontend)"""
    try:
        return success_response('Logged out successfully')
    except Exception as e:
        return error_response(f'Logout failed: {str(e)}', 500)

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        return success_response('Profile retrieved successfully', {'user': user.to_dict()})
        
    except Exception as e:
        return error_response(f'Failed to get profile: {str(e)}', 500)

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        data = request.get_json()
        if not data:
            return error_response('No data provided', 400)
        
        # Update username if provided
        if 'username' in data:
            new_username = data['username'].strip()
            if not validate_username(new_username):
                return error_response('Invalid username format', 400)
            
            # Check if username is already taken by another user
            existing_user = User.query.filter(User.username == new_username, User.id != user_id).first()
            if existing_user:
                return error_response('Username already exists', 409)
            
            user.username = new_username
        
        # Update email if provided
        if 'email' in data:
            new_email = data['email'].strip().lower()
            if not validate_email(new_email):
                return error_response('Invalid email format', 400)
            
            # Check if email is already taken by another user
            existing_user = User.query.filter(User.email == new_email, User.id != user_id).first()
            if existing_user:
                return error_response('Email already exists', 409)
            
            user.email = new_email
        
        db.session.commit()
        
        return success_response('Profile updated successfully', {'user': user.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update profile: {str(e)}', 500)
