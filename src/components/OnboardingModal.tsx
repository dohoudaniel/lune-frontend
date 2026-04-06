import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ArrowRight, ArrowLeft, Sparkles, CheckCircle,
    Code, Briefcase, Award, Upload, Target, Rocket
} from 'lucide-react';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    userRole: 'candidate' | 'employer';
}

type Step = 'welcome' | 'profile' | 'role-setup' | 'complete';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
    isOpen,
    onClose,
    onComplete,
    userRole
}) => {
    const [currentStep, setCurrentStep] = useState<Step>('welcome');
    const [candidateData, setCandidateData] = useState({
        title: '',
        location: '',
        bio: ''
    });
    const [employerData, setEmployerData] = useState({
        companyName: '',
        industry: ''
    });

    const handleNext = () => {
        if (currentStep === 'welcome') {
            setCurrentStep('profile');
        } else if (currentStep === 'profile') {
            setCurrentStep('role-setup');
        } else if (currentStep === 'role-setup') {
            setCurrentStep('complete');
        }
    };

    const handlePrev = () => {
        if (currentStep === 'profile') {
            setCurrentStep('welcome');
        } else if (currentStep === 'role-setup') {
            setCurrentStep('profile');
        }
    };

    const handleSkip = () => {
        setCurrentStep('complete');
    };

    const handleComplete = () => {
        onComplete();
        onClose();
    };

    const renderWelcomeStep = () => (
        <div className="text-center space-y-6">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <Sparkles className="mx-auto text-orange mb-4" size={48} />
                <h2 className="text-3xl font-bold text-slate-900">Welcome to Lune! 🚀</h2>
            </motion.div>

            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-4 text-left"
            >
                <p className="text-slate-600 text-lg leading-relaxed">
                    {userRole === 'candidate'
                        ? "You're now part of Lune's community of verified professionals. In just a few minutes, we'll help you set up your profile and get ready to showcase your skills."
                        : "Welcome to Lune's talent marketplace! Let's set up your employer account so you can start discovering and connecting with verified professionals."}
                </p>

                <div className="bg-gradient-to-r from-orange/10 to-teal/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="text-orange flex-shrink-0 mt-0.5" size={20} />
                        <span className="text-slate-700">
                            {userRole === 'candidate'
                                ? 'Complete your profile to showcase your expertise'
                                : 'Set up your company details'}
                        </span>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle className="text-teal flex-shrink-0 mt-0.5" size={20} />
                        <span className="text-slate-700">
                            {userRole === 'candidate'
                                ? 'Choose your first skill to get assessed'
                                : 'Browse and connect with top talent'}
                        </span>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle className="text-purple-500 flex-shrink-0 mt-0.5" size={20} />
                        <span className="text-slate-700">
                            {userRole === 'candidate'
                                ? 'Get certified and stand out to employers'
                                : 'Build your team with verified professionals'}
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );

    const renderProfileStep = () => (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {userRole === 'candidate' ? 'Tell us about yourself' : 'Tell us about your company'}
                </h2>
                <p className="text-slate-600">This helps employers find you</p>
            </motion.div>

            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
            >
                {userRole === 'candidate' ? (
                    <>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Professional Title
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Senior Frontend Developer"
                                value={candidateData.title}
                                onChange={(e) => setCandidateData({ ...candidateData, title: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange/20 focus:border-orange outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Location
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., San Francisco, CA"
                                value={candidateData.location}
                                onChange={(e) => setCandidateData({ ...candidateData, location: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange/20 focus:border-orange outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Bio (optional)
                            </label>
                            <textarea
                                placeholder="Share a bit about your experience and goals..."
                                value={candidateData.bio}
                                onChange={(e) => setCandidateData({ ...candidateData, bio: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange/20 focus:border-orange outline-none transition-all resize-none"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Company Name
                            </label>
                            <input
                                type="text"
                                placeholder="Your company name"
                                value={employerData.companyName}
                                onChange={(e) => setEmployerData({ ...employerData, companyName: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Industry
                            </label>
                            <select
                                value={employerData.industry}
                                onChange={(e) => setEmployerData({ ...employerData, industry: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
                            >
                                <option value="">Select an industry</option>
                                <option value="Technology">Technology</option>
                                <option value="Finance">Finance</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="Retail">Retail</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Education">Education</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </>
                )}
            </motion.div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-blue-900">
                    You can update these details anytime in your profile settings
                </p>
            </div>
        </div>
    );

    const renderRoleSetupStep = () => (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {userRole === 'candidate' ? 'Ready to get verified?' : 'Start hiring today'}
                </h2>
                <p className="text-slate-600">
                    {userRole === 'candidate'
                        ? 'Choose your first skill to take an assessment'
                        : 'Browse verified talent and post your first job'}
                </p>
            </motion.div>

            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
            >
                {userRole === 'candidate' ? (
                    <div className="bg-gradient-to-br from-orange/10 to-orange/5 border border-orange/20 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <Code className="text-orange" size={24} />
                            <div>
                                <h3 className="font-semibold text-slate-900">Choose Your First Skill</h3>
                                <p className="text-sm text-slate-600">Select from 50+ technical domains</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-700 ml-9">
                            Popular: Frontend, Backend, React, Python, DevOps, AI/ML, and more
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="bg-gradient-to-br from-teal/10 to-teal/5 border border-teal/20 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-3">
                                <Briefcase className="text-teal" size={24} />
                                <div>
                                    <h3 className="font-semibold text-slate-900">Browse Talent</h3>
                                    <p className="text-sm text-slate-600">Find verified professionals</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-3">
                                <Target className="text-purple-500" size={24} />
                                <div>
                                    <h3 className="font-semibold text-slate-900">Post a Job</h3>
                                    <p className="text-sm text-slate-600">Attract top talent to your team</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );

    const renderCompleteStep = () => (
        <div className="text-center space-y-6">
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
            >
                <div className="w-20 h-20 bg-gradient-to-br from-orange to-teal rounded-full flex items-center justify-center mx-auto mb-4">
                    <Rocket className="text-white" size={40} />
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
            >
                <h2 className="text-3xl font-bold text-slate-900">You're all set! 🎉</h2>
                <p className="text-slate-600 text-lg">
                    {userRole === 'candidate'
                        ? "Your profile is ready. Start by taking your first assessment to get verified!"
                        : "Your employer account is ready. Let's find the perfect talent for your team!"}
                </p>

                <div className="bg-gradient-to-r from-orange/5 to-teal/5 border border-orange/10 rounded-lg p-4 text-left">
                    <p className="text-sm text-slate-700">
                        <span className="font-semibold">Pro tip:</span> {' '}
                        {userRole === 'candidate'
                            ? "Complete your profile picture and add your skills to increase your visibility to employers."
                            : "Explore our talent pool and set up your first job posting to start receiving applications from verified professionals."}
                    </p>
                </div>
            </motion.div>
        </div>
    );

    const stepContent = {
        welcome: renderWelcomeStep(),
        profile: renderProfileStep(),
        'role-setup': renderRoleSetupStep(),
        complete: renderCompleteStep()
    };

    const stepTitles = {
        welcome: 'Welcome',
        profile: 'Profile',
        'role-setup': 'Get Started',
        complete: 'Complete'
    };

    const currentStepIndex = ['welcome', 'profile', 'role-setup', 'complete'].indexOf(currentStep);
    const totalSteps = 4;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between">
                                <h3 className="text-white font-semibold">{stepTitles[currentStep]}</h3>
                                <button
                                    onClick={onClose}
                                    className="text-white/60 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Progress */}
                            <div className="px-6 pt-6 pb-4">
                                <div className="flex gap-2">
                                    {[0, 1, 2, 3].map((index) => (
                                        <div
                                            key={index}
                                            className={`h-1 flex-1 rounded-full transition-all ${
                                                index <= currentStepIndex
                                                    ? 'bg-gradient-to-r from-orange to-teal'
                                                    : 'bg-slate-200'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Step {currentStepIndex + 1} of {totalSteps}
                                </p>
                            </div>

                            {/* Content */}
                            <div className="px-6 py-6 max-h-96 overflow-y-auto">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {stepContent[currentStep]}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between gap-3 border-t border-slate-100">
                                <button
                                    onClick={currentStep === 'welcome' ? onClose : handlePrev}
                                    className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    {currentStep === 'welcome' ? 'Skip' : 'Back'}
                                </button>

                                <div className="flex gap-2">
                                    {currentStep === 'welcome' && (
                                        <button
                                            onClick={handleSkip}
                                            className="px-4 py-2 text-slate-600 text-sm hover:text-slate-900 transition-colors"
                                        >
                                            Skip for now
                                        </button>
                                    )}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={currentStep === 'complete' ? handleComplete : handleNext}
                                        className="px-6 py-2 bg-gradient-to-r from-orange to-teal text-white font-semibold rounded-lg flex items-center gap-2 hover:shadow-lg transition-all"
                                    >
                                        {currentStep === 'complete' ? 'Get Started' : 'Next'}
                                        {currentStep !== 'complete' && <ArrowRight size={16} />}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// Icon component needed for profile step
const Info = ({ className, size }: { className?: string; size?: number }) => (
    <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
    >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);
