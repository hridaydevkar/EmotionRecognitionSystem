import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import analyticsService, { EmotionStats, DailyEmotionSummary, PatternAnalysis, Recommendation } from '../services/analyticsService';
import EmotionGauge from '../components/EmotionGauge';
import EmotionHeatmap from '../components/EmotionHeatmap';
import EmotionTimeline from '../components/EmotionTimeline';
import RealTimeEmotionStream from '../components/RealTimeEmotionStream';
import MoodCorrelationMatrix from '../components/MoodCorrelationMatrix';
import SystemPerformance from '../components/SystemPerformance';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  Loader,
  AlertCircle,
  RefreshCw,
  Target,
  Brain,
  Heart,
  Zap,
  Clock,
  TrendingDown,
} from 'lucide-react';
import {
  formatDate,
  getEmotionColor,
  downloadFile,
  getTodayIST,
  getDaysAgoIST,
} from '../utils/helpers';

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<EmotionStats | null>(null);
  const [trends, setTrends] = useState<DailyEmotionSummary[]>([]);
  const [patterns, setPatterns] = useState<PatternAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<{
    emotion: string;
    confidence: number;
    timestamp: Date;
  } | null>(null);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateRange, setDateRange] = useState({
    startDate: getDaysAgoIST(7), // 7 days ago in IST
    endDate: getTodayIST(), // today in IST
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<{ csv: boolean; pdf: boolean }>({
    csv: false,
    pdf: false,
  });

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsData, trendsData, patternsData, recommendationsData] = await Promise.all([
        analyticsService.getEmotionStats(dateRange.startDate, dateRange.endDate),
        analyticsService.getEmotionTrends(timePeriod, dateRange.startDate, dateRange.endDate),
        analyticsService.getPatternAnalysis().catch(() => null), // Optional feature
        analyticsService.getRecommendations().catch(() => []), // Optional feature
      ]);

      setStats(statsData);
      setTrends(trendsData);
      setPatterns(patternsData);
      setRecommendations(recommendationsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [timePeriod, dateRange.startDate, dateRange.endDate]);

  // Generate sample data for heatmap
  const generateHeatmapData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
    const data = [];
    
    for (let day of days) {
      for (let hour = 0; hour < 24; hour++) {
        // Generate data for peak hours (9-18) with higher probability
        const isPeakHour = hour >= 9 && hour <= 18;
        if (Math.random() > (isPeakHour ? 0.3 : 0.7)) {
          data.push({
            hour,
            day,
            emotion: emotions[Math.floor(Math.random() * emotions.length)],
            intensity: Math.random() * 0.8 + 0.2 // 0.2 to 1.0
          });
        }
      }
    }
    return data;
  };

  // Generate sample timeline data
  const generateTimelineData = () => {
    const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(now.getTime() - (i * 10 * 60 * 1000)); // Every 10 minutes
      data.unshift({
        timestamp: timestamp.toISOString(),
        emotion: emotions[Math.floor(Math.random() * emotions.length)],
        confidence: Math.random() * 0.6 + 0.4, // 0.4 to 1.0
        event: Math.random() < 0.1 ? 'Meeting started' : undefined // 10% chance of event
      });
    }
    return data;
  };

  // Handle real-time streaming
  const handleRealTimeToggle = () => {
    setIsRealTimeActive(!isRealTimeActive);
  };

  // Simulate real-time emotion updates
  useEffect(() => {
    if (!isRealTimeActive) {
      setCurrentEmotion(null);
      return;
    }

    const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
    
    const generateRandomEmotion = () => {
      return {
        emotion: emotions[Math.floor(Math.random() * emotions.length)],
        confidence: Math.random() * 0.6 + 0.4, // 0.4 to 1.0
        timestamp: new Date()
      };
    };

    // Initial emotion
    setCurrentEmotion(generateRandomEmotion());

    // Update emotion every 3-8 seconds
    const interval = setInterval(() => {
      setCurrentEmotion(generateRandomEmotion());
    }, Math.random() * 5000 + 3000);

    return () => clearInterval(interval);
  }, [isRealTimeActive]);

  useEffect(() => {
    loadAnalytics();
    
    // Auto-refresh every 30 seconds to pick up new data
    const interval = setInterval(() => {
      console.log('Analytics: Auto-refreshing data...');
      loadAnalytics();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [timePeriod, dateRange, loadAnalytics]);

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setIsExporting(prev => ({ ...prev, [format]: true }));
      setError(null); // Clear any previous errors
      
      const blob = await analyticsService.exportData(
        format,
        dateRange.startDate,
        dateRange.endDate
      );
      
      const filename = `emotion-analytics-${dateRange.startDate}-to-${dateRange.endDate}.${format}`;
      downloadFile(blob, filename);
      
      // Show success message (optional)
      console.log(`✅ ${format.toUpperCase()} export successful`);
    } catch (err: any) {
      console.error(`Export ${format} error:`, err);
      const errorMessage = err?.message || `Failed to export ${format.toUpperCase()}. Please try again.`;
      setError(errorMessage);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(prev => ({ ...prev, [format]: false }));
    }
  };

  // Prepare chart data with improved processing
  const emotionDistributionData = stats && stats.averageEmotions
    ? Object.entries(stats.averageEmotions)
        .map(([emotion, value]) => ({
          name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
          value: Math.max(0, Math.round((value as number) * 100)),
          color: getEmotionColor(emotion),
        }))
        .filter(item => item.value >= 0) // Keep all emotions for better distribution
        .sort((a, b) => b.value - a.value) // Sort by value descending
    : [];

  const trendChartData = trends && trends.length > 0
    ? trends.map(trend => ({
        date: formatDate(trend.date),
        ...Object.fromEntries(
          Object.entries(trend.emotions || {}).map(([emotion, value]) => [
            emotion.charAt(0).toUpperCase() + emotion.slice(1),
            Math.round((value as number) * 100),
          ])
        ),
      }))
    : [];

  const sessionChartData = trends && trends.length > 0
    ? trends.map(trend => ({
        date: formatDate(trend.date),
        sessions: trend.sessionCount || 0,
        detections: trend.detectionCount || 0,
      }))
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={loadAnalytics}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Analyze your emotional patterns and trends over time
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6 lg:mt-0">
            {/* Time Period Selector */}
            <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    timePeriod === period
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>

            {/* Date Range */}
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-500 dark:text-gray-400">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Export Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting.csv}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
              >
                {isExporting.csv ? (
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={isExporting.pdf}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
              >
                {isExporting.pdf ? (
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Sessions
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalSessions}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Detections
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalDetections}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Dominant Emotion
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    {stats.dominantEmotion}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Filter className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Mood Trend
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    {stats.moodTrend}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Emotion Distribution Pie Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Emotion Distribution
            </h3>
            {emotionDistributionData.length > 0 && emotionDistributionData.some(entry => entry.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={emotionDistributionData.filter(entry => entry.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => 
                      (value && value > 5 && percent) ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                    }
                    outerRadius={90}
                    innerRadius={20}
                    fill="#8884d8"
                    dataKey="value"
                    fontSize={12}
                  >
                    {emotionDistributionData.filter(entry => entry.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, name]}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <Brain className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-center">No emotion data available</p>
                <p className="text-sm text-center mt-2">Start using the emotion detector to see your emotional patterns</p>
              </div>
            )}
          </div>

          {/* Real-time Emotion Gauge */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Current Emotion State
            </h3>
            <div className="flex justify-center">
              {stats && stats.averageEmotions ? (
                <EmotionGauge 
                  emotions={stats.averageEmotions} 
                  size={250}
                  showLabels={false}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                    <p>No emotion data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sessions and Detections */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Activity Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={sessionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280" 
                  fontSize={12}
                  tickFormatter={(value) => {
                    const parts = value.split(' ');
                    return parts.length > 2 ? `${parts[0]} ${parts[1]}` : value;
                  }}
                />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="sessions" 
                  stackId="1" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.6}
                  name="Sessions"
                />
                <Area 
                  type="monotone" 
                  dataKey="detections" 
                  stackId="2" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.6}
                  name="Detections"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emotion Trends Line Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Emotion Trends Over Time
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280" 
                fontSize={12}
                tickFormatter={(value) => {
                  const parts = value.split(' ');
                  return parts.length > 2 ? `${parts[0]} ${parts[1]}` : value;
                }}
              />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value) => [`${value}%`, '']}
              />
              <Legend />
              {Object.keys(trendChartData[0] || {})
                .filter(key => key !== 'date')
                .map((emotion, index) => (
                  <Line
                    key={emotion}
                    type="monotone"
                    dataKey={emotion}
                    stroke={getEmotionColor(emotion.toLowerCase())}
                    strokeWidth={2}
                    dot={{ fill: getEmotionColor(emotion.toLowerCase()), strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Advanced Analytics Section */}
        {patterns && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Emotions Analysis */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-6">
                <Target className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Peak Emotion Hours
                </h3>
              </div>
              <div className="space-y-4">
                {patterns?.peakEmotionHours?.map((hour, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-900 dark:text-white font-medium">{hour}:00</span>
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Peak Activity</span>
                  </div>
                ))}
                {(!patterns?.peakEmotionHours || patterns.peakEmotionHours.length === 0) && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No peak emotion patterns detected yet
                  </p>
                )}
              </div>
            </div>

            {/* Stress Level Analysis */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-6">
                <Brain className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Stress Level Distribution
                </h3>
              </div>
              <div className="space-y-4">
                {patterns?.stressLevels ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-green-600 font-medium">Low Stress</span>
                      <div className="flex items-center">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full mr-3">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${patterns.stressLevels.low}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-900 dark:text-white text-sm font-medium">
                          {patterns.stressLevels.low.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-600 font-medium">Medium Stress</span>
                      <div className="flex items-center">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full mr-3">
                          <div 
                            className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                            style={{ width: `${patterns.stressLevels.medium}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-900 dark:text-white text-sm font-medium">
                          {patterns.stressLevels.medium.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-red-600 font-medium">High Stress</span>
                      <div className="flex items-center">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full mr-3">
                          <div 
                            className="h-full bg-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${patterns.stressLevels.high}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-900 dark:text-white text-sm font-medium">
                          {patterns.stressLevels.high.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Loading stress level analysis...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Panel */}
        {recommendations && recommendations.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <Heart className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Personalized Recommendations
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.slice(0, 6).map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    rec.priority === 'high'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : rec.priority === 'medium'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    {rec.type === 'music' && <Zap className="w-4 h-4 text-purple-600 mr-2" />}
                    {rec.type === 'activity' && <TrendingUp className="w-4 h-4 text-green-600 mr-2" />}
                    {rec.type === 'breathing' && <Heart className="w-4 h-4 text-blue-600 mr-2" />}
                    {rec.type === 'tip' && <Brain className="w-4 h-4 text-orange-600 mr-2" />}
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {rec.title}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {rec.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      For: {rec.emotion}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : rec.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Visualizations Section */}
        <div className="space-y-8">
          {/* Real-time Emotion Stream */}
          <RealTimeEmotionStream
            isActive={isRealTimeActive}
            onToggle={handleRealTimeToggle}
            currentEmotion={currentEmotion}
          />

          {/* Emotion Timeline */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <EmotionTimeline data={generateTimelineData()} height={350} />
          </div>

          {/* Emotion Heatmap */}
          <EmotionHeatmap data={generateHeatmapData()} />

          {/* Mood Correlation Matrix */}
          <MoodCorrelationMatrix />

          {/* System Performance Dashboard */}
          <SystemPerformance />
        </div>

        {/* Enhanced Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Mood Trend Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {stats.moodTrend === 'positive' && <TrendingUp className="w-5 h-5 text-green-600 mr-2" />}
                  {stats.moodTrend === 'negative' && <TrendingDown className="w-5 h-5 text-red-600 mr-2" />}
                  {stats.moodTrend === 'neutral' && <Target className="w-5 h-5 text-gray-600 mr-2" />}
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Mood Trend</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  stats.moodTrend === 'positive'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : stats.moodTrend === 'negative'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                }`}>
                  {stats.moodTrend}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.dominantEmotion.charAt(0).toUpperCase() + stats.dominantEmotion.slice(1)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dominant emotion</p>
            </div>

            {/* Total Sessions Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sessions</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSessions}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detection sessions</p>
            </div>

            {/* Total Detections Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Detections</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDetections}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Emotion captures</p>
            </div>

            {/* Average Detection Rate */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <Zap className="w-5 h-5 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg per Session</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalSessions > 0 ? Math.round(stats.totalDetections / stats.totalSessions) : 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detections/session</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
