import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Check, X, Clock, Zap, HelpCircle,
    SkipForward, Flag, Volume2, VolumeX, Pause, Play, Target,
    Award, TrendingUp, Star, ArrowRight, Home, RefreshCw
} from 'lucide-react';
import { DifficultyLevel } from '../types';

interface MobileAssessmentProps {
    skill: string;
    difficulty: DifficultyLevel;
    onComplete: (result: MobileAssessmentResult) => void;
    onExit?: () => void;
}

interface MobileAssessmentResult {
    score: number;
    questionsAnswered: number;
    correctAnswers: number;
    timeSpent: number;
    streakBonus: number;
}

interface Question {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty: number;
}

const SAMPLE_QUESTIONS: Question[] = [
    {
        id: 'q1',
        question: 'What hook is used for side effects in React?',
        options: ['useState', 'useEffect', 'useReducer', 'useContext'],
        correctIndex: 1,
        explanation: 'useEffect is specifically designed for side effects like data fetching, subscriptions, etc.',
        difficulty: 1
    },
    {
        id: 'q2',
        question: 'Which is true about React keys?',
        options: [
            'Keys must be globally unique',
            'Keys help React identify items',
            'Keys should be random',
            'Keys are optional'
        ],
        correctIndex: 1,
        explanation: 'Keys help React identify which items have changed, added, or removed.',
        difficulty: 2
    },
    {
        id: 'q3',
        question: 'What is the virtual DOM?',
        options: [
            'A browser feature',
            'A copy of the real DOM',
            'A CSS framework',
            'A testing library'
        ],
        correctIndex: 1,
        explanation: 'The virtual DOM is a lightweight copy of the real DOM that React uses for efficient updates.',
        difficulty: 1
    },
    {
        id: 'q4',
        question: 'How do you pass data from parent to child?',
        options: ['state', 'props', 'context', 'refs'],
        correctIndex: 1,
        explanation: 'Props are used to pass data from parent components to child components.',
        difficulty: 1
    },
    {
        id: 'q5',
        question: 'Which hook replaces class lifecycle methods?',
        options: ['useState', 'useEffect', 'useMemo', 'useRef'],
        correctIndex: 1,
        explanation: 'useEffect can handle componentDidMount, componentDidUpdate, and componentWillUnmount.',
        difficulty: 2
    }
];

export const MobileAssessment: React.FC<MobileAssessmentProps> = ({
    skill,
    difficulty,
    onComplete,
    onExit
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>(new Array(SAMPLE_QUESTIONS.length).fill(null));
    const [showResult, setShowResult] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isPaused, setIsPaused] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [startTime] = useState(Date.now());
    const [showConfetti, setShowConfetti] = useState(false);

    const x = useMotionValue(0);
    const background = useTransform(
        x,
        [-200, 0, 200],
        ['#ef4444', '#6366f1', '#22c55e']
    );

    const question = SAMPLE_QUESTIONS[currentIndex];
    const progress = ((currentIndex + 1) / SAMPLE_QUESTIONS.length) * 100;

    // Timer
    useEffect(() => {
        if (isPaused || isAnswered || showResult) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleTimeout();
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentIndex, isPaused, isAnswered, showResult]);

    const handleTimeout = () => {
        setIsAnswered(true);
        setStreak(0);
        setTimeout(() => nextQuestion(), 1500);
    };

    const handleSelect = (optionIndex: number) => {
        if (isAnswered) return;

        setSelectedOption(optionIndex);
        setIsAnswered(true);

        const isCorrect = optionIndex === question.correctIndex;
        const newAnswers = [...answers];
        newAnswers[currentIndex] = optionIndex;
        setAnswers(newAnswers);

        if (isCorrect) {
            const newStreak = streak + 1;
            setStreak(newStreak);
            if (newStreak > maxStreak) setMaxStreak(newStreak);

            if (newStreak >= 3) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 1000);
            }
        } else {
            setStreak(0);
        }

        // Auto-advance after delay
        setTimeout(() => {
            if (currentIndex < SAMPLE_QUESTIONS.length - 1) {
                nextQuestion();
            } else {
                finishAssessment();
            }
        }, 1500);
    };

    const nextQuestion = () => {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setShowExplanation(false);
        setTimeLeft(30);
    };

    const finishAssessment = () => {
        setShowResult(true);
        const correctCount = answers.filter((a, i) => a === SAMPLE_QUESTIONS[i].correctIndex).length;
        const score = Math.round((correctCount / SAMPLE_QUESTIONS.length) * 100);
        const timeSpent = Math.round((Date.now() - startTime) / 1000);

        onComplete({
            score,
            questionsAnswered: SAMPLE_QUESTIONS.length,
            correctAnswers: correctCount,
            timeSpent,
            streakBonus: maxStreak * 5
        });
    };

    const handleDrag = (event: any, info: PanInfo) => {
        // Swipe gestures for quick answers
        if (Math.abs(info.offset.x) > 100 && !isAnswered) {
            // Could implement swipe-to-answer
        }
    };

    if (showResult) {
        const correctCount = answers.filter((a, i) => a === SAMPLE_QUESTIONS[i].correctIndex).length;
        const score = Math.round((correctCount / SAMPLE_QUESTIONS.length) * 100);

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 flex flex-col items-center justify-center"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
                >
                    {/* Score Circle */}
                    <div className="relative w-32 h-32 mx-auto mb-6">
                        <svg className="w-full h-full -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="12"
                            />
                            <motion.circle
                                cx="64"
                                cy="64"
                                r="56"
                                fill="none"
                                stroke={score >= 70 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'}
                                strokeWidth="12"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: score / 100 }}
                                transition={{ duration: 1, delay: 0.5 }}
                                style={{ strokeDasharray: '352', strokeDashoffset: '0' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1 }}
                                className="text-4xl font-bold text-gray-900"
                            >
                                {score}%
                            </motion.span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {score >= 80 ? '🎉 Excellent!' : score >= 60 ? '👍 Good Job!' : '💪 Keep Practicing!'}
                    </h2>
                    <p className="text-gray-500 mb-6">
                        {correctCount} of {SAMPLE_QUESTIONS.length} correct
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                            <p className="font-bold text-gray-900">{maxStreak}</p>
                            <p className="text-xs text-gray-500">Max Streak</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                            <p className="font-bold text-gray-900">{Math.round((Date.now() - startTime) / 1000)}s</p>
                            <p className="text-xs text-gray-500">Time</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <Star className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                            <p className="font-bold text-gray-900">+{score + maxStreak * 5}</p>
                            <p className="text-xs text-gray-500">XP</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                setCurrentIndex(0);
                                setAnswers(new Array(SAMPLE_QUESTIONS.length).fill(null));
                                setShowResult(false);
                                setStreak(0);
                                setMaxStreak(0);
                            }}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Try Again
                        </button>
                        <button
                            onClick={onExit}
                            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            Back to Home
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
                <button onClick={onExit} className="p-2">
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">{skill}</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                        {difficulty}
                    </span>
                </div>

                <button onClick={() => setIsPaused(!isPaused)} className="p-2">
                    {isPaused ? <Play className="w-6 h-6 text-gray-600" /> : <Pause className="w-6 h-6 text-gray-600" />}
                </button>
            </header>

            {/* Progress Bar */}
            <div className="bg-white px-4 pb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Question {currentIndex + 1}/{SAMPLE_QUESTIONS.length}</span>
                    <div className="flex items-center gap-2">
                        {streak > 0 && (
                            <span className="flex items-center gap-1 text-orange-500">
                                <Zap className="w-3 h-3" /> {streak}
                            </span>
                        )}
                    </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Timer */}
            <div className="flex justify-center py-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${timeLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                    <Clock className="w-4 h-4" />
                    <span className="font-bold">{timeLeft}s</span>
                </div>
            </div>

            {/* Question Card */}
            <div className="flex-1 px-4 pb-4">
                <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-white rounded-3xl shadow-lg p-6 h-full flex flex-col"
                >
                    {/* Question */}
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
                            {question.question}
                        </h2>

                        {/* Options */}
                        <div className="space-y-3">
                            {question.options.map((option, idx) => {
                                const isSelected = selectedOption === idx;
                                const isCorrect = idx === question.correctIndex;
                                const showCorrect = isAnswered && isCorrect;
                                const showWrong = isAnswered && isSelected && !isCorrect;

                                return (
                                    <motion.button
                                        key={idx}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelect(idx)}
                                        disabled={isAnswered}
                                        className={`w-full p-4 rounded-2xl text-left font-medium transition-all ${showCorrect
                                                ? 'bg-green-100 border-2 border-green-500 text-green-700'
                                                : showWrong
                                                    ? 'bg-red-100 border-2 border-red-500 text-red-700'
                                                    : isSelected
                                                        ? 'bg-indigo-100 border-2 border-indigo-500 text-indigo-700'
                                                        : 'bg-gray-50 border-2 border-gray-200 text-gray-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${showCorrect ? 'bg-green-500 text-white' :
                                                    showWrong ? 'bg-red-500 text-white' :
                                                        isSelected ? 'bg-indigo-500 text-white' :
                                                            'bg-gray-200 text-gray-600'
                                                }`}>
                                                {showCorrect ? <Check className="w-4 h-4" /> :
                                                    showWrong ? <X className="w-4 h-4" /> :
                                                        String.fromCharCode(65 + idx)}
                                            </div>
                                            <span>{option}</span>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Explanation */}
                    <AnimatePresence>
                        {isAnswered && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-gray-100"
                            >
                                <button
                                    onClick={() => setShowExplanation(!showExplanation)}
                                    className="flex items-center gap-2 text-indigo-600 font-medium text-sm"
                                >
                                    <HelpCircle className="w-4 h-4" />
                                    {showExplanation ? 'Hide' : 'Show'} Explanation
                                </button>
                                <AnimatePresence>
                                    {showExplanation && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="mt-2 text-sm text-gray-600"
                                        >
                                            {question.explanation}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Streak Animation */}
            <AnimatePresence>
                {showConfetti && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="fixed inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-bold text-lg flex items-center gap-2 shadow-lg">
                            <Zap className="w-6 h-6" />
                            {streak} Streak! 🔥
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pause Overlay */}
            <AnimatePresence>
                {isPaused && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                    >
                        <div className="text-center text-white">
                            <Pause className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <h2 className="text-2xl font-bold mb-2">Paused</h2>
                            <p className="text-gray-400 mb-6">Tap to resume</p>
                            <button
                                onClick={() => setIsPaused(false)}
                                className="px-8 py-3 bg-white text-gray-900 rounded-full font-bold"
                            >
                                Resume
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileAssessment;
