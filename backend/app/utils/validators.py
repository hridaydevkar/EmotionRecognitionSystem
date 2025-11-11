import re

def validate_email(email):
    """Validate email format"""
    if not email or len(email) < 5 or len(email) > 120:
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if not password or len(password) < 6:
        return False
    return True

def validate_username(username):
    """Validate username format"""
    if not username or len(username) < 3 or len(username) > 80:
        return False
    
    # Username can contain letters, numbers, and underscores
    pattern = r'^[a-zA-Z0-9_]+$'
    return re.match(pattern, username) is not None

def validate_emotion_data(emotions):
    """Validate emotion data structure"""
    if not isinstance(emotions, dict):
        return False
    
    required_emotions = ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral']
    
    # Check all required emotions are present
    for emotion in required_emotions:
        if emotion not in emotions:
            return False
        
        # Check values are floats between 0 and 1
        value = emotions[emotion]
        if not isinstance(value, (int, float)) or not (0 <= value <= 1):
            return False
    
    return True

def validate_session_id(session_id):
    """Validate session ID format"""
    if not session_id or not isinstance(session_id, str):
        return False
    
    # Session ID should be between 10 and 255 characters
    return 10 <= len(session_id.strip()) <= 255
