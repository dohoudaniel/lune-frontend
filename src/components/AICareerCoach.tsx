import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, MessageSquare, Send, Sparkles, Target, TrendingUp,
    Briefcase, GraduationCap, DollarSign, MapPin, Clock, ChevronRight,
    FileText, Award, Lightbulb, BarChart2, Users, Star, Zap,
    RefreshCw, ThumbsUp, ThumbsDown, Bookmark, Share2, X, AlertCircle,
    Loader2, Info
} from 'lucide-react';
import { getCareerRecommendations } from '../services/geminiService';
import { api } from '../lib/api';
import type { Job, RecommendedCertification } from '../types';

// ─── Props & internal types ────────────────────────────────────────────────

interface AICareerCoachProps {
    userId: string;
    userName: string;
    currentSkills: Record<string, number>;
    experience: number;
    currentRole?: string;
    onClose?: () => void;
}

interface CoachMessage {
    id: string;
    role: 'coach' | 'user';
    content: string;
    timestamp: Date;
    suggestions?: string[];
    resources?: Resource[];
    jobs?: Job[];
    certifications?: RecommendedCertification[];
}

interface Resource {
    title: string;
    type: 'course' | 'article' | 'job' | 'skill';
    url?: string;
    description: string;
}

// ─── localStorage helpers ─────────────────────────────────────────────────

const serializeMessages = (msgs: CoachMessage[]): string =>
    JSON.stringify(
        msgs.map(m => ({ ...m, timestamp: m.timestamp.toISOString() }))
    );

const deserializeMessages = (raw: string): CoachMessage[] => {
    try {
        const parsed = JSON.parse(raw);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch {
        return [];
    }
};

// ─── Skeleton component ───────────────────────────────────────────────────

const CardSkeleton: React.FC = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="flex justify-between mb-4">
            <div>
                <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-32 bg-gray-100 rounded" />
            </div>
            <div className="h-7 w-20 bg-gray-100 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
            {[0, 1, 2].map(i => (
                <div key={i}>
                    <div className="h-3 w-20 bg-gray-100 rounded mb-1" />
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
            ))}
        </div>
    </div>
);

// ─── Error banner ─────────────────────────────────────────────────────────

interface ErrorBannerProps {
    message: string;
    onRetry: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="flex-1 text-sm">{message}</p>
        <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition"
        >
            <RefreshCw className="w-4 h-4" />
            Retry
        </button>
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────

export const AICareerCoach: React.FC<AICareerCoachProps> = ({
    userId,
    userName,
    currentSkills,
    experience,
    currentRole = 'Frontend Developer',
    onClose
}) => {
    const chatStorageKey = `lune_career_chat_${userId}`;

    // ── state ──────────────────────────────────────────────────────────────
    const [messages, setMessages] = useState<CoachMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'chat' | 'paths' | 'salary' | 'resume'>('chat');

    // Paths tab
    const [pathJobs, setPathJobs] = useState<Job[]>([]);
    const [pathCerts, setPathCerts] = useState<RecommendedCertification[]>([]);
    const [pathsLoading, setPathsLoading] = useState(false);
    const [pathsError, setPathsError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ── scroll to bottom on new messages ──────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // ── load persisted chat history on mount ──────────────────────────────
    useEffect(() => {
        const stored = localStorage.getItem(chatStorageKey);
        const loaded = stored ? deserializeMessages(stored) : [];

        if (loaded.length === 0) {
            // Show greeting only on first visit
            const greeting: CoachMessage = {
                id: 'greeting',
                role: 'coach',
                content: `Hi ${userName}! I'm your AI Career Coach. Based on your profile, you're a ${currentRole} with ${experience} year${experience !== 1 ? 's' : ''} of experience and skills in ${Object.keys(currentSkills).slice(0, 3).join(', ')}.\n\nHow can I help you today?`,
                timestamp: new Date(),
                suggestions: [
                    'What career paths are available to me?',
                    'How can I increase my salary?',
                    'What skills should I learn next?',
                    'Help me prepare for interviews'
                ]
            };
            setMessages([greeting]);
            localStorage.setItem(chatStorageKey, serializeMessages([greeting]));
        } else {
            setMessages(loaded);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // ── fetch career paths ─────────────────────────────────────────────────
    const fetchCareerPaths = useCallback(async () => {
        setPathsLoading(true);
        setPathsError(null);
        try {
            const { jobs, certifications } = await getCareerRecommendations(currentSkills);
            setPathJobs(jobs);
            setPathCerts(certifications);
        } catch {
            setPathsError('Could not load career recommendations. Please try again.');
        } finally {
            setPathsLoading(false);
        }
    }, [currentSkills]);

    // Load paths when the tab is first opened
    const pathsLoadedRef = useRef(false);
    useEffect(() => {
        if (activeTab === 'paths' && !pathsLoadedRef.current) {
            pathsLoadedRef.current = true;
            fetchCareerPaths();
        }
    }, [activeTab, fetchCareerPaths]);

    // ── send message ───────────────────────────────────────────────────────
    const sendMessage = async (text: string) => {
        if (!text.trim() || isTyping) return;
        setChatError(null);

        const userMessage: CoachMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        const updatedWithUser = [...messages, userMessage];
        setMessages(updatedWithUser);
        setInput('');
        setIsTyping(true);

        try {
            // Call backend — career-recommendations accepts skills + an optional query field.
            // The backend Gemini layer handles the query contextually.
            const result = await api.post('/ai/chat/', {
                messages: updatedWithUser.map(m => ({ role: m.role, content: m.content })),
                skills: currentSkills,
                experience: experience,
                role: currentRole
            });

            const jobs: Job[] = result?.jobs ?? [];
            const certifications: RecommendedCertification[] = result?.certifications ?? [];
            const aiMessage: string = result?.message ?? '';

            // Build a meaningful coach message from the response
            let content = aiMessage;

            if (jobs.length > 0 || certifications.length > 0) {
                const parts: string[] = [];
                if (content) parts.push(content);

                if (jobs.length > 0) {
                    parts.push(`Based on your profile, here are some relevant opportunities:
${jobs.slice(0, 3).map(j => `• **${j.title}** at ${j.company}${j.salary ? ` — ${j.salary}` : ''}${j.location ? ` (${j.location})` : ''}`).join('
')}`);
                }

                if (certifications.length > 0) {
                    parts.push(`Recommended certifications to boost your profile:
${certifications.slice(0, 3).map(c => `• **${c.name}** (${c.provider}) — ${c.reason}`).join('
')}`);
                }

                content = parts.join('

');
            } else if (!content) {
                // Fallback
                content = buildFallbackResponse(text, currentSkills, experience, currentRole);
            }

            const coachMessage: CoachMessage = {
                id: `coach-${Date.now()}`,
                role: 'coach',
                content,
                timestamp: new Date(),
                jobs: jobs.slice(0, 3),
                certifications: certifications.slice(0, 3),
                suggestions: [
                    'Show me more career paths',
                    'What skills should I focus on?',
                    'Help me prepare for interviews',
                    'How can I negotiate a higher salary?'
                ]
            };

            const final = [...updatedWithUser, coachMessage];
            setMessages(final);
            localStorage.setItem(chatStorageKey, serializeMessages(final));
        } catch {
            setChatError('The career coach could not respond right now. Please try again.');
            // Roll back the user message from view so it's clear the exchange failed
            setMessages(updatedWithUser);
            localStorage.setItem(chatStorageKey, serializeMessages(updatedWithUser));
        } finally {
            setIsTyping(false);
        }
    };

    // ── fallback response builder (no hardcoded salary/path data) ─────────
    const buildFallbackResponse = (
        query: string,
        skills: Record<string, number>,
        exp: number,
        role: string
    ): string => {
        const lower = query.toLowerCase();
        const topSkills = Object.entries(skills)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([s]) => s);

        if (lower.includes('interview')) {
            return `Let's get you interview-ready!\n\nFocus on:\n1. **Technical rounds** — practice algorithms and data-structure problems daily\n2. **System design** — be able to design a real product end-to-end\n3. **Behavioural rounds** — prepare 5–7 STAR stories around your ${role} experience\n\nWould you like a mock interview question?`;
        }
        if (lower.includes('skill') || lower.includes('learn')) {
            const strong = Object.entries(skills).filter(([, v]) => v >= 70).map(([s]) => s);
            return `Your strongest skills right now: ${strong.length ? strong.join(', ') : 'still building your foundation'}.\n\nTo accelerate growth, look for skills that complement ${topSkills[0] ?? 'your current stack'} — especially anything in system design, testing, or cloud infrastructure.`;
        }
        if (lower.includes('salary') || lower.includes('pay')) {
            return `For salary guidance, I'd recommend checking live market data on sites like Levels.fyi, Glassdoor, or LinkedIn Salary for your specific role and location — those numbers shift frequently and I want to give you accurate figures rather than estimates.\n\nGeneral tip: quantified achievements on your resume and competing offers are the two biggest salary levers you control.`;
        }

        return `Great question! With ${exp} year${exp !== 1 ? 's' : ''} as a ${role} and your strengths in ${topSkills.join(', ')}, you're well-positioned for career growth.\n\nWhat would you like to explore further?`;
    };

    // ── render ─────────────────────────────────────────────────────────────
    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">AI Career Coach</h1>
                            <p className="text-sm text-gray-500">Your personal career advisor</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Tabs */}
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                            {[
                                { id: 'chat', label: 'Chat', icon: MessageSquare },
                                { id: 'paths', label: 'Paths', icon: TrendingUp },
                                { id: 'salary', label: 'Salary', icon: DollarSign },
                                { id: 'resume', label: 'Resume', icon: FileText }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as 'chat' | 'paths' | 'salary' | 'resume')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${
                                        activeTab === tab.id
                                            ? 'bg-white shadow text-indigo-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {onClose && (
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-hidden">

                {/* ── Chat Tab ─────────────────────────────────────────── */}
                {activeTab === 'chat' && (
                    <div className="h-full flex flex-col">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map(message => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-2xl ${message.role === 'user' ? 'order-2' : ''}`}>
                                        {message.role === 'coach' && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                                    <Brain className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">Career Coach</span>
                                            </div>
                                        )}

                                        <div className={`p-4 rounded-2xl ${
                                            message.role === 'user'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white border border-gray-200 shadow-sm'
                                        }`}>
                                            <div className={`whitespace-pre-wrap ${message.role === 'coach' ? 'prose prose-sm max-w-none' : ''}`}>
                                                {message.content}
                                            </div>
                                        </div>

                                        {/* Inline job cards from API response */}
                                        {message.jobs && message.jobs.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {message.jobs.map((job, idx) => (
                                                    <div key={job.id ?? idx} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                                                        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <Briefcase className="w-4 h-4 text-indigo-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 text-sm truncate">{job.title}</p>
                                                            <p className="text-xs text-gray-500 truncate">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
                                                        </div>
                                                        {job.salary && (
                                                            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap">
                                                                {job.salary}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Inline cert cards from API response */}
                                        {message.certifications && message.certifications.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {message.certifications.map((cert, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                                                        <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <Award className="w-4 h-4 text-purple-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 text-sm truncate">{cert.name}</p>
                                                            <p className="text-xs text-gray-500 truncate">{cert.provider} — {cert.reason}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Suggestions */}
                                        {message.suggestions && message.suggestions.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {message.suggestions.map((suggestion, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => sendMessage(suggestion)}
                                                        disabled={isTyping}
                                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm hover:bg-indigo-100 transition disabled:opacity-50"
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                        <Brain className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                        <span className="text-sm text-gray-500">Thinking…</span>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Error banner above input */}
                        {chatError && (
                            <div className="px-4 pb-2">
                                <ErrorBanner
                                    message={chatError}
                                    onRetry={() => {
                                        setChatError(null);
                                        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                                        if (lastUserMsg) sendMessage(lastUserMsg.content);
                                    }}
                                />
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-200">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                                    placeholder="Ask about careers, skills, interviews…"
                                    disabled={isTyping}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                                />
                                <button
                                    onClick={() => sendMessage(input)}
                                    disabled={!input.trim() || isTyping}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isTyping ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Career Paths Tab ──────────────────────────────────── */}
                {activeTab === 'paths' && (
                    <div className="h-full overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Career Paths</h2>
                            <p className="text-gray-500 mb-6">Personalised opportunities based on your verified skills</p>

                            {/* Error state */}
                            {pathsError && (
                                <div className="mb-6">
                                    <ErrorBanner
                                        message={pathsError}
                                        onRetry={() => {
                                            pathsLoadedRef.current = false;
                                            fetchCareerPaths();
                                        }}
                                    />
                                </div>
                            )}

                            {/* Loading skeletons */}
                            {pathsLoading && (
                                <div className="grid gap-4">
                                    {[0, 1, 2].map(i => <CardSkeleton key={i} />)}
                                </div>
                            )}

                            {/* Empty state */}
                            {!pathsLoading && !pathsError && pathJobs.length === 0 && (
                                <div className="text-center py-16 text-gray-400">
                                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-40" />
                                    <p className="font-medium text-gray-600">No job recommendations yet</p>
                                    <p className="text-sm mt-1">Complete more skill assessments to unlock personalised career paths.</p>
                                </div>
                            )}

                            {/* Job cards */}
                            {!pathsLoading && pathJobs.length > 0 && (
                                <div className="grid gap-4">
                                    {pathJobs.map((job, idx) => (
                                        <motion.div
                                            key={job.id ?? idx}
                                            whileHover={{ scale: 1.01 }}
                                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                                                    <p className="text-gray-500">{job.company}</p>
                                                </div>
                                                {typeof job.matchScore === 'number' && (
                                                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                        job.matchScore >= 80 ? 'bg-green-100 text-green-700' :
                                                        job.matchScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {job.matchScore}% match
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mt-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">Salary</p>
                                                    <p className="font-bold text-green-600">{job.salary || 'Not specified'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Location</p>
                                                    <p className="font-bold text-gray-900">{job.location || 'Remote / Various'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Type</p>
                                                    <p className="font-bold text-gray-900">{job.type || 'Full-time'}</p>
                                                </div>
                                            </div>

                                            {job.required_skills && job.required_skills.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-4">
                                                    {job.required_skills.slice(0, 4).map(skill => (
                                                        <span key={skill} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {job.matchReason && (
                                                <p className="text-sm text-gray-500 mt-3 italic">{job.matchReason}</p>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Certifications */}
                            {!pathsLoading && pathCerts.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended Certifications</h3>
                                    <div className="grid gap-3">
                                        {pathCerts.map((cert, idx) => (
                                            <div key={idx} className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-4">
                                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Award className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{cert.name}</p>
                                                    <p className="text-sm text-gray-500">{cert.provider}</p>
                                                    <p className="text-sm text-gray-600 mt-1">{cert.reason}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Salary Tab ────────────────────────────────────────── */}
                {activeTab === 'salary' && (
                    <div className="h-full overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Salary Insights</h2>

                            {/* Disclaimer banner */}
                            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800">
                                    Salary figures vary widely by location, company size, and negotiation. We recommend cross-referencing with live market data on{' '}
                                    <a href="https://levels.fyi" target="_blank" rel="noopener noreferrer" className="underline font-medium">Levels.fyi</a>,{' '}
                                    <a href="https://glassdoor.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Glassdoor</a>, or{' '}
                                    <a href="https://linkedin.com/salary" target="_blank" rel="noopener noreferrer" className="underline font-medium">LinkedIn Salary</a>{' '}
                                    for accurate, up-to-date ranges for your specific role and region.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                        Salary Boosters
                                    </h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3">
                                            <Zap className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium text-gray-900">Earn a sought-after certification</p>
                                                <p className="text-sm text-gray-500">Cloud, security, and data certs command measurable premiums</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <Zap className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium text-gray-900">Build a quantified portfolio</p>
                                                <p className="text-sm text-gray-500">Show measurable business outcomes, not just tasks completed</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <Zap className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium text-gray-900">Cultivate competing offers</p>
                                                <p className="text-sm text-gray-500">Multiple offers are the single strongest negotiation lever</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <Zap className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium text-gray-900">Target remote-first companies</p>
                                                <p className="text-sm text-gray-500">Remote roles at top-tier firms often pay above local market rates</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 text-purple-500" />
                                        Negotiation Tips
                                    </h3>
                                    <ul className="space-y-3 text-sm text-gray-700">
                                        <li className="flex items-start gap-2">
                                            <Star className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                            Never give the first number — let the employer anchor
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Star className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                            Research live market rates before every conversation
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Star className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                            Negotiate total comp — equity, bonus, and benefits matter
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Star className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                            Always get the final offer in writing before accepting
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-6 bg-indigo-50 rounded-xl p-5 text-center">
                                <p className="text-indigo-800 text-sm font-medium">
                                    Want a salary range for a specific role?
                                </p>
                                <p className="text-indigo-700 text-sm mt-1">
                                    Ask the Career Coach — type your question in the Chat tab and it will pull live data from the backend.
                                </p>
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                                >
                                    Open Chat
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Resume Tab ────────────────────────────────────────── */}
                {activeTab === 'resume' && (
                    <div className="h-full overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume</h2>
                            <p className="text-gray-500 mb-6">AI-powered resume guidance</p>

                            {/* Coming-soon notice replaces the broken upload button */}
                            <div className="bg-white rounded-xl border-2 border-dashed border-indigo-200 p-12 text-center mb-6">
                                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-7 h-7 text-indigo-500" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Resume Analysis — Coming Soon</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    Your AI Skill Passport already captures your verified, proctored skills.
                                    Full resume upload and line-by-line AI feedback will be available in an upcoming release.
                                </p>
                                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium cursor-default select-none">
                                    <Sparkles className="w-4 h-4" />
                                    In development
                                </div>
                            </div>

                            <div className="bg-indigo-50 rounded-xl p-6">
                                <h3 className="font-bold text-indigo-900 mb-4">Resume Tips for Your Level</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">Do</h4>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li>• Quantify achievements with numbers</li>
                                            <li>• Use action verbs (Led, Built, Optimised)</li>
                                            <li>• Include keywords from the job description</li>
                                            <li>• Keep to one page for under 10 years experience</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">Avoid</h4>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li>• Listing every technology you've ever touched</li>
                                            <li>• Generic duty descriptions ("responsible for…")</li>
                                            <li>• Including a personal photo</li>
                                            <li>• Submitting without proofreading</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AICareerCoach;
