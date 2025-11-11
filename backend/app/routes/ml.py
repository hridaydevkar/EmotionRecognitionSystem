from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.emotion import EmotionRecord, EmotionSession
from app.models.user import User
from app.utils.responses import success_response, error_response
from app import db
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, UTC
from collections import defaultdict
import json
import random

# ML imports
try:
    from sklearn.ensemble import RandomForestRegressor, IsolationForest
    from sklearn.linear_model import LinearRegression
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_squared_error
    import joblib
    import os
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

ml_bp = Blueprint('ml', __name__)

# ML Models storage directory
MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'ml_models')

class EmotionAnalyzer:
    def __init__(self):
        self.emotion_weights = {
            'happy': 1.0,
            'sad': -0.8,
            'angry': -1.0,
            'surprised': 0.3,
            'fearful': -0.7,
            'disgusted': -0.6,
            'neutral': 0.0
        }
        
        self.stability_threshold = 0.3  # Lower variance indicates more stability
        
    def calculate_wellness_score(self, emotions_history):
        """Calculate overall wellness based on emotion patterns"""
        if not emotions_history:
            return 0.5
            
        scores = []
        for record in emotions_history[-10:]:  # Last 10 records
            record_score = 0
            total_intensity = 0
            
            for emotion, value in record.items():
                if emotion in self.emotion_weights:
                    weight = self.emotion_weights[emotion]
                    record_score += value * weight
                    total_intensity += value
            
            if total_intensity > 0:
                normalized_score = (record_score + total_intensity) / (2 * total_intensity)
                scores.append(max(0, min(1, normalized_score)))
        
        return np.mean(scores) if scores else 0.5
    
    def calculate_stability_score(self, emotions_history):
        """Calculate emotional stability"""
        if len(emotions_history) < 3:
            return 0.7
            
        recent_records = emotions_history[-5:]
        emotion_variances = {}
        
        for emotion in self.emotion_weights.keys():
            values = [record.get(emotion, 0) for record in recent_records]
            if len(values) > 1:
                variance = np.var(values)
                emotion_variances[emotion] = variance
        
        avg_variance = np.mean(list(emotion_variances.values()))
        stability = max(0.1, 1.0 - (avg_variance / self.stability_threshold))
        return min(1.0, stability)
    
    def get_dominant_emotion_trend(self, emotions_history, lookback=5):
        """Get trending dominant emotion with confidence"""
        if not emotions_history:
            return 'neutral', 0.0
            
        recent_records = emotions_history[-lookback:]
        emotion_totals = defaultdict(float)
        total_weight = 0
        
        for i, record in enumerate(recent_records):
            weight = (i + 1) / len(recent_records)  # More weight to recent
            for emotion, value in record.items():
                if emotion in self.emotion_weights:
                    emotion_totals[emotion] += value * weight
            total_weight += weight
        
        if total_weight > 0:
            for emotion in emotion_totals:
                emotion_totals[emotion] /= total_weight
        
        if not emotion_totals:
            return 'neutral', 0.0
            
        dominant = max(emotion_totals.keys(), key=lambda k: emotion_totals[k])
        confidence = emotion_totals[dominant]
        
        return dominant, min(1.0, confidence)

# Global analyzer instance
analyzer = EmotionAnalyzer()

def get_user_emotion_history(user_id, days=7):
    """Get user's emotion history for analysis"""
    try:
        cutoff_date = datetime.now(UTC) - timedelta(days=days)
        
        records = EmotionRecord.query.filter(
            EmotionRecord.user_id == user_id,
            EmotionRecord.timestamp >= cutoff_date
        ).order_by(EmotionRecord.timestamp.asc()).all()
        
        emotions_list = []
        for record in records:
            if record.emotions:
                if isinstance(record.emotions, str):
                    emotions = json.loads(record.emotions)
                else:
                    emotions = record.emotions
                emotions_list.append(emotions)
        
        return emotions_list
    except Exception as e:
        current_app.logger.error(f"Error getting emotion history: {str(e)}")
        return []

def generate_intelligent_recommendations(dominant_emotion, confidence, wellness_score, stability_score):
    """Generate contextually appropriate recommendations"""
    
    recommendations = []
    
    # Base recommendations by emotion
    if dominant_emotion == 'happy':
        if confidence > 0.7:
            recommendations = [
                {
                    'type': 'maintain',
                    'title': 'Keep the Positive Energy',
                    'description': 'Share your joy with others through meaningful connections',
                    'action': 'Call someone you care about',
                    'duration': '10-15 min',
                    'icon': '📞'
                },
                {
                    'type': 'creative',
                    'title': 'Channel Your Energy',
                    'description': 'Use this positive state for productive activities',
                    'action': 'Work on a personal project or hobby',
                    'duration': '30+ min',
                    'icon': '🎨'
                }
            ]
    
    elif dominant_emotion == 'sad':
        if confidence > 0.6:
            recommendations = [
                {
                    'type': 'support',
                    'title': 'Gentle Self-Care',
                    'description': 'Be kind to yourself during this time',
                    'action': 'Take a warm shower or practice deep breathing',
                    'duration': '15-20 min',
                    'icon': '🛁'
                },
                {
                    'type': 'connection',
                    'title': 'Reach Out',
                    'description': 'Human connection can provide comfort',
                    'action': 'Text a trusted friend or family member',
                    'duration': '5-10 min',
                    'icon': '💬'
                },
                {
                    'type': 'mindfulness',
                    'title': 'Mindful Moment',
                    'description': 'Ground yourself in the present',
                    'action': 'Try a 5-minute guided meditation',
                    'duration': '5 min',
                    'icon': '🧘'
                }
            ]
    
    elif dominant_emotion == 'angry':
        recommendations = [
            {
                'type': 'release',
                'title': 'Physical Release',
                'description': 'Channel anger into movement',
                'action': 'Take a brisk walk or do some stretches',
                'duration': '10-20 min',
                'icon': '🚶'
            },
            {
                'type': 'cooling',
                'title': 'Cool Down Period',
                'description': 'Give yourself time to process',
                'action': 'Step away and take 10 deep breaths',
                'duration': '2-5 min',
                'icon': '❄️'
            },
            {
                'type': 'expression',
                'title': 'Express Safely',
                'description': 'Write down your thoughts',
                'action': 'Journal about what triggered the anger',
                'duration': '10-15 min',
                'icon': '📝'
            }
        ]
    
    elif dominant_emotion == 'surprised':
        recommendations = [
            {
                'type': 'process',
                'title': 'Process the Moment',
                'description': 'Take time to understand what happened',
                'action': 'Reflect on the situation calmly',
                'duration': '5-10 min',
                'icon': '🤔'
            },
            {
                'type': 'adaptation',
                'title': 'Adapt and Learn',
                'description': 'Use surprise as a learning opportunity',
                'action': 'Consider what this teaches you',
                'duration': '10 min',
                'icon': '💡'
            }
        ]
    
    elif dominant_emotion == 'fearful':
        recommendations = [
            {
                'type': 'grounding',
                'title': 'Grounding Exercise',
                'description': 'Focus on your immediate environment',
                'action': 'Name 5 things you can see, 4 you can touch, 3 you can hear',
                'duration': '3-5 min',
                'icon': '🌱'
            },
            {
                'type': 'safety',
                'title': 'Create Safety',
                'description': 'Move to a comfortable, safe space',
                'action': 'Go somewhere you feel secure',
                'duration': '5 min',
                'icon': '🏠'
            },
            {
                'type': 'breathing',
                'title': 'Calm Breathing',
                'description': 'Regulate your nervous system',
                'action': 'Practice 4-7-8 breathing technique',
                'duration': '5-10 min',
                'icon': '🫁'
            }
        ]
    
    else:  # neutral, disgusted, or mixed emotions
        recommendations = [
            {
                'type': 'awareness',
                'title': 'Emotional Check-In',
                'description': 'Tune into how you\'re really feeling',
                'action': 'Spend a moment identifying your emotions',
                'duration': '3-5 min',
                'icon': '🎯'
            },
            {
                'type': 'engagement',
                'title': 'Gentle Activity',
                'description': 'Engage in something mildly pleasant',
                'action': 'Listen to music or look at nature',
                'duration': '10-15 min',
                'icon': '🎵'
            }
        ]
    
    # Adjust recommendations based on stability and wellness
    if stability_score < 0.4:  # Low stability - add stability-focused recommendations
        recommendations.insert(0, {
            'type': 'stability',
            'title': 'Build Routine',
            'description': 'Emotions seem fluctuating - establish grounding',
            'action': 'Create a simple 5-minute daily routine',
            'duration': '5 min',
            'icon': '⚖️'
        })
    
    if wellness_score < 0.3:  # Low wellness - prioritize basic self-care
        recommendations.insert(0, {
            'type': 'wellness',
            'title': 'Basic Self-Care',
            'description': 'Focus on fundamental needs first',
            'action': 'Ensure you\'re hydrated and have eaten',
            'duration': '5 min',
            'icon': '💚'
        })
    
    return recommendations[:4]  # Return top 4 recommendations

@ml_bp.route('/predict-mood', methods=['POST'])
@jwt_required()
def predict_mood():
    """Predict mood trends and provide recommendations"""
    try:
        user_id = get_jwt_identity()
        
        # Get emotion history
        emotions_history = get_user_emotion_history(user_id, days=7)
        
        if not emotions_history:
            return success_response({
                'prediction': {
                    'dominant_emotion': 'neutral',
                    'confidence': 0.0,
                    'trend': 'stable',
                    'wellness_score': 0.5,
                    'stability_score': 0.7
                },
                'recommendations': [
                    {
                        'type': 'start',
                        'title': 'Begin Your Journey',
                        'description': 'Start using the emotion detector to build insights',
                        'action': 'Use the Live Detection feature',
                        'duration': '2-3 min',
                        'icon': '🚀'
                    }
                ],
                'insights': ['Not enough data yet - start by using the emotion detector!']
            })
        
        # Calculate metrics
        dominant_emotion, confidence = analyzer.get_dominant_emotion_trend(emotions_history)
        wellness_score = analyzer.calculate_wellness_score(emotions_history)
        stability_score = analyzer.calculate_stability_score(emotions_history)
        
        # Determine trend
        if len(emotions_history) >= 5:
            recent_wellness = analyzer.calculate_wellness_score(emotions_history[-3:])
            earlier_wellness = analyzer.calculate_wellness_score(emotions_history[-6:-3])
            
            if recent_wellness > earlier_wellness + 0.1:
                trend = 'improving'
            elif recent_wellness < earlier_wellness - 0.1:
                trend = 'declining'
            else:
                trend = 'stable'
        else:
            trend = 'stable'
        
        # Generate recommendations
        recommendations = generate_intelligent_recommendations(
            dominant_emotion, confidence, wellness_score, stability_score
        )
        
        # Generate insights
        insights = []
        
        if confidence > 0.7:
            insights.append(f"Your emotions are clearly trending toward {dominant_emotion} feelings")
        elif confidence > 0.4:
            insights.append(f"You're experiencing moderate {dominant_emotion} emotions")
        else:
            insights.append("Your emotions are quite mixed - this is normal!")
        
        if stability_score > 0.7:
            insights.append("Your emotional state is quite stable")
        elif stability_score < 0.4:
            insights.append("Your emotions have been fluctuating - consider what might be causing changes")
        
        if wellness_score > 0.7:
            insights.append("Your overall emotional wellness looks positive")
        elif wellness_score < 0.3:
            insights.append("Consider focusing on self-care and support")
        
        prediction = {
            'dominant_emotion': dominant_emotion,
            'confidence': round(confidence, 2),
            'trend': trend,
            'wellness_score': round(wellness_score, 2),
            'stability_score': round(stability_score, 2)
        }
        
        return success_response({
            'prediction': prediction,
            'recommendations': recommendations,
            'insights': insights,
            'data_points': len(emotions_history)
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in mood prediction: {str(e)}")
        return error_response("Failed to predict mood", 500)

@ml_bp.route('/recommendations', methods=['POST', 'GET'])
@jwt_required()
def get_recommendations():
    """Get personalized recommendations based on current emotion state"""
    try:
        user_id = get_jwt_identity()
        
        if request.method == 'POST':
            data = request.get_json()
            current_emotions = data.get('emotions', {})
        else:  # GET method - use default emotions or recent history
            emotions_history = get_user_emotion_history(user_id, days=1)
            if emotions_history:
                current_emotions = emotions_history[-1]  # Most recent
            else:
                current_emotions = {'neutral': 0.7, 'happy': 0.3}  # Default
        
        if not current_emotions:
            return error_response("No emotion data provided", 400)
        
        # Get dominant emotion from current state
        dominant_emotion = max(current_emotions, key=current_emotions.get)
        confidence = current_emotions[dominant_emotion]
        
        # Get historical context
        emotions_history = get_user_emotion_history(user_id, days=3)
        
        # Calculate wellness and stability if we have history
        if emotions_history:
            wellness_score = analyzer.calculate_wellness_score(emotions_history + [current_emotions])
            stability_score = analyzer.calculate_stability_score(emotions_history + [current_emotions])
        else:
            wellness_score = 0.5
            stability_score = 0.7
        
        # Generate recommendations
        recommendations = generate_intelligent_recommendations(
            dominant_emotion, confidence, wellness_score, stability_score
        )
        
        return success_response({
            'recommendations': recommendations,
            'context': {
                'dominant_emotion': dominant_emotion,
                'confidence': round(confidence, 2),
                'wellness_score': round(wellness_score, 2),
                'stability_score': round(stability_score, 2)
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error generating recommendations: {str(e)}")
        return error_response("Failed to generate recommendations", 500)


