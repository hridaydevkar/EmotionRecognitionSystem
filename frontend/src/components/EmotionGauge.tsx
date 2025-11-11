import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getEmotionColor, getEmotionEmoji } from '../utils/helpers';

interface EmotionGaugeProps {
  emotions: { [key: string]: number };
  size?: number;
  showLabels?: boolean;
}

const EmotionGauge: React.FC<EmotionGaugeProps> = ({ 
  emotions, 
  size = 200, 
  showLabels = true 
}) => {
  // Convert emotions to gauge data
  const gaugeData = Object.entries(emotions)
    .filter(([_, value]) => value > 0.01) // Only show emotions with significant values
    .map(([emotion, value]) => ({
      name: emotion,
      value: Math.round(value * 100),
      color: getEmotionColor(emotion),
      emoji: getEmotionEmoji(emotion),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7); // Show top 7 emotions

  // Get dominant emotion
  const dominantEmotion = gaugeData[0] || { name: 'neutral', value: 0, emoji: '😐' };

  return (
    <div className="flex flex-col items-center">
      {/* Gauge Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.25}
              outerRadius={size * 0.4}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={450}
            >
              {gaugeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-1">{dominantEmotion.emoji}</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {dominantEmotion.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {dominantEmotion.value}%
            </div>
          </div>
        </div>
      </div>

      {/* Labels */}
      {showLabels && gaugeData.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-sm">
          {gaugeData.slice(0, 6).map((emotion) => (
            <div
              key={emotion.name}
              className="flex items-center text-sm"
            >
              <div
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: emotion.color }}
              ></div>
              <span className="text-gray-700 dark:text-gray-300 capitalize truncate">
                {emotion.name}
              </span>
              <span className="ml-auto text-gray-500 dark:text-gray-400 text-xs">
                {emotion.value}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmotionGauge;
