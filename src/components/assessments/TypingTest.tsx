import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, Play, RotateCcw, CheckCircle, XCircle, Clock, Target, Award } from 'lucide-react';
import {
    getRandomTypingPassage,
    calculateTypingResult,
    TypingTestResult,
    TypingTestConfig,
    DEFAULT_TYPING_CONFIG
} from '../../services/vaAssessmentService';

interface TypingTestProps {
    onComplete: (result: TypingTestResult) => void;
    config?: Partial<TypingTestConfig>;
}

export const TypingTest: React.FC<TypingTestProps> = ({
    onComplete,
    config = {}
}) => {
    const mergedConfig: TypingTestConfig = { ...DEFAULT_TYPING_CONFIG, ...config };

    const [status, setStatus] = useState<'ready' | 'running' | 'finished'>('ready');
    const [passage, setPassage] = useState('');
    const [typedText, setTypedText] = useState('');
    const [timeLeft, setTimeLeft] = useState(mergedConfig.duration);
    const [result, setResult] = useState<TypingTestResult | null>(null);
    const [currentWPM, setCurrentWPM] = useState(0);
    const [currentAccuracy, setCurrentAccuracy] = useState(100);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const startTimeRef = useRef<number>(0);
    const timerRef = useRef<NodeJS.Timeout>(null);

    // Initialize passage
    useEffect(() => {
        setPassage(getRandomTypingPassage());
    }, []);

    // Timer logic
    useEffect(() => {
        if (status === 'running' && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (status === 'running' && timeLeft === 0) {
            finishTest();
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [status, timeLeft]);

    // Calculate live stats
    useEffect(() => {
        if (status === 'running' && typedText.length > 0) {
            const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
            const wordsTyped = typedText.length / 5;
            const wpm = Math.round((wordsTyped / elapsedSeconds) * 60);
            setCurrentWPM(wpm);

            // Calculate live accuracy
            let correct = 0;
            for (let i = 0; i < typedText.length; i++) {
                if (passage[i] === typedText[i]) correct++;
            }
            setCurrentAccuracy(Math.round((correct / typedText.length) * 100));
        }
    }, [typedText, status, passage]);

    const startTest = useCallback(() => {
        setStatus('running');
        setTypedText('');
        setTimeLeft(mergedConfig.duration);
        startTimeRef.current = Date.now();
        inputRef.current?.focus();
    }, [mergedConfig.duration]);

    const finishTest = useCallback(() => {
        setStatus('finished');
        const elapsedSeconds = mergedConfig.duration - timeLeft;
        const testResult = calculateTypingResult(passage, typedText, elapsedSeconds, mergedConfig);
        setResult(testResult);
        onComplete(testResult);
    }, [passage, typedText, timeLeft, mergedConfig, onComplete]);

    const resetTest = useCallback(() => {
        setStatus('ready');
        setTypedText('');
        setTimeLeft(mergedConfig.duration);
        setResult(null);
        setCurrentWPM(0);
        setCurrentAccuracy(100);
        setPassage(getRandomTypingPassage());
    }, [mergedConfig.duration]);

    const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (status !== 'running') return;
        setTypedText(e.target.value);

        // Auto-finish if typed all text
        if (e.target.value.length >= passage.length) {
            finishTest();
        }
    };

    // Render character with highlighting
    const renderPassage = () => {
        return passage.split('').map((char, i) => {
            let className = 'text-gray-400';

            if (i < typedText.length) {
                if (typedText[i] === char) {
                    className = 'text-green-600 bg-green-50';
                } else {
                    className = 'text-red-600 bg-red-100';
                }
            } else if (i === typedText.length) {
                className = 'text-gray-900 bg-yellow-200 animate-pulse';
            }

            return (
                <span key={i} className={`${className} transition-colors`}>
                    {char}
                </span>
            );
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <Keyboard size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Typing Speed Test</h2>
                        <p className="text-indigo-200 text-sm">
                            Target: {mergedConfig.minimumWPM} WPM with {mergedConfig.minimumAccuracy}% accuracy
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-1">
                            <Clock size={16} />
                            Time
                        </div>
                        <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-900'}`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-1">
                            <Target size={16} />
                            WPM
                        </div>
                        <div className={`text-2xl font-bold ${currentWPM >= mergedConfig.minimumWPM ? 'text-green-600' : 'text-orange-500'}`}>
                            {currentWPM}
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-1">
                            <Award size={16} />
                            Accuracy
                        </div>
                        <div className={`text-2xl font-bold ${currentAccuracy >= mergedConfig.minimumAccuracy ? 'text-green-600' : 'text-orange-500'}`}>
                            {currentAccuracy}%
                        </div>
                    </div>
                </div>

                {/* Passage Display */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Type the text below:
                    </label>
                    <div className="bg-gray-50 rounded-xl p-4 text-lg leading-relaxed font-mono min-h-[120px] border border-gray-200">
                        {renderPassage()}
                    </div>
                </div>

                {/* Input Area */}
                <div className="mb-6">
                    <textarea
                        ref={inputRef}
                        value={typedText}
                        onChange={handleTyping}
                        disabled={status !== 'running'}
                        placeholder={status === 'ready' ? 'Click "Start Test" to begin...' : ''}
                        className="w-full h-32 p-4 border border-gray-300 rounded-xl font-mono text-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                    {status === 'ready' && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startTest}
                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
                        >
                            <Play size={20} /> Start Test
                        </motion.button>
                    )}

                    {status === 'running' && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={finishTest}
                            className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
                        >
                            <CheckCircle size={20} /> Finish Early
                        </motion.button>
                    )}

                    {status === 'finished' && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={resetTest}
                            className="px-8 py-3 bg-gray-800 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
                        >
                            <RotateCcw size={20} /> Try Again
                        </motion.button>
                    )}
                </div>

                {/* Results */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`mt-6 p-6 rounded-xl border-2 ${result.passed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                {result.passed ? (
                                    <>
                                        <CheckCircle className="text-green-600" size={28} />
                                        <span className="text-xl font-bold text-green-700">Test Passed!</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="text-red-600" size={28} />
                                        <span className="text-xl font-bold text-red-700">Below Target</span>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-sm text-gray-500">Final WPM</div>
                                    <div className="text-2xl font-bold text-gray-900">{result.wordsPerMinute}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm text-gray-500">Accuracy</div>
                                    <div className="text-2xl font-bold text-gray-900">{result.accuracy}%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm text-gray-500">Characters</div>
                                    <div className="text-2xl font-bold text-gray-900">{result.totalCharacters}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm text-gray-500">Errors</div>
                                    <div className="text-2xl font-bold text-gray-900">{result.errors}</div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TypingTest;
