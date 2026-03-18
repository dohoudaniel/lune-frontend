import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Clock, CheckCircle, Loader, ArrowRight, ArrowLeft,
    MessageSquare, Send, AlertCircle, Sparkles, Video, Mic,
    Eye, ThumbsUp, ThumbsDown, AlertTriangle, StopCircle, Play,
    Camera, ShieldAlert, MicOff, Shield, ChevronDown
} from 'lucide-react';
import {
    generateScenarioAssessment,
    evaluateScenarioResponse,
    ScenarioAssessmentContent
} from '../services/geminiService';

import { proctoringService } from '../services/proctoringService';
import { DifficultyLevel, EvaluationResult } from '../types';
import {
    createAssessmentSession,
    recordUsedQuestions
} from '../services/assessmentSessionService';


interface ScenarioAssessmentProps {
    skill: string;
    difficulty: DifficultyLevel;
    candidateId: string;
    onComplete: (result: EvaluationResult) => void;
    onCancel?: () => void;
}

type AssessmentStep = 'loading' | 'context' | 'situational' | 'oral' | 'submitting' | 'results';

export const ScenarioAssessment: React.FC<ScenarioAssessmentProps> = ({
    skill,
    difficulty,
    candidateId,
    onComplete,
    onCancel
}) => {
    const [step, setStep] = useState<AssessmentStep>('loading');
    const [content, setContent] = useState<ScenarioAssessmentContent | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [result, setResult] = useState<{ score: number; feedback: string; categoryScores: Record<string, number> } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Countup Timer State (starts at 0, counts up)
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    // Anti-Cheating State
    const [cheatingEvents, setCheatingEvents] = useState<string[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [pasteCount, setPasteCount] = useState(0);
    const [activeAlert, setActiveAlert] = useState<string | null>(null);
    const leaveTime = useRef<number>(0);

    // Typing Speed Analysis
    const typingStartTime = useRef<number>(0);
    const lastCharCount = useRef<number>(0);


    // Webcam State for Facial Monitoring
    const [webcamActive, setWebcamActive] = useState(false);
    const [webcamError, setWebcamError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [facialWarnings, setFacialWarnings] = useState(0);

    // Audio Recording State for Oral Responses
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [oralTranscript, setOralTranscript] = useState('');
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Advanced Proctoring State
    const [integrityScore, setIntegrityScore] = useState(100);
    const [proctoringActive, setProctoringActive] = useState(false);
    const [proctoringViolations, setProctoringViolations] = useState<string[]>([]);

    // Session Tracking State
    const [sessionId, setSessionId] = useState<string | null>(null);


    // Load assessment content
    useEffect(() => {
        const loadContent = async () => {
            try {
                // Create assessment session for tracking
                const newSessionId = createAssessmentSession(candidateId, skill, difficulty);
                setSessionId(newSessionId);



                const assessmentContent = await generateScenarioAssessment(skill, difficulty);
                setContent(assessmentContent);
                setStep('context');
            } catch (err) {
                setError('Failed to load assessment. Please try again.');
                console.error(err);
            }
        };
        loadContent();
    }, [skill, difficulty]);

    // Countup Timer (starts when assessment begins)
    useEffect(() => {
        if (timerActive && (step === 'situational' || step === 'oral')) {
            const timer = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timerActive, step]);

    // Start timer and proctoring when moving from context to situational
    const startAssessment = useCallback(async () => {
        // Initialize proctoring session
        const sessionId = `session_${Date.now()}`;
        try {
            await proctoringService.startSession(
                sessionId,
                'candidate_id', // In production, pass actual candidate ID
                skill,
                {
                    onViolation: (violation) => {
                        setProctoringViolations(prev => [...prev, violation.description]);
                        setCheatingEvents(prev => [...prev, `[PROCTORING] ${violation.description}`]);
                        if (violation.severity === 'critical') {
                            setActiveAlert(`Critical Violation: ${violation.description}`);
                        }
                    },
                    onWarning: (message) => {
                        setActiveAlert(message);
                        setTimeout(() => setActiveAlert(null), 3000);
                    },
                    onIntegrityUpdate: (score) => {
                        setIntegrityScore(score);
                    },
                    onTerminate: (reason) => {
                        setActiveAlert(`Assessment Terminated: ${reason}`);
                        // Force end assessment
                        setStep('results');
                    }
                }
            );

            // Initialize face verification if webcam is active
            if (videoRef.current && webcamActive) {
                await proctoringService.initializeFaceVerification(videoRef.current);
            }

            setProctoringActive(true);
        } catch (error) {
            console.error('Failed to start proctoring session:', error);
        }

        setTimerActive(true);
        setStep('situational');
    }, [skill, webcamActive]);


    // Anti-Cheating: Visibility Change, Context Menu, DevTools Detection
    // Anti-Cheating: Comprehensive Detection System
    useEffect(() => {
        if (!timerActive) return;

        // 1. Visibility Change (Tab Switching)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                leaveTime.current = Date.now();
            } else {
                const duration = Date.now() - leaveTime.current;
                if (duration > 2000) {
                    const msg = `Tab switch detected (${(duration / 1000).toFixed(1)}s)`;
                    setWarnings(prev => [...prev, "Warning: Assessment focus lost."]);
                    setCheatingEvents(prev => [...prev, msg]);
                    setActiveAlert("Focus Lost: Please stay on this tab.");
                    setTimeout(() => setActiveAlert(null), 3000);
                }
            }
        };

        // 2. Context Menu (Right-Click)
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            setCheatingEvents(prev => [...prev, "Right-click attempted"]);
            setActiveAlert("Security Warning: Right-click menu disabled during assessment.");
            setTimeout(() => setActiveAlert(null), 2000);
        };

        // 3. DevTools & Keyboard Shortcuts
        const handleKeyDownGlobal = (e: KeyboardEvent) => {
            // DevTools Access
            if (e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'K'))) {
                e.preventDefault();
                setCheatingEvents(prev => [...prev, "Attempted DevTools Access"]);
                setActiveAlert("Security Violation: DevTools disabled during assessment.");
                setTimeout(() => setActiveAlert(null), 3000);
            }

            // Print Screen
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                setCheatingEvents(prev => [...prev, "Screenshot attempt blocked"]);
                setActiveAlert("Screenshots are not allowed during assessment.");
                setTimeout(() => setActiveAlert(null), 2000);
            }

            // Ctrl+P (Print)
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                setCheatingEvents(prev => [...prev, "Print attempt blocked"]);
            }

            // Ctrl+S (Save)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
            }
        };

        // 4. Copy Prevention (on questions)
        const handleCopy = (e: ClipboardEvent) => {
            const selection = window.getSelection()?.toString() || '';
            if (selection.length > 20) {
                setCheatingEvents(prev => [...prev, "Large text copy detected"]);
                setActiveAlert("Copying assessment content is not recommended.");
                setTimeout(() => setActiveAlert(null), 2000);
            }
        };

        // 5. Window Blur (clicking outside browser)
        const handleWindowBlur = () => {
            setCheatingEvents(prev => [...prev, "Window focus lost"]);
            setActiveAlert("Please keep this window focused.");
            setTimeout(() => setActiveAlert(null), 2000);
        };

        // 6. Mouse Leaving Window
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 || e.clientX <= 0 ||
                e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
                // Only log periodically to avoid spam
                const now = Date.now();
                if (!leaveTime.current || now - leaveTime.current > 5000) {
                    setCheatingEvents(prev => [...prev, "Mouse left assessment window"]);
                }
            }
        };

        // 7. Window Resize (potential split-screen)
        let lastWidth = window.innerWidth;
        const handleResize = () => {
            const newWidth = window.innerWidth;
            // Significant resize might indicate split-screen
            if (Math.abs(newWidth - lastWidth) > 200) {
                setCheatingEvents(prev => [...prev, `Window resized (${lastWidth} → ${newWidth})`]);
                setActiveAlert("Window resize detected. Please use full-screen mode.");
                setTimeout(() => setActiveAlert(null), 3000);
            }
            lastWidth = newWidth;
        };

        // 8. Beforeunload Warning
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'Your assessment is in progress. Are you sure you want to leave?';
            return e.returnValue;
        };

        // Add all event listeners
        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("contextmenu", handleContextMenu);
        window.addEventListener("keydown", handleKeyDownGlobal);
        document.addEventListener("copy", handleCopy);
        window.addEventListener("blur", handleWindowBlur);
        document.addEventListener("mouseleave", handleMouseLeave);
        window.addEventListener("resize", handleResize);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("contextmenu", handleContextMenu);
            window.removeEventListener("keydown", handleKeyDownGlobal);
            document.removeEventListener("copy", handleCopy);
            window.removeEventListener("blur", handleWindowBlur);
            document.removeEventListener("mouseleave", handleMouseLeave);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [timerActive]);


    // Webcam Setup for Facial Monitoring
    useEffect(() => {
        const startWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setWebcamActive(true);
                }
            } catch (err) {
                console.error("Webcam access denied", err);
                setWebcamError("Camera access is required for proctoring. Please enable camera permissions.");
            }
        };

        if (step === 'context' || step === 'situational' || step === 'oral') {
            startWebcam();
        }

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
        };
    }, [step]);

    // Simple facial presence check (check if video stream is active)
    useEffect(() => {
        if (!webcamActive || !timerActive) return;

        const checkInterval = setInterval(() => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                const videoTrack = stream.getVideoTracks()[0];

                if (!videoTrack || !videoTrack.enabled || videoTrack.muted) {
                    setFacialWarnings(prev => prev + 1);
                    setCheatingEvents(prev => [...prev, "Camera not detecting face"]);
                    setActiveAlert("Proctoring Alert: Please ensure your face is visible.");
                    setTimeout(() => setActiveAlert(null), 3000);
                }
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(checkInterval);
    }, [webcamActive, timerActive]);

    // Paste Detection
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        if (!timerActive) return;

        const text = e.clipboardData.getData('text');

        // AI Markers Check
        const llmIndicators = ["here is the", "sure,", "generated by", "openai", "gpt", "claude", "chatgpt", "as an ai"];
        const hasLLMMarkers = llmIndicators.some(marker => text.toLowerCase().includes(marker));

        if (hasLLMMarkers) {
            setPasteCount(prev => prev + 1);
            setWarnings(prev => [...prev, "Critical: AI-generated content detected."]);
            setCheatingEvents(prev => [...prev, "Critical: LLM Markers in Paste"]);
            setActiveAlert("Proctor Alert: AI content signature detected.");
            setTimeout(() => setActiveAlert(null), 5000);
        } else if (text.length > 200) {
            setPasteCount(prev => prev + 1);
            setCheatingEvents(prev => [...prev, `Large paste: ${text.length} chars`]);
            setActiveAlert("Proctor Alert: Large text paste detected.");
            setTimeout(() => setActiveAlert(null), 3000);
        }
    }, [timerActive]);

    // Typing Speed Analysis - Detect suspiciously fast typing
    const analyzeTypingSpeed = useCallback((newText: string, questionId: number) => {
        if (!timerActive) return;

        const currentLength = newText.length;
        const previousLength = lastCharCount.current;
        const charDifference = currentLength - previousLength;

        // If it's a new question, reset tracking
        if (previousLength === 0 && currentLength > 0) {
            typingStartTime.current = Date.now();
            lastCharCount.current = currentLength;
            return;
        }

        // Detect suspicious rapid input (more than 10 chars in less than 100ms = ~100 WPM which is very fast)
        if (charDifference > 10) {
            const now = Date.now();
            const timeSinceLastCheck = now - typingStartTime.current;

            // If more than 50 chars added in less than 500ms, flag as suspicious
            if (charDifference > 50 && timeSinceLastCheck < 500) {
                setCheatingEvents(prev => [...prev, `Rapid input detected: ${charDifference} chars in ${timeSinceLastCheck}ms`]);
                setActiveAlert("Unusual typing speed detected.");
                setTimeout(() => setActiveAlert(null), 2000);
            }

            typingStartTime.current = now;
        }

        lastCharCount.current = currentLength;
    }, [timerActive]);


    // Speech Recognition Ref
    const speechRecognitionRef = useRef<any>(null);

    // Audio Recording Functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start Speech Recognition (Real-time)
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (finalTranscript) {
                        setOralTranscript(prev => prev + ' ' + finalTranscript);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                };

                recognition.start();
                speechRecognitionRef.current = recognition;
            } else {
                setOralTranscript("(Speech recognition not supported in this browser. Please ensure your response is clear.)");
            }

            // Recording timer
            const recordTimer = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            // Auto-stop after max duration (90 seconds)
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    stopRecording();
                    clearInterval(recordTimer);
                }
            }, 90000);

        } catch (err) {
            console.error("Audio recording error:", err);
            setActiveAlert("Microphone access is required for oral responses.");
            setTimeout(() => setActiveAlert(null), 3000);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
        if (speechRecognitionRef.current) {
            speechRecognitionRef.current.stop();
            speechRecognitionRef.current = null;
        }
    };

    // Removed placeholder transcribeAudio function as it's now handled in real-time


    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (questionId: number, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
        // Analyze typing speed for open-ended questions
        analyzeTypingSpeed(answer, questionId);
    };

    // Check if current question is answered
    const isCurrentQuestionAnswered = (): boolean => {
        if (!content) return false;
        const currentQuestion = content.situationalQuestions[currentQuestionIndex];
        const answer = answers[currentQuestion.id];
        if (!answer || answer.trim() === '') return false;
        // For text responses, require minimum length
        if (!currentQuestion.options && answer.trim().length < 10) return false;
        return true;
    };

    // Check if all questions are answered
    const getAllUnansweredQuestions = (): number[] => {
        if (!content) return [];
        const unanswered: number[] = [];
        content.situationalQuestions.forEach((q, idx) => {
            const answer = answers[q.id];
            if (!answer || answer.trim() === '') {
                unanswered.push(idx + 1);
            } else if (!q.options && answer.trim().length < 10) {
                // Text responses need minimum length
                unanswered.push(idx + 1);
            }
        });
        return unanswered;
    };

    const areAllQuestionsAnswered = (): boolean => {
        return getAllUnansweredQuestions().length === 0;
    };


    const handleNextQuestion = () => {
        if (!content) return;

        // Allow skipping - no per-question validation
        // Validation only happens at final submission

        if (currentQuestionIndex < content.situationalQuestions.length - 1) {
            // Check if next question requires oral response
            const nextQuestion = content.situationalQuestions[currentQuestionIndex + 1];
            if (nextQuestion.requiresOralResponse) {
                setCurrentQuestionIndex(prev => prev + 1);
                setStep('oral');
            } else {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        } else {
            // Last situational question
            // If there's an oral task, go there. usage of 'submitting' step is ONLY for after oral.
            if (content.oralResponseTask) {
                setStep('oral');
                return;
            }

            // If no oral task (unlikely per new prompt), validate and submit
            const unanswered = getAllUnansweredQuestions();
            if (unanswered.length > 0) {
                setActiveAlert(`Please answer all questions before submitting. Unanswered: Question(s) ${unanswered.join(', ')}`);
                setTimeout(() => setActiveAlert(null), 5000);
                return;
            }
            handleSubmit();
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            // Go back to situational step if coming from oral
            if (step === 'oral') {
                setStep('situational');
            }
        }
    };

    const handleSubmit = async () => {
        if (!content) return;

        // Final validation - all questions must be answered
        const unanswered = getAllUnansweredQuestions();
        if (unanswered.length > 0) {
            setActiveAlert(`Cannot submit: Please answer all questions. Unanswered: Question(s) ${unanswered.join(', ')}`);
            setTimeout(() => setActiveAlert(null), 5000);
            return;
        }

        setStep('submitting');
        setTimerActive(false); // Stop the timer

        // Record used questions in the session before evaluation
        if (sessionId && content) {

            recordUsedQuestions(sessionId, content.situationalQuestions);
        }

        try {
            const evaluationResult = await evaluateScenarioResponse(
                skill,
                {
                    situationalAnswers: answers,
                    writtenResponse: '', // No separate written task now, all in situational answers
                    oralResponseTranscript: oralTranscript
                },
                content
            );

            setResult(evaluationResult);
            setStep('results');
        } catch (err) {
            setError('Failed to submit assessment. Please try again.');
            setStep('situational');
            console.error(err);
        }
    };

    const handleComplete = async () => {
        if (!result) return;

        // End proctoring session and get final report
        const proctoringReport = proctoringService.endSession();
        setProctoringActive(false);

        const passed = result.score >= 70;
        const hasCheatingEvents = cheatingEvents.length > 3;
        const hasLowIntegrity = integrityScore < 50;

        // Final integrity check
        const finalPassed = passed && !hasCheatingEvents && !hasLowIntegrity;

        let txHash;
        if (finalPassed) {
            try {
                // Determine skill name from props
                txHash = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            } catch (e) {
                console.error("Failed to mint certificate", e);
            }
        }

        onComplete({
            score: result.score,
            feedback: result.feedback,
            passed: finalPassed,
            cheatingDetected: hasCheatingEvents || hasLowIntegrity,
            cheatingReason: hasCheatingEvents || hasLowIntegrity
                ? `Integrity Score: ${integrityScore}%. ${cheatingEvents.length} suspicious activities. ${proctoringViolations.length} proctoring violations.`
                : undefined,
            timeSpentSeconds: elapsedTime,
            integrityScore: integrityScore,
            categoryScores: result.categoryScores,
            certificationHash: txHash
        });
    };



    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-100';
        if (score >= 60) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    if (step === 'loading') {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-orange animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900">Preparing Assessment</h2>
                    <p className="text-gray-500">Generating scenario questions for {skill}...</p>
                </div>
            </div>
        );
    }

    if (error) {
        if (error) {
            return (
                <div className="min-h-screen bg-cream flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            );
        }
    }

    if (!content) return null;

    return (
        <div className="min-h-screen bg-cream">
            {/* Anti-Cheating Alert Toast */}
            <AnimatePresence>
                {activeAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        className="fixed top-16 left-1/2 z-50 pointer-events-none"
                    >
                        <div className="bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-red-400 font-bold">
                            <AlertTriangle className="w-5 h-5" />
                            {activeAlert}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="bg-white border-b border-gray-200 h-16 sticky top-0 z-40 bg-opacity-80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-orange" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 leading-tight">{skill} Assessment</h1>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className={`capitalize font-medium ${difficulty === 'Advanced' ? 'text-red-600' :
                                    difficulty === 'Mid-Level' ? 'text-yellow-600' :
                                        'text-green-600'
                                    }`}>{difficulty}</span>
                                <span>•</span>
                                <span>{content.situationalQuestions.length + (content.oralResponseTask ? 1 : 0)} Questions</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Webcam Status */}
                        {proctoringActive && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${webcamActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                {webcamActive ? <Eye className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                                <span className="font-medium">{webcamActive ? 'Proctoring' : 'No Camera'}</span>
                            </div>
                        )}

                        {/* Countup Timer */}
                        {(step === 'situational' || step === 'oral') && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700">
                                <Clock className="w-4 h-4" />
                                <span className="font-mono font-bold">{formatTime(elapsedTime)}</span>
                            </div>
                        )}

                        {/* Warning Count */}
                        {cheatingEvents.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-100 text-amber-700">
                                <ShieldAlert className="w-4 h-4" />
                                <span className="font-medium text-sm">{cheatingEvents.length}</span>
                            </div>
                        )}

                        {/* Integrity Score */}
                        {proctoringActive && (
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${integrityScore >= 80 ? 'bg-green-100 text-green-700' :
                                integrityScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                <Shield className="w-4 h-4" />
                                <span className="font-medium text-sm">{integrityScore}%</span>
                            </div>
                        )}

                    </div>
                </div>
            </header>


            <main className="max-w-4xl mx-auto px-4 py-8">
                <AnimatePresence mode="wait">
                    {/* Context Step */}
                    {step === 'context' && (
                        <motion.div
                            key="context"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                            <div className="p-8 md:p-12">
                                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-8 h-8 text-orange" />
                                </div>
                                <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Scenario Context</h2>
                                <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">Read this context carefully. All following questions will be based on this scenario.</p>

                                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 mb-8">
                                    <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                                        <span className="bg-white px-2 py-0.5 rounded text-xs border border-orange-200 shadow-sm">Your Role</span>
                                        {content.title || skill}
                                    </h3>
                                    <p className="text-orange-900 leading-relaxed">{content.roleContext}</p>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                <div className="w-2 h-2 rounded-full bg-black"></div>
                                                Key Responsibilities
                                            </h4>
                                            <ul className="space-y-3">
                                                {content.situationalQuestions.slice(0, 4).map((q, i) => (
                                                    <li key={i} className="flex gap-3 text-gray-600 text-sm">
                                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                        {q.taskType === 'multiple_choice' ? 'Demonstrate decision-making skills' :
                                                            q.taskType === 'oral_response' ? 'Demonstrate verbal communication' :
                                                                `Handle ${q.scenario.split(' ').slice(0, 4).join(' ')}...`}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                <div className="w-2 h-2 rounded-full bg-black"></div>
                                                Assessment Overview
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                    <div className="text-2xl font-bold text-orange mb-1">{content.situationalQuestions.filter(q => q.options).length}</div>
                                                    <div className="text-xs text-gray-500">MC Question</div>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                    <div className="text-2xl font-bold text-orange mb-1">{content.situationalQuestions.filter(q => !q.options).length}</div>
                                                    <div className="text-xs text-gray-500">Situational Tasks</div>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                    <div className="text-2xl font-bold text-orange mb-1">{content.oralResponseTask ? 1 : 0}</div>
                                                    <div className="text-xs text-gray-500">Video Response</div>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                    <div className="text-2xl font-bold text-orange mb-1">35%</div>
                                                    <div className="text-xs text-gray-500">Difficulty</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={onCancel}
                                        className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={startAssessment}
                                        className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        Start Assessment <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}


                    {/* Situational Questions Step */}
                    {step === 'situational' && content.situationalQuestions[currentQuestionIndex] && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
                            {/* Question Sidebar */}
                            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                    <h3 className="font-bold text-gray-900 text-sm">Progress</h3>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-black transition-all duration-300"
                                            style={{ width: `${(Object.keys(answers).length / content.situationalQuestions.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                    <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Scenarios</div>
                                    {content.situationalQuestions.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentQuestionIndex(i)}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between group transition ${currentQuestionIndex === i
                                                ? 'bg-orange-50 text-orange font-bold border border-orange-100'
                                                : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${answers[q.id]
                                                    ? 'bg-green-100 text-green-700'
                                                    : currentQuestionIndex === i ? 'bg-orange-200 text-orange-900' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {answers[q.id] ? <CheckCircle className="w-3 h-3" /> : i + 1}
                                                </span>
                                                <span className="truncate w-32">{q.options ? 'Multiple Choice' : 'Situational'}</span>
                                            </span>
                                        </button>
                                    ))}
                                    {content.oralResponseTask && (
                                        <>
                                            <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-4">Video Response</div>
                                            <button
                                                onClick={() => setStep('oral')}
                                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between group transition ${(step as AssessmentStep) === 'oral'
                                                    ? 'bg-orange-50 text-orange font-bold border border-orange-100'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${audioBlob
                                                        ? 'bg-green-100 text-green-700'
                                                        : (step as AssessmentStep) === 'oral' ? 'bg-orange-200 text-orange-900' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {audioBlob ? <CheckCircle className="w-3 h-3" /> : content.situationalQuestions.length + 1}
                                                    </span>
                                                    <span className="truncate w-32">Oral Response</span>
                                                </span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Question Content */}
                            <div className="lg:col-span-9 flex flex-col h-full">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentQuestionIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex-1 flex flex-col h-full overflow-y-auto"
                                    >
                                        <div className="flex items-start justify-between mb-6">
                                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                Question {currentQuestionIndex + 1}
                                            </span>
                                        </div>

                                        {/* Scenario Context - Show for each question */}
                                        {content.situationalQuestions[currentQuestionIndex].scenario && (
                                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 mb-6">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Scenario</span>
                                                </div>
                                                <p className="text-orange-900 leading-relaxed text-sm">
                                                    {content.situationalQuestions[currentQuestionIndex].scenario}
                                                </p>
                                            </div>
                                        )}

                                        <h3 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
                                            {content.situationalQuestions[currentQuestionIndex].question}
                                        </h3>

                                        {content.situationalQuestions[currentQuestionIndex].options && content.situationalQuestions[currentQuestionIndex].options!.length > 0 ? (
                                            <>
                                                {/* Multiple Choice Options - Always Visible */}
                                                <div className="space-y-3 max-w-2xl" style={{ display: 'block', visibility: 'visible' }}>
                                                    {content.situationalQuestions[currentQuestionIndex].options!.map((option, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleAnswerSelect(content.situationalQuestions[currentQuestionIndex].id, option)}
                                                            className={`w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-3 group ${answers[content.situationalQuestions[currentQuestionIndex].id] === option
                                                                ? 'border-orange bg-orange-50 text-orange-900'
                                                                : 'border-gray-100 hover:border-orange-200 hover:bg-gray-50'
                                                                }`}
                                                            style={{ display: 'flex', minHeight: '60px' }}
                                                        >
                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${answers[content.situationalQuestions[currentQuestionIndex].id] === option
                                                                ? 'border-orange bg-orange'
                                                                : 'border-gray-300 group-hover:border-orange-300'
                                                                }`}>
                                                                {answers[content.situationalQuestions[currentQuestionIndex].id] === option && (
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                                                )}
                                                            </div>
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* Written Response Text Area - Always Visible */}
                                                <div className="flex-1 flex flex-col" style={{ display: 'flex', visibility: 'visible' }}>
                                                    <textarea
                                                        value={answers[content.situationalQuestions[currentQuestionIndex].id] || ''}
                                                        onChange={(e) => handleAnswerSelect(content.situationalQuestions[currentQuestionIndex].id, e.target.value)}
                                                        onPaste={handlePaste}
                                                        placeholder="Type your detailed response here... (minimum 50 characters)"
                                                        className="w-full h-40 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-orange focus:border-transparent mb-4"
                                                        style={{ display: 'block', minHeight: '160px', visibility: 'visible' }}
                                                    />
                                                    <div className="flex justify-between text-xs text-gray-400">
                                                        <span>Minimum 50 characters required</span>
                                                        <span className={`font-medium ${(answers[content.situationalQuestions[currentQuestionIndex].id]?.length || 0) >= 50 ? 'text-green-600' : 'text-gray-400'}`}>
                                                            {answers[content.situationalQuestions[currentQuestionIndex].id]?.length || 0} chars
                                                        </span>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div className="mt-auto pt-8 flex justify-between border-t border-gray-100">
                                            <button
                                                onClick={handlePrevQuestion}
                                                disabled={currentQuestionIndex === 0}
                                                className="px-6 py-3 text-gray-500 font-bold disabled:opacity-30 hover:bg-gray-50 rounded-xl transition"
                                            >
                                                <ArrowLeft className="w-5 h-5 inline mr-2" /> Previous
                                            </button>

                                            {currentQuestionIndex < content.situationalQuestions.length - 1 ? (
                                                <button
                                                    onClick={handleNextQuestion}
                                                    className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition flex items-center gap-2"
                                                >
                                                    Next Question <ArrowRight className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleNextQuestion} // This will either go to oral or submit
                                                    className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition flex items-center gap-2"
                                                >
                                                    {content.oralResponseTask ? 'Next: Oral Response' : 'Submit Assessment'} <ArrowRight className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    )
                    }

                    {/* Oral Response Step */}
                    {
                        step === 'oral' && content.oralResponseTask && (
                            <motion.div
                                key="oral"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white rounded-2xl shadow-lg p-8"
                            >
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <Mic className="w-6 h-6 text-purple-600" />
                                        Oral Response Task
                                    </h3>
                                    <p className="text-gray-600">Record your verbal response to the following scenario.</p>
                                </div>

                                {/* Current Question Scenario */}
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                                    <h4 className="font-medium text-purple-800 mb-2">Scenario</h4>
                                    <p className="text-purple-900">{content.situationalQuestions[currentQuestionIndex]?.scenario}</p>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                    <h4 className="font-medium text-blue-800 mb-2">Your Task</h4>
                                    <p className="text-blue-900">{content.situationalQuestions[currentQuestionIndex]?.question}</p>
                                </div>

                                {/* Webcam Feed */}
                                <div className="mb-6">
                                    <div className="relative w-full max-w-md mx-auto aspect-video bg-gray-900 rounded-xl overflow-hidden">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 px-2 py-1 rounded text-xs text-green-400 backdrop-blur-md">
                                            <Eye size={12} />
                                            <span>Recording</span>
                                        </div>
                                        {isRecording && (
                                            <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-500 px-3 py-1 rounded-full text-white text-sm animate-pulse">
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                                {formatTime(recordingTime)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recording Controls */}
                                <div className="flex flex-col items-center gap-4 mb-6">
                                    {!isRecording && !audioBlob && (
                                        <button
                                            onClick={startRecording}
                                            className="flex items-center gap-3 px-8 py-4 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition shadow-lg"
                                        >
                                            <Mic className="w-6 h-6" />
                                            Start Recording
                                        </button>
                                    )}

                                    {isRecording && (
                                        <button
                                            onClick={stopRecording}
                                            className="flex items-center gap-3 px-8 py-4 bg-gray-800 text-white rounded-full font-bold hover:bg-gray-900 transition shadow-lg animate-pulse"
                                        >
                                            <StopCircle className="w-6 h-6" />
                                            Stop Recording ({formatTime(recordingTime)})
                                        </button>
                                    )}

                                    {audioBlob && audioUrl && (
                                        <div className="w-full max-w-md">
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-center">
                                                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                                <p className="text-green-800 font-medium">Recording Complete!</p>
                                                <p className="text-green-600 text-sm">Duration: {formatTime(recordingTime)}</p>
                                            </div>
                                            <audio controls className="w-full mb-4">
                                                <source src={audioUrl} type="audio/webm" />
                                            </audio>
                                            <button
                                                onClick={() => {
                                                    setAudioBlob(null);
                                                    setAudioUrl(null);
                                                    setRecordingTime(0);
                                                }}
                                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                                            >
                                                Re-record
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Evaluation Criteria */}
                                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                    <h4 className="font-medium text-gray-700 mb-2">Evaluation Criteria</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {content.oralResponseTask.evaluationCriteria.map((criteria, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600">
                                                {criteria}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={handlePrevQuestion}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Previous
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Save oral response answer
                                            if (content.situationalQuestions[currentQuestionIndex]) {
                                                handleAnswerSelect(content.situationalQuestions[currentQuestionIndex].id, oralTranscript || '(Audio recorded)');
                                            }
                                            // Check all questions answered
                                            const unanswered = getAllUnansweredQuestions();
                                            if (unanswered.length > 0) {
                                                setActiveAlert(`Please answer all questions before submitting. Unanswered: Question(s) ${unanswered.join(', ')}`);
                                                setTimeout(() => setActiveAlert(null), 5000);
                                                return;
                                            }
                                            handleSubmit();
                                        }}
                                        disabled={!audioBlob}
                                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Send className="w-5 h-5" />
                                        Submit Assessment
                                    </button>
                                </div>
                            </motion.div>
                        )
                    }


                    {/* Submitting Step */}
                    {
                        step === 'submitting' && (
                            <motion.div
                                key="submitting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white rounded-2xl shadow-lg p-12 text-center"
                            >
                                <Loader className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-6" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Evaluating Your Response</h2>
                                <p className="text-gray-600">Our AI is analyzing your answers...</p>
                            </motion.div>
                        )
                    }

                    {/* Results Step */}
                    {
                        step === 'results' && result && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-2xl shadow-lg p-8"
                            >
                                {/* Score Banner */}
                                <div className={`text-center p-8 rounded-xl mb-8 ${result.score >= 70 ? 'bg-green-50' : 'bg-red-50'
                                    }`}>
                                    <div className={`w-24 h-24 ${getScoreBg(result.score)} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                        <span className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                                            {result.score}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {result.score >= 70 ? 'Assessment Passed!' : 'Needs Improvement'}
                                    </h2>
                                    {result.score >= 70 ? (
                                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                                    ) : (
                                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                                    )}
                                </div>

                                {/* Category Scores */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                                    {Object.entries(result.categoryScores).map(([category, score]) => (
                                        <div key={category} className={`${getScoreBg(score as number)} rounded-xl p-4 text-center`}>
                                            <p className={`text-2xl font-bold ${getScoreColor(score as number)}`}>{score as number}</p>
                                            <p className="text-xs text-gray-600 capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</p>
                                        </div>
                                    ))}
                                </div>


                                {/* Feedback */}
                                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-indigo-500" />
                                        AI Feedback
                                    </h3>
                                    <div className="space-y-4">
                                        {/* Parse and format the feedback into structured sections */}
                                        {result.feedback.split(/(?=[A-Z][a-z]+\s?(?:Solving|Knowledge|Communication|Focus|Professionalism|Skills)?:)/g)
                                            .filter(section => section.trim())
                                            .map((section, idx) => {
                                                // Check if this section has a category header
                                                const headerMatch = section.match(/^([A-Za-z\s]+):\s*/);
                                                const hasHeader = headerMatch && headerMatch[1].length < 30;
                                                const header = hasHeader ? headerMatch[1].trim() : null;
                                                const content = hasHeader ? section.replace(/^[A-Za-z\s]+:\s*/, '') : section;

                                                // Determine category color
                                                const getCategoryColor = (cat: string | null) => {
                                                    if (!cat) return 'bg-gray-100 text-gray-700';
                                                    const catLower = cat.toLowerCase();
                                                    if (catLower.includes('strength') || catLower.includes('positive')) return 'bg-green-100 text-green-800 border-green-200';
                                                    if (catLower.includes('problem') || catLower.includes('improvement') || catLower.includes('however')) return 'bg-amber-100 text-amber-800 border-amber-200';
                                                    if (catLower.includes('communication')) return 'bg-blue-100 text-blue-800 border-blue-200';
                                                    if (catLower.includes('professional')) return 'bg-purple-100 text-purple-800 border-purple-200';
                                                    if (catLower.includes('knowledge') || catLower.includes('role')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
                                                    if (catLower.includes('customer') || catLower.includes('focus')) return 'bg-teal-100 text-teal-800 border-teal-200';
                                                    if (catLower.includes('verbal')) return 'bg-pink-100 text-pink-800 border-pink-200';
                                                    return 'bg-gray-100 text-gray-700 border-gray-200';
                                                };

                                                return (
                                                    <div key={idx} className={`${header ? 'bg-white rounded-lg border p-4' : ''}`}>
                                                        {header && (
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getCategoryColor(header)}`}>
                                                                    {header}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <p className="text-gray-700 leading-relaxed text-sm">
                                                            {content.trim()}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>

                                {/* Question Details & Answers Review */}
                                <div className="mb-8">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-indigo-500" />
                                        Your Responses
                                    </h3>
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                        {content.situationalQuestions.map((question, idx) => (
                                            <details key={question.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
                                                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${answers[question.id]
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {answers[question.id] ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                                                        </span>
                                                        <span className="font-medium text-gray-800 text-sm line-clamp-1">
                                                            {question.taskType === 'multiple_choice' ? 'Multiple Choice' :
                                                                question.taskType === 'oral_response' ? 'Oral Response' : 'Written Response'}
                                                            : Q{idx + 1}
                                                        </span>
                                                    </div>
                                                    <ChevronDown className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" />
                                                </summary>
                                                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                                                    {/* Question Scenario & Prompt */}
                                                    <div className="mb-3">
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Scenario</p>
                                                        <p className="text-sm text-gray-600">{question.scenario}</p>
                                                    </div>
                                                    <div className="mb-3">
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Question</p>
                                                        <p className="text-sm text-gray-800 font-medium">{question.question}</p>
                                                    </div>
                                                    {/* Options if multiple choice */}
                                                    {question.options && (
                                                        <div className="mb-3">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Options</p>
                                                            <div className="space-y-1">
                                                                {question.options.map((option, optIdx) => (
                                                                    <div
                                                                        key={optIdx}
                                                                        className={`text-sm px-3 py-2 rounded-lg ${answers[question.id] === option
                                                                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                                            : 'bg-gray-50 text-gray-600'
                                                                            }`}
                                                                    >
                                                                        {answers[question.id] === option && (
                                                                            <CheckCircle className="w-4 h-4 inline mr-2 text-indigo-600" />
                                                                        )}
                                                                        {option}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* User's Answer */}
                                                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                                                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Your Answer</p>
                                                        <p className="text-sm text-gray-800">
                                                            {answers[question.id] || <span className="text-red-500 italic">No answer provided</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </details>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleComplete}
                                    className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                                >
                                    Continue
                                </button>
                            </motion.div>
                        )
                    }
                </AnimatePresence >
            </main >
        </div >
    );
};

export default ScenarioAssessment;
