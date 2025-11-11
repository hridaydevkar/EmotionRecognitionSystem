import React from 'react';

interface EmotionHeatmapProps {
  data: {
    hour: number;
    day: string;
    emotion: string;
    intensity: number;
  }[];
  width?: number;
  height?: number;
}

const EmotionHeatmap: React.FC<EmotionHeatmapProps> = ({ 
  data, 
  width = 800, 
  height = 400 
}) => {
  const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const emotionColors = {
    happy: '#10B981',
    sad: '#3B82F6', 
    angry: '#EF4444',
    surprised: '#F59E0B',
    fearful: '#8B5CF6',
    disgusted: '#84CC16',
    neutral: '#6B7280'
  };

  // Create a data map for quick lookup
  const dataMap = new Map<string, typeof data[0]>();
  data.forEach(item => {
    const key = `${item.day}-${item.hour}`;
    dataMap.set(key, item);
  });

  const getIntensityOpacity = (intensity: number) => {
    return Math.max(0.1, Math.min(1, intensity));
  };

  const getCellData = (day: string, hour: number) => {
    return dataMap.get(`${day}-${hour}`);
  };

  return (
    <div className="emotion-heatmap bg-white dark:bg-gray-800 p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Emotion Intensity Heatmap
      </h3>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hours Header */}
          <div className="flex mb-2">
            <div className="w-12 h-8 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
              Day
            </div>
            {hours.map(hour => (
              <div 
                key={hour}
                className="w-8 h-8 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300"
              >
                {hour}
              </div>
            ))}
          </div>

          {/* Heatmap Grid */}
          {days.map(day => (
            <div key={day} className="flex mb-1">
              {/* Day Label */}
              <div className="w-12 h-8 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                {day}
              </div>
              
              {/* Hour Cells */}
              {hours.map(hour => {
                const cellData = getCellData(day, hour);
                const hasData = cellData !== undefined;
                const emotion = cellData?.emotion || 'neutral';
                const intensity = cellData?.intensity || 0;
                const color = emotionColors[emotion as keyof typeof emotionColors];
                
                return (
                  <div
                    key={hour}
                    className="w-8 h-8 m-0.5 rounded-sm border border-gray-200 dark:border-gray-600 cursor-pointer hover:scale-110 transition-transform group relative"
                    style={{
                      backgroundColor: hasData ? color : '#f3f4f6',
                      opacity: hasData ? getIntensityOpacity(intensity) : 0.3
                    }}
                    title={hasData ? `${day} ${hour}:00 - ${emotion} (${(intensity * 100).toFixed(1)}%)` : `${day} ${hour}:00 - No data`}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                      {hasData ? (
                        <>
                          <strong>{day} {hour}:00</strong><br/>
                          {emotion} - {(intensity * 100).toFixed(1)}%
                        </>
                      ) : (
                        `${day} ${hour}:00 - No data`
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Emotions
        </h4>
        <div className="flex flex-wrap gap-4">
          {Object.entries(emotionColors).map(([emotion, color]) => (
            <div key={emotion} className="flex items-center">
              <div 
                className="w-4 h-4 rounded-sm mr-2"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                {emotion}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Intensity Scale
          </h4>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Low</span>
            <div className="flex space-x-1">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-sm bg-purple-500"
                  style={{ opacity }}
                ></div>
              ))}
            </div>
            <span className="text-xs text-gray-500">High</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionHeatmap;
