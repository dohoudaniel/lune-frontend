import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Video, Camera, Mic, Square, Play, RotateCcw, Upload,
    Loader, CheckCircle, XCircle, AlertCircle, Volume2,
    MessageSquare, TrendingUp, Heart, Sparkles, Clock,
    ThumbsUp, ThumbsDown, Eye, Zap
} from 'lucide-react';
import {
    analyzeVideoVerification,
    VideoVerificationResult,
} from '../services/videoAnalysisService';
import { DifficultyLevel } from '../types';

interface VideoVerificationAssessmentProps {
    skill: string;
    difficulty: DifficultyLevel;
    rolePlayPrompt?: string;
    onComplete: (result: VideoVerificationResult, passed: boolean) => void;
    onCancel?: () => void;
}

type RecordingState = 'idle' | 'countdown' | 'recording' | 'preview' | 'analyzing' | 'results';

export const VideoVerificationAssessment: React.FC<VideoVerificationAssessmentProps> = ({
    skill,
    difficulty,
    rolePlayPrompt,
    onComplete,
    onCancel
}) => {
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [countdown, setCountdown] = useState(3);
    const [recordingTime, setRecordingTime] = useState(0);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<VideoVerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const MAX_RECORDING_TIME = 120; // 2 minutes max
    const MIN_RECORDING_TIME = 30; // 30 seconds min

    // Determine assessment type based on skill
    const getAssessmentType = (): 'customer_service' | 'sales' | 'general' => {
        const lowerSkill = skill.toLowerCase();
        if (lowerSkill.includes('customer') || lowerSkill.includes('support') || lowerSkill.includes('help desk')) {
            return 'customer_service';
        }
        if (lowerSkill.includes('sales') || lowerSkill.includes('business development') || lowerSkill.includes('account')) {
            return 'sales';
        }
        return 'general';
    };

    // Generate role-play scenario based on skill
    const getDefaultPrompt = (): string => {
        const assessmentType = getAssessmentType();
        const prompts = {
            customer_service: `A customer calls you frustrated because their order arrived damaged. They've been a loyal customer for 3 years. Record your response as if you were speaking directly to this customer. Demonstrate how you would handle the situation, show empathy, and work towards a resolution.`,
            sales: `You're on a discovery call with a potential client who is interested in your company's services but is hesitant about the price. Record your response demonstrating how you would handle their objection and move towards closing the deal.`,
            general: `Introduce yourself as a ${skill} professional. Explain your approach to work, highlight a key achievement, and describe how you handle challenging situations in your role.`
        };
        return prompts[assessmentType];
    };

    const prompt = rolePlayPrompt || getDefaultPrompt();

    // Start camera preview
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: 'user' },
                audio: true
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError('Unable to access camera. Please allow camera permissions.');
            console.error(err);
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    // Start countdown before recording
    const startCountdown = () => {
        setRecordingState('countdown');
        setCountdown(3);

        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownIntervalRef.current!);
                    startRecording();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Start recording
    const startRecording = () => {
        if (!streamRef.current) return;

        chunksRef.current = [];
        const mediaRecorder = new MediaRecorder(streamRef.current, {
            mimeType: 'video/webm;codecs=vp9'
        });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            setVideoBlob(blob);
            setVideoUrl(URL.createObjectURL(blob));
            setRecordingState('preview');
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(1000);
        setRecordingState('recording');
        setRecordingTime(0);

        // Recording timer
        recordingIntervalRef.current = setInterval(() => {
            setRecordingTime(prev => {
                if (prev >= MAX_RECORDING_TIME - 1) {
                    stopRecording();
                    return MAX_RECORDING_TIME;
                }
                return prev + 1;
            });
        }, 1000);
    };

    // Stop recording
    const stopRecording = () => {
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        stopCamera();
    };

    // Re-record
    const handleReRecord = async () => {
        setVideoBlob(null);
        setVideoUrl(null);
        setRecordingTime(0);
        setAnalysis(null);
        setRecordingState('idle');
        await startCamera();
    };

    // Submit for analysis
    const handleSubmit = async () => {
        if (!videoBlob) return;

        setRecordingState('analyzing');
        setError(null);

        try {
            const videoFile = new File([videoBlob], 'assessment.webm', { type: 'video/webm' });
            const result = await analyzeVideoVerification(
                videoFile,
                prompt,
                getAssessmentType()
            );

            setAnalysis(result);
            setRecordingState('results');
        } catch (err) {
            setError('Failed to analyze video. Please try again.');
            setRecordingState('preview');
            console.error(err);
        }
    };

    // Format time display
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get score color
    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreBg = (score: number): string => {
        if (score >= 80) return 'bg-green-100';
        if (score >= 60) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    // Initialize camera on mount
    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        };
    }, []);

    // Handle completion
    const handleComplete = () => {
        if (analysis) {
            onComplete(analysis, analysis.recommendedPass);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm mb-4">
                        <Video className="w-4 h-4" />
                        Video Verification Assessment
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {skill} Assessment
                    </h1>
                    <p className="text-white/60">
                        Difficulty: <span className="text-white font-medium">{difficulty}</span>
                    </p>
                </motion.div>

                {/* Scenario Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                            <MessageSquare className="w-6 h-6 text-purple-300" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-2">Your Scenario</h3>
                            <p className="text-white/80 leading-relaxed">{prompt}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Main Video Area */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-black/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10"
                >
                    {/* Video Preview */}
                    <div className="relative aspect-video bg-black">
                        {recordingState !== 'results' && (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted={recordingState === 'idle' || recordingState === 'countdown' || recordingState === 'recording'}
                                playsInline
                                src={videoUrl || undefined}
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Countdown Overlay */}
                        <AnimatePresence>
                            {recordingState === 'countdown' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center"
                                >
                                    <motion.div
                                        key={countdown}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 1.5, opacity: 0 }}
                                        className="text-9xl font-bold text-white"
                                    >
                                        {countdown}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Recording Indicator */}
                        {recordingState === 'recording' && (
                            <div className="absolute top-4 left-4 flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full">
                                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                    <span className="text-white font-bold text-sm">REC</span>
                                </div>
                                <div className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white font-mono">
                                    {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
                                </div>
                            </div>
                        )}

                        {/* Analyzing Overlay */}
                        {recordingState === 'analyzing' && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                                <Loader className="w-16 h-16 text-purple-500 animate-spin mb-4" />
                                <h3 className="text-white text-xl font-bold mb-2">Analyzing Your Response</h3>
                                <p className="text-white/60">Evaluating communication skills...</p>
                            </div>
                        )}

                        {/* Results View */}
                        {recordingState === 'results' && analysis && (
                            <div className="absolute inset-0 overflow-y-auto p-6 bg-gradient-to-b from-slate-900 to-slate-800">
                                {/* Pass/Fail Banner */}
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-center justify-center gap-3 p-4 rounded-xl mb-6 ${analysis.recommendedPass
                                            ? 'bg-green-500/20 border border-green-500/30'
                                            : 'bg-red-500/20 border border-red-500/30'
                                        }`}
                                >
                                    {analysis.recommendedPass ? (
                                        <>
                                            <CheckCircle className="w-8 h-8 text-green-400" />
                                            <span className="text-green-300 text-xl font-bold">Assessment Passed!</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-8 h-8 text-red-400" />
                                            <span className="text-red-300 text-xl font-bold">Needs Improvement</span>
                                        </>
                                    )}
                                </motion.div>

                                {/* Overall Score */}
                                <div className="text-center mb-6">
                                    <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBg(analysis.overallScore)} mb-2`}>
                                        <span className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                                            {analysis.overallScore}
                                        </span>
                                    </div>
                                    <p className="text-white/60">Overall Score</p>
                                </div>

                                {/* Score Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                    {[
                                        { label: 'Communication', score: analysis.communicationStyleScore, icon: MessageSquare },
                                        { label: 'Pronunciation', score: analysis.pronunciationScore, icon: Volume2 },
                                        { label: 'Grammar', score: analysis.grammarScore, icon: Sparkles },
                                        { label: 'Intonation', score: analysis.intonationScore, icon: Zap },
                                        { label: 'Confidence', score: analysis.confidenceScore, icon: Eye },
                                        { label: 'Clarity', score: analysis.clarityScore, icon: TrendingUp },
                                        { label: 'Empathy', score: analysis.empathyScore, icon: Heart },
                                        { label: 'Persuasion', score: analysis.persuasionScore, icon: ThumbsUp },
                                    ].map(({ label, score, icon: Icon }) => (
                                        <div key={label} className={`${getScoreBg(score)} rounded-xl p-3 text-center`}>
                                            <Icon className={`w-5 h-5 ${getScoreColor(score)} mx-auto mb-1`} />
                                            <p className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</p>
                                            <p className="text-xs text-gray-600">{label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Feedback */}
                                <div className="bg-white/5 rounded-xl p-4 mb-6">
                                    <h4 className="text-white font-bold mb-3">Communication Feedback</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <p className="text-white/50 text-xs mb-1">Pace</p>
                                            <p className="text-white">{analysis.communicationFeedback.pace}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <p className="text-white/50 text-xs mb-1">Tone</p>
                                            <p className="text-white">{analysis.communicationFeedback.tone}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <p className="text-white/50 text-xs mb-1">Vocabulary</p>
                                            <p className="text-white">{analysis.communicationFeedback.vocabulary}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <p className="text-white/50 text-xs mb-1">Engagement</p>
                                            <p className="text-white">{analysis.communicationFeedback.engagement}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Strengths & Improvements */}
                                <div className="grid md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                        <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5" /> Strengths
                                        </h4>
                                        <ul className="space-y-2">
                                            {analysis.strengths.map((s, i) => (
                                                <li key={i} className="text-green-200 text-sm flex items-start gap-2">
                                                    <span className="text-green-400">•</span> {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                        <h4 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5" /> Areas to Improve
                                        </h4>
                                        <ul className="space-y-2">
                                            {analysis.improvements.map((s, i) => (
                                                <li key={i} className="text-amber-200 text-sm flex items-start gap-2">
                                                    <span className="text-amber-400">•</span> {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="p-4 bg-black/20">
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                <p className="text-red-300">{error}</p>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-4">
                            {recordingState === 'idle' && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={startCountdown}
                                    className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition"
                                >
                                    <Camera className="w-5 h-5" />
                                    Start Recording
                                </motion.button>
                            )}

                            {recordingState === 'recording' && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={stopRecording}
                                    disabled={recordingTime < MIN_RECORDING_TIME}
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold transition disabled:opacity-50"
                                >
                                    <Square className="w-5 h-5" />
                                    Stop Recording
                                    {recordingTime < MIN_RECORDING_TIME && (
                                        <span className="text-sm opacity-60">
                                            (min {MIN_RECORDING_TIME}s)
                                        </span>
                                    )}
                                </motion.button>
                            )}

                            {recordingState === 'preview' && (
                                <>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleReRecord}
                                        className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Re-Record
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSubmit}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-bold transition"
                                    >
                                        <Upload className="w-5 h-5" />
                                        Submit for Analysis
                                    </motion.button>
                                </>
                            )}

                            {recordingState === 'results' && (
                                <>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleReRecord}
                                        className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Try Again
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleComplete}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold transition"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Complete Assessment
                                    </motion.button>
                                </>
                            )}
                        </div>

                        {onCancel && recordingState !== 'analyzing' && (
                            <button
                                onClick={onCancel}
                                className="mt-4 w-full text-center text-white/50 hover:text-white/80 text-sm transition"
                            >
                                Cancel Assessment
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Tips */}
                {(recordingState === 'idle' || recordingState === 'countdown') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
                    >
                        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-yellow-400" />
                            Tips for Success
                        </h4>
                        <ul className="grid md:grid-cols-2 gap-2 text-white/70 text-sm">
                            <li className="flex items-center gap-2">✓ Speak clearly and at a moderate pace</li>
                            <li className="flex items-center gap-2">✓ Maintain eye contact with the camera</li>
                            <li className="flex items-center gap-2">✓ Show empathy and professionalism</li>
                            <li className="flex items-center gap-2">✓ Use appropriate body language</li>
                            <li className="flex items-center gap-2">✓ Find a quiet, well-lit location</li>
                            <li className="flex items-center gap-2">✓ Take a moment to think before speaking</li>
                        </ul>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default VideoVerificationAssessment;
