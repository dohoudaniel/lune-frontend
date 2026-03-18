import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Table2, Presentation, Calendar, Mail,
    ChevronRight, ChevronLeft, CheckCircle, XCircle,
    HelpCircle, Award, RotateCcw
} from 'lucide-react';
import {
    GoogleWorkspaceQuestion,
    getRandomWorkspaceQuestions,
    scoreWorkspaceAnswers
} from '../../services/vaAssessmentService';

interface GoogleWorkspaceQuizProps {
    questionCount?: number;
    onComplete: (result: { score: number; correct: number; total: number; passed: boolean }) => void;
}

const TOOL_ICONS: Record<GoogleWorkspaceQuestion['tool'], React.ReactNode> = {
    docs: <FileText size={20} />,
    sheets: <Table2 size={20} />,
    slides: <Presentation size={20} />,
    calendar: <Calendar size={20} />,
    gmail: <Mail size={20} />
};

const TOOL_COLORS: Record<GoogleWorkspaceQuestion['tool'], string> = {
    docs: 'bg-blue-500',
    sheets: 'bg-green-500',
    slides: 'bg-yellow-500',
    calendar: 'bg-red-500',
    gmail: 'bg-red-600'
};

const TOOL_LABELS: Record<GoogleWorkspaceQuestion['tool'], string> = {
    docs: 'Google Docs',
    sheets: 'Google Sheets',
    slides: 'Google Slides',
    calendar: 'Google Calendar',
    gmail: 'Gmail'
};

export const GoogleWorkspaceQuiz: React.FC<GoogleWorkspaceQuizProps> = ({
    questionCount = 10,
    onComplete
}) => {
    const [status, setStatus] = useState<'ready' | 'quiz' | 'review' | 'finished'>('ready');
    const [questions, setQuestions] = useState<GoogleWorkspaceQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [showExplanation, setShowExplanation] = useState(false);
    const [result, setResult] = useState<{ score: number; correct: number; total: number; passed: boolean } | null>(null);

    const startQuiz = useCallback(() => {
        const qs = getRandomWorkspaceQuestions(questionCount);
        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(null));
        setCurrentIndex(0);
        setStatus('quiz');
        setShowExplanation(false);
    }, [questionCount]);

    const selectAnswer = (optionIndex: number) => {
        if (showExplanation) return; // Already answered

        const newAnswers = [...answers];
        newAnswers[currentIndex] = optionIndex;
        setAnswers(newAnswers);
        setShowExplanation(true);
    };

    const nextQuestion = () => {
        setShowExplanation(false);
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            finishQuiz();
        }
    };

    const prevQuestion = () => {
        if (currentIndex > 0) {
            setShowExplanation(answers[currentIndex - 1] !== null);
            setCurrentIndex(prev => prev - 1);
        }
    };

    const finishQuiz = () => {
        const finalAnswers = answers.map(a => a ?? -1);
        const quizResult = scoreWorkspaceAnswers(questions, finalAnswers);
        setResult(quizResult);
        setStatus('finished');
        onComplete(quizResult);
    };

    const resetQuiz = () => {
        setStatus('ready');
        setQuestions([]);
        setAnswers([]);
        setCurrentIndex(0);
        setResult(null);
        setShowExplanation(false);
    };

    const currentQuestion = questions[currentIndex];
    const currentAnswer = answers[currentIndex];
    const isCorrect = currentAnswer === currentQuestion?.correctAnswer;

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <Table2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Google Workspace Proficiency</h2>
                        <p className="text-green-200 text-sm">
                            Docs, Sheets, Slides, Calendar & Gmail
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
                        <div className="flex justify-center gap-3 mb-6">
                            {Object.entries(TOOL_ICONS).map(([tool, icon]) => (
                                <div
                                    key={tool}
                                    className={`p-3 ${TOOL_COLORS[tool as GoogleWorkspaceQuestion['tool']]} text-white rounded-xl`}
                                >
                                    {icon}
                                </div>
                            ))}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Test Your Google Workspace Skills
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Answer {questionCount} questions about Google Docs, Sheets, Slides, Calendar, and Gmail.
                            You need 70% to pass.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startQuiz}
                            className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-xl shadow-lg"
                        >
                            Start Quiz
                        </motion.button>
                    </motion.div>
                )}

                {/* Quiz State */}
                {status === 'quiz' && currentQuestion && (
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {/* Progress */}
                        <div className="mb-6">
                            <div className="flex justify-between text-sm text-gray-500 mb-2">
                                <span>Question {currentIndex + 1} of {questions.length}</span>
                                <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-green-500 to-teal-500"
                                />
                            </div>
                        </div>

                        {/* Tool Badge */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`p-1.5 ${TOOL_COLORS[currentQuestion.tool]} text-white rounded-lg`}>
                                {TOOL_ICONS[currentQuestion.tool]}
                            </div>
                            <span className="text-sm font-semibold text-gray-600">
                                {TOOL_LABELS[currentQuestion.tool]}
                            </span>
                            <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                    currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                }`}>
                                {currentQuestion.difficulty}
                            </span>
                        </div>

                        {/* Question */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">
                            {currentQuestion.question}
                        </h3>

                        {/* Options */}
                        <div className="space-y-3 mb-6">
                            {currentQuestion.options.map((option, i) => {
                                const isSelected = currentAnswer === i;
                                const isCorrectOption = currentQuestion.correctAnswer === i;

                                let optionClass = 'border-gray-200 hover:border-gray-400';
                                if (showExplanation) {
                                    if (isCorrectOption) {
                                        optionClass = 'border-green-500 bg-green-50';
                                    } else if (isSelected && !isCorrectOption) {
                                        optionClass = 'border-red-500 bg-red-50';
                                    }
                                } else if (isSelected) {
                                    optionClass = 'border-teal-500 bg-teal-50';
                                }

                                return (
                                    <motion.button
                                        key={i}
                                        whileHover={!showExplanation ? { scale: 1.01 } : {}}
                                        whileTap={!showExplanation ? { scale: 0.99 } : {}}
                                        onClick={() => selectAnswer(i)}
                                        disabled={showExplanation}
                                        className={`w-full p-4 border-2 rounded-xl text-left transition-all flex items-center gap-3 ${optionClass}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${showExplanation && isCorrectOption ? 'bg-green-500 text-white' :
                                                showExplanation && isSelected && !isCorrectOption ? 'bg-red-500 text-white' :
                                                    isSelected ? 'bg-teal-500 text-white' :
                                                        'bg-gray-100 text-gray-600'
                                            }`}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <span className="flex-1">{option}</span>
                                        {showExplanation && isCorrectOption && <CheckCircle className="text-green-500" size={20} />}
                                        {showExplanation && isSelected && !isCorrectOption && <XCircle className="text-red-500" size={20} />}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        <AnimatePresence>
                            {showExplanation && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={`p-4 rounded-xl mb-6 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}
                                >
                                    <div className="flex items-start gap-2">
                                        <HelpCircle className={isCorrect ? 'text-green-600' : 'text-blue-600'} size={18} />
                                        <div>
                                            <p className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-blue-700'}`}>
                                                {isCorrect ? 'Correct!' : 'Explanation:'}
                                            </p>
                                            <p className="text-gray-600 text-sm">{currentQuestion.explanation}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex justify-between">
                            <button
                                onClick={prevQuestion}
                                disabled={currentIndex === 0}
                                className="px-4 py-2 text-gray-600 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={18} /> Previous
                            </button>

                            {showExplanation && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={nextQuestion}
                                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-xl flex items-center gap-1"
                                >
                                    {currentIndex < questions.length - 1 ? (
                                        <>Next <ChevronRight size={18} /></>
                                    ) : (
                                        <>Finish Quiz</>
                                    )}
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Finished State */}
                {status === 'finished' && result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                    >
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${result.passed ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            {result.passed ? (
                                <Award className="text-green-600" size={48} />
                            ) : (
                                <XCircle className="text-red-600" size={48} />
                            )}
                        </div>

                        <h3 className={`text-2xl font-bold mb-2 ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                            {result.passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {result.passed
                                ? 'Great job! You demonstrated solid Google Workspace knowledge.'
                                : 'Keep practicing! You need 70% to pass.'}
                        </p>

                        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="text-3xl font-bold text-gray-900">{result.score}%</div>
                                <div className="text-sm text-gray-500">Score</div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="text-3xl font-bold text-green-600">{result.correct}</div>
                                <div className="text-sm text-gray-500">Correct</div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="text-3xl font-bold text-red-600">{result.total - result.correct}</div>
                                <div className="text-sm text-gray-500">Wrong</div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={resetQuiz}
                            className="px-8 py-3 bg-gray-800 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 mx-auto"
                        >
                            <RotateCcw size={18} /> Try Again
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default GoogleWorkspaceQuiz;
