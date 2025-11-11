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
  landmarks?: faceapi.FaceLandmarks68;
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
    detectionInterval = 150, // ~7fps for smooth performance
    confidenceThreshold = 0.5,
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEmotions, setCurrentEmotions] = useState<EmotionDetection[]>([]);
  const [faces, setFaces] = useState<FaceDetection[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Loading face-api.js models...');

      const modelUrl = '/models';
      
      // Check if models are already loaded
      if (faceapi.nets.ssdMobilenetv1.isLoaded && 
          faceapi.nets.faceExpressionNet.isLoaded) {
        console.log('✅ Models already loaded');
        setModelsLoaded(true);
        setIsLoading(false);
        return;
      }
      
      // Load required models
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl),
        faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
      ]);

      console.log('✅ Face detection models loaded successfully!');
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
      console.log('🔄 Initializing webcam...');
      
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
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
      console.error('❌ Camera access error:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access and refresh the page.');
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and refresh the page.');
      } else {
        setError('Failed to access camera. Please check your camera settings.');
      }
    }
  }, []);

  // Process emotions
  const processEmotions = useCallback((expressions: faceapi.FaceExpressions): EmotionDetection => {
    const emotions: EmotionDetection = {
      happy: Math.max(0, expressions.happy || 0),
      sad: Math.max(0, expressions.sad || 0),
      angry: Math.max(0, expressions.angry || 0),
      fearful: Math.max(0, expressions.fearful || 0),
      disgusted: Math.max(0, expressions.disgusted || 0),
      surprised: Math.max(0, expressions.surprised || 0),
      neutral: Math.max(0, expressions.neutral || 0),
    };

    // Apply confidence threshold
    Object.keys(emotions).forEach(key => {
      const emotionKey = key as keyof EmotionDetection;
      if (emotions[emotionKey] < confidenceThreshold) {
        emotions[emotionKey] = 0;
      }
    });

    return emotions;
  }, [confidenceThreshold]);

  // Detect emotions
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

      // Face detection with emotion recognition
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ 
          minConfidence: 0.5 
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
        const processedEmotions: EmotionDetection[] = [];
        const mappedFaces: FaceDetection[] = [];

        resizedDetections.forEach((detection, index) => {
          // Process emotions
          const emotions = processEmotions(detection.expressions);
          processedEmotions.push(emotions);
          
          // Map face data
          const faceData: FaceDetection = {
            detection: detection.detection,
            expressions: detection.expressions,
            box: {
              x: detection.detection.box.x,
              y: detection.detection.box.y,
              width: detection.detection.box.width,
              height: detection.detection.box.height,
            }
          };
          mappedFaces.push(faceData);

          // Draw bounding box
          if (ctx) {
            const { x, y, width, height } = detection.detection.box;
            
            // Face detection box
            ctx.strokeStyle = '#00ff41';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
            
            // Emotion label
            const topEmotion = Object.entries(emotions)
              .reduce((prev, current) => current[1] > prev[1] ? current : prev);
            
            if (topEmotion[1] > confidenceThreshold) {
              ctx.fillStyle = '#00ff41';
              ctx.font = '16px Arial';
              ctx.shadowColor = 'rgba(0,0,0,0.8)';
              ctx.shadowBlur = 4;
              ctx.fillText(
                `${topEmotion[0]}: ${Math.round(topEmotion[1] * 100)}%`,
                x,
                y - 10
              );
              ctx.shadowBlur = 0;
            }
            
            // Face number for multiple faces
            if (resizedDetections.length > 1) {
              ctx.fillStyle = '#ffffff';
              ctx.font = '14px Arial';
              ctx.shadowColor = 'rgba(0,0,0,0.8)';
              ctx.shadowBlur = 4;
              ctx.fillText(`Face ${index + 1}`, x, y + height + 25);
              ctx.shadowBlur = 0;
            }
          }
        });

        // Update state
        setCurrentEmotions(processedEmotions);
        setFaces(mappedFaces);

        // Callback
        if (onEmotionDetected) {
          onEmotionDetected(processedEmotions, mappedFaces);
        }
      } else {
        // No faces
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
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCurrentEmotions([]);
    setFaces([]);
    isProcessingRef.current = false;

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    
    console.log('✅ Detection stopped');
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadModels();
    
    return () => {
      stopDetection();
    };
  }, [loadModels, stopDetection]);

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
    loadModels,
  };
};
