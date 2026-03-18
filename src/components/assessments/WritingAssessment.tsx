import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PenTool, FileText, CheckCircle, Clock, Target,
    RotateCcw, Send, Lightbulb, AlertCircle
} from 'lucide-react';
import {
    WritingTask,
    CommunicationScenario,
    getRandomWritingTask,
    getRandomCommunicationScenario
} from '../../services/vaAssessmentService';

interface WritingAssessmentProps {
    type: 'writing' | 'communication';
    onComplete: (result: { content: string; wordCount: number; task: WritingTask | CommunicationScenario }) => void;
}

export const WritingAssessment: React.FC<WritingAssessmentProps> = ({
    type,
    onComplete
}) => {
    const [status, setStatus] = useState<'ready' | 'writing' | 'submitted'>('ready');
    const [task, setTask] = useState<WritingTask | CommunicationScenario | null>(null);
    const [content, setContent] = useState('');
    const [startTime, setStartTime] = useState<number>(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Timer effect
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'writing') {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status, startTime]);

    const startAssessment = useCallback(() => {
        const newTask = type === 'writing'
            ? getRandomWritingTask()
            : getRandomCommunicationScenario();
        setTask(newTask);
        setContent('');
        setStartTime(Date.now());
        setElapsedTime(0);
        setStatus('writing');
    }, [type]);

    const submitAssessment = useCallback(() => {
        if (!task) return;
        setStatus('submitted');
        onComplete({
            content,
            wordCount: content.trim().split(/\s+/).filter(w => w.length > 0).length,
            task
        });
    }, [task, content, onComplete]);

    const resetAssessment = useCallback(() => {
        setStatus('ready');
        setTask(null);
        setContent('');
        setElapsedTime(0);
    }, []);

    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const isWritingTask = (t: WritingTask | CommunicationScenario): t is WritingTask =>
        'wordLimit' in t || 'type' in t && ['memo', 'summary', 'meeting_notes', 'sop', 'email_draft'].includes((t as WritingTask).type);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getWordStatus = () => {
        if (!task || !isWritingTask(task) || !task.wordLimit) return { status: 'neutral', message: '' };

        if (wordCount < task.wordLimit.min) {
            return {
                status: 'warning',
                message: `${task.wordLimit.min - wordCount} more words needed`
            };
        }
        if (wordCount > task.wordLimit.max) {
            return {
                status: 'error',
                message: `${wordCount - task.wordLimit.max} words over limit`
            };
        }
        return {
            status: 'success',
            message: 'Word count is good!'
        };
    };

    const wordStatus = getWordStatus();

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className={`p-6 text-white ${type === 'writing'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                }`}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                        {type === 'writing' ? <PenTool size={24} /> : <FileText size={24} />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">
                            {type === 'writing' ? 'Document Drafting' : 'Communication Skills'}
                        </h2>
                        <p className={`text-sm ${type === 'writing' ? 'text-purple-200' : 'text-blue-200'}`}>
                            {type === 'writing'
                                ? 'Draft professional documents from requirements'
                                : 'Respond to real-world workplace scenarios'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Ready State */}
                {status === 'ready' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8"
                    >
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${type === 'writing' ? 'bg-purple-100' : 'bg-blue-100'
                            }`}>
                            {type === 'writing'
                                ? <PenTool className="text-purple-600" size={36} />
                                : <FileText className="text-blue-600" size={36} />
                            }
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {type === 'writing'
                                ? 'Ready to Write?'
                                : 'Communication Challenge'}
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            {type === 'writing'
                                ? 'You\'ll be given a document drafting task. Follow the requirements and write a professional document.'
                                : 'You\'ll receive a workplace scenario. Write a professional response addressing the situation.'}
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startAssessment}
                            className={`px-8 py-3 text-white font-bold rounded-xl shadow-lg ${type === 'writing'
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                                    : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                                }`}
                        >
                            Start Assessment
                        </motion.button>
                    </motion.div>
                )}

                {/* Writing State */}
                {status === 'writing' && task && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {/* Stats Bar */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock size={18} />
                                    <span className="font-mono font-medium">{formatTime(elapsedTime)}</span>
                                </div>
                                <div className={`flex items-center gap-2 ${wordStatus.status === 'success' ? 'text-green-600' :
                                        wordStatus.status === 'warning' ? 'text-yellow-600' :
                                            wordStatus.status === 'error' ? 'text-red-600' :
                                                'text-gray-600'
                                    }`}>
                                    <Target size={18} />
                                    <span className="font-medium">{wordCount} words</span>
                                </div>
                            </div>
                            {isWritingTask(task) && task.wordLimit && (
                                <span className="text-sm text-gray-500">
                                    Target: {task.wordLimit.min}-{task.wordLimit.max} words
                                </span>
                            )}
                        </div>

                        {/* Task Details */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${type === 'writing' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {isWritingTask(task) ? task.type.replace('_', ' ').toUpperCase() : (task as CommunicationScenario).type.replace('_', ' ').toUpperCase()}
                                </span>
                                <h3 className="font-bold text-gray-900">
                                    {isWritingTask(task) ? task.title : 'Scenario Response'}
                                </h3>
                            </div>

                            {/* Context */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                <div className="flex items-start gap-2 mb-2">
                                    <Lightbulb className="text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
                                    <span className="font-semibold text-gray-700">Context</span>
                                </div>
                                <p className="text-gray-600 text-sm">
                                    {isWritingTask(task) ? task.context : (task as CommunicationScenario).context}
                                </p>
                            </div>

                            {/* Instructions */}
                            <div className="bg-blue-50 rounded-xl p-4 mb-4">
                                <div className="flex items-start gap-2 mb-2">
                                    <FileText className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                                    <span className="font-semibold text-blue-700">Instructions</span>
                                </div>
                                <p className="text-blue-800 text-sm">
                                    {isWritingTask(task) ? task.instructions : (task as CommunicationScenario).prompt}
                                </p>
                            </div>

                            {/* Requirements */}
                            <div className="bg-green-50 rounded-xl p-4">
                                <div className="flex items-start gap-2 mb-2">
                                    <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                                    <span className="font-semibold text-green-700">Requirements</span>
                                </div>
                                <ul className="space-y-1">
                                    {(isWritingTask(task) ? task.requirements : (task as CommunicationScenario).evaluationCriteria).map((req, i) => (
                                        <li key={i} className="text-green-800 text-sm flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                            {req}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Writing Area */}
                        <div className="mb-4">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Start writing your response here..."
                                className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-800"
                            />
                        </div>

                        {/* Word Status */}
                        {wordStatus.message && (
                            <div className={`flex items-center gap-2 mb-4 text-sm ${wordStatus.status === 'success' ? 'text-green-600' :
                                    wordStatus.status === 'warning' ? 'text-yellow-600' :
                                        'text-red-600'
                                }`}>
                                <AlertCircle size={16} />
                                {wordStatus.message}
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={resetAssessment}
                                className="px-6 py-2 text-gray-600 font-medium flex items-center gap-2"
                            >
                                <RotateCcw size={18} /> Reset
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={submitAssessment}
                                disabled={wordCount < 20}
                                className={`px-8 py-3 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${type === 'writing'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                                        : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                                    }`}
                            >
                                <Send size={18} /> Submit Response
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Submitted State */}
                {status === 'submitted' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                    >
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="text-green-600" size={48} />
                        </div>

                        <h3 className="text-2xl font-bold text-green-700 mb-2">
                            Response Submitted!
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Your response has been recorded. In a real assessment, this would be evaluated by AI for tone, clarity, and professionalism.
                        </p>

                        <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto mb-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{wordCount}</div>
                                    <div className="text-sm text-gray-500">Words Written</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{formatTime(elapsedTime)}</div>
                                    <div className="text-sm text-gray-500">Time Taken</div>
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={resetAssessment}
                            className="px-8 py-3 bg-gray-800 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 mx-auto"
                        >
                            <RotateCcw size={18} /> Try Another
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default WritingAssessment;
