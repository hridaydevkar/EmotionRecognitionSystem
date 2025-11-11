from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.utils.responses import success_response, error_response

user_bp = Blueprint('user', __name__)

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get user profile information"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        # Get additional user statistics
        from app.models.emotion import EmotionRecord, EmotionSession
        
        total_detections = EmotionRecord.query.filter_by(user_id=user_id).count()
        total_sessions = EmotionSession.query.filter_by(user_id=user_id).count()
        
        # Get most recent session
        recent_session = EmotionSession.query.filter_by(user_id=user_id).order_by(
            EmotionSession.start_time.desc()
        ).first()
        
        profile_data = user.to_dict()
        profile_data['statistics'] = {
            'total_detections': total_detections,
            'total_sessions': total_sessions,
            'last_session': recent_session.start_time.isoformat() if recent_session else None
        }
        
        return success_response(
            'Profile retrieved successfully',
            {'user': profile_data}
        )
        
    except Exception as e:
        return error_response(f'Failed to get profile: {str(e)}', 500)

@user_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get comprehensive user statistics"""
    try:
        user_id = get_jwt_identity()
        
        from app.models.emotion import EmotionRecord, EmotionSession
        from datetime import datetime, timedelta
        
        # Get various statistics
        total_detections = EmotionRecord.query.filter_by(user_id=user_id).count()
        total_sessions = EmotionSession.query.filter_by(user_id=user_id).count()
        
        # Get stats for last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_detections = EmotionRecord.query.filter(
            EmotionRecord.user_id == user_id,
            EmotionRecord.timestamp >= thirty_days_ago
        ).count()
        
        recent_sessions = EmotionSession.query.filter(
            EmotionSession.user_id == user_id,
            EmotionSession.start_time >= thirty_days_ago
        ).count()
        
        # Get first and last activity dates
        first_record = EmotionRecord.query.filter_by(user_id=user_id).order_by(
            EmotionRecord.timestamp.asc()
        ).first()
        
        last_record = EmotionRecord.query.filter_by(user_id=user_id).order_by(
            EmotionRecord.timestamp.desc()
        ).first()
        
        stats_data = {
            'all_time': {
                'total_detections': total_detections,
                'total_sessions': total_sessions,
                'first_activity': first_record.timestamp.isoformat() if first_record else None,
                'last_activity': last_record.timestamp.isoformat() if last_record else None
            },
            'last_30_days': {
                'detections': recent_detections,
                'sessions': recent_sessions
            }
        }
        
        return success_response(
            'User statistics retrieved successfully',
            stats_data
        )
        
    except Exception as e:
        return error_response(f'Failed to get user statistics: {str(e)}', 500)
