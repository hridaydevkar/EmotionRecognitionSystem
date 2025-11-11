from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from datetime import timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()

def create_app(config_name=None):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-me')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-change-me')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_HOURS', 24)))
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://localhost/emotion_db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['BCRYPT_LOG_ROUNDS'] = int(os.getenv('BCRYPT_LOG_ROUNDS', 12))
    app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    
    # JWT Configuration - disable strict subject validation for backward compatibility
    app.config['JWT_DECODE_OPTIONS'] = {
        'verify_signature': True,
        'verify_exp': True,
        'verify_nbf': True,
        'verify_iat': True,
        'verify_sub': False,  # Disable strict subject validation
        'require_exp': True,
        'require_iat': True,
        'require_nbf': False
    }
    
    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    
    # Configure JWT to be more flexible with subject validation
    @jwt.additional_claims_loader
    def add_claims_to_access_token(identity):
        # Ensure identity is always a string for JWT
        return {
            'user_id': str(identity) if not isinstance(identity, str) else identity
        }
    
    # Custom JWT error handlers for better user experience
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        from app.utils.responses import error_response
        return error_response('Invalid token. Please login again.', 401)
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        from app.utils.responses import error_response
        return error_response('Token has expired. Please login again.', 401)
    
    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_data):
        from app.utils.responses import error_response
        return error_response('Fresh token required. Please login again.', 401)
    
    # Configure CORS
    CORS(app, origins=os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(','))
    
    # Import models
    from app.models.user import User
    from app.models.emotion import EmotionRecord, EmotionSession
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.emotion import emotion_bp
    from app.routes.analytics import analytics_bp
    from app.routes.user import user_bp
    from app.routes.ml import ml_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(emotion_bp, url_prefix='/api/emotions')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(ml_bp, url_prefix='/api/ml')
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {
            'status': 'healthy',
            'message': 'Emotion Recognition API is running',
            'version': '1.0.0'
        }
    
    # Error handlers
    from app.utils.errors import register_error_handlers
    register_error_handlers(app)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
