import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

export interface EmotionDetection {
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
  neutral: number;
}

export interface FaceDetection {
  detection: faceapi.FaceDetection;
  expressions: faceapi.FaceExpressions;
  landmarks?: faceapi.FaceLandmarks68 | undefined;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface UseEmotionDetectionOptions {
  onEmotionDetected?: (emotions: EmotionDetection[], faces: FaceDetection[]) => void;
  detectionInterval?: number;
  confidenceThreshold?: number;
}

export const useEmotionDetection = (options: UseEmotionDetectionOptions = {}) => {
  const {
    onEmotionDetected,
    detectionInterval = 150, // Faster detection for better responsiveness - 6.7fps
    confidenceThreshold = 0.1, // Much lower threshold to detect subtle emotions
  } = options;

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEmotions, setCurrentEmotions] = useState<EmotionDetection[]>([]);
  const [faces, setFaces] = useState<FaceDetection[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  
  // Add emotion smoothing - improved algorithm for better emotion detection
  const emotionHistoryRef = useRef<EmotionDetection[][]>([]);
  const SMOOTHING_WINDOW = 3; // Reduced window for more responsive detection
  const lastEmotionRef = useRef<EmotionDetection[]>([]);

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Loading face-api.js models...');

      // Use absolute path for model loading to avoid path issues after OS update
      const modelUrl = `${window.location.origin}/models`;
      
      console.log('📦 Loading SSD MobileNet v1 for face detection...');
      console.log('📦 Loading Face Expression Net for emotion recognition...');
      console.log('📝 Using model path:', modelUrl);
      
      // Load the available models (SSD MobileNet for detection and Face Expression for emotions)
      // Loading each model sequentially to ensure proper loading
      await faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl);
      console.log('✓ SSD MobileNet loaded');
      
      await faceapi.nets.faceExpressionNet.loadFromUri(modelUrl);
      console.log('✓ Face Expression Net loaded');

      console.log('✅ All models loaded successfully!');
      console.log('✅ Ready for face detection and emotion recognition');
      setModelsLoaded(true);
    } catch (err) {
      console.error('❌ Error loading models:', err);
      setError('Failed to load face detection models. Please check if model files are available.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('🔄 Initializing camera...');
      
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280, min: 640, max: 1920 },
          height: { ideal: 720, min: 480, max: 1080 },
          facingMode: 'user', // Front camera
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log('✅ Camera initialized successfully!');
              resolve();
            };
          }
        });
      }
    } catch (err) {
      console.error('❌ Camera error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access and refresh the page.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera and refresh the page.');
        } else {
          setError('Failed to access camera. Please check your camera settings.');
        }
      }
    }
  }, []);

  // Process emotions with smoothing to reduce fluctuations
  const processEmotions = useCallback((expressions: faceapi.FaceExpressions): EmotionDetection => {
    const rawEmotions: EmotionDetection = {
      happy: Math.max(0, expressions.happy || 0),
      sad: Math.max(0, expressions.sad || 0),
      angry: Math.max(0, expressions.angry || 0),
      fearful: Math.max(0, expressions.fearful || 0),
      disgusted: Math.max(0, expressions.disgusted || 0),
      surprised: Math.max(0, expressions.surprised || 0),
      neutral: Math.max(0, expressions.neutral || 0),
    };

    return rawEmotions;
  }, []);

  // Improved emotion smoothing to fix fluctuation issues
  const smoothEmotions = useCallback((newEmotions: EmotionDetection[]): EmotionDetection[] => {
    if (newEmotions.length === 0) return [];

    // Update emotion history
    emotionHistoryRef.current.push(newEmotions);
    if (emotionHistoryRef.current.length > SMOOTHING_WINDOW) {
      emotionHistoryRef.current.shift();
    }

    const smoothed: EmotionDetection[] = [];
    
    for (let faceIndex = 0; faceIndex < newEmotions.length; faceIndex++) {
      const currentEmotions = newEmotions[faceIndex];
      const lastEmotions = lastEmotionRef.current[faceIndex] || currentEmotions;
      
      // Weighted averaging: 60% current, 40% previous (more responsive than pure averaging)
      const blended: EmotionDetection = {} as EmotionDetection;
      const emotionKeys = Object.keys(currentEmotions) as (keyof EmotionDetection)[];
      
      emotionKeys.forEach(emotionKey => {
        const currentValue = currentEmotions[emotionKey];
        const lastValue = lastEmotions[emotionKey] || 0;
        
        // Apply weighted blending for smoother transitions
        const blendedValue = (currentValue * 0.6) + (lastValue * 0.4);
        
        // Use an even lower threshold to allow more emotions through
        // Only filter out very minimal emotions (< 0.02) to capture subtle expressions
        blended[emotionKey] = blendedValue > 0.02 ? blendedValue : 0;
      });

      // Ensure emotions sum to approximately 1 (normalize)
      const emotionSum = Object.values(blended).reduce((sum, val) => sum + val, 0);
      if (emotionSum > 0) {
        emotionKeys.forEach(key => {
          blended[key] = blended[key] / emotionSum;
        });
      }

      // Store for next iteration
      if (!lastEmotionRef.current[faceIndex]) {
        lastEmotionRef.current[faceIndex] = {} as EmotionDetection;
      }
      lastEmotionRef.current[faceIndex] = { ...blended };

      smoothed.push(blended);
    }
    
    return smoothed;
  }, []);

  // Face detection and emotion recognition
  const detectEmotions = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded || isProcessingRef.current) {
      return;
    }

    try {
      isProcessingRef.current = true;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      // Set canvas dimensions
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      // Detect faces with expressions (using SsdMobilenetv1 with lower confidence for better detection)
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ 
          minConfidence: 0.3 // Lower confidence for better face detection
        }))
        .withFaceExpressions();

      if (!detections || !Array.isArray(detections)) {
        return;
      }

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      // Clear canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (resizedDetections.length > 0) {
        const rawEmotions: EmotionDetection[] = [];
        const mappedFaces: FaceDetection[] = [];

        resizedDetections.forEach((detection, index) => {
          // Process emotions
          const emotions = processEmotions(detection.expressions);
          rawEmotions.push(emotions);
          
          // Map face data
          const faceData: FaceDetection = {
            detection: detection.detection,
            expressions: detection.expressions,
            landmarks: undefined, // No landmarks with SSD MobileNet only
            box: {
              x: detection.detection.box.x,
              y: detection.detection.box.y,
              width: detection.detection.box.width,
              height: detection.detection.box.height,
            }
          };
          mappedFaces.push(faceData);
        });

        // Apply emotion smoothing to reduce fluctuations
        const smoothedEmotions = smoothEmotions(rawEmotions);

        // Enhanced debugging to track emotion values
        if (smoothedEmotions.length > 0) {
          const emotions = smoothedEmotions[0];
          const nonNeutralEmotions = Object.entries(emotions)
            .filter(([key, value]) => key !== 'neutral' && value > 0.05)
            .map(([key, value]) => `${key}: ${(value * 100).toFixed(1)}%`);
          
          console.log('🎭 Detected emotions:', {
            dominant: Object.entries(emotions).reduce((prev, current) => current[1] > prev[1] ? current : prev),
            nonNeutral: nonNeutralEmotions,
            neutral: `${(emotions.neutral * 100).toFixed(1)}%`,
            allEmotions: emotions
          });
        }

        // Draw face bounding boxes and labels (handle mirroring properly)
        if (ctx) {
          // Save the current transformation
          ctx.save();
          
          resizedDetections.forEach((detection, index) => {
            const { x, y, width, height } = detection.detection.box;
            const smoothed = smoothedEmotions[index];
            
            // Face bounding box
            ctx.strokeStyle = '#00ff41';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
            
            // Find dominant emotion from smoothed data
            const dominantEmotion = Object.entries(smoothed)
              .reduce((prev, current) => current[1] > prev[1] ? current : prev);
            
            if (dominantEmotion[1] > 0.1) { // Lower threshold for display
              // Mirror the text position to account for video mirroring
              const textX = canvas.width - x - width; // Flip X position
              const textY = y - 15;
              
              // Set text properties
              ctx.fillStyle = '#00ff41';
              ctx.font = 'bold 16px Arial';
              ctx.textAlign = 'left';
              
              // Create background for text readability
              const text = `${dominantEmotion[0]}: ${Math.round(dominantEmotion[1] * 100)}%`;
              const metrics = ctx.measureText(text);
              const textWidth = metrics.width;
              const textHeight = 20;
              
              // Draw background
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(textX - 5, textY - textHeight + 5, textWidth + 10, textHeight);
              
              // Draw text
              ctx.fillStyle = '#00ff41';
              ctx.fillText(text, textX, textY);
            }
            
            // Face number for multiple faces
            if (resizedDetections.length > 1) {
              const faceNumX = canvas.width - x - width; // Flip X position
              const faceNumY = y + height + 25;
              
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(faceNumX - 5, faceNumY - 15, 60, 20);
              
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 14px Arial';
              ctx.fillText(`Face ${index + 1}`, faceNumX, faceNumY);
            }
          });
          
          // Restore transformation
          ctx.restore();
        }

        // Update state with smoothed emotions
        setCurrentEmotions(smoothedEmotions);
        setFaces(mappedFaces);

        // Callback with smoothed emotion data
        if (onEmotionDetected) {
          console.log('📞 Calling onEmotionDetected with:', {
            emotionsCount: smoothedEmotions.length,
            facesCount: mappedFaces.length,
            firstEmotion: smoothedEmotions[0]
          });
          onEmotionDetected(smoothedEmotions, mappedFaces);
        }
      } else {
        // No faces detected
        setCurrentEmotions([]);
        setFaces([]);
      }
    } catch (err) {
      console.error('❌ Detection error:', err);
    } finally {
      isProcessingRef.current = false;
    }
  }, [modelsLoaded, onEmotionDetected, processEmotions, confidenceThreshold]);

  // Start detection
  const startDetection = useCallback(async () => {
    console.log('🚀 Starting emotion detection...');
    
    if (!modelsLoaded) {
      await loadModels();
    }

    await initializeCamera();
    setIsDetecting(true);

    // Start detection loop
    intervalRef.current = setInterval(detectEmotions, detectionInterval);
    console.log(`✅ Detection started at ${Math.round(1000 / detectionInterval)}fps`);
  }, [modelsLoaded, loadModels, initializeCamera, detectEmotions, detectionInterval]);

  // Stop detection
  const stopDetection = useCallback(() => {
    console.log('🛑 Stopping detection...');
    setIsDetecting(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Clear state and emotion history
    setCurrentEmotions([]);
    setFaces([]);
    isProcessingRef.current = false;
    emotionHistoryRef.current = []; // Clear emotion smoothing history
    lastEmotionRef.current = []; // Clear last emotion reference

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    
    console.log('✅ Detection stopped');
  }, []);

  // Initialize models on mount
  useEffect(() => {
    loadModels();
    
    return () => {
      stopDetection();
    };
  }, [loadModels, stopDetection]);

  return {
    // Refs
    videoRef,
    canvasRef,
    
    // State
    isLoading,
    isDetecting,
    error,
    currentEmotions,
    faces,
    modelsLoaded,
    
    // Functions
    startDetection,
    stopDetection,
    loadModels,
  };
};
