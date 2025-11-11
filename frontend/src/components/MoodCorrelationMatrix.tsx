import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MoodCorrelationMatrixProps {
  data?: {
    timeOfDay: string;
    dominantEmotion: string;
    averageConfidence: number;
    sessionCount: number;
  }[];
}

const MoodCorrelationMatrix: React.FC<MoodCorrelationMatrixProps> = ({ data }) => {
  const emotionColors = {
    happy: '#10B981',
    sad: '#3B82F6', 
    angry: '#EF4444',
    surprised: '#F59E0B',
    fearful: '#8B5CF6',
    disgusted: '#84CC16',
    neutral: '#6B7280'
  };

  // Generate sample data if none provided
  const sampleData = data || [
    { timeOfDay: 'Morning (6-12)', dominantEmotion: 'neutral', averageConfidence: 75, sessionCount: 12 },
    { timeOfDay: 'Afternoon (12-17)', dominantEmotion: 'happy', averageConfidence: 82, sessionCount: 18 },
    { timeOfDay: 'Evening (17-21)', dominantEmotion: 'neutral', averageConfidence: 68, sessionCount: 15 },
    { timeOfDay: 'Night (21-6)', dominantEmotion: 'sad', averageConfidence: 71, sessionCount: 8 }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-600">
          <p className="font-semibold">{label}</p>
          <p className="text-sm">
            <span 
              className="inline-block w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: emotionColors[data.dominantEmotion as keyof typeof emotionColors] }}
            ></span>
            Dominant: <span className="font-medium capitalize">{data.dominantEmotion}</span>
          </p>
          <p className="text-sm">Confidence: {data.averageConfidence}%</p>
          <p className="text-sm">Sessions: {data.sessionCount}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Time-Based Emotion Patterns
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Discover how your emotions correlate with different times of the day
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sampleData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="timeOfDay" 
            stroke="#6B7280" 
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#6B7280" 
            fontSize={12}
            label={{ value: 'Confidence %', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          <Bar dataKey="averageConfidence" radius={[4, 4, 0, 0]}>
            {sampleData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={emotionColors[entry.dominantEmotion as keyof typeof emotionColors] || '#6B7280'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {sampleData.map((item, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: emotionColors[item.dominantEmotion as keyof typeof emotionColors] }}
              ></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {item.timeOfDay.split(' ')[0]}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {item.dominantEmotion}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {item.sessionCount} sessions
            </p>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          💡 Pattern Insights
        </h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Afternoon shows the highest happiness levels</li>
          <li>• Evening tends to be more neutral as you wind down</li>
          <li>• Night sessions show lower confidence, possibly due to fatigue</li>
          <li>• Consider scheduling important activities during peak mood times</li>
        </ul>
      </div>
    </div>
  );
};

export default MoodCorrelationMatrix;
