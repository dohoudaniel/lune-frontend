import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, Upload, Search, Filter, Mail, Send, Download,
    BarChart2, CheckCircle, XCircle, Clock, Eye, ChevronDown,
    ChevronRight, Star, Trash2, Edit2, UserPlus, FileText, Award,
    TrendingUp, Calendar, Building, Target, Zap, Copy, ExternalLink,
    X, MoreVertical, ArrowUpDown
} from 'lucide-react';
import { CandidateProfile, DifficultyLevel } from '../types';

interface TeamDashboardProps {
    companyId: string;
    companyName: string;
    onClose?: () => void;
}

interface TeamCandidate extends CandidateProfile {
    status: 'invited' | 'in_progress' | 'completed' | 'shortlisted' | 'rejected';
    invitedAt?: string;
    completedAt?: string;
    assessmentScore?: number;
    assessmentSkill?: string;
    notes?: string;
    tags: string[];
}

interface Assessment {
    id: string;
    name: string;
    skill: string;
    difficulty: string;
    questionsCount: number;
    timeLimit: number;
    candidatesInvited: number;
    candidatesCompleted: number;
    createdAt: string;
    status: string;
}

interface BulkInvite {
    emails: string[];
    assessmentId: string;
    message: string;
}





export const TeamAssessmentDashboard: React.FC<TeamDashboardProps> = ({
    companyId,
    companyName,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<'candidates' | 'assessments' | 'analytics'>('candidates');
    const [candidates, setCandidates] = useState<TeamCandidate[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [fetchedCandidates, fetchedAssessments] = await Promise.all([
                    dataService.getCandidates(),
                    dataService.getAssessments()
                ]);

                // Transform generic candidates to TeamCandidate format suitable for this dashboard
                const teamCandidates: TeamCandidate[] = fetchedCandidates.map(c => ({
                    ...c,
                    status: c.verified ? 'completed' : 'invited', // Simplified logic for demo
                    invitedAt: new Date().toISOString(),
                    assessmentSkill: 'General',
                    tags: []
                }));

                setCandidates(teamCandidates);
                setAssessments(fetchedAssessments);
            } catch (error) {
                console.error('Failed to load team dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);
    const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'score' | 'name' | 'date'>('score');

    // Filter and sort candidates
    const filteredCandidates = candidates
        .filter(c => {
            if (statusFilter !== 'all' && c.status !== statusFilter) return false;
            if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'score') return (b.assessmentScore || 0) - (a.assessmentScore || 0);
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'date') return new Date(b.invitedAt || 0).getTime() - new Date(a.invitedAt || 0).getTime();
            return 0;
        });

    const toggleCandidate = (id: string) => {
        const newSelected = new Set(selectedCandidates);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedCandidates(newSelected);
    };

    const selectAll = () => {
        if (selectedCandidates.size === filteredCandidates.length) {
            setSelectedCandidates(new Set());
        } else {
            setSelectedCandidates(new Set(filteredCandidates.map(c => c.id)));
        }
    };

    const updateCandidateStatus = (id: string, status: TeamCandidate['status']) => {
        setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    };

    const getStatusBadge = (status: TeamCandidate['status']) => {
        const styles: Record<string, string> = {
            invited: 'bg-blue-100 text-blue-700',
            in_progress: 'bg-yellow-100 text-yellow-700',
            completed: 'bg-green-100 text-green-700',
            shortlisted: 'bg-purple-100 text-purple-700',
            rejected: 'bg-red-100 text-red-700'
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const stats = {
        total: candidates.length,
        completed: candidates.filter(c => c.status === 'completed' || c.status === 'shortlisted').length,
        inProgress: candidates.filter(c => c.status === 'in_progress').length,
        avgScore: Math.round(candidates.filter(c => c.assessmentScore).reduce((sum, c) => sum + (c.assessmentScore || 0), 0) / candidates.filter(c => c.assessmentScore).length) || 0
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Team Assessment Dashboard</h1>
                                <p className="text-sm text-gray-500">{companyName}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                Invite Candidates
                            </button>
                            {onClose && (
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-4 -mb-px">
                        {[
                            { id: 'candidates', label: 'Candidates', icon: Users },
                            { id: 'assessments', label: 'Assessments', icon: FileText },
                            { id: 'analytics', label: 'Analytics', icon: BarChart2 }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition ${activeTab === tab.id
                                    ? 'bg-gray-50 text-indigo-600 border-t-2 border-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                <p className="text-sm text-gray-500">Total Candidates</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                                <p className="text-sm text-gray-500">Completed</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                                <p className="text-sm text-gray-500">In Progress</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.avgScore}%</p>
                                <p className="text-sm text-gray-500">Avg Score</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Candidates Tab */}
                {activeTab === 'candidates' && (
                    <div className="space-y-4">
                        {/* Toolbar */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search candidates..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="invited">Invited</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="rejected">Rejected</option>
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3 py-2 border border-gray-200 rounded-lg bg-white"
                            >
                                <option value="score">Sort by Score</option>
                                <option value="name">Sort by Name</option>
                                <option value="date">Sort by Date</option>
                            </select>

                            {selectedCandidates.size > 0 && (
                                <div className="flex items-center gap-2 border-l pl-4">
                                    <span className="text-sm text-gray-500">{selectedCandidates.size} selected</span>
                                    <button
                                        onClick={() => setShowCompareModal(true)}
                                        className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium"
                                    >
                                        Compare
                                    </button>
                                    <button className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                                        Shortlist
                                    </button>
                                    <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                                        Export
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Candidates Table */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="w-10 p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0}
                                                onChange={selectAll}
                                                className="rounded"
                                            />
                                        </th>
                                        <th className="text-left p-4 font-medium text-gray-700">Candidate</th>
                                        <th className="text-left p-4 font-medium text-gray-700">Assessment</th>
                                        <th className="text-left p-4 font-medium text-gray-700">Score</th>
                                        <th className="text-left p-4 font-medium text-gray-700">Status</th>
                                        <th className="text-left p-4 font-medium text-gray-700">Invited</th>
                                        <th className="w-20 p-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCandidates.map(candidate => (
                                        <tr key={candidate.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCandidates.has(candidate.id)}
                                                    onChange={() => toggleCandidate(candidate.id)}
                                                    className="rounded"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        {candidate.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{candidate.name}</p>
                                                        <p className="text-sm text-gray-500">{candidate.title}</p>
                                                    </div>
                                                    {candidate.tags.includes('top-performer') && (
                                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-gray-900">{candidate.assessmentSkill}</span>
                                            </td>
                                            <td className="p-4">
                                                {candidate.assessmentScore ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${candidate.assessmentScore >= 80 ? 'bg-green-100 text-green-700' :
                                                            candidate.assessmentScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                            {candidate.assessmentScore}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(candidate.status)}`}>
                                                    {candidate.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {candidate.invitedAt && new Date(candidate.invitedAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1">
                                                    <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                                                        <Eye className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateCandidateStatus(candidate.id, 'shortlisted')}
                                                        className="p-1.5 hover:bg-green-50 rounded-lg"
                                                    >
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateCandidateStatus(candidate.id, 'rejected')}
                                                        className="p-1.5 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <XCircle className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Assessments Tab */}
                {activeTab === 'assessments' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {assessments.map(assessment => (
                            <div key={assessment.id} className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{assessment.name}</h3>
                                        <p className="text-sm text-gray-500">{assessment.skill} • {assessment.difficulty}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${assessment.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {assessment.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{assessment.candidatesInvited}</p>
                                        <p className="text-xs text-gray-500">Invited</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{assessment.candidatesCompleted}</p>
                                        <p className="text-xs text-gray-500">Completed</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{Math.round((assessment.candidatesCompleted / assessment.candidatesInvited) * 100)}%</p>
                                        <p className="text-xs text-gray-500">Completion Rate</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100">
                                        View Results
                                    </button>
                                    <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Create New Assessment Card */}
                        <button className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition">
                            <Plus className="w-8 h-8 mb-2" />
                            <span className="font-medium">Create New Assessment</span>
                        </button>
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {/* Funnel */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-500" />
                                Hiring Funnel
                            </h3>
                            <div className="flex items-center justify-between">
                                {[
                                    { label: 'Invited', count: 15, color: 'bg-blue-500' },
                                    { label: 'Started', count: 12, color: 'bg-yellow-500' },
                                    { label: 'Completed', count: 8, color: 'bg-green-500' },
                                    { label: 'Shortlisted', count: 3, color: 'bg-purple-500' },
                                    { label: 'Hired', count: 1, color: 'bg-indigo-500' }
                                ].map((stage, idx) => (
                                    <React.Fragment key={stage.label}>
                                        <div className="text-center">
                                            <div className={`w-16 h-16 ${stage.color} rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-2`}>
                                                {stage.count}
                                            </div>
                                            <p className="text-sm text-gray-600">{stage.label}</p>
                                        </div>
                                        {idx < 4 && <ChevronRight className="w-6 h-6 text-gray-300" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {/* Score Distribution */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-indigo-500" />
                                Score Distribution
                            </h3>
                            <div className="h-48 flex items-end justify-between gap-2">
                                {[
                                    { range: '0-20', count: 0 },
                                    { range: '21-40', count: 1 },
                                    { range: '41-60', count: 2 },
                                    { range: '61-80', count: 3 },
                                    { range: '81-100', count: 2 }
                                ].map(bucket => (
                                    <div key={bucket.range} className="flex-1 flex flex-col items-center">
                                        <div
                                            className="w-full bg-indigo-500 rounded-t-lg transition-all"
                                            style={{ height: `${bucket.count * 40}px` }}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">{bucket.range}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Time to Complete */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Average Time to Complete</h3>
                                <div className="text-4xl font-bold text-indigo-600 mb-2">32 min</div>
                                <p className="text-sm text-gray-500">Across all assessments</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Time to First Response</h3>
                                <div className="text-4xl font-bold text-green-600 mb-2">4 hours</div>
                                <p className="text-sm text-gray-500">Average invitation to start</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Invite Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl"
                        >
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">Invite Candidates</h2>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Addresses</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg h-24"
                                        placeholder="Enter email addresses, one per line..."
                                    />
                                </div>

                                <div className="text-center py-2 text-gray-500 text-sm">or</div>

                                <button className="w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition flex items-center justify-center gap-2">
                                    <Upload className="w-5 h-5" />
                                    Upload CSV File
                                </button>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assessment</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white">
                                        {assessments.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Message (Optional)</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg h-20"
                                        placeholder="Add a personal message to the invitation..."
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                                    <Send className="w-4 h-4" />
                                    Send Invitations
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Compare Modal */}
            <AnimatePresence>
                {showCompareModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Compare Candidates</h2>
                                <button onClick={() => setShowCompareModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <div className="grid grid-cols-3 gap-6">
                                    {Array.from(selectedCandidates).slice(0, 3).map(id => {
                                        const candidate = candidates.find(c => c.id === id);
                                        if (!candidate) return null;
                                        return (
                                            <div key={id} className="border border-gray-200 rounded-xl p-4">
                                                <div className="text-center mb-4">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-2">
                                                        {candidate.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <h3 className="font-bold">{candidate.name}</h3>
                                                    <p className="text-sm text-gray-500">{candidate.title}</p>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Score</span>
                                                        <span className="font-bold">{candidate.assessmentScore || '—'}%</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Experience</span>
                                                        <span className="font-bold">{candidate.yearsOfExperience} years</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Location</span>
                                                        <span className="font-bold">{candidate.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeamAssessmentDashboard;
