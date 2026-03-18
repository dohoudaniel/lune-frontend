import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Plus, Search, Filter, Edit2, Trash2, Eye, EyeOff,
    CheckCircle, XCircle, Clock, Tag, Code, FileText, MessageSquare,
    BarChart2, ChevronDown, ChevronRight, Save, X, Copy, AlertTriangle
} from 'lucide-react';
import {
    getQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    toggleQuestionActive,
    reviewQuestion,
    getQuestionStats,
    Question,
    QuestionFilter
} from '../services/questionBankService';
import { DifficultyLevel, AssessmentType } from '../types';

interface QuestionBankManagerProps {
    adminId: string;
    onClose?: () => void;
}

type ViewMode = 'grid' | 'list';
type ModalMode = 'create' | 'edit' | 'preview' | null;

export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
    adminId,
    onClose
}) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [stats, setStats] = useState<ReturnType<typeof getQuestionStats> | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSkill, setFilterSkill] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | ''>('');
    const [filterType, setFilterType] = useState<Question['type'] | ''>('');
    const [filterStatus, setFilterStatus] = useState<Question['reviewStatus'] | ''>('');

    // Form state for create/edit
    const [formData, setFormData] = useState<Partial<Question>>({});

    // Load questions
    useEffect(() => {
        loadQuestions();
        setStats(getQuestionStats());
    }, []);

    const loadQuestions = () => {
        const filter: QuestionFilter = {};
        if (filterSkill) filter.skill = filterSkill;
        if (filterDifficulty) filter.difficulty = filterDifficulty;
        if (filterType) filter.type = filterType;
        if (filterStatus) filter.reviewStatus = filterStatus;

        let result = getQuestions(Object.keys(filter).length > 0 ? filter : undefined);

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(q =>
                q.question.toLowerCase().includes(query) ||
                q.skill.toLowerCase().includes(query) ||
                q.tags.some(t => t.toLowerCase().includes(query))
            );
        }

        setQuestions(result);
    };

    useEffect(() => {
        loadQuestions();
    }, [filterSkill, filterDifficulty, filterType, filterStatus, searchQuery]);

    const handleCreate = () => {
        setFormData({
            type: 'multiple_choice',
            difficulty: 'Beginner',
            assessmentType: 'code',
            isActive: true,
            reviewStatus: 'draft',
            tags: [],
            options: ['', '', '', '']
        });
        setModalMode('create');
    };

    const handleEdit = (question: Question) => {
        setFormData(question);
        setSelectedQuestion(question);
        setModalMode('edit');
    };

    const handlePreview = (question: Question) => {
        setSelectedQuestion(question);
        setModalMode('preview');
    };

    const handleSave = () => {
        if (!formData.question || !formData.skill) return;

        if (modalMode === 'create') {
            createQuestion({
                ...formData as any,
                createdBy: adminId
            });
        } else if (modalMode === 'edit' && selectedQuestion) {
            updateQuestion(selectedQuestion.id, formData);
        }

        setModalMode(null);
        setFormData({});
        loadQuestions();
        setStats(getQuestionStats());
    };

    const handleDelete = (id: string) => {
        deleteQuestion(id);
        setDeleteConfirm(null);
        loadQuestions();
        setStats(getQuestionStats());
    };

    const handleToggleActive = (id: string) => {
        toggleQuestionActive(id);
        loadQuestions();
    };

    const handleReview = (id: string, status: Question['reviewStatus']) => {
        reviewQuestion(id, status, adminId);
        loadQuestions();
        setStats(getQuestionStats());
    };

    const getTypeIcon = (type: Question['type']) => {
        switch (type) {
            case 'code': return Code;
            case 'multiple_choice': return CheckCircle;
            case 'scenario': return MessageSquare;
            case 'written': return FileText;
            default: return FileText;
        }
    };

    const getStatusColor = (status: Question['reviewStatus']) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700';
            case 'pending_review': return 'bg-yellow-100 text-yellow-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            case 'draft': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getDifficultyColor = (difficulty: DifficultyLevel) => {
        switch (difficulty) {
            case 'Beginner': return 'bg-blue-100 text-blue-700';
            case 'Mid-Level': return 'bg-purple-100 text-purple-700';
            case 'Advanced': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const uniqueSkills = [...new Set(getQuestions().map(q => q.skill))];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Question Bank</h1>
                                <p className="text-sm text-gray-500">Manage assessment questions</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200"
                            >
                                <Plus className="w-4 h-4" />
                                Add Question
                            </button>
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-sm text-gray-500">Total Questions</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <p className="text-3xl font-bold text-green-600">{stats.byStatus['approved'] || 0}</p>
                            <p className="text-sm text-gray-500">Approved</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <p className="text-3xl font-bold text-yellow-600">{stats.byStatus['pending_review'] || 0}</p>
                            <p className="text-sm text-gray-500">Pending Review</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <p className="text-3xl font-bold text-indigo-600">{stats.avgPassRate}%</p>
                            <p className="text-sm text-gray-500">Avg Pass Rate</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search questions..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <select
                            value={filterSkill}
                            onChange={(e) => setFilterSkill(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg bg-white"
                        >
                            <option value="">All Skills</option>
                            {uniqueSkills.map(skill => (
                                <option key={skill} value={skill}>{skill}</option>
                            ))}
                        </select>

                        <select
                            value={filterDifficulty}
                            onChange={(e) => setFilterDifficulty(e.target.value as DifficultyLevel | '')}
                            className="px-3 py-2 border border-gray-200 rounded-lg bg-white"
                        >
                            <option value="">All Difficulties</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Mid-Level">Mid-Level</option>
                            <option value="Advanced">Advanced</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as Question['reviewStatus'] | '')}
                            className="px-3 py-2 border border-gray-200 rounded-lg bg-white"
                        >
                            <option value="">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="pending_review">Pending Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilterSkill('');
                                setFilterDifficulty('');
                                setFilterStatus('');
                            }}
                            className="px-3 py-2 text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                    {questions.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No Questions Found</h3>
                            <p className="text-gray-500 mb-4">Try adjusting your filters or add a new question</p>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                            >
                                Add First Question
                            </button>
                        </div>
                    ) : (
                        questions.map(question => {
                            const TypeIcon = getTypeIcon(question.type);
                            return (
                                <motion.div
                                    key={question.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${question.isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            <TypeIcon className="w-5 h-5" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h3 className={`font-medium ${question.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {question.question.length > 100
                                                        ? `${question.question.substring(0, 100)}...`
                                                        : question.question}
                                                </h3>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                                    {question.skill}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                                                    {question.difficulty}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(question.reviewStatus)}`}>
                                                    {question.reviewStatus.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    Used {question.timesUsed}x • Avg: {question.avgScore}%
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-1">
                                                {question.tags.slice(0, 4).map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">
                                                        #{tag}
                                                    </span>
                                                ))}
                                                {question.tags.length > 4 && (
                                                    <span className="text-xs text-gray-400">+{question.tags.length - 4} more</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handlePreview(question)}
                                                className="p-2 hover:bg-gray-100 rounded-lg"
                                                title="Preview"
                                            >
                                                <Eye className="w-4 h-4 text-gray-500" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(question)}
                                                className="p-2 hover:bg-gray-100 rounded-lg"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4 text-gray-500" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(question.id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg"
                                                title={question.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {question.isActive ? (
                                                    <EyeOff className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                    <Eye className="w-4 h-4 text-green-500" />
                                                )}
                                            </button>
                                            {question.reviewStatus === 'pending_review' && (
                                                <>
                                                    <button
                                                        onClick={() => handleReview(question.id, 'approved')}
                                                        className="p-2 hover:bg-green-50 rounded-lg"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReview(question.id, 'rejected')}
                                                        className="p-2 hover:bg-red-50 rounded-lg"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => setDeleteConfirm(question.id)}
                                                className="p-2 hover:bg-red-50 rounded-lg"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {(modalMode === 'create' || modalMode === 'edit') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl my-8"
                        >
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {modalMode === 'create' ? 'Add New Question' : 'Edit Question'}
                                </h2>
                            </div>

                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                {/* Question Text */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                                    <textarea
                                        value={formData.question || ''}
                                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 h-24"
                                        placeholder="Enter the question..."
                                    />
                                </div>

                                {/* Skill & Category */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Skill *</label>
                                        <input
                                            type="text"
                                            value={formData.skill || ''}
                                            onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                            placeholder="e.g. React, Python"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <input
                                            type="text"
                                            value={formData.category || ''}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                            placeholder="e.g. frontend, backend"
                                        />
                                    </div>
                                </div>

                                {/* Type & Difficulty */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select
                                            value={formData.type || 'multiple_choice'}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as Question['type'] })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                                        >
                                            <option value="multiple_choice">Multiple Choice</option>
                                            <option value="open_ended">Open Ended</option>
                                            <option value="code">Code</option>
                                            <option value="scenario">Scenario</option>
                                            <option value="written">Written</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                        <select
                                            value={formData.difficulty || 'Beginner'}
                                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                                        >
                                            <option value="Beginner">Beginner</option>
                                            <option value="Mid-Level">Mid-Level</option>
                                            <option value="Advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Multiple Choice Options */}
                                {formData.type === 'multiple_choice' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                                        <div className="space-y-2">
                                            {(formData.options || ['', '', '', '']).map((opt, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="correctAnswer"
                                                        checked={formData.correctAnswer === opt && opt !== ''}
                                                        onChange={() => setFormData({ ...formData, correctAnswer: opt })}
                                                        className="text-indigo-600"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOptions = [...(formData.options || [])];
                                                            newOptions[idx] = e.target.value;
                                                            setFormData({ ...formData, options: newOptions });
                                                        }}
                                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                                                        placeholder={`Option ${idx + 1}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Select the correct answer</p>
                                    </div>
                                )}

                                {/* Context */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Context (Optional)</label>
                                    <textarea
                                        value={formData.context || ''}
                                        onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg h-20"
                                        placeholder="Additional context or background for the question..."
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                                    <input
                                        type="text"
                                        value={(formData.tags || []).join(', ')}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                                        })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                        placeholder="comma, separated, tags"
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                                <button
                                    onClick={() => {
                                        setModalMode(null);
                                        setFormData({});
                                    }}
                                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!formData.question || !formData.skill}
                                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Question
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Modal */}
            <AnimatePresence>
                {modalMode === 'preview' && selectedQuestion && (
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
                            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Question Preview</h2>
                                    <p className="text-sm text-gray-500">{selectedQuestion.skill} • {selectedQuestion.difficulty}</p>
                                </div>
                                <button onClick={() => setModalMode(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">{selectedQuestion.question}</h3>
                                    {selectedQuestion.context && (
                                        <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{selectedQuestion.context}</p>
                                    )}
                                </div>

                                {selectedQuestion.type === 'multiple_choice' && selectedQuestion.options && (
                                    <div className="space-y-2">
                                        {selectedQuestion.options.map((opt, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-3 rounded-lg border ${opt === selectedQuestion.correctAnswer
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200'
                                                    }`}
                                            >
                                                {opt}
                                                {opt === selectedQuestion.correctAnswer && (
                                                    <CheckCircle className="w-4 h-4 text-green-500 inline ml-2" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedQuestion.sampleAnswer && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Sample Answer</h4>
                                        <p className="text-gray-600 text-sm bg-blue-50 p-3 rounded-lg">{selectedQuestion.sampleAnswer}</p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-1">
                                    {selectedQuestion.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {deleteConfirm && (
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
                            className="bg-white rounded-xl p-6 max-w-sm shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Delete Question?</h3>
                                    <p className="text-sm text-gray-500">This cannot be undone</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-bold"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuestionBankManager;
