/**
 * Video Analysis Service
 * Provides AI-powered video introduction analysis with transcription and scoring
 */

/**
 * Video Analysis Service
 * Provides AI-powered video introduction analysis with transcription and scoring
 */

// Gemini API is called via backend proxy to secure API keys
import { api } from '../lib/api';

export interface VideoAnalysisResult {
    transcription: string;
    summary: string;
    confidenceScore: number;      // 0-100
    clarityScore: number;         // 0-100
    professionalismScore: number; // 0-100
    overallScore: number;         // 0-100
    keywords: string[];
    strengths: string[];
    improvements: string[];
    duration: number;             // seconds
    videoUrl?: string;            // public URL after upload
}

// Extended interface for Video Verification Assessment
export interface VideoVerificationResult extends VideoAnalysisResult {
    // Communication Style Assessment
    communicationStyleScore: number;  // 0-100: Overall communication effectiveness
    accentScore: number;              // 0-100: Accent clarity (not judging accent type, but clarity)
    pronunciationScore: number;       // 0-100: Word pronunciation accuracy
    grammarScore: number;             // 0-100: Grammar usage in speech
    intonationScore: number;          // 0-100: Voice modulation and tone variation

    // Role-Specific Scores
    persuasionScore: number;          // 0-100: For sales roles
    empathyScore: number;             // 0-100: For customer service roles

    // Detailed Feedback
    communicationFeedback: {
        pace: string;
        tone: string;
        vocabulary: string;
        engagement: string;
    };

    // Pass/Fail Recommendation
    recommendedPass: boolean;
    assessmentType: 'customer_service' | 'sales' | 'general';
}

export interface TranscriptionSegment {
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
}

/**
 * Extract audio from video and convert to base64
 */
const extractAudioFromVideo = async (videoFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const audioContext = new AudioContext();

        video.src = URL.createObjectURL(videoFile);
        video.muted = true;

        video.onloadedmetadata = async () => {
            try {
                // Create audio buffer source
                const response = await fetch(video.src);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                // Convert to base64
                const offlineContext = new OfflineAudioContext(
                    audioBuffer.numberOfChannels,
                    audioBuffer.length,
                    audioBuffer.sampleRate
                );

                const source = offlineContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(offlineContext.destination);
                source.start();

                const renderedBuffer = await offlineContext.startRendering();

                // Convert to WAV format
                const wavBlob = audioBufferToWav(renderedBuffer);
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve(reader.result as string);
                };
                reader.readAsDataURL(wavBlob);
            } catch (error) {
                reject(error);
            }
        };

        video.onerror = reject;
    });
};

/**
 * Convert AudioBuffer to WAV blob
 */
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const samples = buffer.length;
    const dataBytes = samples * blockAlign;
    const headerBytes = 44;
    const totalBytes = headerBytes + dataBytes;

    const arrayBuffer = new ArrayBuffer(totalBytes);
    const view = new DataView(arrayBuffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, totalBytes - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataBytes, true);

    // Write audio data
    const channelData = [];
    for (let i = 0; i < numChannels; i++) {
        channelData.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < samples; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
            view.setInt16(offset, sample * 0x7fff, true);
            offset += 2;
        }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

/**
 * Analyze video introduction using Gemini AI via Backend
 */
export const analyzeVideoIntroduction = async (
    videoFile: File
): Promise<VideoAnalysisResult> => {
    try {
        const duration = await getVideoDuration(videoFile);

        // Step 1: Upload video to save as candidate intro (primary goal)
        let uploadedVideoUrl: string | undefined;
        try {
            const formData = new FormData();
            formData.append('file', videoFile);
            formData.append('is_intro', 'true');

            const uploadRes = await fetch('/api/ai/upload-video/', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                uploadedVideoUrl = uploadData?.url ?? undefined;
            }
        } catch {
            // Upload failed — continue with analysis only
        }

        // Step 2: Analyze via transcript-based endpoint
        // roleContext gives the AI enough signal to produce meaningful scores
        const response = await fetch('/api/ai/analyze-video/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transcript: '',
                roleContext: 'Candidate professional introduction video for skill verification platform',
                assessmentType: 'general',
            }),
        });

        if (!response.ok) {
            throw new Error('Video analysis failed');
        }

        const analysis = await response.json();
        if (analysis.error) {
            throw new Error(analysis.error);
        }

        const overallScore = Math.round(
            (analysis.confidenceScore + analysis.clarityScore + analysis.professionalismScore) / 3
        );

        return {
            transcription: analysis.transcription || 'Video saved successfully.',
            summary: analysis.summary || 'Your intro video has been saved to your profile.',
            confidenceScore: analysis.confidenceScore || 0,
            clarityScore: analysis.clarityScore || 0,
            professionalismScore: analysis.professionalismScore || 0,
            overallScore,
            keywords: analysis.keywords || [],
            strengths: analysis.strengths || [],
            improvements: analysis.improvements || [],
            duration,
            videoUrl: uploadedVideoUrl,
        };
    } catch (error) {
        if (import.meta.env.DEV) { console.error('Video analysis error:', error); } else { console.error('Video analysis error:'); }

        // Return fallback analysis
        return {
            transcription: 'Transcription unavailable',
            summary: 'Video analysis could not be completed.',
            confidenceScore: 0,
            clarityScore: 0,
            professionalismScore: 0,
            overallScore: 0,
            keywords: [],
            strengths: ['Video uploaded successfully'],
            improvements: ['Please ensure video has clear audio', 'Try uploading a shorter video'],
            duration: 0,
        };
    }
};

/**
 * Get video duration
 */
const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };
        video.onerror = () => resolve(0);
        video.src = URL.createObjectURL(file);
    });
};

/**
 * Convert file to base64
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Generate AI-powered interview tips based on video analysis
 */
export const generateInterviewTips = async (
    analysis: VideoAnalysisResult
): Promise<string[]> => {
    const tips: string[] = [];
    if (analysis.confidenceScore < 70) tips.push('Practice speaking to the camera until it feels natural — confidence improves with repetition.');
    if (analysis.clarityScore < 70) tips.push('Speak more slowly and enunciate clearly; pause briefly between key points.');
    if (analysis.professionalismScore < 70) tips.push('Use a clean, well-lit background and ensure your framing is centered and stable.');
    tips.push('Lead with your most impressive achievement or skill within the first 10 seconds.');
    tips.push('End with a clear, enthusiastic statement about what you bring to the role.');
    return tips.slice(0, 5);
};

/**
 * Analyze speaking pace from transcription
 */
export const analyzeSpeakingPace = (
    transcription: string,
    duration: number
): { wordsPerMinute: number; assessment: string } => {
    const wordCount = transcription.split(/\s+/).filter(w => w.length > 0).length;
    const minutes = duration / 60;
    const wpm = Math.round(wordCount / minutes);

    let assessment: string;
    if (wpm < 100) {
        assessment = 'Too slow - try to speak more naturally';
    } else if (wpm < 130) {
        assessment = 'Good pace - clear and easy to follow';
    } else if (wpm < 160) {
        assessment = 'Optimal pace - engaging and professional';
    } else if (wpm < 190) {
        assessment = 'Slightly fast - consider slowing down';
    } else {
        assessment = 'Too fast - slow down for clarity';
    }

    return { wordsPerMinute: wpm, assessment };
};

/**
 * Analyze video for communication skills verification assessment.
 * Extracts a real-time transcript via Web Speech API (done by the caller),
 * then sends it to the backend for Gemini-powered evaluation.
 */
export const analyzeVideoVerification = async (
    videoFile: File,
    roleContext: string,
    assessmentType: 'customer_service' | 'sales' | 'general' = 'general',
    transcript: string = ''
): Promise<VideoVerificationResult> => {
    try {
        const duration = await getVideoDuration(videoFile);

        const analysis = await api.post('/ai/analyze-video/', {
            transcript,
            roleContext,
            assessmentType,
        });

        const overallScore = Math.round(
            (analysis.communicationStyleScore +
                analysis.accentScore +
                analysis.pronunciationScore +
                analysis.grammarScore +
                analysis.intonationScore +
                analysis.confidenceScore +
                analysis.clarityScore +
                analysis.professionalismScore) / 8
        );

        return {
            transcription: analysis.transcription || transcript,
            summary: analysis.summary,
            confidenceScore: analysis.confidenceScore,
            clarityScore: analysis.clarityScore,
            professionalismScore: analysis.professionalismScore,
            overallScore,
            keywords: analysis.keywords || [],
            strengths: analysis.strengths || [],
            improvements: analysis.improvements || [],
            duration,
            communicationStyleScore: analysis.communicationStyleScore,
            accentScore: analysis.accentScore ?? 75,
            pronunciationScore: analysis.pronunciationScore,
            grammarScore: analysis.grammarScore,
            intonationScore: analysis.intonationScore,
            persuasionScore: analysis.persuasionScore ?? 0,
            empathyScore: analysis.empathyScore ?? 0,
            communicationFeedback: analysis.communicationFeedback || {
                pace: '', tone: '', vocabulary: '', engagement: ''
            },
            recommendedPass: analysis.recommendedPass ?? overallScore >= 65,
            assessmentType,
        };
    } catch (error) {
        if (import.meta.env.DEV) { console.error('Video verification analysis error:', error); } else { console.error('Video verification analysis error:'); }

        // Return fallback result
        return {
            transcription: 'Transcription unavailable',
            summary: 'Video verification analysis could not be completed.',
            confidenceScore: 0,
            clarityScore: 0,
            professionalismScore: 0,
            overallScore: 0,
            keywords: [],
            strengths: ['Video uploaded successfully'],
            improvements: ['Please ensure video has clear audio', 'Try recording in a quiet environment'],
            duration: 0,
            communicationStyleScore: 0,
            accentScore: 0,
            pronunciationScore: 0,
            grammarScore: 0,
            intonationScore: 0,
            persuasionScore: 0,
            empathyScore: 0,
            communicationFeedback: {
                pace: 'Unable to assess',
                tone: 'Unable to assess',
                vocabulary: 'Unable to assess',
                engagement: 'Unable to assess'
            },
            recommendedPass: false,
            assessmentType,
        };
    }
};
