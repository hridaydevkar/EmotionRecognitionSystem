import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface EmotionTimelineProps {
  data: {
    timestamp: string;
    emotion: string;
    confidence: number;
    event?: string;
  }[];
  height?: number;
}

const EmotionTimeline: React.FC<EmotionTimelineProps> = ({ data, height = 400 }) => {
  const emotionColors = {
    happy: '#10B981',
    sad: '#3B82F6', 
    angry: '#EF4444',
    surprised: '#F59E0B',
    fearful: '#8B5CF6',
    disgusted: '#84CC16',
    neutral: '#6B7280'
  };

  // Transform data for chart
  const chartData = data.map((item, index) => ({
    time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    timestamp: item.timestamp,
    confidence: item.confidence * 100,
    emotion: item.emotion,
    event: item.event,
    index
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-600">
          <p className="font-semibold">{label}</p>
          <p className="text-sm">
            <span 
              className="inline-block w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: emotionColors[data.emotion as keyof typeof emotionColors] }}
            ></span>
            Emotion: <span className="font-medium capitalize">{data.emotion}</span>
          </p>
          <p className="text-sm">Confidence: {data.confidence.toFixed(1)}%</p>
          {data.event && (
            <p className="text-sm text-yellow-300">Event: {data.event}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const color = emotionColors[payload.emotion as keyof typeof emotionColors] || '#6B7280';
    
    return (
      <g>
        <circle 
          cx={cx} 
          cy={cy} 
          r={payload.event ? 8 : 4} 
          fill={color}
          stroke={payload.event ? '#FFD700' : color}
          strokeWidth={payload.event ? 2 : 1}
        />
        {payload.event && (
          <circle cx={cx} cy={cy} r={3} fill="#FFD700" />
        )}
      </g>
    );
  };

  // Group data by emotion for multiple lines
  const emotionGroups = data.reduce((acc, item) => {
    if (!acc[item.emotion]) {
      acc[item.emotion] = [];
    }
    acc[item.emotion].push(item);
    return acc;
  }, {} as Record<string, typeof data>);

  return (
    <div className="emotion-timeline">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Emotion Timeline
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track your emotional journey over time. Golden rings indicate special events.
        </p>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="time" 
            stroke="#6B7280" 
            fontSize={12}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#6B7280" 
            fontSize={12}
            label={{ value: 'Confidence %', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Reference lines for confidence levels */}
          <ReferenceLine y={70} stroke="#10B981" strokeDasharray="2 2" opacity={0.5} />
          <ReferenceLine y={50} stroke="#F59E0B" strokeDasharray="2 2" opacity={0.5} />
          <ReferenceLine y={30} stroke="#EF4444" strokeDasharray="2 2" opacity={0.5} />

          <Line
            type="monotone"
            dataKey="confidence"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={<CustomDot />}
            connectNulls={false}
            activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center text-sm">
          <div className="w-3 h-0.5 bg-green-500 mr-2"></div>
          <span className="text-gray-600 dark:text-gray-300">High Confidence (70%+)</span>
        </div>
        <div className="flex items-center text-sm">
          <div className="w-3 h-0.5 bg-yellow-500 mr-2"></div>
          <span className="text-gray-600 dark:text-gray-300">Medium Confidence (50%+)</span>
        </div>
        <div className="flex items-center text-sm">
          <div className="w-3 h-0.5 bg-red-500 mr-2"></div>
          <span className="text-gray-600 dark:text-gray-300">Low Confidence (30%+)</span>
        </div>
        <div className="flex items-center text-sm">
          <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
          <span className="text-gray-600 dark:text-gray-300">Special Events</span>
        </div>
      </div>

      {/* Emotion color legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {Object.entries(emotionColors).map(([emotion, color]) => (
          <div key={emotion} className="flex items-center text-xs">
            <div 
              className="w-3 h-3 rounded-full mr-1" 
              style={{ backgroundColor: color }}
            ></div>
            <span className="text-gray-500 dark:text-gray-400 capitalize">{emotion}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmotionTimeline;
