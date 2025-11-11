import React from 'react';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isLoading: boolean;
  error: string | null;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ videoRef, isLoading, error }) => {
  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Loading camera...</p>
            <p className="text-sm text-gray-400 mt-1">Initializing video stream</p>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90 z-10">
          <div className="text-center text-white max-w-md px-4">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
            <p className="text-sm leading-relaxed">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover ${
          isLoading || error ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-500`}
        style={{
          transform: 'scaleX(-1)', // Mirror effect for natural selfie view
        }}
        onLoadedMetadata={(e) => {
          console.log('Video metadata loaded:', {
            width: e.currentTarget.videoWidth,
            height: e.currentTarget.videoHeight,
          });
        }}
      />
      
      {/* Camera Indicator */}
      {!isLoading && !error && (
        <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black bg-opacity-60 rounded-full px-3 py-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-white font-medium">LIVE</span>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;
