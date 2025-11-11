from flask import Blueprint, jsonify, request, current_app, send_file, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.emotion import EmotionRecord, EmotionSession
from app.utils.responses import success_response, error_response
from datetime import datetime, timedelta, UTC
from sqlalchemy import func, desc
from collections import defaultdict
import io
import csv

# Import ML recommendations function
try:
    from app.routes.ml import generate_intelligent_recommendations
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_analytics_summary():
    """Get analytics summary for the authenticated user"""
    try:
        current_app.logger.info("[ANALYTICS] Summary endpoint called")
        print(f"[DEBUG] Analytics summary endpoint called", flush=True)
        
        # Get current user ID from JWT (handle both string and int for backward compatibility)
        user_id_from_jwt = get_jwt_identity()
        if isinstance(user_id_from_jwt, str):
            user_id = int(user_id_from_jwt)  # Convert string back to int
        else:
            user_id = user_id_from_jwt  # Already an integer (old token)
            
        current_app.logger.info(f"[ANALYTICS] User ID from JWT: {user_id} (original: {user_id_from_jwt}, type: {type(user_id)})")
        print(f"[DEBUG] User ID from JWT: {user_id} (original: {user_id_from_jwt}, type: {type(user_id)})", flush=True)
        
        # Validate user exists
        user = User.query.get(user_id)
        if not user:
            current_app.logger.error(f"[ANALYTICS] User not found for ID: {user_id}")
            print(f"[DEBUG] User not found for ID: {user_id}", flush=True)
            return error_response('User not found', 404)
        
        current_app.logger.info(f"[ANALYTICS] Found user: {user.username} (ID: {user.id})")
        print(f"[DEBUG] Found user: {user.username} (ID: {user.id})", flush=True)
        
        # Get days parameter
        days = request.args.get('days', 7)
        try:
            days = int(days)
            if days <= 0:
                return error_response('Days must be a positive integer', 400)
        except ValueError:
            return error_response('Invalid days parameter', 400)
        
        current_app.logger.info(f"[ANALYTICS] Date range: {days} days")
        print(f"[DEBUG] Date range: {days} days", flush=True)
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        current_app.logger.info(f"[ANALYTICS] Date range: {start_date} to {end_date}")
        print(f"[DEBUG] Date range: {start_date} to {end_date}", flush=True)
        
        # Get total detections in date range
        total_detections = EmotionRecord.query.filter(
            EmotionRecord.user_id == user_id,
            EmotionRecord.timestamp >= start_date,
            EmotionRecord.timestamp <= end_date
        ).count()
        
        # Get session count in date range
        session_count = EmotionSession.query.filter(
            EmotionSession.user_id == user_id,
            EmotionSession.start_time >= start_date,
            EmotionSession.start_time <= end_date
        ).count()
        
        # Get all emotions in date range for average calculation
        emotions_in_range = EmotionRecord.query.filter(
            EmotionRecord.user_id == user_id,
            EmotionRecord.timestamp >= start_date,
            EmotionRecord.timestamp <= end_date
        ).all()
        
        # Calculate average emotions
        if emotions_in_range:
            emotion_sums = defaultdict(float)
            emotion_keys = ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral']
            
            for record in emotions_in_range:
                # Safely get emotions from JSON
                if record.emotions_json:
                    for emotion in emotion_keys:
                        emotion_sums[emotion] += record.emotions_json.get(emotion, 0)
            
            # Calculate averages, avoiding division by zero
            if len(emotions_in_range) > 0:
                average_emotions = {
                    emotion: emotion_sums[emotion] / len(emotions_in_range)
                    for emotion in emotion_keys
                }
                
                # Find dominant emotion (avoid max on empty dict)
                if any(average_emotions.values()):
                    dominant_emotion = max(average_emotions, key=average_emotions.get)
                else:
                    dominant_emotion = 'neutral'
            else:
                average_emotions = {
                    'happy': 0, 'sad': 0, 'angry': 0, 'fearful': 0,
                    'disgusted': 0, 'surprised': 0, 'neutral': 0
                }
                dominant_emotion = 'neutral'
        else:
            average_emotions = {
                'happy': 0, 'sad': 0, 'angry': 0, 'fearful': 0,
                'disgusted': 0, 'surprised': 0, 'neutral': 0
            }
            dominant_emotion = 'neutral'
        
        summary_data = {
            'total_detections': total_detections,
            'average_emotions': average_emotions,
            'dominant_emotion': dominant_emotion,
            'session_count': session_count,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            }
        }
        
        return success_response(
            'Emotion summary retrieved successfully',
            summary_data
        )
        
    except Exception as e:
        current_app.logger.error(f"[ANALYTICS] Error in get_analytics_summary: {str(e)}", exc_info=True)
        print(f"[DEBUG] Error in get_analytics_summary: {str(e)}", flush=True)
        return error_response(f'Failed to get emotion summary: {str(e)}', 500)

@analytics_bp.route('/trends', methods=['GET'])
@jwt_required()
def get_emotion_trends():
    """Get emotion trends over time"""
    try:
        # Get current user ID from JWT (handle both string and int for backward compatibility)
        user_id_from_jwt = get_jwt_identity()
        if isinstance(user_id_from_jwt, str):
            user_id = int(user_id_from_jwt)  # Convert string back to int
        else:
            user_id = user_id_from_jwt  # Already an integer (old token)
            
        days = request.args.get('days', 30, type=int)
        
        # Calculate date range
        end_date = datetime.now(UTC).date()
        start_date = end_date - timedelta(days=days)
        
        # Get emotions grouped by date
        trends_data = []
        emotion_keys = ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral']
        
        for i in range(days + 1):
            current_date = start_date + timedelta(days=i)
            next_date = current_date + timedelta(days=1)
            
            # Get emotions for this day
            day_emotions = EmotionRecord.query.filter(
                EmotionRecord.user_id == user_id,
                EmotionRecord.timestamp >= datetime.combine(current_date, datetime.min.time()),
                EmotionRecord.timestamp < datetime.combine(next_date, datetime.min.time())
            ).all()
            
            # Calculate average emotions for the day
            if day_emotions:
                emotion_sums = defaultdict(float)
                for record in day_emotions:
                    for emotion in emotion_keys:
                        emotion_sums[emotion] += record.emotions_json.get(emotion, 0)
                
                day_averages = {
                    emotion: emotion_sums[emotion] / len(day_emotions)
                    for emotion in emotion_keys
                }
            else:
                day_averages = {emotion: 0 for emotion in emotion_keys}
            
            trends_data.append({
                'date': current_date.isoformat(),
                'emotions': day_averages
            })
        
        return success_response(
            'Emotion trends retrieved successfully',
            trends_data
        )
        
    except Exception as e:
        return error_response(f'Failed to get emotion trends: {str(e)}', 500)

@analytics_bp.route('/daily', methods=['GET'])
def get_daily_stats():
    """Get daily statistics"""
    try:
        # Check JWT manually first
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request()
        
        # Get current user ID from JWT (handle both string and int for backward compatibility)
        user_id_from_jwt = get_jwt_identity()
        if isinstance(user_id_from_jwt, str):
            user_id = int(user_id_from_jwt)  # Convert string back to int
        else:
            user_id = user_id_from_jwt  # Already an integer (old token)
            
        days = request.args.get('days', 14, type=int)
        
        # Calculate date range
        end_date = datetime.now(UTC).date()
        start_date = end_date - timedelta(days=days)
        
        daily_stats = []
        
        for i in range(days + 1):
            current_date = start_date + timedelta(days=i)
            next_date = current_date + timedelta(days=1)
            
            # Get records for this day
            day_records = EmotionRecord.query.filter(
                EmotionRecord.user_id == user_id,
                EmotionRecord.timestamp >= datetime.combine(current_date, datetime.min.time()),
                EmotionRecord.timestamp < datetime.combine(next_date, datetime.min.time())
            ).all()
            
            # Get sessions for this day
            day_sessions = EmotionSession.query.filter(
                EmotionSession.user_id == user_id,
                EmotionSession.start_time >= datetime.combine(current_date, datetime.min.time()),
                EmotionSession.start_time < datetime.combine(next_date, datetime.min.time())
            ).count()
            
            # Calculate stats
            detections = len(day_records)
            
            if day_records:
                # Find dominant emotion for the day
                emotion_sums = defaultdict(float)
                confidence_sum = 0
                
                for record in day_records:
                    dominant = record.get_dominant_emotion()
                    emotion_sums[dominant] += 1
                    
                    # Calculate average confidence
                    max_confidence = max(record.confidence_scores.values())
                    confidence_sum += max_confidence
                
                dominant_emotion = max(emotion_sums, key=emotion_sums.get)
                average_confidence = confidence_sum / len(day_records)
            else:
                dominant_emotion = 'neutral'
                average_confidence = 0
            
            daily_stats.append({
                'date': current_date.isoformat(),
                'detections': detections,
                'sessions': day_sessions,
                'dominant_emotion': dominant_emotion,
                'average_confidence': round(average_confidence, 3)
            })
        
        return success_response(
            'Daily statistics retrieved successfully',
            daily_stats
        )
        
    except Exception as e:
        return error_response(f'Failed to get daily statistics: {str(e)}', 500)

@analytics_bp.route('/distribution', methods=['GET'])
def get_emotion_distribution():
    """Get emotion distribution"""
    try:
        # Check JWT manually first
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request()
        
        # Get current user ID from JWT (handle both string and int for backward compatibility)
        user_id_from_jwt = get_jwt_identity()
        if isinstance(user_id_from_jwt, str):
            user_id = int(user_id_from_jwt)  # Convert string back to int
        else:
            user_id = user_id_from_jwt  # Already an integer (old token)
        days = request.args.get('days', 30, type=int)
        
        # Calculate date range
        end_date = datetime.now(UTC)
        start_date = end_date - timedelta(days=days)
        
        # Get all emotions in date range
        emotions_in_range = EmotionRecord.query.filter(
            EmotionRecord.user_id == user_id,
            EmotionRecord.timestamp >= start_date,
            EmotionRecord.timestamp <= end_date
        ).all()
        
        # Count occurrences of each dominant emotion
        distribution = defaultdict(int)
        
        for record in emotions_in_range:
            dominant_emotion = record.get_dominant_emotion()
            distribution[dominant_emotion] += 1
        
        # Convert to regular dict for JSON serialization
        distribution_dict = dict(distribution)
        
        return success_response(
            'Emotion distribution retrieved successfully',
            distribution_dict
        )
        
    except Exception as e:
        return error_response(f'Failed to get emotion distribution: {str(e)}', 500)

@analytics_bp.route('/patterns/detailed', methods=['GET'])
@jwt_required()
def get_emotion_patterns():
    """Get emotion patterns by hour and day of week"""
    try:
        user_id_from_jwt = get_jwt_identity()
        if isinstance(user_id_from_jwt, str):
            user_id = int(user_id_from_jwt)
        else:
            user_id = user_id_from_jwt
            
        days = request.args.get('days', 30, type=int)
        start_date = datetime.now(UTC) - timedelta(days=days)
        
        records = EmotionRecord.query.filter(
            EmotionRecord.user_id == user_id,
            EmotionRecord.timestamp >= start_date
        ).all()
        
        # Patterns by hour of day (0-23)
        hour_patterns = defaultdict(lambda: defaultdict(list))
        # Patterns by day of week (0=Monday, 6=Sunday)
        day_patterns = defaultdict(lambda: defaultdict(list))
        
        for record in records:
            emotions = record.emotions_json
            hour = record.timestamp.hour
            day_of_week = record.timestamp.weekday()
            
            for emotion, value in emotions.items():
                hour_patterns[hour][emotion].append(value)
                day_patterns[day_of_week][emotion].append(value)
        
        # Calculate averages
        hour_data = []
        for hour in range(24):
            hour_info = {'hour': hour}
            for emotion in ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral']:
                values = hour_patterns[hour][emotion]
                hour_info[emotion] = round(sum(values) / len(values), 3) if values else 0
            hour_data.append(hour_info)
        
        day_data = []
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        for day in range(7):
            day_info = {'day': day_names[day], 'day_num': day}
            for emotion in ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral']:
                values = day_patterns[day][emotion]
                day_info[emotion] = round(sum(values) / len(values), 3) if values else 0
            day_data.append(day_info)
        
        return success_response('Emotion patterns retrieved successfully', {
            'hourly_patterns': hour_data,
            'daily_patterns': day_data,
            'analysis_period_days': days
        })
        
    except Exception as e:
        return error_response(f'Failed to get emotion patterns: {str(e)}', 500)

@analytics_bp.route('/peaks', methods=['GET'])
@jwt_required()
def get_emotion_peaks():
    """Detect peak emotions and unusual patterns"""
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
            return success_response('No data available for peak analysis', {'peaks': [], 'anomalies': []})
        
        peaks = []
        anomalies = []
        
        # Calculate baseline averages
        emotion_baselines = defaultdict(list)
        for record in records:
            emotions = record.emotions_json
            for emotion, value in emotions.items():
                emotion_baselines[emotion].append(value)
        
        baselines = {}
        for emotion, values in emotion_baselines.items():
            baselines[emotion] = sum(values) / len(values)
        
        # Find peaks (values significantly above baseline)
        threshold_multiplier = 1.5
        
        for record in records:
            emotions = record.emotions_json
            for emotion, value in emotions.items():
                if value > baselines[emotion] * threshold_multiplier and value > 0.7:
                    peaks.append({
                        'timestamp': record.timestamp.isoformat(),
                        'emotion': emotion,
                        'value': round(value, 3),
                        'baseline': round(baselines[emotion], 3),
                        'intensity': round(value / baselines[emotion], 2) if baselines[emotion] > 0 else 1
                    })
                
                # Detect anomalies (very high values)
                if value > 0.9:
                    anomalies.append({
                        'timestamp': record.timestamp.isoformat(),
                        'emotion': emotion,
                        'value': round(value, 3),
                        'type': 'high_intensity'
                    })
        
        # Sort by intensity
        peaks.sort(key=lambda x: x['intensity'], reverse=True)
        
        return success_response('Emotion peaks and anomalies detected successfully', {
            'peaks': peaks[:20],  # Top 20 peaks
            'anomalies': anomalies[-10:],  # Recent 10 anomalies
            'baselines': {k: round(v, 3) for k, v in baselines.items()}
        })
        
    except Exception as e:
        return error_response(f'Failed to detect emotion peaks: {str(e)}', 500)

@analytics_bp.route('/export', methods=['GET'])
@jwt_required()
def export_data():
    """Export emotion data in various formats (CSV or PDF)"""
    try:
        user_id_from_jwt = get_jwt_identity()
        if isinstance(user_id_from_jwt, str):
            user_id = int(user_id_from_jwt)
        else:
            user_id = user_id_from_jwt
            
        # Get parameters from query string
        export_format = request.args.get('format', 'csv')  # csv or pdf
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        print(f"[EXPORT DEBUG] Format: {export_format}, Start: {start_date_str}, End: {end_date_str}")
        
        # Parse dates if provided
        if start_date_str and end_date_str:
            try:
                # Handle YYYY-MM-DD format (from frontend)
                if 'T' not in start_date_str:
                    start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0, tzinfo=UTC)
                    end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59, tzinfo=UTC)
                else:
                    # Handle ISO format with time
                    start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                    end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
            except Exception as date_error:
                print(f"[EXPORT ERROR] Date parsing failed: {date_error}")
                return error_response(f'Invalid date format: {str(date_error)}', 400)
        else:
            end_date = datetime.now(UTC)
            start_date = end_date - timedelta(days=30)
        
        print(f"[EXPORT DEBUG] Parsed dates - Start: {start_date}, End: {end_date}")
        
        # Fetch records
        records = EmotionRecord.query.filter(
            EmotionRecord.user_id == user_id,
            EmotionRecord.timestamp >= start_date,
            EmotionRecord.timestamp <= end_date
        ).order_by(EmotionRecord.timestamp).all()
        
        print(f"[EXPORT DEBUG] Found {len(records)} records")
        
        if not records:
            return error_response('No data available for export in the selected date range', 404)
        
        # Prepare data
        export_data = []
        for record in records:
            emotions = record.emotions_json
            row = {
                'Timestamp': record.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'Session ID': record.session_id,
                'Happy': round(float(emotions.get('happy', 0)), 4),
                'Sad': round(float(emotions.get('sad', 0)), 4),
                'Angry': round(float(emotions.get('angry', 0)), 4),
                'Fearful': round(float(emotions.get('fearful', 0)), 4),
                'Disgusted': round(float(emotions.get('disgusted', 0)), 4),
                'Surprised': round(float(emotions.get('surprised', 0)), 4),
                'Neutral': round(float(emotions.get('neutral', 0)), 4)
            }
            export_data.append(row)
        
        if export_format == 'csv':
            print("[EXPORT DEBUG] Generating CSV...")
            # Generate CSV file
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=export_data[0].keys())
            writer.writeheader()
            writer.writerows(export_data)
            
            # Create response
            csv_data = output.getvalue()
            output.close()
            
            response = make_response(csv_data)
            response.headers['Content-Type'] = 'text/csv'
            response.headers['Content-Disposition'] = f'attachment; filename=emotions_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
            print("[EXPORT DEBUG] CSV generated successfully")
            return response
            
        elif export_format == 'pdf':
            print("[EXPORT DEBUG] Generating PDF...")
            # Generate PDF file
            try:
                from reportlab.lib.pagesizes import letter
                from reportlab.lib import colors
                from reportlab.lib.styles import getSampleStyleSheet
                from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
                from reportlab.lib.units import inch
                
                print("[EXPORT DEBUG] Reportlab imported successfully")
                
                # Create PDF in memory
                buffer = io.BytesIO()
                doc = SimpleDocTemplate(buffer, pagesize=letter)
                elements = []
                
                # Add title
                styles = getSampleStyleSheet()
                title = Paragraph('<b>Emotion Analytics Report</b>', styles['Title'])
                elements.append(title)
                elements.append(Spacer(1, 0.25 * inch))
                
                # Add date range
                date_range_text = f"Period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
                elements.append(Paragraph(date_range_text, styles['Normal']))
                elements.append(Spacer(1, 0.25 * inch))
                
                # Prepare table data (convert values to strings to avoid formatting issues)
                table_data = [list(export_data[0].keys())]
                for row in export_data[:100]:  # Limit to first 100 records for PDF
                    table_data.append([str(val) for val in row.values()])
                
                print(f"[EXPORT DEBUG] Table data prepared, rows: {len(table_data)}")
                
                # Create table with smaller font and adjusted column widths
                col_widths = [1.5*inch, 1.5*inch] + [0.6*inch] * 7  # Timestamp, Session, Emotions
                table = Table(table_data, colWidths=col_widths, repeatRows=1)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('FONTSIZE', (0, 1), (-1, -1), 7),
                    ('TOPPADDING', (0, 1), (-1, -1), 3),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 3),
                ]))
                
                elements.append(table)
                
                if len(export_data) > 100:
                    elements.append(Spacer(1, 0.25 * inch))
                    note = Paragraph(f'<i>Note: Showing first 100 of {len(export_data)} records</i>', styles['Normal'])
                    elements.append(note)
                
                # Build PDF
                print("[EXPORT DEBUG] Building PDF document...")
                doc.build(elements)
                buffer.seek(0)
                
                print("[EXPORT DEBUG] PDF generated successfully")
                return send_file(
                    buffer,
                    mimetype='application/pdf',
                    as_attachment=True,
                    download_name=f'emotions_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
                )
                
            except ImportError as import_error:
                print(f"[EXPORT ERROR] Import error: {import_error}")
                return error_response('PDF export requires reportlab library. Please contact administrator.', 500)
            except Exception as pdf_error:
                print(f"[EXPORT ERROR] PDF generation failed: {pdf_error}")
                import traceback
                traceback.print_exc()
                return error_response(f'PDF generation failed: {str(pdf_error)}', 500)
        
        return error_response('Invalid format. Use csv or pdf', 400)
        
    except Exception as e:
        print(f"[EXPORT ERROR] General error: {e}")
        import traceback
        traceback.print_exc()
        return error_response(f'Failed to export data: {str(e)}', 500)

@analytics_bp.route('/patterns', methods=['GET'])
@jwt_required()
def get_pattern_analysis():
    """Get advanced pattern analysis for the authenticated user"""
    try:
        user_id_from_jwt = get_jwt_identity()
        if isinstance(user_id_from_jwt, str):
            user_id = int(user_id_from_jwt)
        else:
            user_id = user_id_from_jwt
        
        # Get recent emotion records for pattern analysis
        end_date = datetime.now(UTC)
        start_date = end_date - timedelta(days=30)  # Last 30 days
        
        records = EmotionRecord.query.filter(
            EmotionRecord.user_id == user_id,
            EmotionRecord.timestamp >= start_date,
            EmotionRecord.timestamp <= end_date
        ).all()
        
        if not records:
            return success_response('Pattern analysis completed', {
                'peakEmotionHours': [],
                'emotionCorrelations': {},
                'stressLevels': {'low': 33.3, 'medium': 33.3, 'high': 33.3}
            })
        
        # Analyze peak emotion hours
        hour_activity = defaultdict(int)
        for record in records:
            hour = record.timestamp.hour
            hour_activity[hour] += 1
        
        # Get top 3 peak hours
        peak_hours = sorted(hour_activity.items(), key=lambda x: x[1], reverse=True)[:3]
        peak_emotion_hours = [str(hour) for hour, count in peak_hours]
        
        # Calculate stress levels based on emotion patterns
        total_records = len(records)
        stress_emotions = ['angry', 'fearful', 'disgusted', 'sad']
        neutral_emotions = ['neutral', 'surprised']
        positive_emotions = ['happy']
        
        high_stress_count = 0
        medium_stress_count = 0
        low_stress_count = 0
        
        for record in records:
            emotions = record.emotions_json or {}
            max_emotion = max(emotions.items(), key=lambda x: x[1]) if emotions else ('neutral', 0)
            emotion_name = max_emotion[0]
            
            if emotion_name in stress_emotions:
                high_stress_count += 1
            elif emotion_name in positive_emotions:
                low_stress_count += 1
            else:
                medium_stress_count += 1
        
        stress_levels = {
            'low': (low_stress_count / total_records) * 100 if total_records > 0 else 33.3,
            'medium': (medium_stress_count / total_records) * 100 if total_records > 0 else 33.3,
            'high': (high_stress_count / total_records) * 100 if total_records > 0 else 33.3
        }
        
        # Simple emotion correlations (placeholder for more advanced ML)
        emotion_correlations = {}
        if records:
            emotion_sums = defaultdict(float)
            for record in records:
                emotions = record.emotions_json or {}
                for emotion, value in emotions.items():
                    emotion_sums[emotion] += value
            
            total_sum = sum(emotion_sums.values())
            if total_sum > 0:
                emotion_correlations = {
                    emotion: (value / total_sum) * 100 
                    for emotion, value in emotion_sums.items()
                }
        
        return success_response('Pattern analysis completed', {
            'peakEmotionHours': peak_emotion_hours,
            'emotionCorrelations': emotion_correlations,
            'stressLevels': stress_levels
        })
        
    except Exception as e:
        current_app.logger.error(f"Pattern analysis error: {str(e)}")
        return error_response(f'Failed to analyze patterns: {str(e)}', 500)

@analytics_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations():
    """Get personalized recommendations based on user's emotion patterns using ML"""
    try:
        user_id_from_jwt = get_jwt_identity()
        if isinstance(user_id_from_jwt, str):
            user_id = int(user_id_from_jwt)
        else:
            user_id = user_id_from_jwt
        
        # Get recent emotion records to generate recommendations
        end_date = datetime.now(UTC)
        start_date = end_date - timedelta(days=7)  # Last 7 days
        
        recent_records = EmotionRecord.query.filter(
            EmotionRecord.user_id == user_id,
            EmotionRecord.timestamp >= start_date,
            EmotionRecord.timestamp <= end_date
        ).order_by(desc(EmotionRecord.timestamp)).limit(20).all()
        
        recommendations = []
        
        if not recent_records:
            # Default recommendations for new users
            recommendations = [
                {
                    'type': 'tip',
                    'title': 'Start Your Journey',
                    'description': 'Begin tracking your emotions to get personalized insights and recommendations.',
                    'emotion': 'general',
                    'priority': 'medium'
                }
            ]
        else:
            # Analyze recent emotions to generate recommendations using ML
            emotion_counts = defaultdict(float)
            total_records = 0
            
            for record in recent_records:
                emotions = record.emotions_json or {}
                total_records += 1
                for emotion, value in emotions.items():
                    emotion_counts[emotion] += float(value) if value else 0
            
            # Calculate average emotion scores
            if emotion_counts:
                for emotion in emotion_counts:
                    emotion_counts[emotion] = emotion_counts[emotion] / total_records
            
            # Get dominant emotion and confidence
            if emotion_counts:
                dominant_emotion = max(emotion_counts.items(), key=lambda x: x[1])
                dominant_emotion_name = dominant_emotion[0]
                confidence = min(dominant_emotion[1], 1.0)  # Cap at 1.0
            else:
                dominant_emotion_name = 'neutral'
                confidence = 0.5
            
            # Calculate wellness and stability scores from the data
            # Wellness score: average of positive emotions (happy, surprised)
            positive_emotions = emotion_counts.get('happy', 0) + emotion_counts.get('surprised', 0)
            wellness_score = min(positive_emotions / 2, 1.0) if positive_emotions > 0 else 0.3
            
            # Stability score: inverse of fluctuation (how consistent emotions are)
            if len(emotion_counts) > 0:
                # If emotions are concentrated in one or two emotions, stability is high
                sorted_emotions = sorted(emotion_counts.values(), reverse=True)
                top_emotion_percentage = sorted_emotions[0] if sorted_emotions else 0
                stability_score = min(top_emotion_percentage, 1.0)
            else:
                stability_score = 0.5
            
            current_app.logger.info(
                f"[ML RECOMMENDATIONS] Emotion Analysis - Dominant: {dominant_emotion_name}, "
                f"Confidence: {confidence:.2f}, Wellness: {wellness_score:.2f}, Stability: {stability_score:.2f}"
            )
            
            # Use ML-based recommendations if available
            if ML_AVAILABLE:
                try:
                    recommendations = generate_intelligent_recommendations(
                        dominant_emotion_name,
                        confidence,
                        wellness_score,
                        stability_score
                    )
                    current_app.logger.info(f"[ML RECOMMENDATIONS] Generated {len(recommendations)} ML-based recommendations")
                except Exception as e:
                    current_app.logger.warning(f"[ML RECOMMENDATIONS] ML function failed, using fallback: {str(e)}")
                    recommendations = get_fallback_recommendations(dominant_emotion_name)
            else:
                current_app.logger.info("[ML RECOMMENDATIONS] ML module not available, using fallback recommendations")
                recommendations = get_fallback_recommendations(dominant_emotion_name)
        
        return success_response('Recommendations generated successfully', {
            'recommendations': recommendations,
            'ml_powered': ML_AVAILABLE
        })
        
    except Exception as e:
        current_app.logger.error(f"Recommendations error: {str(e)}")
        return error_response(f'Failed to generate recommendations: {str(e)}', 500)


def get_fallback_recommendations(dominant_emotion):
    """Fallback recommendations if ML is not available"""
    recommendations = []
    
    if dominant_emotion in ['sad', 'angry', 'fearful']:
        recommendations.extend([
            {
                'type': 'breathing',
                'title': 'Deep Breathing Exercise',
                'description': 'Try 4-7-8 breathing: inhale for 4, hold for 7, exhale for 8. Repeat 4 times.',
                'emotion': dominant_emotion,
                'priority': 'high'
            },
            {
                'type': 'activity',
                'title': 'Take a Walk',
                'description': 'A 10-minute walk outdoors can help improve your mood and reduce stress.',
                'emotion': dominant_emotion,
                'priority': 'medium'
            },
            {
                'type': 'music',
                'title': 'Calming Music',
                'description': 'Listen to soft instrumental music or nature sounds to help relax your mind.',
                'emotion': dominant_emotion,
                'priority': 'low'
            }
        ])
    elif dominant_emotion == 'happy':
        recommendations.extend([
            {
                'type': 'activity',
                'title': 'Share Your Joy',
                'description': 'Call a friend or family member to share your positive energy with them.',
                'emotion': dominant_emotion,
                'priority': 'medium'
            },
            {
                'type': 'tip',
                'title': 'Practice Gratitude',
                'description': 'Write down three things you\'re grateful for today to maintain positive momentum.',
                'emotion': dominant_emotion,
                'priority': 'low'
            }
        ])
    else:  # neutral, surprised, disgusted
        recommendations.extend([
            {
                'type': 'activity',
                'title': 'Mindfulness Moment',
                'description': 'Take 5 minutes to focus on your breathing and observe your current feelings.',
                'emotion': dominant_emotion,
                'priority': 'medium'
            },
            {
                'type': 'tip',
                'title': 'Emotional Check-in',
                'description': 'Ask yourself: How am I feeling right now, and what do I need?',
                'emotion': dominant_emotion,
                'priority': 'low'
            }
        ])
    
    return recommendations
