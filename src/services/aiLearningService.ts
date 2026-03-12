/**
 * AI Learning Service
 * Collects and manages data for AI model improvement
 * All data collection requires explicit user consent
 */

import { DifficultyLevel, AssessmentType } from '../types';

// =====================================================
// INTERFACES
// =====================================================

import { api } from '../lib/api';

export interface LearningDataPoint {
    id: string;
    timestamp: string;
    type: 'assessment' | 'interview' | 'video' | 'interaction';

    // Context
    skill: string;
    category: string;
    difficulty: DifficultyLevel;
    assessmentType: AssessmentType;

    // Input Data
    question?: string;
    prompt?: string;
    context?: string;

    // Response Data
    candidateResponse: string;
    responseTime: number; // milliseconds

    // Evaluation Data
    aiScore: number;
    humanScore?: number; // If reviewed by human
    feedback: string;

    // Metadata
    candidateId: string;
    sessionId: string;
    consentGiven: boolean;
    anonymized: boolean;
}

export interface ConsentRecord {
    candidateId: string;
    consentVersion: string;
    consentedAt: string;
    dataTypes: {
        assessmentData: boolean;
        videoData: boolean;
        interactionData: boolean;
        improvementFeedback: boolean;
    };
    withdrawnAt?: string;
}

export interface AggregatedInsights {
    skill: string;
    category: string;
    totalAssessments: number;
    avgScore: number;
    passRate: number;
    avgResponseTime: number;
    commonMistakes: string[];
    improvementTrends: {
        period: string;
        avgScoreChange: number;
    }[];
    questionDifficulty: {
        questionId: string;
        successRate: number;
        avgTime: number;
    }[];
}

export interface FeedbackSubmission {
    dataPointId: string;
    candidateId: string;
    feedbackType: 'score_correction' | 'feedback_improvement' | 'question_quality' | 'other';
    originalValue: string | number;
    suggestedValue: string | number;
    reason: string;
    submittedAt: string;
}

// =====================================================
// CONSENT MANAGEMENT
// =====================================================

const CONSENT_VERSION = '1.0.0';
const STORAGE_KEY = 'lune_ai_learning_consent';
const DATA_STORAGE_KEY = 'lune_ai_learning_data';
const CONSENT_KEY = 'lune_consents';

let cachedConsents: ConsentRecord[] = [];
let cachedLearningData: LearningDataPoint[] = [];

export const initializeAiLearning = async (userId: string) => {
    try {
        // Fetch user preferences via API
        const data = await api.get(`/users/${userId}/preferences`);
        if (data && data.user_preferences) {
            const prefs = data.user_preferences as any;
            if (prefs.ai_learning?.consents) {
                cachedConsents = prefs.ai_learning.consents;
                localStorage.setItem(CONSENT_KEY, JSON.stringify(cachedConsents));
            }
            if (prefs.ai_learning?.data) {
                cachedLearningData = prefs.ai_learning.data;
                localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(cachedLearningData));
            }
        } else {
            // Fallback load
            const storedConsents = localStorage.getItem(CONSENT_KEY);
            if (storedConsents) cachedConsents = JSON.parse(storedConsents);

            const storedData = localStorage.getItem(DATA_STORAGE_KEY);
            if (storedData) cachedLearningData = JSON.parse(storedData);
        }
    } catch (err) {
        console.error('Failed to init ai learning:', err);
    }
};

const syncToSupabaseAsync = async (userId: string, section: 'consents' | 'data', payload: any) => {
    try {
        const data = await api.get(`/users/${userId}/preferences`);
        const prefs = data || {};
        if (!prefs.ai_learning) prefs.ai_learning = {};
        prefs.ai_learning[section] = payload;
        
        await api.put(`/users/${userId}/preferences`, prefs);
    } catch (e) {
        console.error('Failed to sync ai learning', e);
    }
};

/**
 * Check if candidate has given consent for data collection
 */
export const hasConsent = (candidateId: string): boolean => {
    try {
        const consents = getStoredConsents();
        const consent = consents.find(c => c.candidateId === candidateId);
        return consent !== undefined &&
            consent.withdrawnAt === undefined &&
            consent.consentVersion === CONSENT_VERSION;
    } catch {
        return false;
    }
};

/**
 * Get stored consent records
 */
const getStoredConsents = (): ConsentRecord[] => {
    if (cachedConsents.length > 0) return cachedConsents;
    try {
        const stored = localStorage.getItem(CONSENT_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

/**
 * Record user consent for data collection
 */
export const recordConsent = (
    candidateId: string,
    dataTypes: ConsentRecord['dataTypes']
): ConsentRecord => {
    const consent: ConsentRecord = {
        candidateId,
        consentVersion: CONSENT_VERSION,
        consentedAt: new Date().toISOString(),
        dataTypes
    };

    const consents = getStoredConsents();
    const existingIndex = consents.findIndex(c => c.candidateId === candidateId);

    if (existingIndex >= 0) {
        consents[existingIndex] = consent;
    } else {
        consents.push(consent);
    }

    cachedConsents = consents;
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consents));
    syncToSupabaseAsync(candidateId, 'consents', consents);
    return consent;
};

/**
 * Withdraw consent and optionally delete data
 */
export const withdrawConsent = (candidateId: string, deleteData: boolean = false): void => {
    const consents = getStoredConsents();
    const consentIndex = consents.findIndex(c => c.candidateId === candidateId);

    if (consentIndex >= 0) {
        consents[consentIndex].withdrawnAt = new Date().toISOString();
        cachedConsents = consents;
        localStorage.setItem(CONSENT_KEY, JSON.stringify(consents));
        syncToSupabaseAsync(candidateId, 'consents', consents);
    }

    if (deleteData) {
        deleteCandidateData(candidateId);
    }
};

/**
 * Get consent status for a candidate
 */
export const getConsentStatus = (candidateId: string): ConsentRecord | null => {
    const consents = getStoredConsents();
    return consents.find(c => c.candidateId === candidateId) || null;
};

// =====================================================
// DATA COLLECTION
// =====================================================

/**
 * Get stored learning data
 */
const getStoredData = (): LearningDataPoint[] => {
    if (cachedLearningData.length > 0) return cachedLearningData;
    try {
        const stored = localStorage.getItem(DATA_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

/**
 * Store learning data point (only if consent given)
 */
export const collectLearningData = (
    data: Omit<LearningDataPoint, 'id' | 'timestamp' | 'consentGiven' | 'anonymized'>
): LearningDataPoint | null => {

    // Check consent
    if (!hasConsent(data.candidateId)) {
        return null;
    }

    const dataPoint: LearningDataPoint = {
        ...data,
        id: `ldp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        consentGiven: true,
        anonymized: false
    };

    const storedData = getStoredData();
    storedData.push(dataPoint);

    // Keep only last 1000 data points in local storage
    const trimmedData = storedData.slice(-1000);
    cachedLearningData = trimmedData;
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(trimmedData));
    syncToSupabaseAsync(data.candidateId, 'data', trimmedData);

    return dataPoint;
};

/**
 * Collect assessment data for AI learning
 */
export const collectAssessmentData = (params: {
    candidateId: string;
    sessionId: string;
    skill: string;
    category: string;
    difficulty: DifficultyLevel;
    assessmentType: AssessmentType;
    question: string;
    candidateResponse: string;
    responseTime: number;
    aiScore: number;
    feedback: string;
}): LearningDataPoint | null => {
    return collectLearningData({
        type: 'assessment',
        ...params
    });
};

/**
 * Collect video assessment data
 */
export const collectVideoData = (params: {
    candidateId: string;
    sessionId: string;
    skill: string;
    category: string;
    difficulty: DifficultyLevel;
    prompt: string;
    candidateResponse: string; // Transcription
    responseTime: number;
    aiScore: number;
    feedback: string;
}): LearningDataPoint | null => {
    return collectLearningData({
        type: 'video',
        assessmentType: 'video_verification',
        ...params
    });
};

/**
 * Delete all data for a candidate
 */
export const deleteCandidateData = (candidateId: string): number => {
    const data = getStoredData();
    const filtered = data.filter(d => d.candidateId !== candidateId);
    const deletedCount = data.length - filtered.length;

    cachedLearningData = filtered;
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(filtered));
    syncToSupabaseAsync(candidateId, 'data', filtered);

    return deletedCount;
};

/**
 * Anonymize data (remove PII but keep for aggregate analysis)
 */
export const anonymizeData = (dataPointId: string): boolean => {
    const data = getStoredData();
    const index = data.findIndex(d => d.id === dataPointId);

    if (index >= 0) {
        const candidateId = data[index].candidateId;
        data[index].candidateId = 'anonymous';
        data[index].anonymized = true;
        cachedLearningData = data;
        localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
        syncToSupabaseAsync(candidateId, 'data', data);
        return true;
    }

    return false;
};

// =====================================================
// FEEDBACK COLLECTION
// =====================================================

const FEEDBACK_KEY = 'lune_ai_feedback';

/**
 * Get stored feedback submissions
 */
const getStoredFeedback = (): FeedbackSubmission[] => {
    try {
        const stored = localStorage.getItem(FEEDBACK_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

/**
 * Submit feedback to improve AI
 */
export const submitFeedback = (
    feedback: Omit<FeedbackSubmission, 'submittedAt'>
): FeedbackSubmission => {
    const submission: FeedbackSubmission = {
        ...feedback,
        submittedAt: new Date().toISOString()
    };

    const storedFeedback = getStoredFeedback();
    storedFeedback.push(submission);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(storedFeedback));

    return submission;
};

// =====================================================
// ANALYTICS & INSIGHTS
// =====================================================

/**
 * Get aggregated insights for a skill (anonymized)
 */
export const getSkillInsights = (skill: string): AggregatedInsights | null => {
    const data = getStoredData().filter(d => d.skill === skill);

    if (data.length === 0) return null;

    const passedCount = data.filter(d => d.aiScore >= 70).length;
    const totalResponseTime = data.reduce((sum, d) => sum + d.responseTime, 0);
    const totalScore = data.reduce((sum, d) => sum + d.aiScore, 0);

    // Find common low-scoring areas
    const lowScoreData = data.filter(d => d.aiScore < 60);
    const mistakePatterns = lowScoreData
        .map(d => d.feedback)
        .filter(f => f)
        .slice(0, 5);

    return {
        skill,
        category: data[0]?.category || 'general',
        totalAssessments: data.length,
        avgScore: Math.round(totalScore / data.length),
        passRate: Math.round((passedCount / data.length) * 100),
        avgResponseTime: Math.round(totalResponseTime / data.length),
        commonMistakes: mistakePatterns,
        improvementTrends: [],
        questionDifficulty: []
    };
};

/**
 * Export data for a candidate (GDPR compliance)
 */
export const exportCandidateData = (candidateId: string): {
    consent: ConsentRecord | null;
    data: LearningDataPoint[];
    feedback: FeedbackSubmission[];
} => {
    return {
        consent: getConsentStatus(candidateId),
        data: getStoredData().filter(d => d.candidateId === candidateId),
        feedback: getStoredFeedback().filter(f => f.candidateId === candidateId)
    };
};

/**
 * Get overall platform analytics (anonymized)
 */
export const getPlatformAnalytics = (): {
    totalDataPoints: number;
    skillDistribution: Record<string, number>;
    avgScoreByCategory: Record<string, number>;
    passRateByDifficulty: Record<string, number>;
} => {
    const data = getStoredData();

    const skillDistribution: Record<string, number> = {};
    const categoryScores: Record<string, { total: number; count: number }> = {};
    const difficultyPass: Record<string, { passed: number; total: number }> = {};

    data.forEach(d => {
        // Skill distribution
        skillDistribution[d.skill] = (skillDistribution[d.skill] || 0) + 1;

        // Category scores
        if (!categoryScores[d.category]) {
            categoryScores[d.category] = { total: 0, count: 0 };
        }
        categoryScores[d.category].total += d.aiScore;
        categoryScores[d.category].count += 1;

        // Difficulty pass rates
        if (!difficultyPass[d.difficulty]) {
            difficultyPass[d.difficulty] = { passed: 0, total: 0 };
        }
        difficultyPass[d.difficulty].total += 1;
        if (d.aiScore >= 70) {
            difficultyPass[d.difficulty].passed += 1;
        }
    });

    const avgScoreByCategory: Record<string, number> = {};
    Object.entries(categoryScores).forEach(([cat, stats]) => {
        avgScoreByCategory[cat] = Math.round(stats.total / stats.count);
    });

    const passRateByDifficulty: Record<string, number> = {};
    Object.entries(difficultyPass).forEach(([diff, stats]) => {
        passRateByDifficulty[diff] = Math.round((stats.passed / stats.total) * 100);
    });

    return {
        totalDataPoints: data.length,
        skillDistribution,
        avgScoreByCategory,
        passRateByDifficulty
    };
};
