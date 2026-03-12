import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Database, Video, MessageSquare, Brain, CheckCircle,
    XCircle, ChevronDown, ChevronUp, AlertTriangle, Download,
    Trash2, Info, Lock, Eye, EyeOff
} from 'lucide-react';
import {
    recordConsent,
    withdrawConsent,
    getConsentStatus,
    exportCandidateData,
    deleteCandidateData,
    ConsentRecord
} from '../services/aiLearningService';

interface DataConsentModalProps {
    candidateId: string;
    candidateName: string;
    isOpen: boolean;
    onClose: () => void;
    onConsentUpdated?: (consent: ConsentRecord) => void;
}

export const DataConsentModal: React.FC<DataConsentModalProps> = ({
    candidateId,
    candidateName,
    isOpen,
    onClose,
    onConsentUpdated
}) => {
    const [currentConsent, setCurrentConsent] = useState<ConsentRecord | null>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Consent toggles
    const [assessmentData, setAssessmentData] = useState(false);
    const [videoData, setVideoData] = useState(false);
    const [interactionData, setInteractionData] = useState(false);
    const [improvementFeedback, setImprovementFeedback] = useState(false);

    // Load existing consent on mount
    useEffect(() => {
        if (isOpen && candidateId) {
            const existing = getConsentStatus(candidateId);
            setCurrentConsent(existing);

            if (existing && !existing.withdrawnAt) {
                setAssessmentData(existing.dataTypes.assessmentData);
                setVideoData(existing.dataTypes.videoData);
                setInteractionData(existing.dataTypes.interactionData);
                setImprovementFeedback(existing.dataTypes.improvementFeedback);
            }
        }
    }, [isOpen, candidateId]);

    const handleSaveConsent = () => {
        const consent = recordConsent(candidateId, {
            assessmentData,
            videoData,
            interactionData,
            improvementFeedback
        });

        setCurrentConsent(consent);
        onConsentUpdated?.(consent);
        onClose();
    };

    const handleWithdrawConsent = (deleteData: boolean) => {
        withdrawConsent(candidateId, deleteData);
        setCurrentConsent(null);
        setAssessmentData(false);
        setVideoData(false);
        setInteractionData(false);
        setImprovementFeedback(false);
        setShowDeleteConfirm(false);
        onClose();
    };

    const handleExportData = async () => {
        setIsExporting(true);

        try {
            const data = exportCandidateData(candidateId);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lune_data_export_${candidateId}_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const dataCategories = [
        {
            id: 'assessment',
            title: 'Assessment Responses',
            description: 'Your answers to assessment questions and AI evaluations',
            icon: Brain,
            checked: assessmentData,
            onChange: setAssessmentData,
            details: [
                'Questions you answered',
                'Your written responses',
                'AI-generated scores and feedback',
                'Time taken per question'
            ]
        },
        {
            id: 'video',
            title: 'Video Analysis Data',
            description: 'Transcriptions and analysis from video assessments',
            icon: Video,
            checked: videoData,
            onChange: setVideoData,
            details: [
                'Speech transcriptions',
                'Communication style analysis',
                'Pronunciation and clarity scores',
                'No video recordings are stored'
            ]
        },
        {
            id: 'interaction',
            title: 'Interaction Patterns',
            description: 'How you navigate and use the platform',
            icon: Eye,
            checked: interactionData,
            onChange: setInteractionData,
            details: [
                'Feature usage patterns',
                'Navigation behavior',
                'Time spent on different sections',
                'Error encounters'
            ]
        },
        {
            id: 'feedback',
            title: 'Improvement Feedback',
            description: 'Help us improve by sharing your assessment experiences',
            icon: MessageSquare,
            checked: improvementFeedback,
            onChange: setImprovementFeedback,
            details: [
                'Score accuracy feedback',
                'Question quality ratings',
                'Suggested improvements',
                'General platform feedback'
            ]
        }
    ];

    const anyConsentGiven = assessmentData || videoData || interactionData || improvementFeedback;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Data & Privacy Settings</h2>
                                    <p className="text-sm text-gray-500">Control how your data helps improve Lune</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <XCircle className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Info Banner */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Your data helps us improve</p>
                                <p className="text-blue-700">
                                    By sharing your data, you help train our AI to provide better assessments,
                                    more accurate scoring, and improved feedback for all candidates.
                                </p>
                            </div>
                        </div>

                        {/* Current Status */}
                        {currentConsent && !currentConsent.withdrawnAt && (
                            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <div>
                                    <p className="text-green-800 font-medium">Data sharing is active</p>
                                    <p className="text-green-700 text-sm">
                                        Consented on {new Date(currentConsent.consentedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Data Categories */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-900">Choose what to share</h3>

                            {dataCategories.map(category => (
                                <div
                                    key={category.id}
                                    className="border border-gray-200 rounded-xl overflow-hidden"
                                >
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.checked ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                <category.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{category.title}</p>
                                                <p className="text-sm text-gray-500">{category.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setExpandedSection(
                                                    expandedSection === category.id ? null : category.id
                                                )}
                                                className="p-1 hover:bg-gray-100 rounded"
                                            >
                                                {expandedSection === category.id ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => category.onChange(!category.checked)}
                                                className={`w-12 h-6 rounded-full transition relative ${category.checked ? 'bg-indigo-600' : 'bg-gray-300'
                                                    }`}
                                            >
                                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${category.checked ? 'translate-x-6' : 'translate-x-0.5'
                                                    }`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {expandedSection === category.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 pt-0">
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <p className="text-xs font-medium text-gray-500 mb-2">What's included:</p>
                                                        <ul className="space-y-1">
                                                            {category.details.map((detail, idx) => (
                                                                <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                                                    {detail}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>

                        {/* Your Rights */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-gray-600" />
                                Your Rights
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleExportData}
                                    disabled={isExporting}
                                    className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700"
                                >
                                    <Download className="w-4 h-4" />
                                    {isExporting ? 'Exporting...' : 'Download My Data'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-2 p-3 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition text-sm font-medium text-red-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete All Data
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                        <p className="text-xs text-gray-500">
                            You can change these settings anytime
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveConsent}
                                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                            >
                                Save Preferences
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-xl p-6 max-w-md shadow-2xl"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                        <AlertTriangle className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Delete All Data?</h3>
                                        <p className="text-sm text-gray-500">This action cannot be undone</p>
                                    </div>
                                </div>

                                <p className="text-gray-600 text-sm mb-6">
                                    This will permanently delete all data we've collected from your assessments.
                                    Your certifications and profile will remain intact.
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleWithdrawConsent(true)}
                                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
                                    >
                                        Delete Data
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
};

export default DataConsentModal;
