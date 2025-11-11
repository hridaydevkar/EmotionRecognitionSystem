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
  // Enhanced emotions derived from combinations
  stressed?: number;
  confused?: number;
  tired?: number;
}

export interface FaceDetection {
  detection: faceapi.FaceDetection;
  expressions: faceapi.FaceExpressions;
}

interface UseEmotionDetectionOptions {
  onEmotionDetected?: (emotion: EmotionDetection, faces: FaceDetection[]) => void;
  detectionInterval?: number;
  confidenceThreshold?: number;
}

export const useEmotionDetection = (options: UseEmotionDetectionOptions = {}) => {
  const {
    onEmotionDetected,
    detectionInterval = 200, // SUPER FAST - 5 times per second!
    confidenceThreshold = 0.1, // ULTRA LOW threshold for maximum sensitivity
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Simple emotion history for minimal smoothing
  const emotionHistoryRef = useRef<EmotionDetection[]>([]);
  const HISTORY_SIZE = 2; // Just 2 readings - minimal smoothing for maximum responsiveness

  // **SUPER SIMPLE AND RESPONSIVE EMOTION PROCESSING**
  const processEmotions = useCallback((expressions: faceapi.FaceExpressions): EmotionDetection => {
    // Step 1: Extract raw emotions with boost
    const rawEmotions: EmotionDetection = {
      happy: Math.max(0, expressions.happy * 1.2), // Boost sensitivity
      sad: Math.max(0, expressions.sad * 1.2),
      angry: Math.max(0, expressions.angry * 1.2),
      fearful: Math.max(0, expressions.fearful * 1.2),
      disgusted: Math.max(0, expressions.disgusted * 1.2),
      surprised: Math.max(0, expressions.surprised * 1.2),
      neutral: Math.max(0, expressions.neutral),
    };

    // Step 2: Apply ultra-low confidence filter
    const filteredEmotions: EmotionDetection = {
      happy: rawEmotions.happy >= confidenceThreshold ? rawEmotions.happy : 0,
      sad: rawEmotions.sad >= confidenceThreshold ? rawEmotions.sad : 0,
      angry: rawEmotions.angry >= confidenceThreshold ? rawEmotions.angry : 0,
      fearful: rawEmotions.fearful >= confidenceThreshold ? rawEmotions.fearful : 0,
      disgusted: rawEmotions.disgusted >= confidenceThreshold ? rawEmotions.disgusted : 0,
      surprised: rawEmotions.surprised >= confidenceThreshold ? rawEmotions.surprised : 0,
      neutral: rawEmotions.neutral >= confidenceThreshold ? rawEmotions.neutral : 0,
    };

    // Step 3: Minimal smoothing for responsiveness
    emotionHistoryRef.current.push(filteredEmotions);
    if (emotionHistoryRef.current.length > HISTORY_SIZE) {
      emotionHistoryRef.current.shift();
    }

    let smoothedEmotions: EmotionDetection;
    if (emotionHistoryRef.current.length >= 2) {
      // Simple average of just 2 readings
      const current = emotionHistoryRef.current[emotionHistoryRef.current.length - 1];
      const previous = emotionHistoryRef.current[emotionHistoryRef.current.length - 2];
      
      smoothedEmotions = {
        happy: (current.happy + previous.happy) / 2,
        sad: (current.sad + previous.sad) / 2,
        angry: (current.angry + previous.angry) / 2,
        fearful: (current.fearful + previous.fearful) / 2,
        disgusted: (current.disgusted + previous.disgusted) / 2,
        surprised: (current.surprised + previous.surprised) / 2,
        neutral: (current.neutral + previous.neutral) / 2,
      };
    } else {
      smoothedEmotions = filteredEmotions;
    }

    // Step 4: Add complex emotions
    const result: EmotionDetection = {
      ...smoothedEmotions,
      stressed: Math.min(1, (smoothedEmotions.angry * 0.8) + (smoothedEmotions.fearful * 0.6)),
      confused: Math.min(1, (smoothedEmotions.surprised * 0.7) + (smoothedEmotions.neutral * 0.3)),
      tired: Math.min(1, (smoothedEmotions.sad * 0.6) + (smoothedEmotions.neutral * 0.4)),
    };

    console.log(`😊 Emotions: ${Object.entries(result)
      .filter(([key, value]) => !['stressed', 'confused', 'tired'].includes(key) && value > 0.1)
      .map(([key, value]) => `${key}: ${Math.round(value * 100)}%`)
      .join(', ') || 'neutral'}`);

    return result;
  }, [confidenceThreshold]);

  // Load models
  const loadModels = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Loading face-api.js models...');

      const modelUrl = process.env.PUBLIC_URL + '/models';
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl),
        faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
      ]);

      console.log('✅ Face detection models loaded successfully!');
      setModelsLoaded(true);
    } catch (err) {
      console.error('❌ Model loading error:', err);
      setError('Failed to load models');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('🔄 Starting camera...');
      
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
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });
        
        console.log('✅ Camera started successfully!');
      }
    } catch (err) {
      console.error('❌ Camera error:', err);
      setError('Failed to access camera');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // **SUPER FAST AND RESPONSIVE EMOTION DETECTION**
  const detectEmotions = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) {
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      // Fast detection with lower confidence for better responsiveness
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ 
          minConfidence: 0.5, // Lower for better detection
          maxResults: 1
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
        // Draw face rectangle
        if (ctx) {
          ctx.save();
          ctx.scale(-1, 1); // Flip for mirror effect
          ctx.translate(-canvas.width, 0);
          
          resizedDetections.forEach((detection) => {
            const { x, y, width, height } = detection.detection.box;
            
            ctx.strokeStyle = '#00ff41';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
          });
          
          ctx.restore();
        }

        // Process emotions - SUPER RESPONSIVE!
        const primaryFace = resizedDetections[0];
        
        if (primaryFace?.expressions) {
          const processedEmotions = processEmotions(primaryFace.expressions);
          
          // Update immediately - no delays!
          setCurrentEmotions(processedEmotions);
          
          const mappedFaces: FaceDetection[] = resizedDetections.map(detection => ({
            detection: detection.detection,
            expressions: detection.expressions,
          }));
          
          setFaces(mappedFaces);

          if (onEmotionDetected) {
            onEmotionDetected(processedEmotions, mappedFaces);
          }
        }
      } else {
        // No face detected
        setCurrentEmotions(null);
        setFaces([]);
      }
    } catch (err) {
      console.error('❌ Detection error:', err);
    }
  }, [modelsLoaded, onEmotionDetected, processEmotions]);

  // Start detection
  const startDetection = useCallback(async () => {
    console.log('🚀 Starting SUPER RESPONSIVE emotion detection...');
    
    if (!modelsLoaded) {
      await loadModels();
    }

    await startCamera();
    setIsDetecting(true);

    intervalRef.current = setInterval(detectEmotions, detectionInterval);
    console.log(`✅ Super responsive detection started! (${detectionInterval}ms interval)`);
  }, [modelsLoaded, loadModels, startCamera, detectEmotions, detectionInterval]);

  // Stop detection
  const stopDetection = useCallback(() => {
    console.log('🛑 Stopping detection...');
    setIsDetecting(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    stopCamera();
    setCurrentEmotions(null);
    setFaces([]);

    // Clear history
    emotionHistoryRef.current = [];

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    
    console.log('✅ Detection stopped');
  }, [stopCamera]);

  // Load models on mount
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
