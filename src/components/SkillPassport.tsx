import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Award, TrendingUp, TrendingDown, Target, Briefcase, MapPin,
    Star, BookOpen, ExternalLink, Loader, RefreshCw, ChevronRight,
    CheckCircle, AlertTriangle, Sparkles, Zap, BarChart3, X,
    ShieldCheck, Clock, ArrowLeft, Download, Share2, Users,
    Globe, DollarSign, Lightbulb, ChevronUp
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
    onBack?: () => void;
}

interface SelectedSkillDetail {
    skill: string;
    score: number;
    category: string;
    evidence: string;
    assessmentDate?: string;
    certificateId?: string;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Safe array helper — prevents crashes when backend returns undefined
const safeArr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

export const SkillPassport: React.FC<SkillPassportProps> = ({
    candidate,
    assessmentHistory = [],
    certifications = [],
    onViewJob,
    onBack,
}) => {
    const CACHE_KEY = `lune_skill_passport_${candidate.id}`;

    const [passport, setPassport] = useState<SkillPassportAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'overview' | 'strengths' | 'growth' | 'opportunities'>('overview');
    const [selectedSkill, setSelectedSkill] = useState<SelectedSkillDetail | null>(null);

    const runGenerate = async () => {
        setLoading(true);
        setError(null);

        try {
            const history: AssessmentHistoryItem[] = assessmentHistory.length > 0
                ? assessmentHistory
                : Object.entries(candidate.skills || {}).map(([skill, score]) => ({
                    skill,
                    score: score as number,
                    passed: (score as number) >= 70,
                    difficulty: (score as number) >= 85 ? 'Advanced' : (score as number) >= 70 ? 'Mid-Level' : 'Beginner',
                    completedAt: new Date().toISOString(),
                    category: 'general',
                }));

            const certs: CertificationItem[] = certifications.length > 0
                ? certifications
                : (candidate.certifications || []).map(cert => {
                    let skillName = 'Verified Skill';
                    let hash: string = cert;
                    let date = new Date().toISOString();
                    try {
                        const parsed = JSON.parse(cert);
                        if (parsed.skill) skillName = parsed.skill;
                        if (parsed.hash) hash = parsed.hash;
                        if (parsed.date) date = parsed.date;
                    } catch (_) { /* plain string — use as-is */ }
                    return { skill: skillName, score: 85, issuedAt: date, certificateId: hash };
                });

            const result = await generateSkillPassport(history, certs, candidate.name);

            // Normalise to safe arrays so renders never crash
            const safe: SkillPassportAnalysis = {
                strengths: safeArr(result?.strengths),
                weaknesses: safeArr(result?.weaknesses),
                opportunities: safeArr(result?.opportunities),
                overallProfile: result?.overallProfile ?? {
                    summary: '',
                    readinessScore: 0,
                    topCategory: '',
                    growthAreas: [],
                },
            };
            safe.overallProfile.growthAreas = safeArr(safe.overallProfile.growthAreas);

            setPassport(safe);
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: safe, timestamp: Date.now() }));
        } catch (err) {
            setError('Failed to generate Skill Passport. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_TTL) {
                    // Apply same normalisation to cached data
                    const safe: SkillPassportAnalysis = {
                        strengths: safeArr(data?.strengths),
                        weaknesses: safeArr(data?.weaknesses),
                        opportunities: safeArr(data?.opportunities),
                        overallProfile: data?.overallProfile ?? { summary: '', readinessScore: 0, topCategory: '', growthAreas: [] },
                    };
                    safe.overallProfile.growthAreas = safeArr(safe.overallProfile.growthAreas);
                    setPassport(safe);
                    return;
                }
            } catch { /* invalid cache */ }
        }
        runGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRefresh = () => {
        localStorage.removeItem(CACHE_KEY);
        runGenerate();
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-400' };
        if (score >= 60) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-400' };
        return { text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-400' };
    };

    const getScoreLabel = (score: number) => {
        if (score >= 90) return 'Expert';
        if (score >= 75) return 'Proficient';
        if (score >= 60) return 'Developing';
        return 'Beginner';
    };

    const ScoreRing: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({ score, size = 'md' }) => {
        const dim = size === 'lg' ? 88 : size === 'md' ? 64 : 44;
        const r = (dim / 2) - 6;
        const circ = 2 * Math.PI * r;
        const dash = (score / 100) * circ;
        const colors = getScoreColor(score);
        return (
            <div className="relative inline-flex items-center justify-center" style={{ width: dim, height: dim }}>
                <svg width={dim} height={dim} className="-rotate-90">
                    <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={size === 'lg' ? 8 : 6} />
                    <circle cx={dim / 2} cy={dim / 2} r={r} fill="none"
                        stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
                        strokeWidth={size === 'lg' ? 8 : 6}
                        strokeDasharray={`${dash} ${circ}`}
                        strokeLinecap="round"
                    />
                </svg>
                <span className={`absolute font-bold ${size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-base' : 'text-xs'} ${colors.text}`}>
                    {score}
                </span>
            </div>
        );
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    };
    const containerVariants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.07 } },
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <img src="/icons/icon.svg" alt="Lune" className="w-20 h-20 rounded-2xl shadow-lg" />
                        <div className="absolute -inset-2 rounded-[28px] border-[3px] border-teal/20 border-t-teal animate-spin" style={{ animationDuration: '1s' }} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Generating Your Skill Passport</h3>
                    <p className="text-slate-500">Analysing your assessments and building your profile…</p>
                </div>
            </div>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
                    <AlertTriangle className="w-14 h-14 text-orange mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Unable to Generate Passport</h3>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <button
                        onClick={runGenerate}
                        className="px-6 py-3 bg-teal text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center gap-2 mx-auto"
                    >
                        <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!passport) return null;

    const profile = passport.overallProfile;
    const strengths = safeArr(passport.strengths);
    const weaknesses = safeArr(passport.weaknesses);
    const opportunities = safeArr(passport.opportunities);
    const growthAreas = safeArr(profile?.growthAreas);
    const readiness = profile?.readinessScore ?? 0;

    const handleSkillClick = (s: typeof strengths[0]) => {
        const a = assessmentHistory.find(x => x.skill === s.skill);
        const c = certifications.find(x => x.skill === s.skill);
        setSelectedSkill({
            skill: s.skill,
            score: s.score,
            category: s.category,
            evidence: s.evidence,
            assessmentDate: a?.completedAt || c?.issuedAt,
            certificateId: c?.certificateId,
        });
    };

    // ── Skill Detail Modal ────────────────────────────────────────────────────
    const SkillDetailModal = () => {
        if (!selectedSkill) return null;
        const colors = getScoreColor(selectedSkill.score);
        return (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setSelectedSkill(null)}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="bg-gradient-to-r from-teal to-teal/80 p-6 text-white relative">
                        <button onClick={() => setSelectedSkill(null)} className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-full transition">
                            <X size={18} />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">{selectedSkill.skill}</h2>
                                <p className="text-white/70 text-sm">{selectedSkill.category}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                            <div>
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Score</p>
                                <p className={`text-4xl font-bold ${colors.text}`}>{selectedSkill.score}</p>
                                <p className={`text-xs font-semibold mt-0.5 ${colors.text}`}>{getScoreLabel(selectedSkill.score)}</p>
                            </div>
                            <ScoreRing score={selectedSkill.score} size="lg" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-1 text-sm">Evidence</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{selectedSkill.evidence}</p>
                        </div>
                        {selectedSkill.assessmentDate && (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Clock className="w-3.5 h-3.5" />
                                Assessed {new Date(selectedSkill.assessmentDate).toLocaleDateString()}
                            </div>
                        )}
                        <p className="text-xs text-gray-400 text-center pt-2">Verified through AI-proctored assessment</p>
                    </div>
                </motion.div>
            </motion.div>
        );
    };

    // ── Page ──────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50">
            <AnimatePresence>{selectedSkill && <SkillDetailModal />}</AnimatePresence>

            {/* ── Hero Header ─────────────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-slate-900 via-teal/90 to-teal relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
                    {/* Back / actions row */}
                    <div className="flex items-center justify-between mb-8">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition"
                            >
                                <ArrowLeft size={16} /> Back to Dashboard
                            </button>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                title="Regenerate passport"
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Identity + score */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                        {/* Avatar placeholder */}
                        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white backdrop-blur-sm flex-shrink-0">
                            {candidate.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-teal/30 border border-white/20 rounded-full text-xs text-white font-medium">
                                    Skill Passport
                                </span>
                                <span className="px-2 py-0.5 bg-green-500/20 border border-green-400/30 rounded-full text-xs text-green-300 font-medium flex items-center gap-1">
                                    <CheckCircle size={10} /> Verified
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-1">{candidate.name}</h1>
                            <p className="text-white/70 max-w-xl text-sm leading-relaxed">
                                {profile?.summary || 'AI-verified skill passport based on proctored assessments and certifications.'}
                            </p>
                        </div>

                        {/* Readiness score */}
                        <div className="flex-shrink-0 text-center">
                            <div className="w-28 h-28 bg-white/10 rounded-full flex flex-col items-center justify-center backdrop-blur-sm border border-white/20">
                                <span className="text-4xl font-bold text-white">{readiness}</span>
                                <span className="text-white/60 text-xs mt-0.5">/ 100</span>
                            </div>
                            <p className="text-white/70 text-xs mt-2 font-medium">Readiness Score</p>
                        </div>
                    </div>

                    {/* Quick stats bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Verified Skills', value: strengths.length, icon: ShieldCheck, color: 'text-green-400' },
                            { label: 'Top Category', value: profile?.topCategory || '—', icon: Zap, color: 'text-yellow-400' },
                            { label: 'Certifications', value: (certifications.length || candidate.certifications?.length || 0), icon: Award, color: 'text-blue-400' },
                            { label: 'Opportunities', value: opportunities.length, icon: Briefcase, color: 'text-purple-400' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                    <span className="text-white/60 text-xs">{stat.label}</span>
                                </div>
                                <p className="text-white font-bold text-lg">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tab bar */}
                <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="flex gap-1 border-b border-white/10">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'strengths', label: `Skills (${strengths.length})`, icon: TrendingUp },
                            { id: 'growth', label: `Growth Areas`, icon: Target },
                            { id: 'opportunities', label: `Jobs (${opportunities.length})`, icon: Briefcase },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id as any)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
                                    activeSection === tab.id
                                        ? 'border-white text-white'
                                        : 'border-transparent text-white/50 hover:text-white/80'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.icon.displayName || tab.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Content ──────────────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <AnimatePresence mode="wait">

                    {/* ── Overview ─────────────────────────────────────────── */}
                    {activeSection === 'overview' && (
                        <motion.div
                            key="overview"
                            variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}
                            className="grid md:grid-cols-2 gap-6"
                        >
                            {/* Top Skills preview */}
                            <motion.div variants={itemVariants} className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-emerald-500" /> Top Verified Skills
                                    </h3>
                                    <button onClick={() => setActiveSection('strengths')} className="text-teal text-sm font-medium hover:opacity-80 flex items-center gap-1">
                                        View All <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                {strengths.length === 0 ? (
                                    <p className="text-gray-400 text-sm">No verified skills yet — complete an assessment to get started.</p>
                                ) : (
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {strengths.slice(0, 3).map((s, i) => {
                                            const c = getScoreColor(s.score);
                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => handleSkillClick(s)}
                                                    className={`p-4 rounded-xl border ${c.border} ${c.bg} cursor-pointer hover:shadow-md transition-all`}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="font-bold text-gray-900">{s.skill}</p>
                                                            <p className="text-xs text-gray-500">{s.category}</p>
                                                        </div>
                                                        <ScoreRing score={s.score} size="sm" />
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-2">{s.evidence}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>

                            {/* Focus Areas */}
                            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-5">
                                    <Target className="w-5 h-5 text-teal" /> Focus Areas
                                </h3>
                                {growthAreas.length === 0 ? (
                                    <p className="text-gray-400 text-sm">No focus areas identified yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {growthAreas.map((area, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                                <div className="w-7 h-7 bg-teal/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-teal font-bold text-xs">{i + 1}</span>
                                                </div>
                                                <span className="text-gray-700 text-sm leading-snug">{area}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            {/* Growth Preview */}
                            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 text-amber-500" /> Improvement Areas
                                    </h3>
                                    <button onClick={() => setActiveSection('growth')} className="text-teal text-sm font-medium hover:opacity-80 flex items-center gap-1">
                                        View All <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                {weaknesses.length === 0 ? (
                                    <p className="text-gray-400 text-sm">No improvement areas found — great work!</p>
                                ) : (
                                    <div className="space-y-3">
                                        {weaknesses.slice(0, 3).map((w, i) => {
                                            const c = getScoreColor(w.score);
                                            return (
                                                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${c.border} ${c.bg}`}>
                                                    <div className={`text-xs font-bold px-2 py-1 rounded-lg ${c.bg} ${c.text} border ${c.border}`}>{w.score}</div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-sm">{w.skill}</p>
                                                        <p className="text-xs text-gray-500">{w.category}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>

                            {/* Opportunities preview */}
                            {opportunities.length > 0 && (
                                <motion.div variants={itemVariants} className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                            <Briefcase className="w-5 h-5 text-purple-500" /> Top Job Matches
                                        </h3>
                                        <button onClick={() => setActiveSection('opportunities')} className="text-teal text-sm font-medium hover:opacity-80 flex items-center gap-1">
                                            View All <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {opportunities.slice(0, 2).map((opp, i) => {
                                            const c = getScoreColor(opp.matchScore);
                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => onViewJob?.(opp)}
                                                    className="p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition cursor-pointer"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">{opp.jobTitle}</p>
                                                            <p className="text-xs text-gray-500">{opp.company}</p>
                                                        </div>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${c.bg} ${c.text}`}>{opp.matchScore}%</span>
                                                    </div>
                                                    <div className="flex gap-2 flex-wrap">
                                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-lg">{opp.salaryRange}</span>
                                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg flex items-center gap-1"><MapPin size={10} />{opp.location}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* ── Strengths ─────────────────────────────────────────── */}
                    {activeSection === 'strengths' && (
                        <motion.div
                            key="strengths"
                            variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {strengths.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-400">
                                    No verified skills yet — complete an assessment to get started.
                                </div>
                            ) : (
                                strengths.map((s, i) => {
                                    const c = getScoreColor(s.score);
                                    return (
                                        <motion.div
                                            key={i} variants={itemVariants}
                                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-lg hover:border-emerald-200 transition-all"
                                            onClick={() => handleSkillClick(s)}
                                        >
                                            <div className="flex items-start gap-5">
                                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 text-lg">{s.skill}</h4>
                                                            <p className="text-gray-400 text-sm mb-2">{s.category}</p>
                                                        </div>
                                                        <div className={`px-4 py-2 rounded-xl ${c.bg} text-center flex-shrink-0`}>
                                                            <span className={`text-2xl font-bold ${c.text}`}>{s.score}</span>
                                                            <p className={`text-xs font-semibold mt-0.5 ${c.text}`}>{getScoreLabel(s.score)}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-600 text-sm leading-relaxed">{s.evidence}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    )}

                    {/* ── Growth Areas ──────────────────────────────────────── */}
                    {activeSection === 'growth' && (
                        <motion.div
                            key="growth"
                            variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Focus Areas card */}
                            {growthAreas.length > 0 && (
                                <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-5">
                                        <Target className="w-5 h-5 text-teal" /> Recommended Focus Areas
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {growthAreas.map((area, i) => (
                                            <div key={i} className="flex items-start gap-3 p-4 bg-teal/5 border border-teal/15 rounded-xl">
                                                <div className="w-8 h-8 bg-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-teal font-bold text-sm">{i + 1}</span>
                                                </div>
                                                <span className="text-gray-700 text-sm leading-snug">{area}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Weakness cards */}
                            {weaknesses.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-400">
                                    No improvement areas identified — great work!
                                </div>
                            ) : (
                                weaknesses.map((w, i) => {
                                    const c = getScoreColor(w.score);
                                    return (
                                        <motion.div key={i} variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 text-lg">{w.skill}</h4>
                                                            <p className="text-gray-400 text-sm">{w.category}</p>
                                                        </div>
                                                        <div className={`px-3 py-1.5 rounded-xl ${c.bg} text-center flex-shrink-0`}>
                                                            <span className={`font-bold ${c.text}`}>{w.score}</span>
                                                            <p className={`text-xs font-semibold ${c.text}`}>{getScoreLabel(w.score)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-amber-50 rounded-xl p-4 mb-4">
                                                <h5 className="font-semibold text-amber-800 text-sm mb-1 flex items-center gap-1.5">
                                                    <Lightbulb className="w-4 h-4" /> Recommendation
                                                </h5>
                                                <p className="text-amber-700 text-sm leading-relaxed">{w.recommendation}</p>
                                            </div>

                                            {safeArr(w.resources).length > 0 && (
                                                <div>
                                                    <h5 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-1.5">
                                                        <BookOpen className="w-4 h-4" /> Suggested Resources
                                                    </h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        {safeArr(w.resources).map((r, ri) => (
                                                            <span key={ri} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs flex items-center gap-1 hover:bg-gray-200 transition">
                                                                {r} <ExternalLink className="w-3 h-3" />
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    )}

                    {/* ── Opportunities ─────────────────────────────────────── */}
                    {activeSection === 'opportunities' && (
                        <motion.div
                            key="opportunities"
                            variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {opportunities.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-400">
                                    No opportunities found — add more skills to your profile.
                                </div>
                            ) : (
                                opportunities.map((opp, i) => {
                                    const c = getScoreColor(opp.matchScore);
                                    return (
                                        <motion.div
                                            key={i} variants={itemVariants}
                                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition cursor-pointer"
                                            onClick={() => onViewJob?.(opp)}
                                        >
                                            <div className="flex items-start justify-between mb-3 gap-4">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-lg">{opp.jobTitle}</h4>
                                                    <p className="text-gray-500 text-sm">{opp.company}</p>
                                                </div>
                                                <div className={`px-4 py-2 rounded-xl ${c.bg} ${c.border} border text-center flex-shrink-0`}>
                                                    <div className="flex items-center gap-1">
                                                        <Star className={`w-4 h-4 ${c.text}`} fill="currentColor" />
                                                        <span className={`font-bold ${c.text}`}>{opp.matchScore}%</span>
                                                    </div>
                                                    <p className={`text-xs font-semibold mt-0.5 ${c.text}`}>Match</p>
                                                </div>
                                            </div>

                                            <p className="text-gray-600 text-sm mb-4 leading-relaxed">{opp.reason}</p>

                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1">
                                                    <DollarSign size={12} />{opp.salaryRange}
                                                </span>
                                                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1">
                                                    <MapPin size={12} />{opp.location}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default SkillPassport;
