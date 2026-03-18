import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Video, VideoOff, MessageSquare, Brain, Clock,
    ChevronRight, CheckCircle, AlertTriangle, Sparkles, Volume2,
    Play, Pause, RotateCcw, ThumbsUp, ThumbsDown, Lightbulb,
    User, Bot, Send, X, BarChart2, Target, Zap, Award
} from 'lucide-react';

interface AIInterviewSimulatorProps {
    skill: string;
    interviewType: 'behavioral' | 'technical' | 'case_study' | 'sales_pitch';
    difficulty: 'entry' | 'mid' | 'senior' | 'executive';
    onComplete: (result: InterviewResult) => void;
    onCancel?: () => void;
}

interface InterviewResult {
    overallScore: number;
    categories: {
        communication: number;
        technicalDepth: number;
        problemSolving: number;
        cultureFit: number;
        confidence: number;
    };
    feedback: string;
    strengths: string[];
    improvements: string[];
    transcripts: ConversationMessage[];
}

interface ConversationMessage {
    id: string;
    role: 'interviewer' | 'candidate';
    content: string;
    timestamp: Date;
    feedback?: {
        type: 'positive' | 'improvement' | 'tip';
        message: string;
    };
}

interface InterviewQuestion {
    id: string;
    question: string;
    category: string;
    followUps: string[];
    evaluationCriteria: string[];
}

const INTERVIEW_QUESTIONS: Record<string, InterviewQuestion[]> = {
    behavioral: [
        {
            id: 'b1',
            question: "Tell me about a time when you had to deal with a difficult team member. How did you handle it?",
            category: 'Conflict Resolution',
            followUps: ["What was the outcome?", "What would you do differently?"],
            evaluationCriteria: ['STAR method usage', 'Empathy shown', 'Resolution focus']
        },
        {
            id: 'b2',
            question: "Describe a situation where you had to meet a tight deadline. How did you manage your time?",
            category: 'Time Management',
            followUps: ["What tools did you use?", "How did you prioritize?"],
            evaluationCriteria: ['Organization skills', 'Prioritization', 'Stress management']
        },
        {
            id: 'b3',
            question: "Give me an example of when you showed leadership, even without a formal title.",
            category: 'Leadership',
            followUps: ["How did others respond?", "What did you learn?"],
            evaluationCriteria: ['Initiative', 'Influence', 'Results orientation']
        }
    ],
    technical: [
        {
            id: 't1',
            question: "Can you explain how you would design a scalable notification system?",
            category: 'System Design',
            followUps: ["How would you handle millions of users?", "What about real-time updates?"],
            evaluationCriteria: ['Architecture knowledge', 'Scalability thinking', 'Trade-off analysis']
        },
        {
            id: 't2',
            question: "Walk me through how you would debug a performance issue in a web application.",
            category: 'Problem Solving',
            followUps: ["What tools would you use?", "How do you identify the root cause?"],
            evaluationCriteria: ['Systematic approach', 'Tool knowledge', 'Root cause analysis']
        },
        {
            id: 't3',
            question: "Explain the difference between SQL and NoSQL databases. When would you use each?",
            category: 'Technical Knowledge',
            followUps: ["Give a real-world example", "What about hybrid approaches?"],
            evaluationCriteria: ['Technical accuracy', 'Practical application', 'Trade-off understanding']
        }
    ],
    case_study: [
        {
            id: 'c1',
            question: "Our client's e-commerce conversion rate dropped 20% last quarter. How would you diagnose and fix this?",
            category: 'Business Analysis',
            followUps: ["What data would you need?", "What's your hypothesis?"],
            evaluationCriteria: ['Analytical framework', 'Data-driven approach', 'Creative solutions']
        },
        {
            id: 'c2',
            question: "A startup wants to enter the food delivery market. What should their go-to-market strategy be?",
            category: 'Strategy',
            followUps: ["How would you differentiate?", "What about unit economics?"],
            evaluationCriteria: ['Market understanding', 'Strategic thinking', 'Execution planning']
        }
    ],
    sales_pitch: [
        {
            id: 's1',
            question: "I'm a VP of Engineering. Convince me why we should switch from our current CI/CD tool to yours.",
            category: 'Value Proposition',
            followUps: ["What about migration costs?", "How do you compare to competitors?"],
            evaluationCriteria: ['Needs discovery', 'Value articulation', 'Objection handling']
        },
        {
            id: 's2',
            question: "We're happy with our current solution. Why should we even consider a change?",
            category: 'Objection Handling',
            followUps: ["What ROI can you guarantee?", "What if it doesn't work out?"],
            evaluationCriteria: ['Active listening', 'Empathy', 'Closing skills']
        }
    ]
};

export const AIInterviewSimulator: React.FC<AIInterviewSimulatorProps> = ({
    skill,
    interviewType,
    difficulty,
    onComplete,
    onCancel
}) => {
    const [stage, setStage] = useState<'intro' | 'interview' | 'processing' | 'results'>('intro');
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [showTips, setShowTips] = useState(true);
    const [result, setResult] = useState<InterviewResult | null>(null);
    const [fillerWordCount, setFillerWordCount] = useState(0);
    const [realtimeFeedback, setRealtimeFeedback] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const questions = INTERVIEW_QUESTIONS[interviewType] || INTERVIEW_QUESTIONS.behavioral;
    const currentQuestion = questions[currentQuestionIndex];

    // Timer
    useEffect(() => {
        if (stage === 'interview') {
            const timer = setInterval(() => setTimeElapsed(t => t + 1), 1000);
            return () => clearInterval(timer);
        }
    }, [stage]);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize camera
    useEffect(() => {
        if (stage === 'interview' && isVideoOn && videoRef.current) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(console.error);
        }
    }, [stage, isVideoOn, isMicOn]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startInterview = () => {
        setStage('interview');

        // Add initial interviewer message
        const greeting: ConversationMessage = {
            id: 'greeting',
            role: 'interviewer',
            content: `Hello! I'm your AI interviewer today. I'll be conducting a ${interviewType.replace('_', ' ')} interview focused on ${skill}. Let's begin with our first question.`,
            timestamp: new Date()
        };

        setTimeout(() => {
            setMessages([greeting]);
            setIsAISpeaking(true);

            setTimeout(() => {
                const firstQuestion: ConversationMessage = {
                    id: 'q1',
                    role: 'interviewer',
                    content: currentQuestion.question,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, firstQuestion]);
                setIsAISpeaking(false);
            }, 2000);
        }, 500);
    };

    const analyzeResponse = (text: string): { fillerWords: number; feedback: string | null } => {
        const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally'];
        let count = 0;
        fillers.forEach(filler => {
            const regex = new RegExp(`\\b${filler}\\b`, 'gi');
            const matches = text.match(regex);
            if (matches) count += matches.length;
        });

        let feedback = null;
        if (count > 3) {
            feedback = `Tip: Try to reduce filler words like "um" and "like" - you used ${count} in this response.`;
        } else if (text.length < 100) {
            feedback = "Tip: Consider providing more detail and specific examples in your answers.";
        } else if (!text.includes('I')) {
            feedback = "Tip: Use 'I' statements to clearly show your personal contribution.";
        }

        return { fillerWords: count, feedback };
    };

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        const analysis = analyzeResponse(inputText);
        setFillerWordCount(prev => prev + analysis.fillerWords);
        if (analysis.feedback) {
            setRealtimeFeedback(analysis.feedback);
            setTimeout(() => setRealtimeFeedback(null), 5000);
        }

        const userMessage: ConversationMessage = {
            id: `user-${Date.now()}`,
            role: 'candidate',
            content: inputText,
            timestamp: new Date(),
            feedback: analysis.feedback ? { type: 'tip', message: analysis.feedback } : undefined
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsAISpeaking(true);

        // Generate AI follow-up or next question
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                // Ask follow-up or next question
                const shouldFollowUp = Math.random() > 0.5 && currentQuestion.followUps.length > 0;

                const aiResponse: ConversationMessage = {
                    id: `ai-${Date.now()}`,
                    role: 'interviewer',
                    content: shouldFollowUp
                        ? currentQuestion.followUps[Math.floor(Math.random() * currentQuestion.followUps.length)]
                        : "Great, thank you for that response. Let's move on to the next question.",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiResponse]);

                if (!shouldFollowUp) {
                    setCurrentQuestionIndex(prev => prev + 1);
                    setTimeout(() => {
                        const nextQ = questions[currentQuestionIndex + 1];
                        if (nextQ) {
                            const nextQuestion: ConversationMessage = {
                                id: `q-${currentQuestionIndex + 2}`,
                                role: 'interviewer',
                                content: nextQ.question,
                                timestamp: new Date()
                            };
                            setMessages(prev => [...prev, nextQuestion]);
                        }
                        setIsAISpeaking(false);
                    }, 1500);
                } else {
                    setIsAISpeaking(false);
                }
            } else {
                // End interview
                const closing: ConversationMessage = {
                    id: 'closing',
                    role: 'interviewer',
                    content: "Thank you for your responses today. That concludes our interview. I'll now generate your performance report.",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, closing]);
                setIsAISpeaking(false);

                setTimeout(() => {
                    generateResults();
                }, 2000);
            }
        }, 2000);
    };

    const generateResults = () => {
        setStage('processing');

        setTimeout(() => {
            const mockResult: InterviewResult = {
                overallScore: 78,
                categories: {
                    communication: 82,
                    technicalDepth: 75,
                    problemSolving: 80,
                    cultureFit: 85,
                    confidence: 70
                },
                feedback: "You demonstrated strong communication skills and provided relevant examples. Your technical knowledge is solid, though you could dive deeper into implementation details. Work on reducing filler words and projecting more confidence.",
                strengths: [
                    "Clear and structured responses using STAR method",
                    "Good use of specific examples from past experience",
                    "Showed empathy and teamwork orientation",
                    "Asked clarifying questions when needed"
                ],
                improvements: [
                    "Reduce filler words (um, like) - detected " + fillerWordCount + " instances",
                    "Provide more quantitative results when discussing achievements",
                    "Speak with more confidence - avoid hedging language",
                    "Consider deeper technical details in system design answers"
                ],
                transcripts: messages
            };

            setResult(mockResult);
            setStage('results');
        }, 3000);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-100';
        if (score >= 60) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    // Intro Screen
    if (stage === 'intro') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur">
                            <Brain className="w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">AI Interview Simulator</h1>
                        <p className="text-purple-200">Practice makes perfect</p>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-500">Interview Type</p>
                                <p className="font-bold text-gray-900 capitalize">{interviewType.replace('_', ' ')}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-500">Level</p>
                                <p className="font-bold text-gray-900 capitalize">{difficulty}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-500">Focus Area</p>
                                <p className="font-bold text-gray-900">{skill}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-500">Questions</p>
                                <p className="font-bold text-gray-900">{questions.length} questions</p>
                            </div>
                        </div>

                        <div className="bg-purple-50 rounded-xl p-6 mb-8">
                            <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5" />
                                What to Expect
                            </h3>
                            <ul className="space-y-2 text-purple-800 text-sm">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5" />
                                    Real-time AI interviewer with follow-up questions
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5" />
                                    Live feedback on filler words and response quality
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5" />
                                    Detailed performance report with improvement tips
                                </li>
                            </ul>
                        </div>

                        <div className="flex gap-4">
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={startInterview}
                                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
                            >
                                <Play className="w-5 h-5" />
                                Start Interview
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Interview Screen
    if (stage === 'interview') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col">
                {/* Header */}
                <header className="bg-slate-800 border-b border-slate-700 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-white">
                                <Brain className="w-5 h-5 text-purple-400" />
                                <span className="font-bold">AI Interview</span>
                            </div>
                            <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                                Q{currentQuestionIndex + 1}/{questions.length}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 rounded-lg text-white">
                                <Clock className="w-4 h-4" />
                                <span className="font-mono">{formatTime(timeElapsed)}</span>
                            </div>

                            <button
                                onClick={() => setIsMicOn(!isMicOn)}
                                className={`p-2 rounded-lg ${isMicOn ? 'bg-green-500' : 'bg-red-500'} text-white`}
                            >
                                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => setIsVideoOn(!isVideoOn)}
                                className={`p-2 rounded-lg ${isVideoOn ? 'bg-green-500' : 'bg-red-500'} text-white`}
                            >
                                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="flex-1 flex">
                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <AnimatePresence>
                                {messages.map(message => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${message.role === 'candidate' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[70%] ${message.role === 'candidate'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-700 text-white'
                                            } rounded-2xl p-4`}>
                                            <div className="flex items-center gap-2 mb-2 text-xs opacity-70">
                                                {message.role === 'interviewer' ? (
                                                    <><Bot className="w-3 h-3" /> AI Interviewer</>
                                                ) : (
                                                    <><User className="w-3 h-3" /> You</>
                                                )}
                                            </div>
                                            <p>{message.content}</p>

                                            {message.feedback && (
                                                <div className="mt-3 bg-yellow-500/20 text-yellow-200 p-2 rounded-lg text-xs flex items-start gap-2">
                                                    <Lightbulb className="w-3 h-3 mt-0.5" />
                                                    {message.feedback.message}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isAISpeaking && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-slate-700 text-white rounded-2xl p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                            </div>
                                            <span className="text-sm text-slate-400">AI is thinking...</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Real-time Feedback */}
                        <AnimatePresence>
                            {realtimeFeedback && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="mx-6 mb-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-200 p-3 rounded-xl flex items-center gap-2 text-sm"
                                >
                                    <Lightbulb className="w-4 h-4" />
                                    {realtimeFeedback}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Area */}
                        <div className="p-4 bg-slate-800 border-t border-slate-700">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type your response... (or use voice)"
                                    className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    disabled={isAISpeaking}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputText.trim() || isAISpeaking}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Video Preview Sidebar */}
                    <div className="w-80 bg-slate-800 border-l border-slate-700 p-4 flex flex-col">
                        {/* Self Video */}
                        <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden mb-4 relative">
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
                                    <VideoOff className="w-8 h-8 text-slate-600" />
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                                You
                            </div>
                        </div>

                        {/* Tips Panel */}
                        <div className="bg-slate-700/50 rounded-xl p-4 flex-1">
                            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-yellow-400" />
                                Interview Tips
                            </h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-start gap-2">
                                    <Target className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                    Use the STAR method for behavioral questions
                                </li>
                                <li className="flex items-start gap-2">
                                    <Target className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                    Provide specific examples with metrics
                                </li>
                                <li className="flex items-start gap-2">
                                    <Target className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                    Take a moment to think before answering
                                </li>
                            </ul>

                            <div className="mt-4 pt-4 border-t border-slate-600">
                                <p className="text-xs text-slate-400 mb-2">Filler Words Detected</p>
                                <div className="flex items-center gap-2">
                                    <div className={`text-2xl font-bold ${fillerWordCount > 5 ? 'text-red-400' : fillerWordCount > 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {fillerWordCount}
                                    </div>
                                    <span className="text-xs text-slate-400">Keep it low!</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Processing Screen
    if (stage === 'processing') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-white"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"
                    />
                    <h2 className="text-2xl font-bold mb-2">Analyzing Your Interview</h2>
                    <p className="text-purple-300">Generating personalized feedback...</p>
                </motion.div>
            </div>
        );
    }

    // Results Screen
    if (stage === 'results' && result) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-4 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center mb-8">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl font-bold">{result.overallScore}</span>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Interview Complete!</h1>
                        <p className="text-purple-200">Here's your performance breakdown</p>
                    </div>

                    {/* Category Scores */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-purple-500" />
                            Performance by Category
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(result.categories).map(([category, score]) => (
                                <div key={category}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="capitalize text-gray-700">{category.replace(/([A-Z])/g, ' $1')}</span>
                                        <span className={`font-bold ${getScoreColor(score as number)}`}>{score}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${score}%` }}
                                            transition={{ duration: 1, delay: 0.2 }}
                                            className={`h-full rounded-full ${(score as number) >= 80 ? 'bg-green-500' : (score as number) >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Strengths & Improvements */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
                            <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                                <ThumbsUp className="w-5 h-5" />
                                Strengths
                            </h3>
                            <ul className="space-y-2">
                                {result.strengths.map((strength, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-green-800 text-sm">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        {strength}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
                            <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5" />
                                Areas to Improve
                            </h3>
                            <ul className="space-y-2">
                                {result.improvements.map((improvement, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-orange-800 text-sm">
                                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                        {improvement}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Overall Feedback */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-purple-500" />
                            Overall Feedback
                        </h3>
                        <p className="text-gray-700">{result.feedback}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                setStage('intro');
                                setMessages([]);
                                setCurrentQuestionIndex(0);
                                setTimeElapsed(0);
                                setFillerWordCount(0);
                            }}
                            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-5 h-5" />
                            Practice Again
                        </button>
                        <button
                            onClick={() => onComplete(result)}
                            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                        >
                            <Award className="w-5 h-5" />
                            Finish
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return null;
};

export default AIInterviewSimulator;
