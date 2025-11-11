import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import * as tf from '@tensorflow/tfjs';

export interface EmotionDetection {
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
  neutral: number;
  // Enhanced emotions derived from combinations
  stressed?: number;
  confused?: number;
  tired?: number;
}

export interface FaceDetection {
  landmarks: any[];
  confidence: number;
}

interface UseAdvancedEmotionDetectionOptions {
  onEmotionDetected?: (emotion: EmotionDetection, faces: FaceDetection[]) => void;
  detectionInterval?: number;
}

// Advanced emotion detection using facial landmarks and machine learning
export const useAdvancedEmotionDetection = (options: UseAdvancedEmotionDetectionOptions = {}) => {
  const {
    onEmotionDetected,
    detectionInterval = 300, // Slower for better stability
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEmotions, setCurrentEmotions] = useState<EmotionDetection | null>(null);
  const [faces, setFaces] = useState<FaceDetection[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Advanced emotion smoothing system
  const emotionHistoryRef = useRef<EmotionDetection[]>([]);
  const stabilityCounterRef = useRef<{ [key: string]: number }>({});
  const lastDominantEmotionRef = useRef<string>('neutral');
  
    // Optimized configuration to prevent lag
  const DETECTION_INTERVAL = 500; // Much slower to prevent lag
  const CONFIDENCE_THRESHOLD = 0.25;
  const HISTORY_SIZE = 8;
  const STABILITY_FRAMES = 4;
  const MIN_CONFIDENCE = 0.2; // Minimum confidence for any emotion
  const SMOOTHING_FACTOR = 0.8; // Heavy smoothing

  // Facial landmark-based emotion analysis
  const analyzeFacialLandmarks = useCallback((landmarks: any[]): EmotionDetection => {
    if (!landmarks || landmarks.length === 0) {
      return {
        happy: 0, sad: 0, angry: 0, fearful: 0,
        disgusted: 0, surprised: 0, neutral: 1
      };
    }

    // Key facial points for emotion detection
    const leftEyeCorner = landmarks[33]; // Left eye outer corner
    const rightEyeCorner = landmarks[263]; // Right eye outer corner
    const leftMouth = landmarks[61]; // Left mouth corner
    const rightMouth = landmarks[291]; // Right mouth corner
    const topLip = landmarks[13]; // Top lip center
    const bottomLip = landmarks[14]; // Bottom lip center
    const noseTip = landmarks[1]; // Nose tip
    const leftEyebrow = landmarks[70]; // Left eyebrow
    const rightEyebrow = landmarks[300]; // Right eyebrow

    // Calculate distances and ratios
    const mouthWidth = Math.abs(leftMouth.x - rightMouth.x);
    const mouthHeight = Math.abs(topLip.y - bottomLip.y);
    const eyeDistance = Math.abs(leftEyeCorner.x - rightEyeCorner.x);
    const eyebrowHeight = (leftEyebrow.y + rightEyebrow.y) / 2;
    const mouthCurve = (leftMouth.y + rightMouth.y) / 2 - ((topLip.y + bottomLip.y) / 2);

    // Emotion detection based on facial geometry
    const emotions: EmotionDetection = {
      happy: 0, sad: 0, angry: 0, fearful: 0,
      disgusted: 0, surprised: 0, neutral: 0.3 // Base neutral
    };

    // Happy detection: mouth corners up, wider mouth
    if (mouthCurve < -0.01 && mouthWidth / eyeDistance > 0.5) {
      emotions.happy = Math.min(1, Math.abs(mouthCurve) * 50 + (mouthWidth / eyeDistance - 0.5) * 2);
    }

    // Sad detection: mouth corners down, droopy eyes
    if (mouthCurve > 0.005) {
      emotions.sad = Math.min(1, mouthCurve * 100);
    }

    // Surprised detection: wide eyes, open mouth
    if (mouthHeight / mouthWidth > 0.8 && eyebrowHeight < noseTip.y - 0.1) {
      emotions.surprised = Math.min(1, (mouthHeight / mouthWidth - 0.8) * 5 + Math.abs(eyebrowHeight - noseTip.y + 0.1) * 10);
    }

    // Angry detection: lowered eyebrows, tense mouth
    if (eyebrowHeight > noseTip.y - 0.05 && mouthWidth / eyeDistance < 0.45) {
      emotions.angry = Math.min(1, (eyebrowHeight - noseTip.y + 0.05) * 20 + (0.45 - mouthWidth / eyeDistance) * 4);
    }

    // Fearful detection: raised eyebrows, wide eyes, small mouth
    if (eyebrowHeight < noseTip.y - 0.08 && mouthWidth / eyeDistance < 0.4) {
      emotions.fearful = Math.min(1, Math.abs(eyebrowHeight - noseTip.y + 0.08) * 15 + (0.4 - mouthWidth / eyeDistance) * 5);
    }

    // Disgusted detection: raised upper lip, squinted eyes
    if (topLip.y < bottomLip.y - 0.01 && mouthWidth / eyeDistance < 0.45) {
      emotions.disgusted = Math.min(1, Math.abs(topLip.y - bottomLip.y + 0.01) * 100);
    }

    // Normalize emotions
    const total = Object.values(emotions).reduce((sum, val) => sum + val, 0);
    if (total > 1) {
      Object.keys(emotions).forEach(key => {
        emotions[key as keyof EmotionDetection] /= total;
      });
    }

    return emotions;
  }, []);

  // Ultra-stable emotion processing
  const processEmotions = useCallback((rawEmotions: EmotionDetection): EmotionDetection => {
    // Add to history
    emotionHistoryRef.current.push(rawEmotions);
    if (emotionHistoryRef.current.length > HISTORY_SIZE) {
      emotionHistoryRef.current.shift();
    }

    // Get average over history
    let smoothedEmotions: EmotionDetection = {
      happy: 0, sad: 0, angry: 0, fearful: 0,
      disgusted: 0, surprised: 0, neutral: 0
    };

    if (emotionHistoryRef.current.length >= 3) {
      emotionHistoryRef.current.forEach(emotion => {
        smoothedEmotions.happy += emotion.happy;
        smoothedEmotions.sad += emotion.sad;
        smoothedEmotions.angry += emotion.angry;
        smoothedEmotions.fearful += emotion.fearful;
        smoothedEmotions.disgusted += emotion.disgusted;
        smoothedEmotions.surprised += emotion.surprised;
        smoothedEmotions.neutral += emotion.neutral;
      });

      const count = emotionHistoryRef.current.length;
      Object.keys(smoothedEmotions).forEach(key => {
        smoothedEmotions[key as keyof EmotionDetection] /= count;
      });
    } else {
      smoothedEmotions = rawEmotions;
    }

    // Apply confidence threshold
    Object.keys(smoothedEmotions).forEach(key => {
      const emotionKey = key as keyof EmotionDetection;
      const value = smoothedEmotions[emotionKey];
      if (value !== undefined && value < MIN_CONFIDENCE) {
        smoothedEmotions[emotionKey] = 0;
      }
    });

    // Find dominant emotion
    const dominantEmotion = Object.entries(smoothedEmotions)
      .reduce((prev, current) => current[1] > prev[1] ? current : prev)[0];

    // Stability check - require multiple frames to change dominant emotion
    if (dominantEmotion !== lastDominantEmotionRef.current) {
      stabilityCounterRef.current[dominantEmotion] = (stabilityCounterRef.current[dominantEmotion] || 0) + 1;
      
      if (stabilityCounterRef.current[dominantEmotion] >= STABILITY_FRAMES) {
        lastDominantEmotionRef.current = dominantEmotion;
        stabilityCounterRef.current = {}; // Reset counters
      } else {
        // Not stable enough, return previous emotion pattern
        const prevEmotion = { ...smoothedEmotions };
        Object.keys(prevEmotion).forEach(key => {
          const emotionKey = key as keyof EmotionDetection;
          const value = prevEmotion[emotionKey];
          if (key === lastDominantEmotionRef.current) {
            prevEmotion[emotionKey] = Math.max(0.6, value || 0);
          } else {
            prevEmotion[emotionKey] = (value || 0) * 0.5;
          }
        });
        smoothedEmotions = prevEmotion;
      }
    } else {
      // Same dominant emotion, reset other counters
      stabilityCounterRef.current = {};
    }

    // Add complex emotions
    const result: EmotionDetection = {
      ...smoothedEmotions,
      stressed: (smoothedEmotions.angry + smoothedEmotions.fearful > 0.5) ? 
        Math.min(0.8, smoothedEmotions.angry * 0.6 + smoothedEmotions.fearful * 0.4) : 0,
      confused: (smoothedEmotions.surprised > 0.3 && smoothedEmotions.neutral > 0.3) ?
        Math.min(0.6, (smoothedEmotions.surprised + smoothedEmotions.neutral) * 0.5) : 0,
      tired: (smoothedEmotions.sad > 0.3 && smoothedEmotions.neutral > 0.4) ?
        Math.min(0.7, smoothedEmotions.sad * 0.4 + smoothedEmotions.neutral * 0.6) : 0
    };

    return result;
  }, []);

  // Initialize MediaPipe Face Mesh with performance optimizations
  const initializeMediaPipe = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🚀 Starting MediaPipe initialization...');

      const faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          const url = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          console.log('Loading MediaPipe file:', url);
          return url;
        }
      });

      console.log('📦 MediaPipe FaceMesh instance created');

      // Try with lower confidence first to see if it detects anything
      faceMesh.setOptions({
        maxNumFaces: 1,              
        refineLandmarks: false,      
        minDetectionConfidence: 0.5, // Lower confidence for debugging
        minTrackingConfidence: 0.5   
      });

      console.log('⚙️ MediaPipe options configured');

      let lastProcessTime = 0;
      faceMesh.onResults((results: any) => {
        const now = Date.now();
        // Much slower processing to prevent lag
        if (now - lastProcessTime < DETECTION_INTERVAL) return;
        lastProcessTime = now;

        console.log('MediaPipe results:', {
          hasResults: !!results,
          hasFaceLandmarks: !!(results?.multiFaceLandmarks),
          faceCount: results?.multiFaceLandmarks?.length || 0,
          imageData: !!results?.image
        });

        if (!canvasRef.current) {
          console.warn('Canvas not available');
          return;
        }

        try {
          // Clear canvas
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }

          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            console.log('✅ Face detected! Landmarks count:', results.multiFaceLandmarks[0].length);
            const landmarks = results.multiFaceLandmarks[0];
            
            // Draw simple face indicator (performance optimized)
            if (ctx) {
              const xs = landmarks.map((p: any) => p.x);
              const ys = landmarks.map((p: any) => p.y);
              const minX = Math.min(...xs) * canvasRef.current.width;
              const maxX = Math.max(...xs) * canvasRef.current.width;
              const minY = Math.min(...ys) * canvasRef.current.height;
              const maxY = Math.max(...ys) * canvasRef.current.height;
              
              ctx.strokeStyle = '#00ff41';
              ctx.lineWidth = 2;
              ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
              
              // Show "Face Detected" text
              ctx.fillStyle = '#00ff41';
              ctx.font = 'bold 16px Arial';
              ctx.fillText('Face Detected!', minX, minY - 10);
            }
            
            // Analyze emotions from landmarks (throttled)
            const rawEmotions = analyzeFacialLandmarks(landmarks);
            const processedEmotions = processEmotions(rawEmotions);
            
            setCurrentEmotions(processedEmotions);
            setFaces([{ landmarks, confidence: 0.9 }]);

            // Find dominant emotion
            const dominantEntry = Object.entries(processedEmotions)
              .filter(([_, value]) => value > 0)
              .reduce((prev, current) => current[1] > prev[1] ? current : prev, ['neutral', 0]);

            console.log(`🎯 Stable emotion: ${dominantEntry[0]} (${Math.round(dominantEntry[1] * 100)}%)`);

            if (onEmotionDetected) {
              onEmotionDetected(processedEmotions, [{ landmarks, confidence: 0.9 }]);
            }
          } else {
            console.log('❌ No face detected in frame');
            // Draw "No Face" indicator
            if (ctx) {
              ctx.fillStyle = '#ff4444';
              ctx.font = 'bold 16px Arial';
              ctx.fillText('No Face Detected', 10, 30);
            }
            setCurrentEmotions(null);
            setFaces([]);
          }
        } catch (err) {
          console.error('Error processing results:', err);
        }
      });

      faceMeshRef.current = faceMesh;
      setModelsLoaded(true);
      console.log('✅ MediaPipe Face Mesh initialized and ready!');
    } catch (err) {
      setError('Failed to initialize MediaPipe Face Mesh');
      console.error('❌ MediaPipe initialization error:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack'
      });
    } finally {
      setIsLoading(false);
    }
  }, [analyzeFacialLandmarks, processEmotions, onEmotionDetected]);

  // Start camera with MediaPipe - optimized for performance
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('📹 Starting camera initialization...');
      
      if (!videoRef.current) {
        console.error('❌ Video element not available');
        return;
      }
      
      if (!faceMeshRef.current) {
        console.error('❌ MediaPipe FaceMesh not initialized');
        return;
      }

      console.log('📹 Video element and MediaPipe ready, creating camera...');

      // Use lower resolution to reduce lag
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          // Throttle the sending to MediaPipe to prevent lag
          if (faceMeshRef.current && videoRef.current && isDetecting) {
            try {
              console.log('📡 Sending frame to MediaPipe...');
              await faceMeshRef.current.send({ image: videoRef.current });
            } catch (err) {
              // Silently handle errors to prevent spam
              console.warn('⚠️ Frame processing skipped:', err);
            }
          }
        },
        width: 640,   // Lower resolution for better performance
        height: 480,  // Lower resolution for better performance
        facingMode: 'user'
      });

      console.log('📹 Camera instance created, starting...');

      // Add a delay before starting to prevent immediate lag
      setTimeout(async () => {
        try {
          await camera.start();
          cameraRef.current = camera;
          console.log('✅ MediaPipe camera started successfully');
          console.log('📹 Camera details:', {
            width: videoRef.current?.videoWidth,
            height: videoRef.current?.videoHeight,
            readyState: videoRef.current?.readyState
          });
        } catch (err) {
          console.error('❌ Failed to start camera:', err);
          setError('Failed to start camera - please check permissions');
        }
      }, 500); // Longer delay to ensure everything is ready

    } catch (err) {
      setError('Failed to initialize camera');
      console.error('❌ Camera initialization error:', err);
    }
  }, [isDetecting]);

  // Start detection
  const startDetection = useCallback(async () => {
    console.log('🚀 Starting advanced emotion detection...');
    
    if (!modelsLoaded) {
      await initializeMediaPipe();
    }

    await startCamera();
    setIsDetecting(true);
    console.log('✅ Advanced emotion detection started');
  }, [modelsLoaded, initializeMediaPipe, startCamera]);

  // Enhanced stop detection with proper cleanup
  const stopDetection = useCallback(async () => {
    console.log('🛑 Stopping advanced emotion detection...');
    setIsDetecting(false);
    
    // Stop camera first
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
        cameraRef.current = null;
      } catch (err) {
        console.warn('Error stopping camera:', err);
      }
    }
    
    // Clear any intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clear state
    setCurrentEmotions(null);
    setFaces([]);
    emotionHistoryRef.current = [];
    stabilityCounterRef.current = {};
    lastDominantEmotionRef.current = 'neutral';
    
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    console.log('✅ Advanced emotion detection stopped');
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeMediaPipe();
    return () => {
      stopDetection();
    };
  }, [initializeMediaPipe, stopDetection]);

  return {
    videoRef,
    canvasRef,
    isLoading,
    isDetecting,
    error,
    currentEmotions,
    faces,
    modelsLoaded,
    startDetection,
    stopDetection,
  };
};
