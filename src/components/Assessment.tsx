import React, { useState, useEffect, useRef, useCallback } from "react";
import { sanitizeHTML } from "../lib/sanitize";
import {
  Play,
  AlertTriangle,
  Loader,
  Code,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Command,
  Check,
  Send,
  Clock,
  Cpu,
  FileJson,
  XCircle,
  Terminal,
  CheckCircle2,
  XCircle as XCircleIcon,
  Mic,
  MicOff,
  BarChart3,
  BookOpen,
  Video,
  HelpCircle,
} from "lucide-react";
import {
  evaluateCodeSubmission,
  generateCheatingAnalysis,
  generateAssessment,
} from "../services/geminiService";

import {
  smartExecuteCode,
  TestCase,
  CodeExecutionResult,
} from "../services/codeExecutionService";
import { EvaluationResult, AssessmentContent, DifficultyLevel } from "../types";
import { audioRecordingService } from "../services/audioRecordingService";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import { motion, AnimatePresence } from "framer-motion";

interface AssessmentProps {
  skill: string;
  difficulty: DifficultyLevel;
  onComplete: (result: EvaluationResult) => void;
}

// Question type definitions
type QuestionType = "mcq" | "video" | "situational" | "theory";

interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options: string[];
}

interface QuestionDistribution {
  mcq: { count: number; percentage: number };
  video: { count: number; percentage: number };
  situational: { count: number; percentage: number };
  total: number;
}

interface ProgressTracker {
  completed: number;
  mcqCompleted: number;
  videoCompleted: number;
  situationalCompleted: number;
}

// Helper function to detect question type
const detectQuestionType = (question: any): QuestionType => {
  if (!question) return "theory";

  // Check if question has an explicit type field
  if (
    question.type &&
    ["mcq", "video", "situational"].includes(question.type)
  ) {
    return question.type;
  }

  // Fallback: assume theory questions are from theoryQuestions array
  return "theory";
};

// Helper function to calculate question distribution
const calculateDistribution = (questions: any[]): QuestionDistribution => {
  const distribution: QuestionDistribution = {
    mcq: { count: 0, percentage: 0 },
    video: { count: 0, percentage: 0 },
    situational: { count: 0, percentage: 0 },
    total: questions.length,
  };

  if (distribution.total === 0) return distribution;

  questions.forEach((q) => {
    const type = detectQuestionType(q);
    if (type !== "theory") {
      distribution[type].count++;
    }
  });

  // Calculate percentages
  Object.keys(distribution).forEach((key) => {
    if (key !== "total" && distribution[key as QuestionType]) {
      distribution[key as QuestionType].percentage = Math.round(
        (distribution[key as QuestionType].count / distribution.total) * 100,
      );
    }
  });

  return distribution;
};

const COMPLETION_KEYWORDS = [
  "function",
  "const",
  "let",
  "var",
  "return",
  "if",
  "else",
  "for",
  "while",
  "switch",
  "case",
  "break",
  "continue",
  "try",
  "catch",
  "finally",
  "async",
  "await",
  "class",
  "extends",
  "constructor",
  "this",
  "super",
  "import",
  "export",
  "from",
  "default",
  "console",
  "log",
  "null",
  "undefined",
  "true",
  "false",
  "Promise",
  "JSON",
  "map",
  "filter",
  "reduce",
  "forEach",
  "length",
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "slice",
  "Object",
  "Array",
  "String",
  "Number",
  "Boolean",
  "Date",
  "Math",
  "window",
  "document",
];

export const Assessment: React.FC<AssessmentProps> = ({
  skill,
  difficulty,
  onComplete,
}) => {
  const [loading, setLoading] = useState(true);
  const [assessmentContent, setAssessmentContent] =
    useState<AssessmentContent | null>(null);
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [cheatingEvents, setCheatingEvents] = useState<string[]>([]);
  const [webcamActive, setWebcamActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"challenge" | "theory">(
    "challenge",
  );
  const [theoryAnswers, setTheoryAnswers] = useState<Record<number, number>>(
    {},
  );
  const [statusMessage, setStatusMessage] = useState("");

  // Editor State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [showGazeOverlay, setShowGazeOverlay] = useState(false);
  const [gazePosition, setGazePosition] = useState({ x: 50, y: 50 });

  // Question Distribution State
  const [distribution, setDistribution] = useState<QuestionDistribution | null>(
    null,
  );
  const [progressTracker, setProgressTracker] = useState<ProgressTracker>({
    completed: 0,
    mcqCompleted: 0,
    videoCompleted: 0,
    situationalCompleted: 0,
  });
  const [currentQuestionType, setCurrentQuestionType] =
    useState<QuestionType | null>(null);

  // Code Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] =
    useState<CodeExecutionResult | null>(null);
  const [showOutput, setShowOutput] = useState(false);

  // Audio Recording State
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [audioRecordingError, setAudioRecordingError] = useState<string | null>(
    null,
  );
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Sample test cases for the assessment
  const testCases: TestCase[] = [
    { name: "Basic Test", input: "", expected_output: "Hello World" },
    { name: "Edge Case", input: "5", expected_output: "5" },
    { name: "Large Input", input: "100", expected_output: "100" },
  ];

  // Proctoring Metrics
  const [pasteCount, setPasteCount] = useState(0);
  const [suspiciousGazeCount, setSuspiciousGazeCount] = useState(0);
  const [pasteContentWarnings, setPasteContentWarnings] = useState(0);
  const [typingBursts, setTypingBursts] = useState(0);

  const isPasting = useRef(false);
  const leaveTime = useRef<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Timer Effect
  useEffect(() => {
    if (!loading && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [loading, timeLeft]);

  // Load Assessment Content
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      const content = await generateAssessment(skill, difficulty);
      setAssessmentContent(content);
      setCode(content.starterCode || "// Start coding here...");

      // Calculate distribution from theory questions
      if (content.theoryQuestions && content.theoryQuestions.length > 0) {
        const dist = calculateDistribution(content.theoryQuestions);
        setDistribution(dist);
      }

      setLoading(false);
    };
    loadContent();
  }, [skill, difficulty]);

  // Anti-Cheating: Visibility & Context Menu & DevTools
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        leaveTime.current = Date.now();
      } else {
        const duration = Date.now() - leaveTime.current;
        // Granular Check: Only flag if gone for meaningful time (>2s)
        if (duration > 2000) {
          const msg = `Tab switch detected (${(duration / 1000).toFixed(1)}s)`;
          setWarnings((prev) => [...prev, "Warning: Assessment focus lost."]);
          setCheatingEvents((prev) => [...prev, msg]);
          setActiveAlert("Focus Lost: Please stay on this tab.");
          setTimeout(() => setActiveAlert(null), 3000);
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setActiveAlert("Security Warning: Right-click menu disabled.");
      setTimeout(() => setActiveAlert(null), 2000);
    };

    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      // Allow DevTools inspection in development mode
      if (import.meta.env.DEV) return;
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          (e.key === "I" || e.key === "J" || e.key === "C"))
      ) {
        e.preventDefault();
        setCheatingEvents((prev) => [...prev, "Attempted DevTools Access"]);
        setActiveAlert("Security Violation: DevTools disabled.");
        setTimeout(() => setActiveAlert(null), 3000);
      }
    };

    // Gaze tracking proxy: mouse leaving window = candidate looking away
    const handleMouseLeave = () => {
      setSuspiciousGazeCount((prev) => prev + 1);
      setCheatingEvents((prev) => [...prev, "Gaze left screen"]);
      setActiveAlert("Proctor Alert: Please keep your eyes on the screen.");
      setTimeout(() => setActiveAlert(null), 3000);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDownGlobal);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDownGlobal);
      document.documentElement.removeEventListener(
        "mouseleave",
        handleMouseLeave,
      );
    };
  }, []);

  // Anti-Cheating: Block and log paste attempts in the code editor
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault(); // Block all paste in the code editor
    isPasting.current = true;
    const text = e.clipboardData.getData("text");

    // AI Markers Check
    const llmIndicators = [
      "here is the code",
      "sure,",
      "generated by",
      "openai",
      "gpt",
      "claude",
      "solution:",
    ];
    const hasLLMMarkers = llmIndicators.some((marker) =>
      text.toLowerCase().includes(marker),
    );

    if (hasLLMMarkers) {
      setPasteContentWarnings((prev) => prev + 1);
      setWarnings((prev) => [
        ...prev,
        "Critical: AI-generated content detected.",
      ]);
      setCheatingEvents((prev) => [...prev, "Critical: LLM Markers in Paste"]);
      setActiveAlert("Proctor Alert: AI content signature detected.");
      setTimeout(() => setActiveAlert(null), 5000);
    } else if (text.length > 150) {
      setPasteCount((prev) => prev + 1);
      setCheatingEvents((prev) => [
        ...prev,
        `Large paste: ${text.length} chars`,
      ]);
      setActiveAlert("Proctor Alert: Large code block paste detected.");
      setTimeout(() => setActiveAlert(null), 3000);
    }

    setTimeout(() => {
      isPasting.current = false;
    }, 100);
  };

  // Webcam & Audio Setup — runs AFTER the assessment content loads so the video element is in the DOM
  useEffect(() => {
    if (loading) return; // video element not rendered yet while loading screen is showing

    let stream: MediaStream | null = null;
    const startWebcamAndAudio = async () => {
      try {
        // Request both video and audio
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        audioStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {
            /* autoplay policy — muted video plays anyway */
          });
          setWebcamActive(true);
        }

        // Start audio recording for assessment
        const audioStarted = await audioRecordingService.startRecording();
        if (audioStarted) {
          setIsAudioRecording(true);
          setAudioRecordingError(null);
        }
      } catch (err: any) {
        console.error("Camera/Microphone access denied", err);
        const reason =
          err?.name === "NotAllowedError"
            ? "Camera/Microphone permission denied."
            : "Camera/Microphone not accessible.";
        setWarnings((prev) => [
          ...prev,
          `${reason} Enable camera and microphone for proctoring.`,
        ]);
        setAudioRecordingError(reason);
      }
    };

    startWebcamAndAudio();

    return () => {
      // Cleanup: stop all media streams
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      audioStreamRef.current = null;
      setWebcamActive(false);
    };
  }, [loading]);

  /**
   * Stop all media streams and audio recording
   */
  const stopAllMediaStreams = useCallback(() => {
    try {
      // Stop audio recording
      audioRecordingService.stopAllStreams();
      setIsAudioRecording(false);

      // Stop video stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        audioStreamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setWebcamActive(false);
    } catch (error: any) {
      console.error("Error stopping media streams:", error);
    }
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopAllMediaStreams();
    };
  }, [stopAllMediaStreams]);

  // Editor Logic: Scroll Sync & Autocomplete
  const handleScroll = () => {
    if (preRef.current && textareaRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const updateCursorAndSuggestions = (
    e:
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.KeyboardEvent
      | React.MouseEvent,
  ) => {
    if (!textareaRef.current) return;

    const { selectionStart, value } = textareaRef.current;
    const textBeforeCaret = value.substring(0, selectionStart);
    const lines = textBeforeCaret.split("\n");
    const currentLine = lines[lines.length - 1];
    const words = currentLine.split(/[\s(){}[\];,]/);
    const currentWord = words[words.length - 1];

    // Calculate cursor position for popup
    const lineHeight = 24;
    const charWidth = 9.6; // Approximate for Fira Code 16px
    const top = lines.length * lineHeight - textareaRef.current.scrollTop;
    const left =
      currentLine.length * charWidth - textareaRef.current.scrollLeft + 40; // +Padding

    setCursorPosition({ top, left });

    if (currentWord.length > 1) {
      const matches = COMPLETION_KEYWORDS.filter(
        (k) => k.startsWith(currentWord) && k !== currentWord,
      );
      if (matches.length > 0) {
        setSuggestions(matches);
        setShowSuggestions(true);
        setSuggestionIndex(0);
        return;
      }
    }
    setShowSuggestions(false);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    updateCursorAndSuggestions(e);

    // Burst typing check
    if (!isPasting.current && Math.abs(newCode.length - code.length) > 10) {
      setTypingBursts((prev) => prev + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIndex((i) => (i + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIndex(
          (i) => (i - 1 + suggestions.length) % suggestions.length,
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertSuggestion(suggestions[suggestionIndex]);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    }
  };

  const insertSuggestion = (suggestion: string) => {
    if (!textareaRef.current) return;
    const { selectionStart, value } = textareaRef.current;
    const textBeforeCaret = value.substring(0, selectionStart);
    const words = textBeforeCaret.split(/[\s(){}[\];,]/);
    const currentWord = words[words.length - 1];

    const before = value.substring(0, selectionStart - currentWord.length);
    const after = value.substring(selectionStart);
    const newCode = before + suggestion + after;

    setCode(newCode);
    setShowSuggestions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = (before + suggestion).length;
        textareaRef.current.selectionStart = newPos;
        textareaRef.current.selectionEnd = newPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Run code with test cases
  const handleRunCode = async () => {
    setIsRunning(true);
    setShowOutput(true);

    // Verify audio is still recording
    const audioState = audioRecordingService.getState();
    if (!audioState.isRecording && isAudioRecording) {
      setAudioRecordingError(
        "Audio recording stopped unexpectedly. Please restart the assessment.",
      );
    }
    setExecutionResult(null);

    try {
      const result = await smartExecuteCode(code, "javascript", testCases);
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        success: false,
        results: [],
        totalTests: testCases.length,
        passedTests: 0,
        executionTime: null,
        error: error instanceof Error ? error.message : "Execution failed",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleTheoryAnswerChange = (
    questionId: number,
    optionIndex: number,
    type: QuestionType,
  ) => {
    setTheoryAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));

    // Update progress tracker
    setProgressTracker((prev) => {
      const updated = { ...prev };

      // Only count if this is the first time answering
      if (!(questionId in theoryAnswers)) {
        updated.completed++;
        if (type === "mcq") updated.mcqCompleted++;
        else if (type === "video") updated.videoCompleted++;
        else if (type === "situational") updated.situationalCompleted++;
      }

      return updated;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!assessmentContent) return;

    setIsSubmitting(true);
    setStatusMessage("Analyzing session integrity...");

    const metrics = {
      tabSwitches: cheatingEvents.filter((e) => e.includes("Tab")).length,
      pasteEvents: pasteCount,
      suspiciousEyemovements: suspiciousGazeCount,
      typingBursts: typingBursts,
      pasteContentWarnings: pasteContentWarnings,
    };

    const cheatAnalysis = await generateCheatingAnalysis(
      cheatingEvents,
      metrics,
      code,
    );

    setStatusMessage("Evaluating code performance...");
    const evaluation = await evaluateCodeSubmission(
      code,
      skill,
      assessmentContent.description,
      theoryAnswers,
    );

    let txHash = undefined;
    const passed = evaluation.score >= 70;

    if (passed && !cheatAnalysis.isCheating) {
      setStatusMessage("Generating Secure Certificate...");
      try {
        txHash = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      } catch (e) {
        console.error("Mint failed", e);
      }
    }

    setIsSubmitting(false);
    onComplete({
      score: evaluation.score,
      feedback: evaluation.feedback,
      passed,
      cheatingDetected: cheatAnalysis.isCheating,
      cheatingReason: cheatAnalysis.reason,
      certificationHash: txHash,
    });
  }, [
    code,
    skill,
    cheatingEvents,
    pasteCount,
    suspiciousGazeCount,
    typingBursts,
    pasteContentWarnings,
    onComplete,
    assessmentContent,
    theoryAnswers,
  ]);

  const isLowTime = timeLeft < 300; // Less than 5 mins

  if (loading) {
    return (
      <div className="h-screen w-full bg-editor flex flex-col items-center justify-center text-white space-y-4">
        <Loader className="animate-spin w-10 h-10 text-teal-500" />
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-mono"
        >
          Initializing Environment...
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-500 text-sm"
        >
          Configuring {difficulty} Assessment
        </motion.p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-editor text-gray-300 flex flex-col font-mono overflow-hidden select-none">
      {/* Alert Toast */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-16 left-1/2 z-50 pointer-events-none"
          >
            <div className="bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-red-400 font-bold">
              <AlertTriangle className="animate-bounce" size={20} />
              {activeAlert}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="h-12 bg-editorSide border-b border-black flex items-center justify-between px-4 select-none z-20"
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-sans text-gray-400 font-bold tracking-wide">
            LUNE <span className="text-teal-500">IDE</span>
          </span>
          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-500">
            {difficulty} Mode
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-teal-400 bg-teal-900/30 px-3 py-1 rounded-full border border-teal-500/20">
            <ShieldCheck size={14} />
            <span className="text-xs font-bold">Secure Environment</span>
          </div>
          <motion.div
            animate={
              isLowTime
                ? { scale: [1, 1.05, 1], color: ["#fff", "#f87171", "#fff"] }
                : {}
            }
            transition={isLowTime ? { repeat: Infinity, duration: 1 } : {}}
            className={`font-mono font-bold px-3 py-1 rounded flex items-center gap-2 ${isLowTime ? "bg-red-900/50 text-red-200 border border-red-500/30" : "bg-gray-700 text-white"}`}
          >
            <Clock size={14} />
            {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")}
          </motion.div>
        </div>
      </motion.div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-1/3 bg-editorSide border-r border-black flex flex-col z-10"
        >
          {/* Webcam Feed */}
          <div className="h-48 bg-black relative border-b border-gray-700 group overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 px-2 py-1 rounded text-xs text-green-400 backdrop-blur-md">
              <Eye size={12} />
              <span>Proctor Active</span>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-editorSide border-b border-black">
            <button
              onClick={() => setActiveTab("challenge")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition relative ${activeTab === "challenge" ? "text-white" : "text-gray-500 hover:bg-gray-800"}`}
            >
              Challenge
              {activeTab === "challenge" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("theory")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition relative ${activeTab === "theory" ? "text-white" : "text-gray-500 hover:bg-gray-800"}`}
            >
              Theory
              {activeTab === "theory" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"
                />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 relative">
            {/* Distribution Overview (Before Starting) */}
            {distribution &&
              assessmentContent?.theoryQuestions &&
              assessmentContent.theoryQuestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={16} className="text-orange-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                      Question Distribution ({distribution.total} total)
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {/* MCQ Distribution */}
                    {distribution.mcq.count > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <HelpCircle size={12} className="text-blue-400" />
                            <span className="font-semibold text-gray-300">
                              MCQ: {distribution.mcq.count} question
                              {distribution.mcq.count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <span className="text-blue-400 font-bold">
                            {distribution.mcq.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${distribution.mcq.percentage}%`,
                            }}
                            transition={{ delay: 0.1, duration: 0.6 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                          />
                        </div>
                      </div>
                    )}

                    {/* Video Distribution */}
                    {distribution.video.count > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Video size={12} className="text-orange-400" />
                            <span className="font-semibold text-gray-300">
                              Video: {distribution.video.count} question
                              {distribution.video.count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <span className="text-orange-400 font-bold">
                            {distribution.video.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${distribution.video.percentage}%`,
                            }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                          />
                        </div>
                      </div>
                    )}

                    {/* Situational Distribution */}
                    {distribution.situational.count > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <BookOpen size={12} className="text-green-400" />
                            <span className="font-semibold text-gray-300">
                              Situational: {distribution.situational.count}{" "}
                              question
                              {distribution.situational.count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <span className="text-green-400 font-bold">
                            {distribution.situational.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${distribution.situational.percentage}%`,
                            }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="h-full bg-gradient-to-r from-green-500 to-green-600"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Summary */}
                  {progressTracker.completed > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400"
                    >
                      <div className="flex items-center justify-between">
                        <span>Progress:</span>
                        <span className="font-semibold text-teal-400">
                          {progressTracker.completed}/{distribution.total}{" "}
                          Complete
                        </span>
                      </div>
                      {(progressTracker.mcqCompleted > 0 ||
                        progressTracker.videoCompleted > 0 ||
                        progressTracker.situationalCompleted > 0) && (
                        <div className="mt-2 space-y-1 text-xs text-gray-500">
                          {progressTracker.mcqCompleted > 0 && (
                            <div className="flex justify-between">
                              <span className="text-blue-400">MCQ:</span>
                              <span>
                                {progressTracker.mcqCompleted}/
                                {distribution.mcq.count}
                              </span>
                            </div>
                          )}
                          {progressTracker.videoCompleted > 0 && (
                            <div className="flex justify-between">
                              <span className="text-orange-400">Video:</span>
                              <span>
                                {progressTracker.videoCompleted}/
                                {distribution.video.count}
                              </span>
                            </div>
                          )}
                          {progressTracker.situationalCompleted > 0 && (
                            <div className="flex justify-between">
                              <span className="text-green-400">
                                Situational:
                              </span>
                              <span>
                                {progressTracker.situationalCompleted}/
                                {distribution.situational.count}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}

            <AnimatePresence mode="wait">
              {activeTab === "challenge" ? (
                <motion.div
                  key="challenge"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="prose prose-invert prose-sm max-w-none"
                >
                  <h3 className="text-white font-bold text-xl mb-2 flex items-center gap-2">
                    <Code size={20} className="text-teal-500" />
                    {assessmentContent?.title}
                  </h3>
                  <div className="text-gray-400 leading-relaxed text-sm whitespace-pre-wrap font-sans">
                    {assessmentContent?.description}
                  </div>

                  <div className="mt-8">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Requirements
                    </h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-gray-400">
                        <Check
                          size={14}
                          className="text-teal-500 mt-0.5 shrink-0"
                        />
                        <span>Solves the problem statement</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-400">
                        <Check
                          size={14}
                          className="text-teal-500 mt-0.5 shrink-0"
                        />
                        <span>Passes all edge cases</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-400">
                        <Check
                          size={14}
                          className="text-teal-500 mt-0.5 shrink-0"
                        />
                        <span>Follows clean code principles</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg text-blue-200 text-xs flex gap-3">
                    <div className="p-1.5 bg-blue-500/20 rounded-md h-fit text-blue-400">
                      <Command size={14} />
                    </div>
                    <div>
                      <strong className="block mb-1 text-blue-300">
                        Tips:
                      </strong>
                      Use standard libraries. Check your syntax. Press{" "}
                      <code className="bg-blue-900/50 px-1 rounded">
                        Ctrl+Space
                      </code>{" "}
                      for AI autocomplete.
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="theory"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {assessmentContent?.theoryQuestions?.map((q, idx) => {
                    const questionType = detectQuestionType(q);
                    const typeConfig = {
                      mcq: {
                        icon: HelpCircle,
                        color: "text-blue-400",
                        bg: "from-blue-900/20",
                      },
                      video: {
                        icon: Video,
                        color: "text-orange-400",
                        bg: "from-orange-900/20",
                      },
                      situational: {
                        icon: BookOpen,
                        color: "text-green-400",
                        bg: "from-green-900/20",
                      },
                      theory: {
                        icon: HelpCircle,
                        color: "text-teal-400",
                        bg: "from-teal-900/20",
                      },
                    };
                    const config = typeConfig[questionType];
                    const IconComponent = config.icon;

                    return (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`text-sm bg-gradient-to-br ${config.bg} to-gray-900/10 rounded-lg p-4 border border-gray-700/50`}
                      >
                        <div className="flex items-start gap-2 mb-3">
                          <IconComponent
                            size={14}
                            className={`${config.color} mt-0.5 shrink-0`}
                          />
                          <p className="text-white font-bold flex gap-2 flex-1">
                            <span className="text-teal-500 font-mono">
                              {idx + 1}.
                            </span>
                            {q.question}
                          </p>
                          {questionType !== "theory" && (
                            <span
                              className={`text-xs font-semibold ${config.color} uppercase tracking-wider`}
                            >
                              {questionType}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {(q.options ?? []).map((opt, optIdx) => (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer group ${
                                theoryAnswers[q.id] === optIdx
                                  ? "bg-teal-900/20 border-teal-500/50 text-white"
                                  : "border-gray-800 hover:bg-gray-800 hover:border-gray-700 text-gray-400"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  theoryAnswers[q.id] === optIdx
                                    ? "border-teal-500 bg-teal-500"
                                    : "border-gray-600 group-hover:border-gray-500"
                                }`}
                              >
                                {theoryAnswers[q.id] === optIdx && (
                                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                )}
                              </div>
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                checked={theoryAnswers[q.id] === optIdx}
                                onChange={() =>
                                  handleTheoryAnswerChange(
                                    q.id,
                                    optIdx,
                                    questionType,
                                  )
                                }
                                className="sr-only"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Warning Feed */}
            <AnimatePresence>
              {warnings.length > 0 && (
                <div className="absolute bottom-4 left-6 right-6 space-y-2 pointer-events-none">
                  {warnings.slice(-3).map((w, i) => (
                    <motion.div
                      key={w + i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-red-900/80 backdrop-blur-sm border border-red-500/30 p-2.5 rounded text-red-100 text-xs flex items-center gap-2 shadow-lg"
                    >
                      <AlertTriangle size={12} className="text-red-400" /> {w}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit Area */}
          <div className="p-4 border-t border-black bg-editorSide z-20">
            {isSubmitting ? (
              <div className="text-xs text-teal-400 flex flex-col items-center justify-center gap-3 py-2">
                <Loader className="animate-spin" size={20} />
                <p className="animate-pulse">{statusMessage}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Run Code Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="w-full bg-gray-700 text-white py-2.5 rounded-lg font-bold hover:bg-gray-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isRunning ? (
                    <>
                      <Loader className="animate-spin" size={14} />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play size={14} /> Run Code
                    </>
                  )}
                </motion.button>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-500 transition flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20"
                >
                  Submit Assessment <Send size={16} />
                </motion.button>
              </div>
            )}

            {/* Execution Results */}
            <AnimatePresence>
              {showOutput && executionResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden"
                >
                  <div className="px-3 py-2 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                      <Terminal size={12} />
                      Output
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${executionResult.passedTests === executionResult.totalTests ? "text-green-400" : "text-yellow-400"}`}
                      >
                        {executionResult.passedTests}/
                        {executionResult.totalTests} Passed
                      </span>
                      {executionResult.executionTime && (
                        <span className="text-xs text-gray-500">
                          {executionResult.executionTime}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
                    {executionResult.results.map((result, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 text-xs p-2 rounded ${result.passed ? "bg-green-900/20 text-green-300" : "bg-red-900/20 text-red-300"}`}
                      >
                        {result.passed ? (
                          <CheckCircle2
                            size={14}
                            className="text-green-400 shrink-0 mt-0.5"
                          />
                        ) : (
                          <XCircleIcon
                            size={14}
                            className="text-red-400 shrink-0 mt-0.5"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-bold">
                            {result.testCase.name || `Test ${idx + 1}`}
                          </div>
                          {!result.passed && result.actual_output && (
                            <div className="mt-1 text-gray-400">
                              Expected:{" "}
                              <code className="bg-gray-800 px-1 rounded">
                                {result.testCase.expected_output}
                              </code>
                              <br />
                              Got:{" "}
                              <code className="bg-gray-800 px-1 rounded">
                                {result.actual_output}
                              </code>
                            </div>
                          )}
                          {result.error && (
                            <div className="mt-1 text-red-400">
                              {result.error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {executionResult.error && (
                      <div className="text-red-400 text-xs p-2 bg-red-900/20 rounded">
                        {executionResult.error}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right Panel: Enhanced Code Editor */}
        <div className="flex-1 relative bg-editor" ref={editorContainerRef}>
          {/* Layer 1: Syntax Highlighting (Bottom) */}
          <pre
            ref={preRef}
            className="absolute inset-0 w-full h-full p-8 m-0 overflow-hidden font-mono text-base leading-relaxed pointer-events-none z-0"
            aria-hidden="true"
            style={{ tabSize: 2 }}
          >
            <code
              className="language-javascript"
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(
                  Prism.highlight(
                    code,
                    Prism.languages.javascript,
                    "javascript",
                  ),
                ),
              }}
            />
          </pre>

          {/* Layer 2: Input (Top) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            onClick={updateCursorAndSuggestions}
            onScroll={handleScroll}
            onPaste={handlePaste}
            className="absolute inset-0 w-full h-full p-8 m-0 bg-transparent text-transparent caret-teal-400 font-mono text-base leading-relaxed resize-none outline-none z-10 selection:bg-teal-500/30"
            spellCheck="false"
            autoCapitalize="off"
            autoCorrect="off"
            style={{ tabSize: 2 }}
          />

          {/* Layer 3: Autocomplete Dropdown */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  top: cursorPosition.top + 20,
                  left: cursorPosition.left,
                }}
                className="absolute z-20 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-56 overflow-hidden"
              >
                <div className="bg-gray-950 px-2 py-1.5 text-[10px] text-gray-500 uppercase font-bold border-b border-gray-800 flex justify-between items-center">
                  <span>Suggestions</span>
                  <span className="text-[9px] bg-gray-800 px-1 rounded text-gray-400">
                    Tab
                  </span>
                </div>
                <ul className="max-h-48 overflow-y-auto custom-scrollbar">
                  {suggestions.map((s, i) => (
                    <li
                      key={s}
                      className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors ${i === suggestionIndex ? "bg-teal-600/20 text-teal-300 border-l-2 border-teal-500" : "text-gray-400 hover:bg-gray-800"}`}
                      onClick={() => insertSuggestion(s)}
                    >
                      <Code
                        size={12}
                        className={
                          i === suggestionIndex ? "text-teal-500" : "opacity-30"
                        }
                      />
                      <span className="font-mono">{s}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
