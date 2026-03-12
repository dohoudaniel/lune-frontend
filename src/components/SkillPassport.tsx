import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Award, TrendingUp, TrendingDown, Target, Briefcase, MapPin,
    Star, BookOpen, ExternalLink, Loader, RefreshCw, ChevronRight,
    CheckCircle, AlertTriangle, Sparkles, Zap, BarChart3, X, Play,
    ShieldCheck, Clock, Video
} from 'lucide-react';
import {
    generateSkillPassport,
    SkillPassportAnalysis,
    AssessmentHistoryItem,
    CertificationItem
} from '../services/geminiService';
import { CandidateProfile } from '../types';

interface SkillPassportProps {
    candidate: CandidateProfile;
    assessmentHistory?: AssessmentHistoryItem[];
    certifications?: CertificationItem[];
    onViewJob?: (job: SkillPassportAnalysis['opportunities'][0]) => void;
}

interface SelectedSkillDetail {
    skill: string;
    score: number;
    category: string;
    evidence: string;
    assessmentDate?: string;
    blockchainHash?: string;
}

export const SkillPassport: React.FC<SkillPassportProps> = ({
    candidate,
    assessmentHistory = [],
    certifications = [],
    onViewJob
}) => {
    const [passport, setPassport] = useState<SkillPassportAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'overview' | 'strengths' | 'weaknesses' | 'opportunities'>('overview');
    const [selectedSkill, setSelectedSkill] = useState<SelectedSkillDetail | null>(null);

    // Generate passport on mount or when data changes
    const generatePassport = async () => {
        setLoading(true);
        setError(null);

        try {
            // Convert candidate skills to assessment history if not provided
            const history: AssessmentHistoryItem[] = assessmentHistory.length > 0
                ? assessmentHistory
                : Object.entries(candidate.skills).map(([skill, score]) => ({
                    skill,
                    score: score as number,
                    passed: (score as number) >= 70,
                    difficulty: (score as number) >= 85 ? 'Advanced' : (score as number) >= 70 ? 'Mid-Level' : 'Beginner',
                    completedAt: new Date().toISOString(),
                    category: 'general'
                }));

            // Convert certifications
            const certs: CertificationItem[] = certifications.length > 0
                ? certifications
                : candidate.certifications.map(cert => {
                    let skillName = 'Verified Skill';
                    let hash: string = cert;
                    let date = new Date().toISOString();

                    try {
                        const parsed = JSON.parse(cert);
                        if (parsed.skill) skillName = parsed.skill;
                        if (parsed.hash) hash = parsed.hash;
                        if (parsed.date) date = parsed.date;
                    } catch (e) {
                        // Original string format
                    }

                    return {
                        skill: skillName,
                        score: 85,
                        issuedAt: date,
                        blockchainHash: hash
                    };
                });

            const result = await generateSkillPassport(history, certs, candidate.name);
            setPassport(result);
        } catch (err) {
            setError('Failed to generate Skill Passport. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generatePassport();
    }, []);

    const getScoreColor = (score: number) => {
        if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
        if (score >= 60) return { text: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' };
        return { text: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' };
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <Loader className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Generating Your Skill Passport</h3>
                <p className="text-gray-500">Analyzing your assessments and certifications...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Generate Passport</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <button
                    onClick={generatePassport}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2 mx-auto"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        );
    }

    if (!passport) return null;

    const handleSkillClick = (strength: typeof passport.strengths[0]) => {
        // Find corresponding assessment data
        const assessment = assessmentHistory.find(a => a.skill === strength.skill);
        const cert = certifications.find(c => c.skill === strength.skill);

        setSelectedSkill({
            skill: strength.skill,
            score: strength.score,
            category: strength.category,
            evidence: strength.evidence,
            assessmentDate: assessment?.completedAt || cert?.issuedAt,
            blockchainHash: cert?.blockchainHash
        });
    };

    // Skill Detail Modal Component
    const SkillDetailModal = () => {
        if (!selectedSkill) return null;

        const scoreColors = getScoreColor(selectedSkill.score);

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setSelectedSkill(null)}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white relative">
                        <button
                            onClick={() => setSelectedSkill(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-xl font-bold">{selectedSkill.skill}</h2>
                                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                                        Verified
                                    </span>
                                </div>
                                <p className="text-green-100 text-sm">{selectedSkill.category}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5">
                        {/* Score Display */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Assessment Score</p>
                                <p className={`text-3xl font-bold ${scoreColors.text}`}>{selectedSkill.score}%</p>
                            </div>
                            <div className={`w-16 h-16 ${scoreColors.bg} rounded-full flex items-center justify-center`}>
                                <CheckCircle className={`w-8 h-8 ${scoreColors.text}`} />
                            </div>
                        </div>

                        {/* Assessment Details */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900">AI Assessment Summary</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{selectedSkill.evidence}</p>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-3">
                            {selectedSkill.assessmentDate && (
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-medium">Completed</span>
                                    </div>
                                    <p className="text-blue-800 font-semibold text-sm">
                                        {new Date(selectedSkill.assessmentDate).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                            {selectedSkill.blockchainHash && (
                                <div className="p-3 bg-purple-50 rounded-xl">
                                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span className="text-xs font-medium">Blockchain Hash</span>
                                    </div>
                                    <p className="text-purple-800 font-mono text-xs truncate" title={selectedSkill.blockchainHash}>
                                        {selectedSkill.blockchainHash.slice(0, 16)}...
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* View Recording Button (placeholder) */}
                        <button className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg">
                            <Video className="w-5 h-5" />
                            View Assessment Recording
                        </button>

                        <p className="text-xs text-gray-400 text-center">
                            This skill has been verified through AI-proctored assessment
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Skill Detail Modal */}
            <AnimatePresence>
                {selectedSkill && <SkillDetailModal />}
            </AnimatePresence>

            {/* Header Card */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                            <Award className="w-4 h-4" />
                            Skill Passport
                        </div>
                        <h2 className="text-2xl font-bold mb-1">{candidate.name}</h2>
                        <p className="text-white/70">{passport.overallProfile?.summary || "Skill passport verified."}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <span className="text-3xl font-bold">{passport.overallProfile?.readinessScore || 75}</span>
                            </div>
                            <p className="text-xs text-white/70 mt-1">Readiness Score</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'strengths', label: 'Strengths', icon: TrendingUp },
                    { id: 'weaknesses', label: 'Growth Areas', icon: TrendingDown },
                    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition ${activeSection === tab.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Sections */}
            <AnimatePresence mode="wait">
                {activeSection === 'overview' && (
                    <motion.div
                        key="overview"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0 }}
                        className="grid md:grid-cols-2 gap-6"
                    >
                        {/* Quick Stats */}
                        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-500" />
                                Profile Highlights
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                                    <span className="text-green-700 font-medium">Top Category</span>
                                    <span className="text-green-800 font-bold">{passport.overallProfile?.topCategory || "General"}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                                    <span className="text-blue-700 font-medium">Verified Skills</span>
                                    <span className="text-blue-800 font-bold">{passport.strengths.length}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                                    <span className="text-purple-700 font-medium">Certifications</span>
                                    <span className="text-purple-800 font-bold">{certifications.length || candidate.certifications.length}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Growth Areas */}
                        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-500" />
                                Focus Areas
                            </h3>
                            <div className="space-y-3">
                                {(passport.overallProfile?.growthAreas || []).map((area, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                            <span className="text-amber-600 font-bold text-sm">{idx + 1}</span>
                                        </div>
                                        <span className="text-gray-700 font-medium">{area}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Top Strength Preview */}
                        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                    Top Skills
                                </h3>
                                <button
                                    onClick={() => setActiveSection('strengths')}
                                    className="text-indigo-600 text-sm font-medium hover:text-indigo-700 flex items-center gap-1"
                                >
                                    View All <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                {passport.strengths.slice(0, 3).map((strength, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-green-50 rounded-xl p-4 border border-green-100 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
                                        onClick={() => handleSkillClick(strength)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-green-800">{strength.skill}</span>
                                            <span className={`text-lg font-bold ${getScoreColor(strength.score).text}`}>
                                                {strength.score}
                                            </span>
                                        </div>
                                        <p className="text-green-700 text-sm">{strength.evidence}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {activeSection === 'strengths' && (
                    <motion.div
                        key="strengths"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {passport.strengths.map((strength, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-lg hover:border-green-200 transition-all"
                                onClick={() => handleSkillClick(strength)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">{strength.skill}</h4>
                                            <p className="text-gray-500 text-sm mb-2">{strength.category}</p>
                                            <p className="text-gray-600">{strength.evidence}</p>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl ${getScoreColor(strength.score).bg}`}>
                                        <span className={`text-2xl font-bold ${getScoreColor(strength.score).text}`}>
                                            {strength.score}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeSection === 'weaknesses' && (
                    <motion.div
                        key="weaknesses"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {passport.weaknesses.map((weakness, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-gray-900 text-lg">{weakness.skill}</h4>
                                            <div className={`px-3 py-1 rounded-lg ${getScoreColor(weakness.score).bg}`}>
                                                <span className={`font-bold ${getScoreColor(weakness.score).text}`}>
                                                    {weakness.score}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-gray-500 text-sm">{weakness.category}</p>
                                    </div>
                                </div>

                                <div className="bg-amber-50 rounded-xl p-4 mb-4">
                                    <h5 className="font-medium text-amber-800 mb-2">Recommendation</h5>
                                    <p className="text-amber-700">{weakness.recommendation}</p>
                                </div>

                                <div>
                                    <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        Suggested Resources
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {weakness.resources.map((resource, rIdx) => (
                                            <span
                                                key={rIdx}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm flex items-center gap-1"
                                            >
                                                {resource}
                                                <ExternalLink className="w-3 h-3" />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeSection === 'opportunities' && (
                    <motion.div
                        key="opportunities"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {passport.opportunities.map((opp, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition cursor-pointer"
                                onClick={() => onViewJob?.(opp)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg">{opp.jobTitle}</h4>
                                        <p className="text-gray-500">{opp.company}</p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl ${getScoreColor(opp.matchScore).bg} ${getScoreColor(opp.matchScore).border} border`}>
                                        <div className="flex items-center gap-1">
                                            <Star className={`w-4 h-4 ${getScoreColor(opp.matchScore).text}`} fill="currentColor" />
                                            <span className={`font-bold ${getScoreColor(opp.matchScore).text}`}>
                                                {opp.matchScore}% Match
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-600 mb-4">{opp.reason}</p>

                                <div className="flex flex-wrap gap-3">
                                    <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                                        {opp.salaryRange}
                                    </span>
                                    <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {opp.location}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Refresh Button */}
            <div className="text-center">
                <button
                    onClick={generatePassport}
                    disabled={loading}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-2 mx-auto"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Passport
                </button>
            </div>
        </div>
    );
};

export default SkillPassport;
