import React, { useState, useEffect, useRef } from 'react';
import { dataService } from '../services/dataService';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Video, Pause, Play, Volume2, VolumeX, Maximize2, Minimize2,
    Users, Clock, Eye, MessageSquare, ChevronLeft, ChevronRight,
    Radio, Circle, User, Loader, RefreshCw, Download, Share2,
    AlertCircle, CheckCircle, XCircle, BarChart2, Calendar
} from 'lucide-react';
import { CandidateProfile } from '../types';

interface LiveSession {
    id: string;
    candidateId: string;
    candidateName: string;
    candidateImage?: string;
    skill: string;
    difficulty: string;
    status: 'waiting' | 'in_progress' | 'completed' | 'paused';
    startedAt: string;
    currentQuestion: number;
    totalQuestions: number;
    timeElapsed: number;
    timeRemaining: number;
    viewers: number;
}

interface AssessmentRecording {
    id: string;
    candidateId: string;
    candidateName: string;
    candidateImage?: string;
    skill: string;
    difficulty: string;
    recordedAt: string;
    duration: number;
    score: number;
    passed: boolean;
    videoUrl?: string;
    highlights: {
        timestamp: number;
        label: string;
        type: 'positive' | 'negative' | 'neutral';
    }[];
}

interface LiveAssessmentViewerProps {
    mode: 'live' | 'recordings';
    onClose?: () => void;
}



export const LiveAssessmentViewer: React.FC<LiveAssessmentViewerProps> = ({
    mode = 'live',
    onClose
}) => {
    const [activeMode, setActiveMode] = useState<'live' | 'recordings'>(mode);
    const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
    const [selectedRecording, setSelectedRecording] = useState<AssessmentRecording | null>(null);
    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [recordings, setRecordings] = useState<AssessmentRecording[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [fetchedSessions, fetchedRecordings] = await Promise.all([
                    dataService.getLiveSessions(),
                    dataService.getRecordings()
                ]);

                setSessions(fetchedSessions);

                // Transform recording generic data to AssessmentRecording type
                const transformedRecordings: AssessmentRecording[] = fetchedRecordings.map(r => ({
                    id: r.id,
                    candidateId: r.user_id,
                    candidateName: r.user?.name || 'Unknown',
                    candidateImage: undefined, // Add image if available in profile join
                    skill: r.assessment?.title || 'Assessment',
                    difficulty: r.assessment?.difficulty || 'Medium',
                    recordedAt: r.submitted_at || new Date().toISOString(),
                    duration: 1800, // Mock duration or calc from events
                    score: r.score,
                    passed: r.passed,
                    videoUrl: r.video_url,
                    highlights: [] // Mock or fetch highlights
                }));

                setRecordings(transformedRecordings);
            } catch (error) {
                console.error('Failed to load assessment data', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Video player states
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [showChat, setShowChat] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Update live session timers
    useEffect(() => {
        if (activeMode === 'live') {
            const interval = setInterval(() => {
                setSessions(prev => prev.map(session => {
                    if (session.status === 'in_progress') {
                        const newTimeElapsed = session.timeElapsed + 1;
                        const newTimeRemaining = Math.max(0, session.timeRemaining - 1);
                        return {
                            ...session,
                            timeElapsed: newTimeElapsed,
                            timeRemaining: newTimeRemaining,
                            status: newTimeRemaining === 0 ? 'completed' : session.status
                        };
                    }
                    return session;
                }));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [activeMode]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const getStatusColor = (status: LiveSession['status']) => {
        switch (status) {
            case 'in_progress': return 'bg-green-500';
            case 'waiting': return 'bg-yellow-500';
            case 'completed': return 'bg-blue-500';
            case 'paused': return 'bg-orange-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusLabel = (status: LiveSession['status']) => {
        switch (status) {
            case 'in_progress': return 'Live';
            case 'waiting': return 'Starting Soon';
            case 'completed': return 'Completed';
            case 'paused': return 'Paused';
            default: return status;
        }
    };

    const handleSeek = (timestamp: number) => {
        setCurrentTime(timestamp);
        if (videoRef.current) {
            videoRef.current.currentTime = timestamp;
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Video className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">Assessment Viewer</h1>
                            <p className="text-slate-400 text-sm">Watch live or review recordings</p>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-700/50 p-1 rounded-xl flex">
                            <button
                                onClick={() => setActiveMode('live')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeMode === 'live'
                                    ? 'bg-red-500 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Radio className="w-4 h-4" />
                                Live ({sessions.filter(s => s.status === 'in_progress').length})
                            </button>
                            <button
                                onClick={() => setActiveMode('recordings')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeMode === 'recordings'
                                    ? 'bg-purple-500 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Video className="w-4 h-4" />
                                Recordings ({recordings.length})
                            </button>
                        </div>

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-700 rounded-lg transition"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <AnimatePresence mode="wait">
                    {/* Live Sessions View */}
                    {activeMode === 'live' && !selectedSession && (
                        <motion.div
                            key="live-list"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">Active Assessments</h2>
                                    <p className="text-slate-400 text-sm">
                                        {sessions.filter(s => s.status === 'in_progress').length} candidates currently taking assessments
                                    </p>
                                </div>
                                <button
                                    onClick={() => { }}
                                    className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sessions.map(session => (
                                    <motion.div
                                        key={session.id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setSelectedSession(session)}
                                        className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-purple-500/50 transition cursor-pointer group"
                                    >
                                        {/* Video Preview */}
                                        <div className="aspect-video bg-slate-900 relative">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                                                    <img
                                                        src={session.candidateImage || `https://ui-avatars.com/api/?name=${session.candidateName}`}
                                                        alt={session.candidateName}
                                                        className="w-16 h-16 rounded-full object-cover"
                                                    />
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="absolute top-3 left-3 flex items-center gap-2">
                                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${session.status === 'in_progress' ? 'bg-red-500' : 'bg-slate-700'
                                                    }`}>
                                                    {session.status === 'in_progress' && (
                                                        <Circle className="w-2 h-2 fill-current animate-pulse" />
                                                    )}
                                                    {getStatusLabel(session.status)}
                                                </div>
                                            </div>

                                            {/* Viewers */}
                                            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 rounded-full text-xs">
                                                <Eye className="w-3 h-3" />
                                                {session.viewers}
                                            </div>

                                            {/* Play overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                                    <Play className="w-8 h-8 text-white ml-1" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-4">
                                            <h3 className="font-bold text-white mb-1">{session.candidateName}</h3>
                                            <p className="text-slate-400 text-sm mb-3">
                                                {session.skill} • {session.difficulty}
                                            </p>

                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-4 text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTime(session.timeElapsed)}
                                                    </span>
                                                    <span>
                                                        Q{session.currentQuestion}/{session.totalQuestions}
                                                    </span>
                                                </div>

                                                {session.status === 'in_progress' && (
                                                    <div className="flex items-center gap-1 text-green-400">
                                                        <Circle className="w-2 h-2 fill-current animate-pulse" />
                                                        Active
                                                    </div>
                                                )}
                                            </div>

                                            {/* Progress bar */}
                                            <div className="mt-3 h-1 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-500 transition-all"
                                                    style={{ width: `${(session.currentQuestion / session.totalQuestions) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {sessions.length === 0 && (
                                <div className="text-center py-16">
                                    <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold mb-2">No Active Assessments</h3>
                                    <p className="text-slate-400">Check back later to watch candidates in action</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Live Session Viewing */}
                    {activeMode === 'live' && selectedSession && (
                        <motion.div
                            key="live-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <button
                                onClick={() => setSelectedSession(null)}
                                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back to sessions
                            </button>

                            <div className="grid lg:grid-cols-3 gap-6">
                                {/* Video Player */}
                                <div className="lg:col-span-2">
                                    <div className="bg-slate-800 rounded-2xl overflow-hidden">
                                        <div className="aspect-video bg-black relative">
                                            {/* Placeholder for actual video stream */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <img
                                                            src={selectedSession.candidateImage}
                                                            alt={selectedSession.candidateName}
                                                            className="w-20 h-20 rounded-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 text-red-400 justify-center">
                                                        <Circle className="w-3 h-3 fill-current animate-pulse" />
                                                        <span className="font-medium">Live Assessment in Progress</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status overlay */}
                                            <div className="absolute top-4 left-4 flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 rounded-full text-sm font-bold">
                                                    <Circle className="w-2 h-2 fill-current animate-pulse" />
                                                    LIVE
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 rounded-full text-sm">
                                                    <Eye className="w-4 h-4" />
                                                    {selectedSession.viewers + 1} watching
                                                </div>
                                            </div>

                                            {/* Timer */}
                                            <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 rounded-full text-sm font-mono">
                                                <Clock className="w-4 h-4 inline mr-2" />
                                                {formatTime(selectedSession.timeRemaining)} remaining
                                            </div>
                                        </div>

                                        {/* Controls */}
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => setIsMuted(!isMuted)}
                                                    className="p-2 hover:bg-slate-700 rounded-lg"
                                                >
                                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setShowChat(!showChat)}
                                                    className={`p-2 rounded-lg transition ${showChat ? 'bg-purple-500' : 'hover:bg-slate-700'}`}
                                                >
                                                    <MessageSquare className="w-5 h-5" />
                                                </button>
                                                <button className="p-2 hover:bg-slate-700 rounded-lg">
                                                    <Maximize2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-4">
                                    {/* Candidate Info */}
                                    <div className="bg-slate-800 rounded-xl p-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <img
                                                src={selectedSession.candidateImage}
                                                alt={selectedSession.candidateName}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                            <div>
                                                <h3 className="font-bold">{selectedSession.candidateName}</h3>
                                                <p className="text-slate-400 text-sm">{selectedSession.skill}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="bg-slate-700/50 rounded-lg p-3">
                                                <p className="text-slate-400">Difficulty</p>
                                                <p className="font-bold">{selectedSession.difficulty}</p>
                                            </div>
                                            <div className="bg-slate-700/50 rounded-lg p-3">
                                                <p className="text-slate-400">Progress</p>
                                                <p className="font-bold">Q{selectedSession.currentQuestion}/{selectedSession.totalQuestions}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assessment Progress */}
                                    <div className="bg-slate-800 rounded-xl p-4">
                                        <h4 className="font-bold mb-3">Assessment Progress</h4>
                                        <div className="space-y-3">
                                            {Array.from({ length: selectedSession.totalQuestions }).map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center gap-3 p-2 rounded-lg ${idx < selectedSession.currentQuestion ? 'bg-green-500/20' :
                                                        idx === selectedSession.currentQuestion ? 'bg-purple-500/20 border border-purple-500/50' :
                                                            'bg-slate-700/50'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx < selectedSession.currentQuestion ? 'bg-green-500' :
                                                        idx === selectedSession.currentQuestion ? 'bg-purple-500' :
                                                            'bg-slate-600'
                                                        }`}>
                                                        {idx < selectedSession.currentQuestion ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                                                    </div>
                                                    <span className="text-sm">
                                                        {idx < selectedSession.currentQuestion ? 'Completed' :
                                                            idx === selectedSession.currentQuestion ? 'In Progress' :
                                                                'Pending'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Recordings View */}
                    {activeMode === 'recordings' && !selectedRecording && (
                        <motion.div
                            key="recordings-list"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="mb-6">
                                <h2 className="text-xl font-bold">Assessment Recordings</h2>
                                <p className="text-slate-400 text-sm">Review past candidate assessments</p>
                            </div>

                            <div className="space-y-4">
                                {recordings.map(recording => (
                                    <motion.div
                                        key={recording.id}
                                        whileHover={{ x: 4 }}
                                        onClick={() => setSelectedRecording(recording)}
                                        className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-purple-500/50 transition cursor-pointer flex items-center gap-6"
                                    >
                                        {/* Thumbnail */}
                                        <div className="w-32 aspect-video bg-slate-900 rounded-lg relative flex-shrink-0 overflow-hidden">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <img
                                                    src={recording.candidateImage}
                                                    alt={recording.candidateName}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            </div>
                                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-xs">
                                                {formatDuration(recording.duration)}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold">{recording.candidateName}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${recording.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {recording.passed ? 'Passed' : 'Failed'}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-sm mb-2">
                                                {recording.skill} • {recording.difficulty}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(recording.recordedAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <BarChart2 className="w-3 h-3" />
                                                    Score: {recording.score}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold ${recording.score >= 80 ? 'bg-green-500/20 text-green-400' :
                                            recording.score >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                            {recording.score}
                                        </div>

                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Recording Playback */}
                    {activeMode === 'recordings' && selectedRecording && (
                        <motion.div
                            key="recording-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <button
                                onClick={() => setSelectedRecording(null)}
                                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back to recordings
                            </button>

                            <div className="grid lg:grid-cols-3 gap-6">
                                {/* Video Player */}
                                <div className="lg:col-span-2">
                                    <div className="bg-slate-800 rounded-2xl overflow-hidden">
                                        <div className="aspect-video bg-black relative">
                                            {/* Placeholder for actual video */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <img
                                                            src={selectedRecording.candidateImage}
                                                            alt={selectedRecording.candidateName}
                                                            className="w-20 h-20 rounded-full object-cover"
                                                        />
                                                    </div>
                                                    <p className="text-slate-400">Recording Playback</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress bar with highlights */}
                                        <div className="px-4 py-2">
                                            <div className="relative h-2 bg-slate-700 rounded-full">
                                                <div
                                                    className="absolute h-full bg-purple-500 rounded-full"
                                                    style={{ width: `${(currentTime / selectedRecording.duration) * 100}%` }}
                                                />
                                                {selectedRecording.highlights.map((highlight, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleSeek(highlight.timestamp)}
                                                        className={`absolute w-3 h-3 rounded-full -top-0.5 transform -translate-x-1/2 ${highlight.type === 'positive' ? 'bg-green-400' :
                                                            highlight.type === 'negative' ? 'bg-red-400' :
                                                                'bg-yellow-400'
                                                            }`}
                                                        style={{ left: `${(highlight.timestamp / selectedRecording.duration) * 100}%` }}
                                                        title={highlight.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Controls */}
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setIsPlaying(!isPlaying)}
                                                    className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center"
                                                >
                                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                                </button>
                                                <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-slate-700 rounded-lg">
                                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                                </button>
                                                <span className="text-sm font-mono text-slate-400">
                                                    {formatTime(currentTime)} / {formatTime(selectedRecording.duration)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 hover:bg-slate-700 rounded-lg">
                                                    <Download className="w-5 h-5" />
                                                </button>
                                                <button className="p-2 hover:bg-slate-700 rounded-lg">
                                                    <Share2 className="w-5 h-5" />
                                                </button>
                                                <button className="p-2 hover:bg-slate-700 rounded-lg">
                                                    <Maximize2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-4">
                                    {/* Result Summary */}
                                    <div className={`rounded-xl p-6 text-center ${selectedRecording.passed ? 'bg-green-500/20' : 'bg-red-500/20'
                                        }`}>
                                        <div className={`w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl font-bold ${selectedRecording.passed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                            }`}>
                                            {selectedRecording.score}
                                        </div>
                                        <h3 className="font-bold text-lg">
                                            {selectedRecording.passed ? 'Assessment Passed' : 'Assessment Failed'}
                                        </h3>
                                        <p className="text-slate-400 text-sm">{selectedRecording.skill} • {selectedRecording.difficulty}</p>
                                    </div>

                                    {/* Key Moments */}
                                    <div className="bg-slate-800 rounded-xl p-4">
                                        <h4 className="font-bold mb-3">Key Moments</h4>
                                        <div className="space-y-2">
                                            {selectedRecording.highlights.map((highlight, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSeek(highlight.timestamp)}
                                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition text-left"
                                                >
                                                    <div className={`w-2 h-2 rounded-full ${highlight.type === 'positive' ? 'bg-green-400' :
                                                        highlight.type === 'negative' ? 'bg-red-400' :
                                                            'bg-yellow-400'
                                                        }`} />
                                                    <span className="text-sm flex-1">{highlight.label}</span>
                                                    <span className="text-xs text-slate-400 font-mono">
                                                        {formatTime(highlight.timestamp)}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Candidate Info */}
                                    <div className="bg-slate-800 rounded-xl p-4">
                                        <h4 className="font-bold mb-3">Candidate</h4>
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={selectedRecording.candidateImage}
                                                alt={selectedRecording.candidateName}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                            <div>
                                                <p className="font-bold">{selectedRecording.candidateName}</p>
                                                <p className="text-slate-400 text-sm">{formatDate(selectedRecording.recordedAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default LiveAssessmentViewer;
