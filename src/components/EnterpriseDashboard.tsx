import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, Users, Briefcase, TrendingUp, TrendingDown,
    Clock, DollarSign, Target, Award, ChevronDown, ChevronUp,
    Building2, UserCheck, Calendar, ArrowRight, Filter,
    Download, RefreshCw, Settings, Bell, Search, PieChart
} from 'lucide-react';
import {
    getEnterpriseAnalytics,
    EnterpriseAnalytics,
    PipelineStage,
    formatCurrency,
    formatNumber,
    calculateFunnelMetrics
} from '../services/enterpriseAnalyticsService';

interface EnterpriseDashboardProps {
    companyId: string;
    companyName: string;
    onBack?: () => void;
}

export const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({
    companyId,
    companyName,
    onBack
}) => {
    const [analytics, setAnalytics] = useState<EnterpriseAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [activeTab, setActiveTab] = useState<'overview' | 'pipeline' | 'team' | 'talent'>('overview');

    useEffect(() => {
        loadAnalytics();
    }, [companyId, dateRange]);

    const loadAnalytics = async () => {
        setLoading(true);
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);

        const data = await getEnterpriseAnalytics(companyId, { start, end });
        setAnalytics(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!analytics) return null;

    const funnelMetrics = calculateFunnelMetrics(analytics.pipeline);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{companyName}</h1>
                                <p className="text-sm text-gray-500">Enterprise Dashboard</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Date Range Selector */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {(['7d', '30d', '90d'] as const).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setDateRange(range)}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition ${dateRange === range
                                            ? 'bg-white text-teal-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                                    </button>
                                ))}
                            </div>

                            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                                <RefreshCw className="w-5 h-5 text-gray-600" onClick={loadAnalytics} />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                                <Download className="w-5 h-5 text-gray-600" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition relative">
                                <Bell className="w-5 h-5 text-gray-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 mt-4 -mb-px">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'pipeline', label: 'Hiring Pipeline', icon: Target },
                            { id: 'team', label: 'Team Activity', icon: Users },
                            { id: 'talent', label: 'Talent Pool', icon: UserCheck },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === tab.id
                                    ? 'border-teal-600 text-teal-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <MetricCard
                                    title="Active Jobs"
                                    value={analytics.hiringMetrics.activeJobPosts}
                                    change={12}
                                    icon={Briefcase}
                                    color="teal"
                                />
                                <MetricCard
                                    title="Total Applications"
                                    value={analytics.hiringMetrics.totalApplications}
                                    change={8}
                                    icon={Users}
                                    color="blue"
                                />
                                <MetricCard
                                    title="Avg. Time to Hire"
                                    value={`${analytics.hiringMetrics.averageTimeToHire}d`}
                                    change={-5}
                                    icon={Clock}
                                    color="purple"
                                />
                                <MetricCard
                                    title="Cost per Hire"
                                    value={formatCurrency(analytics.hiringMetrics.costPerHire)}
                                    change={-3}
                                    icon={DollarSign}
                                    color="green"
                                />
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Hiring Funnel */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-gray-900">Hiring Funnel</h3>
                                        <span className="text-sm text-gray-500">
                                            {funnelMetrics.overallConversion}% conversion
                                        </span>
                                    </div>
                                    <FunnelChart stages={analytics.pipeline} />
                                    <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                                        <p className="text-sm text-amber-800">
                                            <strong>Bottleneck:</strong> {funnelMetrics.bottleneck}
                                        </p>
                                    </div>
                                </div>

                                {/* Top Skills */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6">Top Skills in Talent Pool</h3>
                                    <div className="space-y-4">
                                        {analytics.talentPool.topSkills.map((skill, idx) => (
                                            <div key={skill.skill} className="flex items-center gap-4">
                                                <span className="text-sm font-medium text-gray-500 w-6">{idx + 1}</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-gray-900">{skill.skill}</span>
                                                        <span className="text-sm text-gray-500">{skill.count} candidates</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${skill.avgScore}%` }}
                                                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                                                            className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-teal-600">{skill.avgScore}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Stats</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-gray-900">
                                            {analytics.hiringMetrics.offersExtended}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">Offers Extended</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-gray-900">
                                            {analytics.hiringMetrics.offerAcceptanceRate}%
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">Offer Acceptance</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-gray-900">
                                            {formatNumber(analytics.talentPool.verifiedCandidates)}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">Verified Candidates</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-gray-900">
                                            {analytics.talentPool.averageScore}%
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">Avg. Skill Score</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'pipeline' && (
                        <motion.div
                            key="pipeline"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Detailed Pipeline View</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Stage</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Count</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">% of Total</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Conversion</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Progress</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.pipeline.map((stage, idx) => (
                                                <tr key={stage.name} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${getStageColor(idx)}`} />
                                                            <span className="font-medium text-gray-900">{stage.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-right py-4 px-4 font-bold text-gray-900">{stage.count}</td>
                                                    <td className="text-right py-4 px-4 text-gray-600">{stage.percentage}%</td>
                                                    <td className="text-right py-4 px-4">
                                                        <span className={`font-medium ${stage.conversionRate >= 50 ? 'text-green-600' : 'text-amber-600'}`}>
                                                            {stage.conversionRate}%
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 w-48">
                                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${stage.percentage}%` }}
                                                                transition={{ delay: idx * 0.1 }}
                                                                className={`h-full rounded-full ${getStageColor(idx)}`}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'team' && (
                        <motion.div
                            key="team"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Team Performance</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Team Member</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Reviewed</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Interviews</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Offers</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Avg Response</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.teamActivity.map((member, idx) => (
                                                <tr key={member.memberId} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                                {member.memberName.charAt(0)}
                                                            </div>
                                                            <span className="font-medium text-gray-900">{member.memberName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-right py-4 px-4 font-medium text-gray-900">{member.candidatesReviewed}</td>
                                                    <td className="text-right py-4 px-4 font-medium text-gray-900">{member.interviewsConducted}</td>
                                                    <td className="text-right py-4 px-4 font-medium text-gray-900">{member.offersExtended}</td>
                                                    <td className="text-right py-4 px-4">
                                                        <span className={`font-medium ${member.avgResponseTime <= 12 ? 'text-green-600' : 'text-amber-600'}`}>
                                                            {member.avgResponseTime}h
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'talent' && (
                        <motion.div
                            key="talent"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* By Skill */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6">Candidates by Skill</h3>
                                    <div className="space-y-4">
                                        {Object.entries(analytics.talentPool.candidatesBySkill).map(([skill, count]) => (
                                            <div key={skill} className="flex items-center gap-4">
                                                <span className="font-medium text-gray-900 w-24">{skill}</span>
                                                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(Number(count) / 200) * 100}%` }}
                                                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                                                    />
                                                </div>
                                                <span className="font-bold text-gray-900 w-12 text-right">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* By Experience */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6">Candidates by Experience</h3>
                                    <div className="space-y-4">
                                        {Object.entries(analytics.talentPool.candidatesByExperience).map(([exp, count]) => (
                                            <div key={exp} className="flex items-center gap-4">
                                                <span className="font-medium text-gray-900 w-24">{exp}</span>
                                                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(Number(count) / 350) * 100}%` }}
                                                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                                                    />
                                                </div>
                                                <span className="font-bold text-gray-900 w-12 text-right">{count}</span>
                                            </div>
                                        ))}
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

// Metric Card Component
interface MetricCardProps {
    title: string;
    value: string | number;
    change: number;
    icon: React.FC<{ className?: string }>;
    color: 'teal' | 'blue' | 'purple' | 'green';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, color }) => {
    const colorClasses = {
        teal: 'from-teal-500 to-teal-600',
        blue: 'from-blue-500 to-blue-600',
        purple: 'from-purple-500 to-purple-600',
        green: 'from-green-500 to-green-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
        >
            <div className="flex items-start justify-between">
                <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {Math.abs(change)}%
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-4">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{title}</p>
        </motion.div>
    );
};

// Funnel Chart Component
interface FunnelChartProps {
    stages: PipelineStage[];
}

const FunnelChart: React.FC<FunnelChartProps> = ({ stages }) => {
    return (
        <div className="space-y-3">
            {stages.map((stage, idx) => (
                <div key={stage.name} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600 w-24">{stage.name}</span>
                    <div className="flex-1 relative">
                        <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stage.percentage}%` }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                className={`h-full rounded-lg ${getStageColor(idx)}`}
                            />
                        </div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-16 text-right">{stage.count}</span>
                </div>
            ))}
        </div>
    );
};

const getStageColor = (index: number): string => {
    const colors = [
        'bg-teal-500',
        'bg-blue-500',
        'bg-purple-500',
        'bg-amber-500',
        'bg-green-500',
    ];
    return colors[index % colors.length];
};

export default EnterpriseDashboard;
