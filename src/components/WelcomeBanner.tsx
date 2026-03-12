import React from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles, ArrowRight, CheckCircle, Circle,
    Target, Award, Video, User, Rocket, X,
    ChevronRight, TrendingUp
} from 'lucide-react';
import { onboardingService, OnboardingProgress } from '../services/onboardingService';

interface WelcomeBannerProps {
    userName: string;
    userRole: 'candidate' | 'employer';
    onStartTour?: () => void;
    onDismiss?: () => void;
    className?: string;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
    userName,
    userRole,
    onStartTour,
    onDismiss,
    className = ''
}) => {
    const progress = onboardingService.getProgress();
    const completionPercentage = onboardingService.getCompletionPercentage();
    const nextAction = onboardingService.getNextRecommendedAction();
    const firstName = userName.split(' ')[0];

    // Greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative bg-gradient-to-r from-teal via-darkblue to-slate-900 rounded-3xl p-6 md:p-8 text-white overflow-hidden ${className}`}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal rounded-full blur-3xl" />
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }} />
            </div>

            {/* Dismiss Button */}
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition text-white/60 hover:text-white"
                >
                    <X size={18} />
                </button>
            )}

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center gap-2 mb-2"
                        >
                            <Sparkles className="text-orange" size={20} />
                            <span className="text-orange font-medium text-sm">
                                {userRole === 'candidate' ? 'Candidate Dashboard' : 'Employer Dashboard'}
                            </span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className="text-2xl md:text-3xl font-bold"
                        >
                            {getGreeting()}, {firstName}! 👋
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-white/70 mt-1"
                        >
                            {userRole === 'candidate'
                                ? "Let's build your verified profile and get you noticed!"
                                : "Discover verified talent and make confident hiring decisions!"}
                        </motion.p>
                    </div>

                    {/* Progress Circle */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 }}
                        className="flex items-center gap-4"
                    >
                        <div className="relative w-20 h-20">
                            {/* Background Circle */}
                            <svg className="w-full h-full -rotate-90">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="35"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="6"
                                />
                                <motion.circle
                                    cx="40"
                                    cy="40"
                                    r="35"
                                    fill="none"
                                    stroke="url(#progressGradient)"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 35}`}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 35 }}
                                    animate={{
                                        strokeDashoffset: 2 * Math.PI * 35 * (1 - completionPercentage / 100)
                                    }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                                <defs>
                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#E9C46A" />
                                        <stop offset="100%" stopColor="#0A9396" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-bold">{completionPercentage}%</span>
                                <span className="text-xs text-white/60">Complete</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Progress Steps */}
                {userRole === 'candidate' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6"
                    >
                        <ProgressStep
                            icon={<Rocket size={16} />}
                            label="Tour"
                            completed={progress.tourCompleted}
                        />
                        <ProgressStep
                            icon={<User size={16} />}
                            label="Profile"
                            completed={progress.profileCompleted}
                        />
                        <ProgressStep
                            icon={<Target size={16} />}
                            label="Assessment"
                            completed={progress.firstAssessmentTaken}
                        />
                        <ProgressStep
                            icon={<Award size={16} />}
                            label="Certificate"
                            completed={progress.firstCertificateEarned}
                        />
                        <ProgressStep
                            icon={<Video size={16} />}
                            label="Video"
                            completed={progress.videoUploaded}
                        />
                    </motion.div>
                )}

                {/* Next Action CTA */}
                {nextAction && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-orange rounded-xl flex items-center justify-center flex-shrink-0">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">{nextAction.title}</h3>
                                <p className="text-white/60 text-xs">{nextAction.description}</p>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                if (nextAction.action === 'complete_tour' && onStartTour) {
                                    onStartTour();
                                }
                            }}
                            className="flex items-center justify-center gap-2 bg-white text-slate-900 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-100 transition shadow-lg flex-shrink-0"
                        >
                            {nextAction.action === 'complete_tour' ? 'Start Tour' : 'Continue'}
                            <ChevronRight size={16} />
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

// Progress Step Sub-component
const ProgressStep: React.FC<{
    icon: React.ReactNode;
    label: string;
    completed: boolean;
}> = ({ icon, label, completed }) => (
    <div className={`flex items-center gap-2 p-2 rounded-lg transition ${completed ? 'bg-white/20' : 'bg-white/5'
        }`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${completed ? 'bg-green-500 text-white' : 'bg-white/20 text-white/60'
            }`}>
            {completed ? <CheckCircle size={14} /> : icon}
        </div>
        <span className={`text-xs font-medium ${completed ? 'text-white' : 'text-white/60'
            }`}>
            {label}
        </span>
    </div>
);

// Compact version for smaller spaces
interface CompactProgressProps {
    className?: string;
}

export const CompactOnboardingProgress: React.FC<CompactProgressProps> = ({ className = '' }) => {
    const completionPercentage = onboardingService.getCompletionPercentage();
    const nextAction = onboardingService.getNextRecommendedAction();

    if (completionPercentage === 100 || !nextAction) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`bg-gradient-to-r from-teal/10 to-orange/10 border border-teal/20 rounded-xl p-4 ${className}`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Getting Started</span>
                <span className="text-xs text-teal font-bold">{completionPercentage}% Complete</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-teal to-orange rounded-full"
                />
            </div>

            {/* Next Step */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Circle className="text-orange" size={14} />
                    <span className="text-xs text-slate-600">Next: {nextAction.title}</span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-xs text-teal font-semibold hover:underline flex items-center gap-1"
                >
                    Continue <ArrowRight size={12} />
                </motion.button>
            </div>
        </motion.div>
    );
};

export default WelcomeBanner;
