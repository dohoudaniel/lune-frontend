import React, { useState, useEffect, useRef } from 'react';
import { sanitizeTextHTML } from '../lib/sanitize';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Clock, CheckCircle, Loader, ArrowRight,
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Link2, Image, Undo, Redo, Save,
    AlertCircle, Sparkles, Type, Heading1, Heading2
} from 'lucide-react';

import { DifficultyLevel, EvaluationResult } from '../types';

interface TextEditorAssessmentProps {
    skill: string;
    difficulty: DifficultyLevel;
    onComplete: (result: EvaluationResult) => void;
    onCancel?: () => void;
}

interface DocumentTask {
    title: string;
    description: string;
    documentType: string;
    requirements: string[];
    template: string;
    wordCountMin: number;
    wordCountMax: number;
    evaluationCriteria: string[];
}

type TextAlignment = 'left' | 'center' | 'right';

export const TextEditorAssessment: React.FC<TextEditorAssessmentProps> = ({
    skill,
    difficulty,
    onComplete,
    onCancel
}) => {
    const [step, setStep] = useState<'loading' | 'instructions' | 'editing' | 'submitting' | 'results'>('loading');
    const [task, setTask] = useState<DocumentTask | null>(null);
    const [content, setContent] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes
    const [wordCount, setWordCount] = useState(0);
    const [result, setResult] = useState<{ score: number; feedback: string; categoryScores: Record<string, number> } | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    // Formatting states
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [alignment, setAlignment] = useState<TextAlignment>('left');
    const [fontSize, setFontSize] = useState('16');

    // Generate task based on difficulty
    useEffect(() => {
        const generateTask = () => {
            const tasks: Record<DifficultyLevel, DocumentTask> = {
                'Beginner': {
                    title: 'Business Email Composition',
                    description: 'Write a professional email to schedule a meeting.',
                    documentType: 'Email',
                    requirements: [
                        'Professional greeting and closing',
                        'Clear subject line (in first line)',
                        'Propose 2-3 meeting time options',
                        'State the purpose of the meeting',
                        'Use proper email formatting'
                    ],
                    template: `Subject: [Your Subject Here]

Dear [Recipient Name],

[Your message here]

Best regards,
[Your Name]
[Your Title]`,
                    wordCountMin: 100,
                    wordCountMax: 200,
                    evaluationCriteria: ['Professional tone', 'Clarity', 'Formatting', 'Grammar', 'Completeness']
                },
                'Mid-Level': {
                    title: 'Project Status Report',
                    description: 'Create a comprehensive project status update document.',
                    documentType: 'Report',
                    requirements: [
                        'Executive summary section',
                        'Current status with progress percentage',
                        'Key accomplishments (bullet list)',
                        'Challenges and risks section',
                        'Next steps and timeline',
                        'Use headings to organize sections'
                    ],
                    template: `PROJECT STATUS REPORT

Project Name: [Project Name]
Reporting Period: [Date Range]
Prepared By: [Your Name]

---

EXECUTIVE SUMMARY
[Brief overview of project status]

CURRENT STATUS
[Progress details]

KEY ACCOMPLISHMENTS
• [Accomplishment 1]
• [Accomplishment 2]

CHALLENGES & RISKS
[Describe any issues]

NEXT STEPS
[Upcoming actions and timeline]`,
                    wordCountMin: 250,
                    wordCountMax: 500,
                    evaluationCriteria: ['Structure', 'Professional tone', 'Completeness', 'Clarity', 'Formatting', 'Grammar']
                },
                'Advanced': {
                    title: 'Business Proposal Document',
                    description: 'Draft a formal business proposal for a potential client.',
                    documentType: 'Proposal',
                    requirements: [
                        'Cover page with title and date',
                        'Problem statement/client needs analysis',
                        'Proposed solution with benefits',
                        'Implementation timeline',
                        'Pricing structure (create a simple table)',
                        'Terms and conditions section',
                        'Call to action and next steps',
                        'Use professional formatting throughout'
                    ],
                    template: `[COMPANY NAME]

BUSINESS PROPOSAL

Prepared for: [Client Name]
Date: [Current Date]

---

1. INTRODUCTION
[Introduce your company and the purpose of this proposal]

2. UNDERSTANDING YOUR NEEDS
[Describe the client's challenges and requirements]

3. PROPOSED SOLUTION
[Detail your solution and its benefits]

4. IMPLEMENTATION TIMELINE
Phase 1: [Description] - [Duration]
Phase 2: [Description] - [Duration]

5. INVESTMENT
| Service | Description | Price |
|---------|-------------|-------|
| [Item]  | [Desc]      | $X    |

6. TERMS & CONDITIONS
[Standard terms]

7. NEXT STEPS
[Call to action]

---
[Contact Information]`,
                    wordCountMin: 400,
                    wordCountMax: 800,
                    evaluationCriteria: ['Persuasiveness', 'Structure', 'Professional tone', 'Completeness', 'Visual formatting', 'Grammar', 'Clarity']
                }
            };

            setTask(tasks[difficulty]);
            setContent(tasks[difficulty].template);
            setStep('instructions');
        };

        setTimeout(generateTask, 1000);
    }, [difficulty]);

    // Timer
    useEffect(() => {
        if (step === 'editing') {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 0) {
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [step]);

    // Word count
    useEffect(() => {
        const words = content.trim().split(/\s+/).filter(w => w.length > 0);
        setWordCount(words.length);
    }, [content]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const executeCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const handleFormatBold = () => {
        executeCommand('bold');
        setIsBold(!isBold);
    };

    const handleFormatItalic = () => {
        executeCommand('italic');
        setIsItalic(!isItalic);
    };

    const handleFormatUnderline = () => {
        executeCommand('underline');
        setIsUnderline(!isUnderline);
    };

    const handleAlign = (align: TextAlignment) => {
        executeCommand(`justify${align.charAt(0).toUpperCase() + align.slice(1)}`);
        setAlignment(align);
    };

    const handleList = (ordered: boolean) => {
        executeCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
    };

    const handleFontSize = (size: string) => {
        setFontSize(size);
        executeCommand('fontSize', size === '14' ? '2' : size === '16' ? '3' : size === '18' ? '4' : size === '24' ? '5' : '6');
    };

    const handleHeading = (level: 1 | 2) => {
        executeCommand('formatBlock', level === 1 ? 'h1' : 'h2');
    };

    const handleEditorInput = () => {
        if (editorRef.current) {
            // MEDIUM-5: Sanitise at write time so the stored value is always clean,
            // regardless of how or where it is later rendered or submitted.
            setContent(sanitizeTextHTML(editorRef.current.innerHTML));
        }
    };

    const handleSubmit = async () => {
        if (!task) return;
        setStep('submitting');

        // Simulate AI evaluation
        setTimeout(() => {
            const textContent = editorRef.current?.textContent || '';
            const wordCount = textContent.trim().split(/\s+/).filter(w => w.length > 0).length;
            const hasHeadings = content.includes('<h1>') || content.includes('<h2>') || content.toUpperCase().includes('STATUS') || content.toUpperCase().includes('SUMMARY');
            const hasBullets = content.includes('<li>') || content.includes('•') || content.includes('-');
            const hasProperStructure = task.requirements.filter(req => {
                const keywords = req.toLowerCase().split(' ').filter(w => w.length > 4);
                return keywords.some(k => content.toLowerCase().includes(k));
            }).length;

            const structureScore = Math.min(100, (hasProperStructure / task.requirements.length) * 100);
            const formattingScore = (hasHeadings ? 50 : 0) + (hasBullets ? 50 : 0);
            const lengthScore = wordCount >= task.wordCountMin && wordCount <= task.wordCountMax ? 100 :
                wordCount < task.wordCountMin ? (wordCount / task.wordCountMin) * 100 : 80;
            const toneScore = 75; // Would be AI-evaluated
            const grammarScore = 80; // Would be AI-evaluated

            const overallScore = Math.round(
                (structureScore * 0.3) +
                (formattingScore * 0.2) +
                (lengthScore * 0.15) +
                (toneScore * 0.2) +
                (grammarScore * 0.15)
            );

            setResult({
                score: overallScore,
                feedback: overallScore >= 70
                    ? `Great job! Your ${task.documentType.toLowerCase()} demonstrates professional writing skills with good structure and formatting.`
                    : `Your ${task.documentType.toLowerCase()} needs improvement in structure and completeness. Focus on addressing all requirements.`,
                categoryScores: {
                    'Structure': Math.round(structureScore),
                    'Formatting': Math.round(formattingScore),
                    'Length': Math.round(lengthScore),
                    'Professionalism': toneScore,
                    'Grammar': grammarScore
                }
            });
            setStep('results');
        }, 2500);
    };

    const handleComplete = async () => {
        if (!result) return;

        const passed = result.score >= 70;
        let txHash;

        if (passed) {
            try {
                txHash = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            } catch (e) {
                console.error("Failed to mint", e);
            }
        }

        onComplete({
            score: result.score,
            feedback: result.feedback,
            passed,
            cheatingDetected: false,
            certificationHash: txHash
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100';
        if (score >= 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    if (step === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900">Preparing Document</h2>
                    <p className="text-gray-500">Loading {skill} assessment...</p>
                </div>
            </div>
        );
    }

    if (!task) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">{task.title}</h1>
                            <p className="text-sm text-gray-500">{difficulty} Level</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {step === 'editing' && (
                            <>
                                <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${wordCount < task.wordCountMin ? 'bg-amber-100 text-amber-700' :
                                    wordCount > task.wordCountMax ? 'bg-red-100 text-red-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                    {wordCount} / {task.wordCountMin}-{task.wordCountMax} words
                                </div>

                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    <Clock className="w-4 h-4" />
                                    <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={wordCount < task.wordCountMin * 0.5}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Submit
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Formatting Toolbar */}
                {step === 'editing' && (
                    <div className="border-t border-gray-200 px-4 py-2 flex items-center gap-1 bg-gray-50 flex-wrap">
                        {/* Font Size */}
                        <select
                            value={fontSize}
                            onChange={(e) => handleFontSize(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm mr-2"
                        >
                            <option value="14">14</option>
                            <option value="16">16</option>
                            <option value="18">18</option>
                            <option value="24">24</option>
                            <option value="32">32</option>
                        </select>

                        <div className="w-px h-6 bg-gray-300 mx-2" />

                        {/* Text Formatting */}
                        <button
                            onClick={handleFormatBold}
                            className={`p-2 rounded hover:bg-gray-200 ${isBold ? 'bg-gray-200' : ''}`}
                            title="Bold"
                        >
                            <Bold className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleFormatItalic}
                            className={`p-2 rounded hover:bg-gray-200 ${isItalic ? 'bg-gray-200' : ''}`}
                            title="Italic"
                        >
                            <Italic className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleFormatUnderline}
                            className={`p-2 rounded hover:bg-gray-200 ${isUnderline ? 'bg-gray-200' : ''}`}
                            title="Underline"
                        >
                            <Underline className="w-4 h-4" />
                        </button>

                        <div className="w-px h-6 bg-gray-300 mx-2" />

                        {/* Headings */}
                        <button
                            onClick={() => handleHeading(1)}
                            className="p-2 rounded hover:bg-gray-200"
                            title="Heading 1"
                        >
                            <Heading1 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleHeading(2)}
                            className="p-2 rounded hover:bg-gray-200"
                            title="Heading 2"
                        >
                            <Heading2 className="w-4 h-4" />
                        </button>

                        <div className="w-px h-6 bg-gray-300 mx-2" />

                        {/* Alignment */}
                        <button
                            onClick={() => handleAlign('left')}
                            className={`p-2 rounded hover:bg-gray-200 ${alignment === 'left' ? 'bg-gray-200' : ''}`}
                            title="Align Left"
                        >
                            <AlignLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleAlign('center')}
                            className={`p-2 rounded hover:bg-gray-200 ${alignment === 'center' ? 'bg-gray-200' : ''}`}
                            title="Align Center"
                        >
                            <AlignCenter className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleAlign('right')}
                            className={`p-2 rounded hover:bg-gray-200 ${alignment === 'right' ? 'bg-gray-200' : ''}`}
                            title="Align Right"
                        >
                            <AlignRight className="w-4 h-4" />
                        </button>

                        <div className="w-px h-6 bg-gray-300 mx-2" />

                        {/* Lists */}
                        <button
                            onClick={() => handleList(false)}
                            className="p-2 rounded hover:bg-gray-200"
                            title="Bullet List"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleList(true)}
                            className="p-2 rounded hover:bg-gray-200"
                            title="Numbered List"
                        >
                            <ListOrdered className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6">
                <AnimatePresence mode="wait">
                    {/* Instructions Step */}
                    {step === 'instructions' && (
                        <motion.div
                            key="instructions"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8"
                        >
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Type className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
                                <p className="text-gray-600">{task.description}</p>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-6 mb-6">
                                <h3 className="font-bold text-blue-900 mb-4">Document Requirements</h3>
                                <ul className="space-y-2">
                                    {task.requirements.map((req, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-blue-800">
                                            <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <span>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-gray-900">{task.wordCountMin}-{task.wordCountMax}</p>
                                    <p className="text-sm text-gray-500">Word Count</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-gray-900">30</p>
                                    <p className="text-sm text-gray-500">Minutes</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                {onCancel && (
                                    <button
                                        onClick={onCancel}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={() => setStep('editing')}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                >
                                    Start Writing <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Editing Step */}
                    {step === 'editing' && (
                        <motion.div
                            key="editing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex gap-6"
                        >
                            {/* Editor */}
                            <div className="flex-1">
                                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        onInput={handleEditorInput}
                                        className="min-h-[600px] p-8 focus:outline-none prose prose-sm max-w-none"
                                        style={{ fontFamily: 'Georgia, serif', lineHeight: 1.8 }}
                                        dangerouslySetInnerHTML={{ __html: sanitizeTextHTML(task.template.replace(/\n/g, '<br>')) }}
                                    />
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="w-72 space-y-4">
                                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-blue-500" />
                                        Checklist
                                    </h3>
                                    <ul className="space-y-2 text-sm">
                                        {task.requirements.map((req, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-gray-600">
                                                <input type="checkbox" className="mt-1" />
                                                <span>{req}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Tips
                                    </h4>
                                    <ul className="text-sm text-amber-700 space-y-1">
                                        <li>• Use headings to organize your document</li>
                                        <li>• Keep paragraphs focused</li>
                                        <li>• Proofread before submitting</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Submitting Step */}
                    {step === 'submitting' && (
                        <motion.div
                            key="submitting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-12 text-center"
                        >
                            <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Evaluating Your Document</h2>
                            <p className="text-gray-600">Analyzing structure, formatting, and content...</p>
                        </motion.div>
                    )}

                    {/* Results Step */}
                    {step === 'results' && result && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8"
                        >
                            <div className={`text-center p-8 rounded-xl mb-8 ${result.score >= 70 ? 'bg-green-50' : 'bg-red-50'
                                }`}>
                                <div className={`w-24 h-24 ${result.score >= 70 ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                    <span className={`text-4xl font-bold ${result.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                        {result.score}%
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {result.score >= 70 ? 'Assessment Passed!' : 'Needs Improvement'}
                                </h2>
                            </div>

                            {/* Category Scores */}
                            <div className="grid grid-cols-5 gap-2 mb-8">
                                {Object.entries(result.categoryScores).map(([category, score]) => (
                                    <div key={category} className={`rounded-xl p-3 text-center ${getScoreColor(Number(score))}`}>
                                        <p className="text-lg font-bold">{score}</p>
                                        <p className="text-xs">{category}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 mb-8">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-blue-500" />
                                    Feedback
                                </h3>
                                <p className="text-gray-700">{result.feedback}</p>
                            </div>

                            <button
                                onClick={handleComplete}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                            >
                                Continue
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default TextEditorAssessment;
