import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Code, MessageSquare, Video, VideoOff, Mic, MicOff,
    Play, Pause, Send, X, ChevronDown, Eye, EyeOff, Terminal,
    Share2, Settings, Clock, CheckCircle, AlertTriangle, Lightbulb,
    RotateCcw, Copy, Download, Maximize2, Minimize2
} from 'lucide-react';
import { DifficultyLevel } from '../types';

interface CollaborativeCodingProps {
    sessionId: string;
    skill: string;
    difficulty: DifficultyLevel;
    mode: 'candidate' | 'interviewer';
    onComplete?: (result: CollabResult) => void;
    onLeave?: () => void;
}

interface CollabResult {
    score: number;
    feedback: string;
    codeQuality: number;
    communication: number;
    problemSolving: number;
    collaboration: number;
}

interface ChatMessage {
    id: string;
    sender: 'candidate' | 'interviewer' | 'system';
    message: string;
    timestamp: Date;
}

interface CodingProblem {
    id: string;
    title: string;
    description: string;
    examples: { input: string; output: string; explanation?: string }[];
    constraints: string[];
    starterCode: string;
    testCases: { input: string; expected: string }[];
    hints: string[];
}

const SAMPLE_PROBLEM: CodingProblem = {
    id: 'two-sum',
    title: 'Two Sum',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
        {
            input: 'nums = [2,7,11,15], target = 9',
            output: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
        },
        {
            input: 'nums = [3,2,4], target = 6',
            output: '[1,2]'
        }
    ],
    constraints: [
        '2 <= nums.length <= 10^4',
        '-10^9 <= nums[i] <= 10^9',
        '-10^9 <= target <= 10^9',
        'Only one valid answer exists.'
    ],
    starterCode: `function twoSum(nums, target) {
    // Your code here
    
}`,
    testCases: [
        { input: '[[2,7,11,15], 9]', expected: '[0,1]' },
        { input: '[[3,2,4], 6]', expected: '[1,2]' },
        { input: '[[3,3], 6]', expected: '[0,1]' }
    ],
    hints: [
        'Think about using a hash map to store values you\'ve seen.',
        'For each number, check if (target - number) exists in the map.',
        'You can solve this in O(n) time with O(n) space.'
    ]
};

export const CollaborativeCoding: React.FC<CollaborativeCodingProps> = ({
    sessionId,
    skill,
    difficulty,
    mode,
    onComplete,
    onLeave
}) => {
    const [code, setCode] = useState(SAMPLE_PROBLEM.starterCode);
    const [output, setOutput] = useState<string>('');
    const [isRunning, setIsRunning] = useState(false);
    const [testResults, setTestResults] = useState<{ passed: boolean; input: string; expected: string; actual: string }[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [showChat, setShowChat] = useState(true);
    const [showVideo, setShowVideo] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [currentHint, setCurrentHint] = useState(0);
    const [showHints, setShowHints] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
    const [partnerCursor, setPartnerCursor] = useState<{ line: number; col: number } | null>(null);
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const partnerVideoRef = useRef<HTMLVideoElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const codeRef = useRef<HTMLTextAreaElement>(null);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setTimeElapsed(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Initialize video
    useEffect(() => {
        if (isVideoOn && videoRef.current) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(console.error);
        }
    }, [isVideoOn, isMicOn]);

    // Simulate partner activity
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                setIsPartnerTyping(true);
                setTimeout(() => setIsPartnerTyping(false), 2000);
            }
            if (Math.random() > 0.8) {
                setPartnerCursor({
                    line: Math.floor(Math.random() * 10) + 1,
                    col: Math.floor(Math.random() * 40) + 1
                });
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const runCode = async () => {
        setIsRunning(true);
        setOutput('Running...\n');

        // Simulate code execution
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            // Simple evaluation (in production, use a sandboxed environment)
            const results = SAMPLE_PROBLEM.testCases.map(tc => {
                const passed = Math.random() > 0.3; // Simulated
                return {
                    passed,
                    input: tc.input,
                    expected: tc.expected,
                    actual: passed ? tc.expected : '[0,0]'
                };
            });

            setTestResults(results);
            const passedCount = results.filter(r => r.passed).length;
            setOutput(`Executed ${results.length} test cases.\n${passedCount}/${results.length} passed.`);
        } catch (error: any) {
            setOutput(`Error: ${error.message}`);
        }

        setIsRunning(false);
    };

    const sendMessage = () => {
        if (!chatInput.trim()) return;

        const message: ChatMessage = {
            id: Date.now().toString(),
            sender: mode,
            message: chatInput,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, message]);
        setChatInput('');

        // Simulate partner response
        if (mode === 'candidate') {
            setTimeout(() => {
                const responses = [
                    "Good approach! Have you considered the edge cases?",
                    "Try thinking about the time complexity here.",
                    "That's a valid solution. Can you optimize it?",
                    "What happens if the array has duplicates?"
                ];
                const response: ChatMessage = {
                    id: Date.now().toString(),
                    sender: 'interviewer',
                    message: responses[Math.floor(Math.random() * responses.length)],
                    timestamp: new Date()
                };
                setChatMessages(prev => [...prev, response]);
            }, 2000 + Math.random() * 3000);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const newCode = code.substring(0, start) + '  ' + code.substring(end);
            setCode(newCode);
            setTimeout(() => {
                target.selectionStart = target.selectionEnd = start + 2;
            }, 0);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-slate-900">
            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-white">
                        <Users className="w-5 h-5 text-green-400" />
                        <span className="font-bold">Collaborative Session</span>
                    </div>
                    <div className="px-3 py-1 bg-slate-700 rounded-lg text-slate-300 text-sm">
                        {skill} • {difficulty}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 rounded-lg text-white">
                        <Clock className="w-4 h-4" />
                        <span className="font-mono">{formatTime(timeElapsed)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMicOn(!isMicOn)}
                            className={`p-2 rounded-lg ${isMicOn ? 'bg-green-600' : 'bg-red-600'} text-white`}
                        >
                            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setIsVideoOn(!isVideoOn)}
                            className={`p-2 rounded-lg ${isVideoOn ? 'bg-green-600' : 'bg-red-600'} text-white`}
                        >
                            {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                        </button>
                    </div>

                    <button
                        onClick={onLeave}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                    >
                        End Session
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Problem & Code */}
                <div className="flex-1 flex flex-col">
                    {/* Problem Description */}
                    <div className="h-1/3 overflow-y-auto border-b border-slate-700 p-4 bg-slate-800">
                        <h2 className="text-xl font-bold text-white mb-3">{SAMPLE_PROBLEM.title}</h2>
                        <div className="prose prose-invert prose-sm max-w-none">
                            <p className="text-slate-300 whitespace-pre-wrap">{SAMPLE_PROBLEM.description}</p>

                            <h4 className="text-white mt-4">Examples:</h4>
                            {SAMPLE_PROBLEM.examples.map((ex, idx) => (
                                <div key={idx} className="bg-slate-700 rounded-lg p-3 my-2">
                                    <p className="text-slate-300"><strong className="text-slate-200">Input:</strong> {ex.input}</p>
                                    <p className="text-slate-300"><strong className="text-slate-200">Output:</strong> {ex.output}</p>
                                    {ex.explanation && (
                                        <p className="text-slate-400 text-sm mt-1">{ex.explanation}</p>
                                    )}
                                </div>
                            ))}

                            <h4 className="text-white mt-4">Constraints:</h4>
                            <ul className="text-slate-300">
                                {SAMPLE_PROBLEM.constraints.map((c, idx) => (
                                    <li key={idx}>{c}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Hints */}
                        <div className="mt-4">
                            <button
                                onClick={() => setShowHints(!showHints)}
                                className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-sm"
                            >
                                <Lightbulb className="w-4 h-4" />
                                {showHints ? 'Hide Hints' : 'Show Hints'}
                                <ChevronDown className={`w-4 h-4 transition ${showHints ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {showHints && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-2 space-y-2"
                                    >
                                        {SAMPLE_PROBLEM.hints.slice(0, currentHint + 1).map((hint, idx) => (
                                            <div key={idx} className="bg-yellow-900/30 text-yellow-200 p-2 rounded-lg text-sm">
                                                💡 Hint {idx + 1}: {hint}
                                            </div>
                                        ))}
                                        {currentHint < SAMPLE_PROBLEM.hints.length - 1 && (
                                            <button
                                                onClick={() => setCurrentHint(h => h + 1)}
                                                className="text-yellow-400 text-sm hover:underline"
                                            >
                                                Show next hint
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Code Editor */}
                    <div className="flex-1 flex flex-col bg-slate-900">
                        <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                            <div className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-300 text-sm">solution.js</span>
                                {isPartnerTyping && (
                                    <span className="text-xs text-blue-400 animate-pulse">Partner is typing...</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                    Ln {cursorPosition.line}, Col {cursorPosition.col}
                                </span>
                                <button
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="p-1.5 hover:bg-slate-700 rounded"
                                >
                                    {isFullscreen ? (
                                        <Minimize2 className="w-4 h-4 text-slate-400" />
                                    ) : (
                                        <Maximize2 className="w-4 h-4 text-slate-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <textarea
                                ref={codeRef}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onSelect={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    const lines = code.substring(0, target.selectionStart).split('\n');
                                    setCursorPosition({
                                        line: lines.length,
                                        col: lines[lines.length - 1].length + 1
                                    });
                                }}
                                className="w-full h-full bg-slate-900 text-green-400 font-mono text-sm p-4 resize-none focus:outline-none"
                                spellCheck={false}
                                style={{ tabSize: 2 }}
                            />

                            {/* Partner cursor indicator */}
                            {partnerCursor && (
                                <div
                                    className="absolute w-0.5 h-5 bg-blue-500 animate-pulse pointer-events-none"
                                    style={{
                                        top: `${(partnerCursor.line - 1) * 20 + 16}px`,
                                        left: `${partnerCursor.col * 8 + 16}px`
                                    }}
                                />
                            )}
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-t border-slate-700">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={runCode}
                                    disabled={isRunning}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isRunning ? (
                                        <RotateCcw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Play className="w-4 h-4" />
                                    )}
                                    Run Code
                                </button>
                                <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400">
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex gap-2">
                                {testResults.map((result, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-6 h-6 rounded flex items-center justify-center ${result.passed ? 'bg-green-600' : 'bg-red-600'
                                            }`}
                                    >
                                        {result.passed ? (
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        ) : (
                                            <X className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Output */}
                        <div className="h-32 bg-black border-t border-slate-700 p-3 font-mono text-sm overflow-y-auto">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <Terminal className="w-4 h-4" />
                                Output
                            </div>
                            <pre className="text-slate-300 whitespace-pre-wrap">{output || 'Click "Run Code" to execute'}</pre>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Video & Chat */}
                <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
                    {/* Video Section */}
                    {showVideo && (
                        <div className="border-b border-slate-700">
                            {/* Partner Video */}
                            <div className="aspect-video bg-slate-900 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center">
                                        <span className="text-2xl text-slate-400">
                                            {mode === 'candidate' ? '👨‍💼' : '👩‍💻'}
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                                    {mode === 'candidate' ? 'Interviewer' : 'Candidate'}
                                </div>
                            </div>

                            {/* Self Video */}
                            <div className="h-24 bg-slate-900 relative">
                                {isVideoOn ? (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <VideoOff className="w-6 h-6 text-slate-600" />
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                                    You
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chat Section */}
                    <div className="flex-1 flex flex-col">
                        <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                                <MessageSquare className="w-4 h-4" />
                                <span className="font-medium">Chat</span>
                            </div>
                            <button
                                onClick={() => setShowVideo(!showVideo)}
                                className="p-1.5 hover:bg-slate-700 rounded"
                            >
                                {showVideo ? (
                                    <EyeOff className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <Eye className="w-4 h-4 text-slate-400" />
                                )}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {chatMessages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`${msg.sender === mode
                                            ? 'ml-4 text-right'
                                            : 'mr-4'
                                        }`}
                                >
                                    <div
                                        className={`inline-block p-2 rounded-lg text-sm max-w-full ${msg.sender === mode
                                                ? 'bg-blue-600 text-white'
                                                : msg.sender === 'system'
                                                    ? 'bg-slate-600 text-slate-200'
                                                    : 'bg-slate-700 text-white'
                                            }`}
                                    >
                                        {msg.message}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="p-3 border-t border-slate-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={sendMessage}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollaborativeCoding;
