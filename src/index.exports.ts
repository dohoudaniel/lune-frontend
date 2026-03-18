/**
 * Lune Platform - Component & Service Exports
 * Centralized exports for all assessment-related functionality
 */

// =====================================================
// ASSESSMENT COMPONENTS
// =====================================================

// Technical Assessments
export { Assessment } from './components/Assessment';

// Non-Technical Assessments
export { default as ScenarioAssessment } from './components/ScenarioAssessment';
export { default as VideoVerificationAssessment } from './components/VideoVerificationAssessment';

// Office Tools Assessments
export { default as SpreadsheetAssessment } from './components/SpreadsheetAssessment';
export { default as TextEditorAssessment } from './components/TextEditorAssessment';
export { default as PresentationAssessment } from './components/PresentationAssessment';

// Video & Analysis
export { default as VideoAnalyzer } from './components/VideoAnalyzer';

// Skill Passport
export { default as SkillPassport } from './components/SkillPassport';

// =====================================================
// ADVANCED ASSESSMENT FEATURES
// =====================================================

// AI Interview Simulator
export { default as AIInterviewSimulator } from './components/AIInterviewSimulator';

// Collaborative Coding
export { default as CollaborativeCoding } from './components/CollaborativeCoding';

// Mobile-First Assessment
export { default as MobileAssessment } from './components/MobileAssessment';

// =====================================================
// EMPLOYER COMPONENTS
// =====================================================

export { default as LiveAssessmentViewer } from './components/LiveAssessmentViewer';
export { EmployerDashboard } from './components/EmployerDashboard';
export { default as EnterpriseDashboard } from './components/EnterpriseDashboard';
export { default as TeamAssessmentDashboard } from './components/TeamAssessmentDashboard';

// =====================================================
// ANALYTICS & INSIGHTS
// =====================================================

export { default as AnalyticsDashboard } from './components/AnalyticsDashboard';

// =====================================================
// GAMIFICATION
// =====================================================

export { default as GamificationHub } from './components/GamificationHub';

// =====================================================
// CREDENTIALS & BADGES
// =====================================================

export { default as ShareableCredential } from './components/ShareableCredential';

// =====================================================
// AI CAREER COACH
// =====================================================

export { default as AICareerCoach } from './components/AICareerCoach';

// =====================================================
// ADMIN COMPONENTS
// =====================================================

export { default as QuestionBankManager } from './components/QuestionBankManager';
export { AdminDashboard } from './components/AdminDashboard';
export type { AdminDashboardProps } from './components/AdminDashboard';

// =====================================================
// PROFILE
// =====================================================

export { ProfilePage } from './components/ProfilePage';
export type { ProfilePageProps } from './components/ProfilePage';

// =====================================================
// PRIVACY & CONSENT
// =====================================================

export { default as DataConsentModal } from './components/DataConsentModal';

// =====================================================
// SERVICES
// =====================================================

// AI Services
export {
    generateAssessment,
    evaluateCodeSubmission,
    generateScenarioAssessment,
    evaluateScenarioResponse,
    generateSkillPassport,
    getAssessmentType,
    getSkillCategory,
    isNonTechSkill,
    generateCheatingAnalysis,
    getCareerRecommendations,
    matchCandidatesToJob,
    generateInterviewQuestion,
    evaluateInterviewResponse
} from './services/geminiService';

// Video Analysis
export {
    analyzeVideoIntroduction,
    analyzeVideoVerification
} from './services/videoAnalysisService';

// Question Bank
export {
    getQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getRandomQuestions,
    getAssessmentQuestions,
    getQuestionStats
} from './services/questionBankService';

// AI Learning
export {
    hasConsent,
    recordConsent,
    withdrawConsent,
    collectAssessmentData,
    collectVideoData,
    exportCandidateData,
    getPlatformAnalytics
} from './services/aiLearningService';

// Adaptive Assessment
export {
    initializeSession,
    selectNextQuestion,
    updateAbilityEstimate,
    shouldTerminate,
    generateResult,
    abilityToLevel,
    abilityToPercentile
} from './services/adaptiveAssessmentService';

// Gamification
export {
    initializeUser,
    getUserGamification,
    awardXP,
    updateStreak,
    checkAchievements,
    getLeaderboard,
    getUserRank
} from './services/gamificationService';

// Assessment Templates
export {
    getAllTemplates,
    getTemplateById,
    getTemplatesByCategory,
    searchTemplates,
    getPopularTemplates,
    getRecommendedTemplates,
    cloneTemplate
} from './services/assessmentTemplatesService';

// Proctoring
export {
    proctoringService,
    ProctoringService
} from './services/proctoringService';



// =====================================================
// TYPE EXPORTS
// =====================================================

export type {
    DifficultyLevel,
    AssessmentType,
    EvaluationResult,
    CandidateProfile,
    SkillCategory
} from './types';

export type { ScenarioAssessmentContent } from './services/geminiService';
export type { VideoVerificationResult, VideoAnalysisResult } from './services/videoAnalysisService';
export type { Question, QuestionBank, QuestionFilter } from './services/questionBankService';
export type { LearningDataPoint, ConsentRecord, FeedbackSubmission } from './services/aiLearningService';
export type { AdaptiveQuestion, CandidateState, AdaptiveResult } from './services/adaptiveAssessmentService';
export type { UserGamification, Achievement, DailyChallenge, LeaderboardEntry } from './services/gamificationService';
export type { AssessmentTemplate, TemplateSection } from './services/assessmentTemplatesService';
export type { ProctoringSession, Violation, EnvironmentCheck, ProctoringConfig } from './services/proctoringService';
