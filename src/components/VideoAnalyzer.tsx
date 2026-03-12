import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Video, Upload, Loader, CheckCircle, XCircle,
    Mic, Eye, Sparkles, TrendingUp, MessageSquare,
    Clock, Volume2, AlertCircle, Download, Share2
} from 'lucide-react';
import {
    analyzeVideoIntroduction,
    VideoAnalysisResult,
    generateInterviewTips,
    analyzeSpeakingPace
} from '../services/videoAnalysisService';

interface VideoAnalyzerProps {
    onAnalysisComplete?: (result: VideoAnalysisResult) => void;
    existingVideoUrl?: string;
}

export const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({
    onAnalysisComplete,
    existingVideoUrl
}) => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(existingVideoUrl || null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<VideoAnalysisResult | null>(null);
    const [tips, setTips] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showTranscript, setShowTranscript] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('video/')) {
            setError('Please select a video file');
            return;
        }

        if (file.size > 100 * 1024 * 1024) { // 100MB limit
            setError('Video must be less than 100MB');
            return;
        }

        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
        setError(null);
        setAnalysis(null);
    };

    const handleAnalyze = async () => {
        if (!videoFile) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const result = await analyzeVideoIntroduction(videoFile);
            setAnalysis(result);

            // Generate tips
            const generatedTips = await generateInterviewTips(result);
            setTips(generatedTips);

            if (onAnalysisComplete) {
                onAnalysisComplete(result);
            }
        } catch (err) {
            setError('Failed to analyze video. Please try again.');
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreBg = (score: number): string => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">AI Video Analysis</h3>
                        <p className="text-sm text-gray-500">Get AI-powered feedback on your introduction</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Upload Area */}
                {!videoUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-purple-400 transition cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Drop your video here or click to upload</p>
                        <p className="text-sm text-gray-400 mt-2">MP4, MOV, WebM up to 100MB</p>
                    </motion.div>
                )}

                {/* Video Preview */}
                {videoUrl && (
                    <div className="space-y-4">
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                            <video
                                ref={videoRef}
                                src={videoUrl}
                                controls
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Action Buttons */}
                        {!analysis && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setVideoUrl(null);
                                        setVideoFile(null);
                                    }}
                                    className="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition"
                                >
                                    Change Video
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Analyze with AI
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-red-700">{error}</p>
                    </motion.div>
                )}

                {/* Analysis Results */}
                <AnimatePresence>
                    {analysis && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mt-6 space-y-6"
                        >
                            {/* Score Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <ScoreCard
                                    label="Overall"
                                    score={analysis.overallScore}
                                    icon={TrendingUp}
                                />
                                <ScoreCard
                                    label="Confidence"
                                    score={analysis.confidenceScore}
                                    icon={Eye}
                                />
                                <ScoreCard
                                    label="Clarity"
                                    score={analysis.clarityScore}
                                    icon={Volume2}
                                />
                                <ScoreCard
                                    label="Professional"
                                    score={analysis.professionalismScore}
                                    icon={MessageSquare}
                                />
                            </div>

                            {/* Summary */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="font-bold text-gray-900 mb-2">Summary</h4>
                                <p className="text-gray-600">{analysis.summary}</p>
                            </div>

                            {/* Keywords */}
                            {analysis.keywords.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-3">Keywords Detected</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.keywords.map((keyword, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Strengths & Improvements */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-green-50 rounded-xl p-4">
                                    <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        Strengths
                                    </h4>
                                    <ul className="space-y-2">
                                        {analysis.strengths.map((strength, idx) => (
                                            <li key={idx} className="text-green-700 text-sm flex items-start gap-2">
                                                <span className="text-green-500 mt-1">•</span>
                                                {strength}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-amber-50 rounded-xl p-4">
                                    <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" />
                                        Areas to Improve
                                    </h4>
                                    <ul className="space-y-2">
                                        {analysis.improvements.map((improvement, idx) => (
                                            <li key={idx} className="text-amber-700 text-sm flex items-start gap-2">
                                                <span className="text-amber-500 mt-1">•</span>
                                                {improvement}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Transcript Toggle */}
                            <div>
                                <button
                                    onClick={() => setShowTranscript(!showTranscript)}
                                    className="text-purple-600 font-medium text-sm flex items-center gap-2 hover:text-purple-700"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    {showTranscript ? 'Hide Transcript' : 'Show Full Transcript'}
                                </button>

                                <AnimatePresence>
                                    {showTranscript && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
                                        >
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {analysis.transcription}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* AI Tips */}
                            {tips.length > 0 && (
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-500" />
                                        AI Interview Tips
                                    </h4>
                                    <ul className="space-y-2">
                                        {tips.map((tip, idx) => (
                                            <li key={idx} className="text-gray-700 text-sm flex items-start gap-3">
                                                <span className="w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                                    {idx + 1}
                                                </span>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Re-analyze Button */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setAnalysis(null);
                                        setVideoUrl(null);
                                        setVideoFile(null);
                                    }}
                                    className="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload New Video
                                </button>
                                <button
                                    className="py-3 px-4 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                                <button
                                    className="py-3 px-4 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// Score Card Component
interface ScoreCardProps {
    label: string;
    score: number;
    icon: React.FC<{ className?: string }>;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ label, score, icon: Icon }) => {
    const getColor = (s: number) => {
        if (s >= 80) return { bg: 'bg-green-100', text: 'text-green-600', ring: 'ring-green-500' };
        if (s >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-600', ring: 'ring-yellow-500' };
        return { bg: 'bg-red-100', text: 'text-red-600', ring: 'ring-red-500' };
    };

    const colors = getColor(score);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${colors.bg} rounded-xl p-4 text-center`}
        >
            <Icon className={`w-6 h-6 ${colors.text} mx-auto mb-2`} />
            <p className={`text-2xl font-bold ${colors.text}`}>{score}</p>
            <p className="text-xs text-gray-600 mt-1">{label}</p>
        </motion.div>
    );
};

export default VideoAnalyzer;
