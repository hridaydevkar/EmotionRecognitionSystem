from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.emotion import EmotionRecord, EmotionSession
from app.utils.validators import validate_emotion_data, validate_session_id
from app.utils.responses import success_response, error_response, paginated_response
from datetime import datetime
import uuid

emotion_bp = Blueprint('emotions', __name__)

@emotion_bp.route('/save', methods=['POST'])
@jwt_required()
def save_emotion():
    """Save emotion data"""
    try:
        # Get current user ID from JWT (handle both string and int for backward compatibility)
        user_id_from_jwt = get_jwt_identity()
        if isinstance(user_id_from_jwt, str):
            user_id = int(user_id_from_jwt)  # Convert string back to int
        else:
            user_id = user_id_from_jwt  # Already an integer (old token)
            
        data = request.get_json()
        
        if not data:
            return error_response('No data provided', 400)
        
        emotions = data.get('emotions', {})
        confidence_scores = data.get('confidence_scores', {})
        session_id = data.get('session_id', '').strip()
        
        # Validate emotion data
        if not validate_emotion_data(emotions):
            return error_response('Invalid emotion data format', 400)
        
        if not validate_emotion_data(confidence_scores):
            return error_response('Invalid confidence scores format', 400)
        
        if not validate_session_id(session_id):
            return error_response('Invalid session ID', 400)
        
        # Check if session exists, create if not
        session = EmotionSession.query.filter_by(session_id=session_id, user_id=user_id).first()
        if not session:
            session = EmotionSession(
                user_id=user_id,
                session_id=session_id,
                start_time=datetime.utcnow()
            )
            db.session.add(session)
        
        # Create emotion record
        emotion_record = EmotionRecord(
            user_id=user_id,
            session_id=session_id,
            emotions_json=emotions,
            confidence_scores=confidence_scores
        )
        
        db.session.add(emotion_record)
        
        # Update session detection count
        session.total_detections += 1
        
        db.session.commit()
        
        return success_response(
            'Emotion data saved successfully',
            {'emotion_record': emotion_record.to_dict()},
            201
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to save emotion data: {str(e)}', 500)

@emotion_bp.route('/history', methods=['GET'])
@jwt_required()
def get_emotion_history():
    """Get user's emotion history with pagination"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)  # Convert string back to int
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)  # Max 100 per page
        
        # Get paginated emotion records
        emotions_query = EmotionRecord.query.filter_by(user_id=user_id).order_by(
            EmotionRecord.timestamp.desc()
        )
        
        emotions_paginated = emotions_query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        emotion_data = [record.to_dict() for record in emotions_paginated.items]
        
        return paginated_response(
            items=emotion_data,
            page=page,
            per_page=per_page,
            total=emotions_paginated.total,
            message="Emotion history retrieved successfully"
        )
        
    except Exception as e:
        return error_response(f'Failed to get emotion history: {str(e)}', 500)

@emotion_bp.route('/session/<session_id>', methods=['GET'])
@jwt_required()
def get_session_emotions(session_id):
    """Get emotions for a specific session"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)  # Convert string back to int
        
        # Validate session ID
        if not validate_session_id(session_id):
            return error_response('Invalid session ID', 400)
        
        # Check if session belongs to user
        session = EmotionSession.query.filter_by(
            session_id=session_id, 
            user_id=user_id
        ).first()
        
        if not session:
            return error_response('Session not found', 404)
        
        # Get all emotions for this session
        emotions = EmotionRecord.query.filter_by(
            session_id=session_id, 
            user_id=user_id
        ).order_by(EmotionRecord.timestamp.asc()).all()
        
        emotion_data = [record.to_dict() for record in emotions]
        
        return success_response(
            'Session emotions retrieved successfully',
            {
                'session': session.to_dict(),
                'emotions': emotion_data
            }
        )
        
    except Exception as e:
        return error_response(f'Failed to get session emotions: {str(e)}', 500)

@emotion_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_emotion_sessions():
    """Get user's emotion sessions"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)  # Convert string back to int
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Get paginated sessions
        sessions_query = EmotionSession.query.filter_by(user_id=user_id).order_by(
            EmotionSession.start_time.desc()
        )
        
        sessions_paginated = sessions_query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        sessions_data = [session.to_dict() for session in sessions_paginated.items]
        
        return paginated_response(
            items=sessions_data,
            page=page,
            per_page=per_page,
            total=sessions_paginated.total,
            message="Emotion sessions retrieved successfully"
        )
        
    except Exception as e:
        return error_response(f'Failed to get emotion sessions: {str(e)}', 500)

@emotion_bp.route('/session/start', methods=['POST'])
@jwt_required()
def start_session():
    """Start a new emotion detection session"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)  # Convert string back to int
        
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        print(f"[DEBUG] Creating new session with ID: {session_id} for user: {user_id}", flush=True)
        
        # Create new session
        session = EmotionSession(
            user_id=user_id,
            session_id=session_id,
            start_time=datetime.utcnow()
        )
        
        db.session.add(session)
        db.session.commit()
        
        return success_response(
            'Session started successfully',
            {'session': session.to_dict()},
            201
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to start session: {str(e)}', 500)

@emotion_bp.route('/session/<session_id>/end', methods=['POST'])
@jwt_required()
def end_session(session_id):
    """End an emotion detection session"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)  # Convert string back to int
        
        print(f"[DEBUG] Attempting to end session: {session_id} for user: {user_id}", flush=True)
        
        # Find session
        session = EmotionSession.query.filter_by(
            session_id=session_id,
            user_id=user_id
        ).first()
        
        if not session:
            print(f"[DEBUG] Session not found: {session_id} for user: {user_id}", flush=True)
            return error_response('Session not found', 404)
        
        print(f"[DEBUG] Found session: {session_id}, ending it...", flush=True)
        
        if session.end_time:
            return error_response('Session already ended', 400)
        
        # End session
        session.end_time = datetime.utcnow()
        db.session.commit()
        
        return success_response(
            'Session ended successfully',
            {'session': session.to_dict()}
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to end session: {str(e)}', 500)
