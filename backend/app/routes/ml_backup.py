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
os.makedirs(MODELS_DIR, exist_ok=True)

@ml_bp.route('/predict/mood', methods=['POST'])
@jwt_required()
def predict_mood():
    """Predict future mood based on historical patterns"""
    try:
        if not ML_AVAILABLE:
            return error_response('ML libraries not available. Install scikit-learn to use ML features.', 500)
            
        user_id_from_jwt = get_jwt_identity()
        if isinstance(user_id_from_jwt, str):
            user_id = int(user_id_from_jwt)
        else:
            user_id = user_id_from_jwt
            
        data = request.get_json()
        hours_ahead = data.get('hours_ahead', 24)  # Predict 24 hours ahead by default
        
        # Get historical data (last 30 days)
        start_date = datetime.now(UTC) - timedelta(days=30)
        records = EmotionRecord.query.filter(
            EmotionRecord.user_id == user_id,
            EmotionRecord.timestamp >= start_date
        ).order_by(EmotionRecord.timestamp).all()
        
        if len(records) < 10:
            return error_response('Insufficient data for prediction. Need at least 10 emotion records.', 400)
        
        # Prepare data for ML
        df_data = []
        for record in records:
            emotions = record.emotions_json
            df_data.append({
                'timestamp': record.timestamp,
                'hour': record.timestamp.hour,
                'day_of_week': record.timestamp.weekday(),
                'happy': emotions.get('happy', 0),
                'sad': emotions.get('sad', 0),
                'angry': emotions.get('angry', 0),
                'fearful': emotions.get('fearful', 0),
                'disgusted': emotions.get('disgusted', 0),
                'surprised': emotions.get('surprised', 0),
                'neutral': emotions.get('neutral', 0)
            })
        
        df = pd.DataFrame(df_data)
        
        # Feature engineering
        features = ['hour', 'day_of_week']
        emotions = ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral']
        
        # Create rolling averages
        for emotion in emotions:
            df[f'{emotion}_rolling_3'] = df[emotion].rolling(window=3, min_periods=1).mean()
            df[f'{emotion}_rolling_6'] = df[emotion].rolling(window=6, min_periods=1).mean()
        
        # Prepare features and targets
        feature_cols = features + [f'{e}_rolling_3' for e in emotions] + [f'{e}_rolling_6' for e in emotions]
        X = df[feature_cols].fillna(0)
        
        predictions = {}
        models = {}
        
        # Train models for each emotion
        for emotion in emotions:
            y = df[emotion]
            
            if len(X) > 5:  # Need minimum data for training
                try:
                    # Split data
                    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
                    
                    # Train Random Forest model
                    model = RandomForestRegressor(n_estimators=50, random_state=42)
                    model.fit(X_train, y_train)
                    
                    # Predict future emotion based on current patterns
                    current_time = datetime.now(UTC)
                    future_time = current_time + timedelta(hours=hours_ahead)
                    
                    # Get recent averages for rolling features
                    recent_emotions = df[emotions].tail(6).mean()
                    
                    future_features = pd.DataFrame({
                        'hour': [future_time.hour],
                        'day_of_week': [future_time.weekday()],
                        **{f'{e}_rolling_3': [recent_emotions[e]] for e in emotions},
                        **{f'{e}_rolling_6': [recent_emotions[e]] for e in emotions}
                    })
                    
                    prediction = model.predict(future_features)[0]
                    predictions[emotion] = max(0, min(1, prediction))  # Clamp between 0 and 1
                    models[emotion] = model
                    
                except Exception as e:
                    current_app.logger.warning(f"Failed to train model for {emotion}: {str(e)}")
                    predictions[emotion] = recent_emotions[emotion]
        
        # Calculate mood score and dominant predicted emotion
        if predictions:
            dominant_emotion = max(predictions, key=predictions.get)
            mood_score = predictions.get('happy', 0) - predictions.get('sad', 0) - predictions.get('angry', 0)
            mood_score = max(-1, min(1, mood_score))  # Normalize between -1 and 1
        else:
            dominant_emotion = 'neutral'
            mood_score = 0
        
        # Generate mood description
        if mood_score > 0.3:
            mood_description = 'positive'
        elif mood_score < -0.3:
            mood_description = 'negative'
        else:
            mood_description = 'neutral'
        
        return success_response('Mood prediction completed successfully', {
            'predictions': predictions,
            'dominant_emotion': dominant_emotion,
            'mood_score': round(mood_score, 3),
            'mood_description': mood_description,
            'prediction_time': future_time.isoformat(),
            'confidence': 0.7 if len(records) > 50 else 0.5  # Higher confidence with more data
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in mood prediction: {str(e)}", exc_info=True)
        return error_response(f'Failed to predict mood: {str(e)}', 500)

@ml_bp.route('/analyze/stress', methods=['GET'])
@jwt_required()
def analyze_stress_levels():
    """Analyze stress levels from emotion patterns"""
    try:
        user_id_from_jwt = get_jwt_identity()
        if isinstance(user_id_from_jwt, str):
            user_id = int(user_id_from_jwt)
        else:
            user_id = user_id_from_jwt
            
        days = request.args.get('days', 7, type=int)
        start_date = datetime.now(UTC) - timedelta(days=days)
        
        records = EmotionRecord.query.filter(
            EmotionRecord.user_id == user_id,
            EmotionRecord.timestamp >= start_date
        ).order_by(EmotionRecord.timestamp).all()
        
        if not records:
            return error_response('No emotion data available for stress analysis', 400)
        
        stress_data = []
        hourly_stress = defaultdict(list)
        
        for record in records:
            emotions = record.emotions_json
            
            # Calculate stress score based on emotion combination
            # Higher stress = more angry, fearful, disgusted, sad; less happy
            stress_score = (
                emotions.get('angry', 0) * 0.3 +
                emotions.get('fearful', 0) * 0.3 +
                emotions.get('disgusted', 0) * 0.2 +
                emotions.get('sad', 0) * 0.2 -
                emotions.get('happy', 0) * 0.1
            )
            stress_score = max(0, min(1, stress_score))  # Clamp between 0 and 1
            
            stress_data.append({
                'timestamp': record.timestamp.isoformat(),
                'stress_level': round(stress_score, 3),
                'dominant_emotion': record.get_dominant_emotion()
            })
            
            # Group by hour for patterns
            hour = record.timestamp.hour
            hourly_stress[hour].append(stress_score)
        
        # Calculate overall stress metrics
        stress_levels = [item['stress_level'] for item in stress_data]
        avg_stress = sum(stress_levels) / len(stress_levels)
        max_stress = max(stress_levels)
        
        # Find peak stress hours
        peak_hours = []
        for hour, values in hourly_stress.items():
            if values:
                avg_hour_stress = sum(values) / len(values)
                if avg_hour_stress > avg_stress * 1.2:  # 20% above average
                    peak_hours.append({
                        'hour': hour,
                        'avg_stress': round(avg_hour_stress, 3)
                    })
        
        # Stress level categorization
        if avg_stress < 0.3:
            stress_category = 'low'
        elif avg_stress < 0.6:
            stress_category = 'moderate'
        else:
            stress_category = 'high'
        
        return success_response('Stress analysis completed successfully', {
            'overall_metrics': {
                'average_stress': round(avg_stress, 3),
                'max_stress': round(max_stress, 3),
                'stress_category': stress_category
            },
            'stress_timeline': stress_data,
            'peak_stress_hours': sorted(peak_hours, key=lambda x: x['avg_stress'], reverse=True)[:5],
            'analysis_period_days': days
        })
        
    except Exception as e:
        return error_response(f'Failed to analyze stress levels: {str(e)}', 500)

@ml_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_personalized_recommendations():
    """Get personalized recommendations based on current mood and patterns"""
    try:
        user_id_from_jwt = get_jwt_identity()
        if isinstance(user_id_from_jwt, str):
            user_id = int(user_id_from_jwt)
        else:
            user_id = user_id_from_jwt
            
        # Get recent emotion data (last 24 hours)
        start_date = datetime.now(UTC) - timedelta(hours=24)
        recent_records = EmotionRecord.query.filter(
            EmotionRecord.user_id == user_id,
            EmotionRecord.timestamp >= start_date
        ).order_by(EmotionRecord.timestamp.desc()).limit(10).all()
        
        if not recent_records:
            return success_response('No recent data for recommendations', {
                'recommendations': get_default_recommendations(),
                'reason': 'default_recommendations'
            })
        
        # Calculate current mood state
        recent_emotions = defaultdict(list)
        for record in recent_records:
            emotions = record.emotions_json
            for emotion, value in emotions.items():
                recent_emotions[emotion].append(value)
        
        # Average recent emotions
        avg_emotions = {}
        for emotion, values in recent_emotions.items():
            avg_emotions[emotion] = sum(values) / len(values)
        
        dominant_emotion = max(avg_emotions, key=avg_emotions.get)
        
        # Calculate stress level
        stress_score = (
            avg_emotions.get('angry', 0) * 0.3 +
            avg_emotions.get('fearful', 0) * 0.3 +
            avg_emotions.get('disgusted', 0) * 0.2 +
            avg_emotions.get('sad', 0) * 0.2
        )
        
        recommendations = []
        
        # Music recommendations
        music_recs = get_music_recommendations(dominant_emotion, avg_emotions)
        recommendations.extend(music_recs)
        
        # Activity recommendations
        activity_recs = get_activity_recommendations(dominant_emotion, stress_score)
        recommendations.extend(activity_recs)
        
        # Wellness tips
        wellness_recs = get_wellness_recommendations(avg_emotions, stress_score)
        recommendations.extend(wellness_recs)
        
        # Breathing exercises for high stress
        if stress_score > 0.6:
            breathing_recs = get_breathing_exercises()
            recommendations.extend(breathing_recs)
        
        return success_response('Personalized recommendations generated successfully', {
            'current_mood': {
                'dominant_emotion': dominant_emotion,
                'emotions': {k: round(v, 3) for k, v in avg_emotions.items()},
                'stress_level': round(stress_score, 3)
            },
            'recommendations': recommendations[:8]  # Limit to 8 recommendations
        })
        
    except Exception as e:
        return error_response(f'Failed to generate recommendations: {str(e)}', 500)

def get_music_recommendations(dominant_emotion, emotions):
    """Get music recommendations based on mood"""
    music_db = {
        'happy': [
            {'type': 'music', 'title': 'Uplifting Background Music', 'description': 'Light, positive instrumental music', 'genre': 'Instrumental', 'mood': 'uplifting'},
            {'type': 'music', 'title': 'Motivational Sounds', 'description': 'Energizing background music for productivity', 'genre': 'Electronic', 'mood': 'energetic'}
        ],
        'sad': [
            {'type': 'music', 'title': 'Calming Instrumentals', 'description': 'Peaceful piano and ambient sounds', 'genre': 'Ambient', 'mood': 'soothing'},
            {'type': 'music', 'title': 'Nature & Rain Sounds', 'description': 'Natural soundscapes for relaxation', 'genre': 'Nature', 'mood': 'peaceful'}
        ],
        'angry': [
            {'type': 'music', 'title': 'Deep Breathing Sounds', 'description': 'Guided breathing with soft background music', 'genre': 'Meditation', 'mood': 'calming'},
            {'type': 'music', 'title': 'Soft Classical', 'description': 'Gentle classical pieces to restore calm', 'genre': 'Classical', 'mood': 'relaxing'}
        ],
        'fearful': [
            {'type': 'music', 'title': 'Grounding Meditation Music', 'description': 'Stable, reassuring instrumental sounds', 'genre': 'Meditation', 'mood': 'grounding'},
            {'type': 'music', 'title': 'Gentle Background Tones', 'description': 'Soft, consistent ambient music', 'genre': 'Ambient', 'mood': 'safe'}
        ],
        'neutral': [
            {'type': 'music', 'title': 'Focus Background Music', 'description': 'Non-distracting ambient sounds', 'genre': 'Lo-fi', 'mood': 'focused'},
            {'type': 'music', 'title': 'Light Instrumental', 'description': 'Pleasant background music', 'genre': 'Instrumental', 'mood': 'neutral'}
        ]
    }
    
    return music_db.get(dominant_emotion, music_db['neutral'])

def get_activity_recommendations(dominant_emotion, stress_level):
    """Get activity recommendations based on mood and stress"""
    activities = []
    
    if stress_level > 0.6:  # High stress
        activities.extend([
            {'type': 'activity', 'title': 'Take slow, deep breaths', 'description': 'Focus on your breathing for a few minutes', 'duration': '3 min'},
            {'type': 'activity', 'title': 'Step away from screen', 'description': 'Give your eyes and mind a brief rest', 'duration': '5 min'}
        ])
    elif dominant_emotion == 'sad':
        activities.extend([
            {'type': 'activity', 'title': 'Gentle self-care', 'description': 'Take a warm bath, read a book, or practice self-compassion', 'duration': '20 min'},
            {'type': 'activity', 'title': 'Light physical movement', 'description': 'Try gentle stretching or a short walk if you feel up to it', 'duration': '10 min'}
        ])
    elif dominant_emotion == 'angry':
        activities.extend([
            {'type': 'activity', 'title': 'Progressive muscle relaxation', 'description': 'Tense and release muscle groups to reduce physical tension', 'duration': '10 min'},
            {'type': 'activity', 'title': 'Write down your thoughts', 'description': 'Express your feelings through journaling', 'duration': '15 min'}
        ])
    elif dominant_emotion == 'happy':
        activities.extend([
            {'type': 'activity', 'title': 'Savor the moment', 'description': 'Take time to appreciate and remember this positive feeling', 'duration': '5 min'},
            {'type': 'activity', 'title': 'Creative expression', 'description': 'Channel positive energy into art, music, or writing', 'duration': '20 min'}
        ])
    else:  # Neutral or other emotions
        activities.extend([
            {'type': 'activity', 'title': 'Mindful observation', 'description': 'Notice your current environment and sensations', 'duration': '5 min'},
            {'type': 'activity', 'title': 'Set a small intention', 'description': 'Choose one positive thing to focus on for the rest of your day', 'duration': '2 min'}
        ])
    
    return activities

def get_wellness_recommendations(emotions, stress_level):
    """Get wellness tips based on emotional patterns"""
    tips = []
    
    if stress_level > 0.5:
        tips.append({
            'type': 'wellness',
            'title': 'Grounding Technique',
            'description': 'Notice 5 things you can see, 4 you can hear, 3 you can feel, 2 you can smell, 1 you can taste',
            'category': 'mindfulness'
        })
    
    if emotions.get('sad', 0) > 0.4:
        tips.append({
            'type': 'wellness',
            'title': 'Gentle Reminder',
            'description': 'This feeling is temporary. You\'ve gotten through difficult times before',
            'category': 'self_compassion'
        })
    
    if emotions.get('happy', 0) < 0.3:  # Low happiness
        tips.append({
            'type': 'wellness',
            'title': 'Small Appreciation',
            'description': 'Notice one small thing in your environment that brings you even a tiny bit of comfort',
            'category': 'awareness'
        })
    
    # Always include a general wellness tip
    tips.append({
        'type': 'wellness',
        'title': 'Emotional Awareness',
        'description': 'Acknowledging your emotions without judgment is the first step to understanding yourself',
        'category': 'mindfulness'
    })
    
    return tips

def get_breathing_exercises():
    """Get breathing exercises for stress relief"""
    return [
        {
            'type': 'breathing',
            'title': 'Simple Deep Breathing',
            'description': 'Breathe in slowly for 4 counts, pause, then breathe out slowly for 6 counts',
            'duration': '2 min',
            'technique': 'simple'
        },
        {
            'type': 'breathing',
            'title': 'Natural Breathing Awareness',
            'description': 'Simply notice your natural breath without trying to change it',
            'duration': '3 min',
            'technique': 'awareness'
        }
    ]

def get_default_recommendations():
    """Get default recommendations when no data is available"""
    return [
        {'type': 'wellness', 'title': 'Welcome to Emotion Tracking', 'description': 'This system helps you become more aware of your emotional patterns', 'category': 'introduction'},
        {'type': 'activity', 'title': 'Start with a few deep breaths', 'description': 'Take a moment to center yourself before beginning', 'duration': '1 min'},
        {'type': 'music', 'title': 'Ambient Background Sounds', 'description': 'Gentle environmental sounds for focus and calm', 'genre': 'Ambient'}
    ]

@ml_bp.route('/anomaly-detection', methods=['GET'])
@jwt_required()
def detect_anomalies():
    """Detect unusual emotional patterns"""
    try:
        if not ML_AVAILABLE:
            return error_response('ML libraries not available. Install scikit-learn to use anomaly detection.', 500)
            
        user_id_from_jwt = get_jwt_identity()
        if isinstance(user_id_from_jwt, str):
            user_id = int(user_id_from_jwt)
        else:
            user_id = user_id_from_jwt
            
        days = request.args.get('days', 14, type=int)
        start_date = datetime.now(UTC) - timedelta(days=days)
        
        records = EmotionRecord.query.filter(
            EmotionRecord.user_id == user_id,
            EmotionRecord.timestamp >= start_date
        ).order_by(EmotionRecord.timestamp).all()
        
        if len(records) < 20:
            return error_response('Insufficient data for anomaly detection. Need at least 20 records.', 400)
        
        # Prepare data
        emotions_data = []
        for record in records:
            emotions = record.emotions_json
            emotions_data.append([
                emotions.get('happy', 0),
                emotions.get('sad', 0),
                emotions.get('angry', 0),
                emotions.get('fearful', 0),
                emotions.get('disgusted', 0),
                emotions.get('surprised', 0),
                emotions.get('neutral', 0)
            ])
        
        # Use Isolation Forest for anomaly detection
        X = np.array(emotions_data)
        iso_forest = IsolationForest(contamination=0.1, random_state=42)
        anomalies = iso_forest.fit_predict(X)
        
        # Get anomalous records
        anomalous_records = []
        for i, is_anomaly in enumerate(anomalies):
            if is_anomaly == -1:  # -1 indicates anomaly
                record = records[i]
                emotions = record.emotions_json
                anomalous_records.append({
                    'timestamp': record.timestamp.isoformat(),
                    'emotions': emotions,
                    'dominant_emotion': record.get_dominant_emotion(),
                    'anomaly_score': abs(iso_forest.score_samples([emotions_data[i]])[0])
                })
        
        return success_response('Anomaly detection completed successfully', {
            'anomalies_found': len(anomalous_records),
            'anomalous_records': sorted(anomalous_records, key=lambda x: x['anomaly_score'], reverse=True)[:10],
            'total_records_analyzed': len(records)
        })
        
    except Exception as e:
        return error_response(f'Failed to detect anomalies: {str(e)}', 500)
