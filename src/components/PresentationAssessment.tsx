import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Presentation, Clock, CheckCircle, Loader, ArrowRight, ArrowLeft,
    Plus, Trash2, Image, Type, Square, Circle, Play, Save,
    AlertCircle, Sparkles, Layout, Grid, Monitor, ChevronLeft, ChevronRight
} from 'lucide-react';

import { DifficultyLevel, EvaluationResult } from '../types';

interface PresentationAssessmentProps {
    skill: string;
    difficulty: DifficultyLevel;
    onComplete: (result: EvaluationResult) => void;
    onCancel?: () => void;
}

interface SlideElement {
    id: string;
    type: 'text' | 'title' | 'subtitle' | 'bullet' | 'image' | 'shape';
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
}

interface Slide {
    id: string;
    layout: 'title' | 'content' | 'two-column' | 'image-text' | 'blank';
    elements: SlideElement[];
    backgroundColor: string;
}

interface PresentationTask {
    title: string;
    description: string;
    topic: string;
    requirements: string[];
    minSlides: number;
    maxSlides: number;
    suggestedOutline: string[];
}

const SLIDE_LAYOUTS = [
    { id: 'title', name: 'Title Slide', icon: Layout },
    { id: 'content', name: 'Content', icon: Type },
    { id: 'two-column', name: 'Two Column', icon: Grid },
    { id: 'image-text', name: 'Image + Text', icon: Image },
    { id: 'blank', name: 'Blank', icon: Square },
];

const DEFAULT_COLORS = ['#1e293b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const PresentationAssessment: React.FC<PresentationAssessmentProps> = ({
    skill,
    difficulty,
    onComplete,
    onCancel
}) => {
    const [step, setStep] = useState<'loading' | 'instructions' | 'editing' | 'preview' | 'submitting' | 'results'>('loading');
    const [task, setTask] = useState<PresentationTask | null>(null);
    const [slides, setSlides] = useState<Slide[]>([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(45 * 60); // 45 minutes
    const [result, setResult] = useState<{ score: number; feedback: string; categoryScores: Record<string, number> } | null>(null);
    const [previewIndex, setPreviewIndex] = useState(0);

    // Generate task based on difficulty
    useEffect(() => {
        const generateTask = () => {
            const tasks: Record<DifficultyLevel, PresentationTask> = {
                'Beginner': {
                    title: 'Product Introduction Presentation',
                    description: 'Create a short presentation introducing a new product or service.',
                    topic: 'New Product Launch',
                    requirements: [
                        'Title slide with product name',
                        'Problem statement slide',
                        'Solution/Product overview',
                        'Key features (3-4 bullet points)',
                        'Call to action/closing slide'
                    ],
                    minSlides: 4,
                    maxSlides: 6,
                    suggestedOutline: ['Title', 'The Problem', 'Our Solution', 'Key Features', 'Get Started']
                },
                'Mid-Level': {
                    title: 'Quarterly Business Review',
                    description: 'Create a professional QBR presentation for stakeholders.',
                    topic: 'Q4 Business Review',
                    requirements: [
                        'Executive summary slide',
                        'Key metrics and KPIs',
                        'Achievements & highlights',
                        'Challenges faced and solutions',
                        'Financial overview',
                        'Goals for next quarter',
                        'Q&A slide'
                    ],
                    minSlides: 6,
                    maxSlides: 10,
                    suggestedOutline: ['Executive Summary', 'Key Metrics', 'Q4 Achievements', 'Challenges & Solutions', 'Financial Overview', 'Q1 Goals', 'Questions']
                },
                'Advanced': {
                    title: 'Investment Pitch Deck',
                    description: 'Create a compelling investor pitch deck for a startup.',
                    topic: 'Series A Funding Pitch',
                    requirements: [
                        'Company vision and mission',
                        'Market opportunity analysis',
                        'Product/service demonstration',
                        'Business model explanation',
                        'Competitive advantage',
                        'Team introduction',
                        'Financial projections',
                        'Funding ask and use of funds',
                        'Call to action'
                    ],
                    minSlides: 10,
                    maxSlides: 15,
                    suggestedOutline: ['Vision', 'The Problem', 'Our Solution', 'Market Opportunity', 'Business Model', 'Traction', 'Competition', 'Team', 'Financials', 'The Ask']
                }
            };

            setTask(tasks[difficulty]);

            // Initialize with template slides
            const templateSlides: Slide[] = [
                {
                    id: '1',
                    layout: 'title',
                    backgroundColor: '#1e3a8a',
                    elements: [
                        {
                            id: 'title-1',
                            type: 'title',
                            content: tasks[difficulty].topic,
                            x: 50,
                            y: 180,
                            width: 700,
                            height: 80,
                            fontSize: 48,
                            color: '#ffffff'
                        },
                        {
                            id: 'subtitle-1',
                            type: 'subtitle',
                            content: 'Your Name • Date',
                            x: 50,
                            y: 280,
                            width: 700,
                            height: 40,
                            fontSize: 24,
                            color: '#94a3b8'
                        }
                    ]
                },
                {
                    id: '2',
                    layout: 'content',
                    backgroundColor: '#ffffff',
                    elements: [
                        {
                            id: 'heading-2',
                            type: 'title',
                            content: 'Slide Title',
                            x: 50,
                            y: 40,
                            width: 700,
                            height: 60,
                            fontSize: 36,
                            color: '#1e3a8a'
                        },
                        {
                            id: 'content-2',
                            type: 'bullet',
                            content: '• First point\n• Second point\n• Third point',
                            x: 50,
                            y: 120,
                            width: 700,
                            height: 280,
                            fontSize: 24,
                            color: '#334155'
                        }
                    ]
                }
            ];

            setSlides(templateSlides);
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

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const addSlide = (layout: string = 'content') => {
        const newSlide: Slide = {
            id: Date.now().toString(),
            layout: layout as Slide['layout'],
            backgroundColor: '#ffffff',
            elements: [
                {
                    id: `title-${Date.now()}`,
                    type: 'title',
                    content: 'New Slide',
                    x: 50,
                    y: 40,
                    width: 700,
                    height: 60,
                    fontSize: 36,
                    color: '#1e3a8a'
                },
                {
                    id: `content-${Date.now()}`,
                    type: 'bullet',
                    content: '• Add your content here',
                    x: 50,
                    y: 120,
                    width: 700,
                    height: 280,
                    fontSize: 24,
                    color: '#334155'
                }
            ]
        };

        setSlides(prev => [...prev, newSlide]);
        setCurrentSlideIndex(slides.length);
    };

    const deleteSlide = (index: number) => {
        if (slides.length <= 1) return;
        setSlides(prev => prev.filter((_, i) => i !== index));
        if (currentSlideIndex >= slides.length - 1) {
            setCurrentSlideIndex(Math.max(0, slides.length - 2));
        }
    };

    const updateElement = (slideIndex: number, elementId: string, updates: Partial<SlideElement>) => {
        setSlides(prev => prev.map((slide, idx) => {
            if (idx !== slideIndex) return slide;
            return {
                ...slide,
                elements: slide.elements.map(el =>
                    el.id === elementId ? { ...el, ...updates } : el
                )
            };
        }));
    };

    const updateSlideBackground = (color: string) => {
        setSlides(prev => prev.map((slide, idx) =>
            idx === currentSlideIndex ? { ...slide, backgroundColor: color } : slide
        ));
    };

    const handleSubmit = () => {
        if (!task) return;
        setStep('submitting');

        setTimeout(() => {
            const slideCount = slides.length;
            const hasEnoughSlides = slideCount >= task.minSlides && slideCount <= task.maxSlides;
            const contentRichness = slides.reduce((acc, slide) => {
                return acc + slide.elements.filter(el => el.content.length > 20).length;
            }, 0);

            const structureScore = hasEnoughSlides ? 85 : 60;
            const designScore = slides.some(s => s.backgroundColor !== '#ffffff') ? 80 : 65;
            const contentScore = Math.min(100, (contentRichness / (slides.length * 2)) * 100);
            const completenessScore = (slideCount / task.minSlides) * 100;

            const overallScore = Math.round(
                (structureScore * 0.25) +
                (designScore * 0.25) +
                (contentScore * 0.25) +
                (completenessScore * 0.25)
            );

            setResult({
                score: Math.min(100, overallScore),
                feedback: overallScore >= 70
                    ? `Excellent presentation! You've created a well-structured ${slideCount}-slide deck with good visual design and content coverage.`
                    : `Your presentation has ${slideCount} slides. Consider adding more content and improving the visual design to meet professional standards.`,
                categoryScores: {
                    'Structure': Math.round(structureScore),
                    'Design': Math.round(designScore),
                    'Content': Math.round(contentScore),
                    'Completeness': Math.round(completenessScore)
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

    const currentSlide = slides[currentSlideIndex];

    if (step === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900">Preparing Presentation</h2>
                    <p className="text-gray-500">Loading {skill} assessment...</p>
                </div>
            </div>
        );
    }

    if (!task) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-orange-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Presentation className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">{task.title}</h1>
                            <p className="text-sm text-gray-500">{difficulty} Level • {slides.length}/{task.minSlides}-{task.maxSlides} slides</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {step === 'editing' && (
                            <>
                                <button
                                    onClick={() => {
                                        setPreviewIndex(0);
                                        setStep('preview');
                                    }}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition flex items-center gap-2"
                                >
                                    <Play className="w-4 h-4" />
                                    Preview
                                </button>

                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    <Clock className="w-4 h-4" />
                                    <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={slides.length < task.minSlides}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Submit
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
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
                                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Monitor className="w-8 h-8 text-orange-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
                                <p className="text-gray-600">{task.description}</p>
                            </div>

                            <div className="bg-orange-50 rounded-xl p-6 mb-6">
                                <h3 className="font-bold text-orange-900 mb-4">Presentation Requirements</h3>
                                <ul className="space-y-2">
                                    {task.requirements.map((req, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-orange-800">
                                            <CheckCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                            <span>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <h4 className="font-medium text-gray-700 mb-3">Suggested Outline</h4>
                                <div className="flex flex-wrap gap-2">
                                    {task.suggestedOutline.map((item, idx) => (
                                        <span key={idx} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
                                            {idx + 1}. {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-gray-900">{task.minSlides}-{task.maxSlides}</p>
                                    <p className="text-sm text-gray-500">Slides Required</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-gray-900">45</p>
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
                                    className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition flex items-center justify-center gap-2"
                                >
                                    Start Creating <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Editing Step */}
                    {step === 'editing' && currentSlide && (
                        <motion.div
                            key="editing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex gap-6"
                        >
                            {/* Slide Thumbnails */}
                            <div className="w-48 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {slides.map((slide, idx) => (
                                    <div
                                        key={slide.id}
                                        onClick={() => setCurrentSlideIndex(idx)}
                                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition ${idx === currentSlideIndex ? 'border-orange-500' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div
                                            className="aspect-[16/9] p-2"
                                            style={{ backgroundColor: slide.backgroundColor }}
                                        >
                                            <div className="text-[8px] truncate" style={{ color: slide.elements[0]?.color }}>
                                                {slide.elements[0]?.content || 'Untitled'}
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                                            {idx + 1}
                                        </div>
                                        {slides.length > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSlide(idx);
                                                }}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 hover:opacity-100 transition"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button
                                    onClick={() => addSlide()}
                                    className="w-full aspect-[16/9] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Main Slide Editor */}
                            <div className="flex-1">
                                {/* Slide Canvas */}
                                <div
                                    className="aspect-[16/9] rounded-xl shadow-2xl overflow-hidden relative"
                                    style={{ backgroundColor: currentSlide.backgroundColor }}
                                >
                                    {currentSlide.elements.map(element => (
                                        <div
                                            key={element.id}
                                            onClick={() => setSelectedElement(element.id)}
                                            className={`absolute cursor-pointer ${selectedElement === element.id ? 'ring-2 ring-orange-500' : ''
                                                }`}
                                            style={{
                                                left: element.x,
                                                top: element.y,
                                                width: element.width,
                                                height: element.height,
                                            }}
                                        >
                                            {element.type === 'title' && (
                                                <input
                                                    type="text"
                                                    value={element.content}
                                                    onChange={(e) => updateElement(currentSlideIndex, element.id, { content: e.target.value })}
                                                    className="w-full h-full bg-transparent font-bold focus:outline-none"
                                                    style={{
                                                        fontSize: element.fontSize,
                                                        color: element.color
                                                    }}
                                                />
                                            )}
                                            {element.type === 'subtitle' && (
                                                <input
                                                    type="text"
                                                    value={element.content}
                                                    onChange={(e) => updateElement(currentSlideIndex, element.id, { content: e.target.value })}
                                                    className="w-full h-full bg-transparent focus:outline-none"
                                                    style={{
                                                        fontSize: element.fontSize,
                                                        color: element.color
                                                    }}
                                                />
                                            )}
                                            {element.type === 'bullet' && (
                                                <textarea
                                                    value={element.content}
                                                    onChange={(e) => updateElement(currentSlideIndex, element.id, { content: e.target.value })}
                                                    className="w-full h-full bg-transparent resize-none focus:outline-none"
                                                    style={{
                                                        fontSize: element.fontSize,
                                                        color: element.color,
                                                        lineHeight: 1.8
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Toolbar */}
                                <div className="mt-4 flex items-center gap-4 bg-white rounded-xl p-3 shadow">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">Background:</span>
                                        {DEFAULT_COLORS.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => updateSlideBackground(color)}
                                                className={`w-6 h-6 rounded-full border-2 ${currentSlide.backgroundColor === color ? 'border-orange-500' : 'border-gray-200'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>

                                    <div className="w-px h-6 bg-gray-300" />

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">Layout:</span>
                                        {SLIDE_LAYOUTS.slice(0, 3).map(layout => (
                                            <button
                                                key={layout.id}
                                                onClick={() => addSlide(layout.id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg"
                                                title={`Add ${layout.name} slide`}
                                            >
                                                <layout.icon className="w-4 h-4 text-gray-600" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="w-64 space-y-4">
                                <div className="bg-white rounded-xl shadow p-4">
                                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-orange-500" />
                                        Progress
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Slides</span>
                                            <span className={slides.length >= task.minSlides ? 'text-green-600' : 'text-amber-600'}>
                                                {slides.length}/{task.minSlides}
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-orange-500 transition-all"
                                                style={{ width: `${Math.min(100, (slides.length / task.minSlides) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Tips
                                    </h4>
                                    <ul className="text-sm text-amber-700 space-y-1">
                                        <li>• Keep text concise</li>
                                        <li>• Use consistent styling</li>
                                        <li>• One main idea per slide</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Preview Step */}
                    {step === 'preview' && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
                        >
                            <button
                                onClick={() => setStep('editing')}
                                className="absolute top-4 right-4 text-white/80 hover:text-white"
                            >
                                Exit Preview (ESC)
                            </button>

                            <div
                                className="w-[80vw] aspect-[16/9] rounded-lg overflow-hidden relative"
                                style={{ backgroundColor: slides[previewIndex]?.backgroundColor }}
                            >
                                {slides[previewIndex]?.elements.map(element => (
                                    <div
                                        key={element.id}
                                        className="absolute"
                                        style={{
                                            left: `${(element.x / 800) * 100}%`,
                                            top: `${(element.y / 450) * 100}%`,
                                            width: `${(element.width / 800) * 100}%`,
                                            fontSize: `${element.fontSize! * 1.5}px`,
                                            color: element.color,
                                            whiteSpace: 'pre-wrap'
                                        }}
                                    >
                                        {element.content}
                                    </div>
                                ))}
                            </div>

                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
                                <button
                                    onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                                    disabled={previewIndex === 0}
                                    className="p-3 bg-white/20 rounded-full text-white disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <span className="text-white font-medium">
                                    {previewIndex + 1} / {slides.length}
                                </span>
                                <button
                                    onClick={() => setPreviewIndex(Math.min(slides.length - 1, previewIndex + 1))}
                                    disabled={previewIndex === slides.length - 1}
                                    className="p-3 bg-white/20 rounded-full text-white disabled:opacity-50"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
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
                            <Loader className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Evaluating Presentation</h2>
                            <p className="text-gray-600">Analyzing structure, design, and content...</p>
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
                                <p className="text-gray-600">{slides.length} slides created</p>
                            </div>

                            {/* Category Scores */}
                            <div className="grid grid-cols-4 gap-2 mb-8">
                                {Object.entries(result.categoryScores).map(([category, score]) => (
                                    <div key={category} className={`rounded-xl p-3 text-center ${getScoreColor(Number(score))}`}>
                                        <p className="text-lg font-bold">{score}</p>
                                        <p className="text-xs">{category}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 mb-8">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-orange-500" />
                                    Feedback
                                </h3>
                                <p className="text-gray-700">{result.feedback}</p>
                            </div>

                            <button
                                onClick={handleComplete}
                                className="w-full px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition"
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

export default PresentationAssessment;
