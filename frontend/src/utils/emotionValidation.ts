// White Box Testing Suite for Emotion Recognition System
// SWE Practical - Experiment No. 8

// Case Study 1: Emotion Validation Function
function validateEmotion(confidence: number, threshold: number = 0.5, isCalibrated: boolean = false): string {
    // Node 1: Entry point
    if (confidence < 0 || confidence > 1) {
        // Node 2: Invalid confidence
        return "INVALID_CONFIDENCE";
    }
    
    // Node 3: Check calibration
    if (isCalibrated) {
        threshold = threshold * 0.8; // Lower threshold for calibrated systems
    }
    
    // Node 4: Check confidence level
    if (confidence >= threshold) {
        // Node 5: High confidence path
        if (confidence >= 0.9) {
            // Node 6: Very high confidence
            return "HIGH_CONFIDENCE";
        }
        // Node 7: Medium confidence
        return "MEDIUM_CONFIDENCE";
    }
    
    // Node 8: Low confidence
    return "LOW_CONFIDENCE";
}

// Case Study 2: Emotion Processing Pipeline
function processEmotionData(emotions: any[], smoothingFactor: number = 0.7, minConfidence: number = 0.4) {
    // Node 1: Entry point
    if (!emotions || emotions.length === 0) {
        // Node 2: Empty data
        return { error: "NO_DATA", result: null };
    }
    
    let processedEmotions = [];
    
    // Node 3: Loop through emotions
    for (let i = 0; i < emotions.length; i++) {
        let emotion = emotions[i];
        
        // Node 4: Check confidence threshold
        if (emotion.confidence >= minConfidence) {
            // Node 5: Apply smoothing
            if (i > 0 && processedEmotions.length > 0) {
                // Node 6: Smooth with previous
                emotion.confidence = (emotion.confidence * smoothingFactor) + 
                                   (processedEmotions[processedEmotions.length - 1].confidence * (1 - smoothingFactor));
            }
            // Node 7: Add to processed
            processedEmotions.push({ ...emotion });
        }
        // Node 8: Skip low confidence (implicit)
    }
    
    // Node 9: Check if any valid emotions
    if (processedEmotions.length === 0) {
        // Node 10: No valid emotions
        return { error: "LOW_CONFIDENCE_DATA", result: null };
    }
    
    // Node 11: Return success
    return { error: null, result: processedEmotions };
}

export { validateEmotion, processEmotionData };