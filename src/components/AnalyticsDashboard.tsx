import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart2, TrendingUp, TrendingDown, Users, Award, Clock,
    Target, Zap, Calendar, ChevronDown, ChevronUp, Filter,
    Download, RefreshCw, Eye, Star, ArrowUp, ArrowDown,
    Brain, BookOpen, Briefcase, MapPin, PieChart, Activity
} from 'lucide-react';

interface AnalyticsDashboardProps {
    viewType: 'candidate' | 'employer';
    userId: string;
    userName: string;
}

interface CandidateAnalytics {
    skillProgress: {
        skill: string;
        currentScore: number;
        previousScore: number;
        change: number;
        assessmentsCount: number;
    }[];
    learningPath: {
        skill: string;
        recommended: boolean;
        marketDemand: 'high' | 'medium' | 'low';
        estimatedTime: number; // hours
    }[];
    peerComparison: {
        skill: string;
        yourScore: number;
        averageScore: number;
        percentile: number;
    }[];
    activityHistory: {
        date: string;
        type: 'assessment' | 'certificate' | 'learning';
        skill: string;
        result?: number;
    }[];
    overallStats: {
        totalAssessments: number;
        certificatesEarned: number;
        avgScore: number;
        streak: number;
        hoursLearned: number;
    };
}

interface EmployerAnalytics {
    hiringFunnel: {
        stage: string;
        count: number;
        conversionRate: number;
    }[];
    timeMetrics: {
        avgTimeToHire: number; // days
        avgTimeToComplete: number; // minutes
        avgTimeToRespond: number; // hours
    };
    qualityMetrics: {
        avgScore: number;
        passRate: number;
        topSkillsHired: string[];
    };
    diversityMetrics?: {
        locations: { location: string; count: number }[];
        experienceLevels: { level: string; count: number }[];
    };
    monthlyTrends: {
        month: string;
        invited: number;
        completed: number;
        hired: number;
    }[];
}

// Mock data generators
const generateCandidateAnalytics = (): CandidateAnalytics => ({
    skillProgress: [
        { skill: 'React', currentScore: 85, previousScore: 72, change: 13, assessmentsCount: 4 },
        { skill: 'TypeScript', currentScore: 78, previousScore: 65, change: 13, assessmentsCount: 3 },
        { skill: 'CSS', currentScore: 82, previousScore: 80, change: 2, assessmentsCount: 2 },
        { skill: 'Node.js', currentScore: 70, previousScore: 75, change: -5, assessmentsCount: 2 }
    ],
    learningPath: [
        { skill: 'GraphQL', recommended: true, marketDemand: 'high', estimatedTime: 20 },
        { skill: 'AWS', recommended: true, marketDemand: 'high', estimatedTime: 40 },
        { skill: 'Docker', recommended: false, marketDemand: 'medium', estimatedTime: 15 },
        { skill: 'Testing', recommended: true, marketDemand: 'medium', estimatedTime: 25 }
    ],
    peerComparison: [
        { skill: 'React', yourScore: 85, averageScore: 72, percentile: 82 },
        { skill: 'TypeScript', yourScore: 78, averageScore: 68, percentile: 75 },
        { skill: 'CSS', yourScore: 82, averageScore: 70, percentile: 78 }
    ],
    activityHistory: [
        { date: '2026-01-14', type: 'assessment', skill: 'React', result: 85 },
        { date: '2026-01-12', type: 'certificate', skill: 'React' },
        { date: '2026-01-10', type: 'assessment', skill: 'TypeScript', result: 78 },
        { date: '2026-01-08', type: 'learning', skill: 'GraphQL' },
        { date: '2026-01-05', type: 'assessment', skill: 'CSS', result: 82 }
    ],
    overallStats: {
        totalAssessments: 12,
        certificatesEarned: 5,
        avgScore: 79,
        streak: 7,
        hoursLearned: 24
    }
});

const generateEmployerAnalytics = (): EmployerAnalytics => ({
    hiringFunnel: [
        { stage: 'Invited', count: 150, conversionRate: 100 },
        { stage: 'Started', count: 120, conversionRate: 80 },
        { stage: 'Completed', count: 85, conversionRate: 71 },
        { stage: 'Passed', count: 52, conversionRate: 61 },
        { stage: 'Interviewed', count: 28, conversionRate: 54 },
        { stage: 'Hired', count: 8, conversionRate: 29 }
    ],
    timeMetrics: {
        avgTimeToHire: 14,
        avgTimeToComplete: 35,
        avgTimeToRespond: 6
    },
    qualityMetrics: {
        avgScore: 73,
        passRate: 61,
        topSkillsHired: ['React', 'Python', 'TypeScript']
    },
    diversityMetrics: {
        locations: [
            { location: 'United States', count: 45 },
            { location: 'India', count: 32 },
            { location: 'Europe', count: 28 },
            { location: 'Other', count: 15 }
        ],
        experienceLevels: [
            { level: '0-2 years', count: 25 },
            { level: '3-5 years', count: 40 },
            { level: '6-10 years', count: 28 },
            { level: '10+ years', count: 7 }
        ]
    },
    monthlyTrends: [
        { month: 'Sep', invited: 30, completed: 22, hired: 2 },
        { month: 'Oct', invited: 45, completed: 35, hired: 3 },
        { month: 'Nov', invited: 38, completed: 28, hired: 1 },
        { month: 'Dec', invited: 20, completed: 15, hired: 1 },
        { month: 'Jan', invited: 55, completed: 42, hired: 4 }
    ]
});

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
    viewType,
    userId,
    userName
}) => {
    const [candidateData, setCandidateData] = useState<CandidateAnalytics | null>(null);
    const [employerData, setEmployerData] = useState<EmployerAnalytics | null>(null);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            if (viewType === 'candidate') {
                setCandidateData(generateCandidateAnalytics());
            } else {
                setEmployerData(generateEmployerAnalytics());
            }
            setIsLoading(false);
        }, 500);
    }, [viewType, timeRange]);

    const getDemandBadge = (demand: 'high' | 'medium' | 'low') => {
        const styles = {
            high: 'bg-green-100 text-green-700',
            medium: 'bg-yellow-100 text-yellow-700',
            low: 'bg-gray-100 text-gray-700'
        };
        return styles[demand];
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    // Candidate Analytics View
    if (viewType === 'candidate' && candidateData) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Your Analytics</h2>
                        <p className="text-gray-500">Track your progress and compare with peers</p>
                    </div>
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="px-4 py-2 border border-gray-200 rounded-lg bg-white"
                    >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                    </select>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-5 gap-4">
                    {[
                        { label: 'Assessments', value: candidateData.overallStats.totalAssessments, icon: Target, color: 'indigo' },
                        { label: 'Certificates', value: candidateData.overallStats.certificatesEarned, icon: Award, color: 'purple' },
                        { label: 'Avg Score', value: `${candidateData.overallStats.avgScore}%`, icon: TrendingUp, color: 'green' },
                        { label: 'Day Streak', value: candidateData.overallStats.streak, icon: Zap, color: 'orange' },
                        { label: 'Hours Learned', value: candidateData.overallStats.hoursLearned, icon: Clock, color: 'blue' }
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-200">
                            <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center mb-3`}>
                                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Skill Progress */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        Skill Progress Over Time
                    </h3>
                    <div className="space-y-4">
                        {candidateData.skillProgress.map(skill => (
                            <div key={skill.skill}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium text-gray-900">{skill.skill}</span>
                                        <span className={`flex items-center text-sm ${skill.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {skill.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                            {Math.abs(skill.change)}%
                                        </span>
                                    </div>
                                    <span className="font-bold text-indigo-600">{skill.currentScore}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="relative h-full">
                                        <div
                                            className="absolute h-full bg-gray-300 rounded-full"
                                            style={{ width: `${skill.previousScore}%` }}
                                        />
                                        <motion.div
                                            initial={{ width: `${skill.previousScore}%` }}
                                            animate={{ width: `${skill.currentScore}%` }}
                                            className="absolute h-full bg-indigo-500 rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Learning Path */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-500" />
                            Recommended Learning Path
                        </h3>
                        <div className="space-y-3">
                            {candidateData.learningPath.map(item => (
                                <div key={item.skill} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {item.recommended && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                                        <span className="font-medium">{item.skill}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDemandBadge(item.marketDemand)}`}>
                                            {item.marketDemand} demand
                                        </span>
                                        <span className="text-sm text-gray-500">{item.estimatedTime}h</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Peer Comparison */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-500" />
                            Peer Comparison (Anonymized)
                        </h3>
                        <div className="space-y-4">
                            {candidateData.peerComparison.map(item => (
                                <div key={item.skill}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-700">{item.skill}</span>
                                        <span className="text-indigo-600 font-medium">Top {100 - item.percentile}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-6 bg-gray-100 rounded relative">
                                            <div
                                                className="absolute h-full bg-gray-300 rounded"
                                                style={{ width: `${item.averageScore}%` }}
                                            />
                                            <div
                                                className="absolute h-full bg-indigo-500 rounded"
                                                style={{ width: `${item.yourScore}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold w-12 text-right">{item.yourScore}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>Avg: {item.averageScore}%</span>
                                        <span>You: {item.yourScore}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {candidateData.activityHistory.map((activity, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.type === 'assessment' ? 'bg-blue-100 text-blue-600' :
                                        activity.type === 'certificate' ? 'bg-green-100 text-green-600' :
                                            'bg-purple-100 text-purple-600'
                                    }`}>
                                    {activity.type === 'assessment' ? <Target className="w-5 h-5" /> :
                                        activity.type === 'certificate' ? <Award className="w-5 h-5" /> :
                                            <BookOpen className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                        {activity.type === 'assessment' ? `Completed ${activity.skill} assessment` :
                                            activity.type === 'certificate' ? `Earned ${activity.skill} certificate` :
                                                `Started learning ${activity.skill}`}
                                    </p>
                                    <p className="text-sm text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                                </div>
                                {activity.result && (
                                    <div className="text-lg font-bold text-indigo-600">{activity.result}%</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Employer Analytics View
    if (viewType === 'employer' && employerData) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Hiring Analytics</h2>
                        <p className="text-gray-500">Track your recruiting performance</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as any)}
                            className="px-4 py-2 border border-gray-200 rounded-lg bg-white"
                        >
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-500">Avg Time to Hire</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{employerData.timeMetrics.avgTimeToHire} days</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-sm text-gray-500">Pass Rate</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{employerData.qualityMetrics.passRate}%</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Target className="w-5 h-5 text-purple-600" />
                            </div>
                            <p className="text-sm text-gray-500">Avg Score</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{employerData.qualityMetrics.avgScore}%</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Zap className="w-5 h-5 text-orange-600" />
                            </div>
                            <p className="text-sm text-gray-500">Avg Response Time</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{employerData.timeMetrics.avgTimeToRespond}h</p>
                    </div>
                </div>

                {/* Hiring Funnel */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-indigo-500" />
                        Hiring Funnel
                    </h3>
                    <div className="flex items-end justify-between h-48 gap-4">
                        {employerData.hiringFunnel.map((stage, idx) => (
                            <div key={stage.stage} className="flex-1 flex flex-col items-center">
                                <span className="text-sm font-bold text-gray-900 mb-2">{stage.count}</span>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(stage.count / employerData.hiringFunnel[0].count) * 100}%` }}
                                    className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg min-h-[20px]"
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">{stage.stage}</p>
                                {idx > 0 && (
                                    <p className="text-xs text-gray-400">{stage.conversionRate}%</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Monthly Trends */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            Monthly Trends
                        </h3>
                        <div className="h-48 flex items-end justify-between gap-2">
                            {employerData.monthlyTrends.map(month => (
                                <div key={month.month} className="flex-1 flex flex-col items-center">
                                    <div className="w-full flex flex-col gap-1">
                                        <div
                                            className="w-full bg-blue-200 rounded-t"
                                            style={{ height: `${month.invited * 2}px` }}
                                        />
                                        <div
                                            className="w-full bg-green-400 rounded"
                                            style={{ height: `${month.completed * 2}px` }}
                                        />
                                        <div
                                            className="w-full bg-purple-500 rounded-b"
                                            style={{ height: `${month.hired * 10}px` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">{month.month}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center gap-6 mt-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-200 rounded" />
                                <span className="text-gray-500">Invited</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-400 rounded" />
                                <span className="text-gray-500">Completed</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-500 rounded" />
                                <span className="text-gray-500">Hired</span>
                            </div>
                        </div>
                    </div>

                    {/* Candidate Distribution */}
                    {employerData.diversityMetrics && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-indigo-500" />
                                Candidate Distribution
                            </h3>
                            <div className="space-y-3">
                                {employerData.diversityMetrics.locations.map(loc => (
                                    <div key={loc.location}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-700">{loc.location}</span>
                                            <span className="text-gray-500">{loc.count}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${(loc.count / 120) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Top Skills Hired */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-indigo-500" />
                        Top Skills Hired
                    </h3>
                    <div className="flex gap-3">
                        {employerData.qualityMetrics.topSkillsHired.map((skill, idx) => (
                            <div key={skill} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium flex items-center gap-2">
                                <span className="text-indigo-400">#{idx + 1}</span>
                                {skill}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default AnalyticsDashboard;
