import React, { useEffect } from 'react';
import { FaceDetection } from '../hooks/useEmotionDetection';

interface FaceOverlayProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  faces: FaceDetection[];
  isDetecting: boolean;
}

const FaceOverlay: React.FC<FaceOverlayProps> = ({ canvasRef, faces, isDetecting }) => {
  // Sync canvas size with container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const resizeCanvas = () => {
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.offsetWidth;
          canvas.height = container.offsetHeight;
        }
      };
      
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [canvasRef]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Canvas for face detection boxes and labels */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          transform: 'scaleX(-1)', // Mirror to match video
        }}
      />
      
      {/* Detection Status Indicator */}
      {isDetecting && (
        <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black bg-opacity-70 rounded-full px-3 py-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-white font-medium">DETECTING</span>
        </div>
      )}
      
      {/* Face Count Badge */}
      {faces.length > 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 rounded-full px-3 py-1">
          <span className="text-xs text-white font-medium">
            {faces.length} face{faces.length !== 1 ? 's' : ''} detected
          </span>
        </div>
      )}
      
      {/* Performance Info */}
      {isDetecting && (
        <div className="absolute bottom-4 left-4 text-xs text-white bg-black bg-opacity-70 rounded px-2 py-1">
          ~5fps (Stable)
        </div>
      )}
      
      {/* Model Info */}
      {isDetecting && (
        <div className="absolute bottom-4 right-4 text-xs text-white bg-black bg-opacity-70 rounded px-2 py-1">
          face-api.js
        </div>
      )}
    </div>
  );
};

export default FaceOverlay;
