from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON

class EmotionSession(db.Model):
    __tablename__ = 'emotion_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_id = db.Column(db.String(255), unique=True, nullable=False, index=True)
    start_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    end_time = db.Column(db.DateTime)
    total_detections = db.Column(db.Integer, default=0, nullable=False)
    
    # Relationships
    emotion_records = db.relationship('EmotionRecord', backref='session', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert session object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'start_time': self.start_time.isoformat() + 'Z',  # Add Z suffix to indicate UTC
            'end_time': self.end_time.isoformat() + 'Z' if self.end_time else None,
            'total_detections': self.total_detections
        }
    
    def __repr__(self):
        return f'<EmotionSession {self.session_id}>'

class EmotionRecord(db.Model):
    __tablename__ = 'emotion_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_id = db.Column(db.String(255), db.ForeignKey('emotion_sessions.session_id'), nullable=False)
    emotions_json = db.Column(JSON, nullable=False)
    confidence_scores = db.Column(JSON, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Indexes for better performance
    __table_args__ = (
        db.Index('idx_user_timestamp', 'user_id', 'timestamp'),
        db.Index('idx_session_timestamp', 'session_id', 'timestamp'),
    )
    
    def to_dict(self):
        """Convert emotion record object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'emotions_json': self.emotions_json,
            'confidence_scores': self.confidence_scores,
            'timestamp': self.timestamp.isoformat() + 'Z'  # Add Z suffix to indicate UTC
        }
    
    def get_dominant_emotion(self):
        """Get the dominant emotion from the emotions_json"""
        if not self.emotions_json:
            return 'neutral'
        
        return max(self.emotions_json, key=self.emotions_json.get)
    
    def __repr__(self):
        return f'<EmotionRecord {self.id} - {self.get_dominant_emotion()}>'
