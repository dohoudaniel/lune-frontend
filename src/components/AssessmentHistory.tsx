/**
 * Assessment History Component
 * Displays a candidate's assessment performance over time with trends and analytics
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, TrendingDown, Clock, Award, Target, Calendar,
    ChevronRight, CheckCircle, XCircle, AlertTriangle, BarChart3,
    RefreshCw, Lightbulb, Timer, Shield, ChevronDown
} from 'lucide-react';
import {
    getPerformanceSummary,
    getImprovementSuggestions,
    formatTimeSpent,
    PerformanceSummary,
    AssessmentHistoryEntry,
    AssessmentTrend
} from '../services/assessmentHistoryService';

interface AssessmentHistoryProps {
    candidateId: string;
    onRetakeAssessment?: (skill: string) => void;
}

export const AssessmentHistory: React.FC<AssessmentHistoryProps> = ({
    candidateId,
    onRetakeAssessment
}) => {
    const [summary, setSummary] = useState<PerformanceSummary | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedTrend, setSelectedTrend] = useState<AssessmentTrend | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'trends'>('overview');
    const [loading, setLoading] = useState(true);

    // Load data on mount and when candidateId changes
    useEffect(() => {
        loadData();
    }, [candidateId]);

    const loadData = () => {
        setLoading(true);
        const performanceSummary = getPerformanceSummary(candidateId);
        const improvementSuggestions = getImprovementSuggestions(candidateId);
        setSummary(performanceSummary);
        setSuggestions(improvementSuggestions);
        setLoading(false);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-100';
        if (score >= 60) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-500">Loading assessment history...</p>
            </div>
        );
    }

    if (!summary || summary.totalAssessments === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Assessment History</h3>
                <p className="text-gray-500 mb-4">
                    Complete your first assessment to start tracking your progress over time.
                </p>
                <button
                    onClick={() => onRetakeAssessment?.('')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                >
                    Take an Assessment
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{summary.totalAssessments}</p>
                            <p className="text-xs text-gray-500">Total Assessments</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{summary.passRate}%</p>
                            <p className="text-xs text-gray-500">Pass Rate</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 ${getScoreBg(summary.averageScore)} rounded-lg flex items-center justify-center`}>
                            <Award className={`w-5 h-5 ${getScoreColor(summary.averageScore)}`} />
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${getScoreColor(summary.averageScore)}`}>{summary.averageScore}</p>
                            <p className="text-xs text-gray-500">Avg Score</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Timer className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-purple-600">{formatTimeSpent(summary.totalTimeSpent)}</p>
                            <p className="text-xs text-gray-500">Total Time</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'history', label: 'History' },
                    { id: 'trends', label: 'Trends' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition ${activeTab === tab.id
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid md:grid-cols-2 gap-6"
                    >
                        {/* Improvement Suggestions */}
                        {suggestions.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                                    Suggestions for You
                                </h3>
                                <div className="space-y-3">
                                    {suggestions.map((suggestion, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl">
                                            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-yellow-700 text-xs font-bold">{idx + 1}</span>
                                            </div>
                                            <p className="text-sm text-gray-700">{suggestion}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Skills Coverage */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-500" />
                                Skills Assessed
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {summary.skillsAssessed.map(skill => (
                                    <span
                                        key={skill}
                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                            {summary.categoriesAssessed.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 mb-2">Categories</p>
                                    <div className="flex flex-wrap gap-2">
                                        {summary.categoriesAssessed.map(cat => (
                                            <span
                                                key={cat}
                                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs capitalize"
                                            >
                                                {cat.replace('_', ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'history' && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-gray-500" />
                                Recent Activity
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                            {summary.recentActivity.map((entry, idx) => (
                                <div key={entry.id} className="p-4 hover:bg-gray-50 transition">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${entry.passed ? 'bg-green-100' : 'bg-red-100'
                                                }`}>
                                                {entry.passed ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{entry.skill}</p>
                                                <p className="text-xs text-gray-500">
                                                    {entry.difficulty} • {formatRelativeTime(entry.completedAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-xl font-bold ${getScoreColor(entry.score)}`}>
                                                {entry.score}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatTimeSpent(entry.timeSpentSeconds)}
                                            </p>
                                        </div>
                                    </div>
                                    {entry.cheatingDetected && (
                                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-2">
                                            <AlertTriangle className="w-3 h-3" />
                                            Integrity concerns detected
                                        </div>
                                    )}
                                    {!entry.passed && onRetakeAssessment && (
                                        <button
                                            onClick={() => onRetakeAssessment(entry.skill)}
                                            className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                        >
                                            Retake Assessment <ChevronRight className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'trends' && (
                    <motion.div
                        key="trends"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {summary.trends.map((trend, idx) => (
                            <div
                                key={trend.skill}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                <button
                                    onClick={() => setSelectedTrend(selectedTrend?.skill === trend.skill ? null : trend)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${trend.improvement >= 0 ? 'bg-green-100' : 'bg-red-100'
                                            }`}>
                                            {trend.improvement >= 0 ? (
                                                <TrendingUp className="w-6 h-6 text-green-600" />
                                            ) : (
                                                <TrendingDown className="w-6 h-6 text-red-600" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-900">{trend.skill}</p>
                                            <p className="text-sm text-gray-500">
                                                {trend.totalAttempts} attempt{trend.totalAttempts > 1 ? 's' : ''} •
                                                Best: {trend.bestScore}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${getScoreColor(trend.averageScore)}`}>
                                                Avg: {trend.averageScore}
                                            </p>
                                            <p className={`text-sm font-medium ${trend.improvement >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {trend.improvement >= 0 ? '+' : ''}{trend.improvement}% change
                                            </p>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${selectedTrend?.skill === trend.skill ? 'rotate-180' : ''
                                            }`} />
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {selectedTrend?.skill === trend.skill && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-gray-100 overflow-hidden"
                                        >
                                            <div className="p-4 bg-gray-50">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                                                    Attempt History
                                                </p>
                                                <div className="flex items-end gap-2 h-24">
                                                    {trend.attempts.map((attempt, aIdx) => (
                                                        <div
                                                            key={aIdx}
                                                            className="flex-1 flex flex-col items-center gap-1"
                                                        >
                                                            <div
                                                                className={`w-full rounded-t ${attempt.passed ? 'bg-green-500' : 'bg-red-400'
                                                                    }`}
                                                                style={{
                                                                    height: `${(attempt.score / 100) * 80}px`,
                                                                    minHeight: '8px'
                                                                }}
                                                                title={`Score: ${attempt.score}`}
                                                            />
                                                            <span className="text-xs text-gray-500">
                                                                {attempt.score}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-gray-400 text-center mt-2">
                                                    {formatDate(trend.attempts[0].date)} → {formatDate(trend.attempts[trend.attempts.length - 1].date)}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AssessmentHistory;
