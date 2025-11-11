import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import EmotionDetector from '../components/EmotionDetector';
import { EmotionDetection, FaceDetection } from '../hooks/useEmotionDetection';
import emotionService, { EmotionRecord } from '../services/emotionService';
import {
  Activity,
  TrendingUp,
  Clock,
  Calendar,
  Loader,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  formatDateTime,
  getDominantEmotion,
  getEmotionColor,
  getEmotionEmoji,
  getEmotionIntensity,
  calculateMoodScore,
  getMoodLabel,
  getTodayIST,
} from '../utils/helpers';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentEmotion, setCurrentEmotion] = useState<EmotionDetection | null>(null);
  const [recentRecords, setRecentRecords] = useState<EmotionRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    todaySessionCount: 0,
    todayDetectionCount: 0,
    averageMood: 0.5,
  });

  // Debug: Log auth status
  useEffect(() => {
    console.log('Dashboard Auth Status:', {
      isAuthenticated,
      user: user?.username,
      token: localStorage.getItem('token') ? 'Present' : 'Missing'
    });
  }, [isAuthenticated, user]);

  // Load recent emotion records function
  const loadRecentRecords = async () => {
    try {
      setIsLoadingRecords(true);
      setRecordsError(null);
      
      const today = getTodayIST();
      console.log('Dashboard: Fetching emotion history for date:', today);
      const history = await emotionService.getEmotionHistory(1, 10, today);
      console.log('Dashboard: Received history data:', history);
      
      // Ensure we always have an array - API returns 'items', not 'records'
      const records = history?.items || [];
      console.log('Dashboard: Processed records:', records);
      setRecentRecords(records);
      
      // Calculate basic stats
      const detectionCount = records.length;
      const sessionIds = new Set(records.map((r: any) => r.session_id));
      const sessionCount = sessionIds.size;
      
      console.log('Dashboard: Calculated stats:', { detectionCount, sessionCount });
      
      // Log first record to see structure
      if (records.length > 0) {
        console.log('Dashboard: First record structure:', records[0]);
        console.log('Dashboard: First record emotions_json:', records[0]?.emotions_json);
        console.log('Dashboard: First record emotions (mapped):', records[0]?.emotions);
      }
      
      // Calculate average mood with error handling
      const moodScores = records.map((r: any) => {
        try {
          // Use emotions_json field from backend, map it to emotions for consistency
          const emotions = r.emotions_json || r.emotions;
          if (!emotions) {
            console.warn('Dashboard: Record missing emotions:', r);
            return 0.5; // neutral fallback
          }
          return calculateMoodScore(emotions);
        } catch (error) {
          console.error('Dashboard: Error calculating mood for record:', r, error);
          return 0.5; // neutral fallback
        }
      });
      const averageMood = moodScores.length > 0 
        ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length 
        : 0.5;
      
      setStats({
        todaySessionCount: sessionCount,
        todayDetectionCount: detectionCount,
        averageMood,
      });
    } catch (error: any) {
      console.error('Failed to load recent records:', error);
      setRecordsError(error.message || 'Failed to load recent records');
      // Ensure recentRecords is always an array
      setRecentRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // Load data on component mount and set up auto-refresh
  useEffect(() => {
    loadRecentRecords();
    
    // Auto-refresh every 30 seconds when user is authenticated (since we also have immediate refresh on save)
    let interval: NodeJS.Timeout | null = null;
    if (isAuthenticated) {
      interval = setInterval(() => {
        console.log('Dashboard: Auto-refreshing data...');
        loadRecentRecords();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAuthenticated]);

  const handleEmotionUpdate = (emotions: EmotionDetection[], faces: FaceDetection[]) => {
    // Use the first face's emotions if multiple faces are detected
    if (emotions.length > 0) {
      setCurrentEmotion(emotions[0]);
    }
  };

  const handleEmotionSaved = () => {
    console.log('Dashboard: Emotion saved, refreshing data...');
    // Refresh data immediately when an emotion is saved
    loadRecentRecords();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.username}!
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Track your emotions in real-time and view your emotional insights
            </p>
            {/* Debug Auth Status */}
            {!isAuthenticated && (
              <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  ⚠️ Not authenticated - emotion saving will not work
                </p>
              </div>
            )}
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={loadRecentRecords}
            disabled={isLoadingRecords}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingRecords ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Today's Sessions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Today's Sessions
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.todaySessionCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detections */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Detections
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.todayDetectionCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Average Mood */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Average Mood
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {getMoodLabel(stats.averageMood)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Emotion Display */}
            {currentEmotion && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Current Emotion
                </h3>
                
                <div className="text-center mb-6">
                  {(() => {
                    const dominant = getDominantEmotion(currentEmotion);
                    return (
                      <div>
                        <div className="text-6xl mb-2">{getEmotionEmoji(dominant)}</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize mb-1">
                          {dominant}
                        </div>
                        <div className="text-lg text-gray-600 dark:text-gray-400">
                          {getEmotionIntensity(currentEmotion[dominant as keyof EmotionDetection] || 0)}% confidence
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
                  {Object.entries(currentEmotion).map(([emotion, value]) => (
                    <div key={emotion} className="text-center">
                      <div className="text-2xl mb-2">{getEmotionEmoji(emotion)}</div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white capitalize mb-1">
                        {emotion}
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${getEmotionIntensity(value || 0)}%`,
                            backgroundColor: getEmotionColor(emotion),
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getEmotionIntensity(value || 0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emotion Detector */}
            <EmotionDetector
              onEmotionUpdate={handleEmotionUpdate}
              onEmotionSaved={handleEmotionSaved}
              autoSave={true}
              showConfidence={true}
              className="sticky top-4"
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Activity
                  </h3>
                </div>
              </div>

              <div className="p-6">
                {isLoadingRecords ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : recordsError ? (
                  <div className="flex items-center justify-center py-8 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="text-sm">{recordsError}</span>
                  </div>
                ) : (recentRecords || []).length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    {!isAuthenticated ? (
                      <>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Not authenticated - cannot load activity
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Please ensure you are logged in
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No activity yet today
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Start a detection session to see your activity
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(recentRecords || []).slice(0, 10).map((record) => {
                      // Use emotions_json field from backend, fallback to emotions
                      const emotions = record.emotions_json || record.emotions;
                      
                      // Skip records without valid emotions data
                      if (!emotions) {
                        console.log('Skipping record without emotions:', record);
                        return null;
                      }
                      
                      const dominant = getDominantEmotion(emotions);
                      const moodScore = calculateMoodScore(emotions);
                      
                      return (
                        <div
                          key={record.id}
                          className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                        >
                          <div className="text-2xl">{getEmotionEmoji(dominant)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {dominant}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDateTime(record.timestamp)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${getEmotionColor(dominant)}20`,
                                color: getEmotionColor(dominant),
                              }}
                            >
                              {getMoodLabel(moodScore)}
                            </div>
                          </div>
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Tips
                </h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <p>Position your face clearly in the camera for better detection</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <p>Regular emotion tracking helps identify patterns</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    <p>Check the Analytics page for detailed insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
