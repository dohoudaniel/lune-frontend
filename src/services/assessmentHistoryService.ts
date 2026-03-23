/**
 * Assessment History Service
 * Tracks and persists candidate assessment performance over time
 */

import { DifficultyLevel } from '../types';
import { getSkillCategory } from './geminiService';
import { api } from '../lib/api';

// Storage key for assessment history
const HISTORY_STORAGE_KEY = 'lune_assessment_history';

// Assessment history item interface
export interface AssessmentHistoryEntry {
    id: string;
    candidateId: string;
    skill: string;
    category: string;
    score: number;
    passed: boolean;
    difficulty: DifficultyLevel;
    completedAt: string;
    timeSpentSeconds: number;
    cheatingDetected: boolean;
    integrityScore: number;
    feedback?: string;
    categoryScores?: Record<string, number>;
    certificationHash?: string;
}

// Assessment trend data for visualization
export interface AssessmentTrend {
    skill: string;
    attempts: {
        date: string;
        score: number;
        passed: boolean;
    }[];
    averageScore: number;
    bestScore: number;
    improvement: number; // percentage improvement from first to last attempt
    totalAttempts: number;
}

// Overall performance summary
export interface PerformanceSummary {
    totalAssessments: number;
    passedAssessments: number;
    failedAssessments: number;
    passRate: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    totalTimeSpent: number; // in seconds
    skillsAssessed: string[];
    categoriesAssessed: string[];
    recentActivity: AssessmentHistoryEntry[];
    trends: AssessmentTrend[];
}

// In-memory cache to maintain synchronous API compatibility with existing app
let cachedHistory: AssessmentHistoryEntry[] = [];

/**
 * Initialize history from Supabase (Call this on login)
 */
export const initializeAssessmentHistory = async (userId: string) => {
    try {
        const data = await api.get('/assessments/history/');
        cachedHistory = data.map((row: any) => ({
            id: row.id,
            candidateId: row.user,
            skill: row.skill_name,
            category: row.skill_category,
            score: row.score,
            passed: row.passed,
            difficulty: row.difficulty,
            completedAt: row.completed_at,
            timeSpentSeconds: row.time_spent_seconds || 0,
            cheatingDetected: row.cheating_detected,
            integrityScore: row.integrity_score || 100,
            feedback: row.feedback,
            categoryScores: row.category_scores,
            certificationHash: row.certification_hash
        }));

        saveAssessmentHistory(cachedHistory);
    } catch (err) {
        console.error('Failed to initialize history:', err);
    }
};

/**
 * Load assessment history (Sync - returns cached or local storage fallback)
 */
export const loadAssessmentHistory = (candidateId?: string): AssessmentHistoryEntry[] => {
    try {
        if (cachedHistory.length > 0) {
            return candidateId ? cachedHistory.filter(h => h.candidateId === candidateId) : cachedHistory;
        }

        const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (stored) {
            const history: AssessmentHistoryEntry[] = JSON.parse(stored);
            cachedHistory = history;
            if (candidateId) {
                return history.filter(entry => entry.candidateId === candidateId);
            }
            return history;
        }
    } catch (error) {
        console.error('Error loading assessment history:', error);
    }
    return [];
};

/**
 * Save assessment history locally (fallback)
 */
const saveAssessmentHistory = (history: AssessmentHistoryEntry[]): void => {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
        console.error('Error saving assessment history:', error);
    }
};

/**
 * Add a new assessment entry to history
 */
export const addAssessmentEntry = (
    candidateId: string,
    skill: string,
    score: number,
    passed: boolean,
    difficulty: DifficultyLevel,
    timeSpentSeconds: number,
    cheatingDetected: boolean = false,
    integrityScore: number = 100,
    feedback?: string,
    categoryScores?: Record<string, number>,
    certificationHash?: string
): AssessmentHistoryEntry => {
    const entry: AssessmentHistoryEntry = {
        id: `assessment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        candidateId,
        skill,
        category: getSkillCategory(skill),
        score,
        passed,
        difficulty,
        completedAt: new Date().toISOString(),
        timeSpentSeconds,
        cheatingDetected,
        integrityScore,
        feedback,
        categoryScores,
        certificationHash
    };

    cachedHistory.push(entry);
    saveAssessmentHistory(cachedHistory);

    // Save to Backend (Async - Fire & Forget)
    (async () => {
        try {
            await api.post('/assessments/submit/', {
                assessment: 'dynamic_id', // Handle real IDs later
                skill_name: skill,
                difficulty,
                score,
                passed,
                time_spent_seconds: timeSpentSeconds,
                code_submission: '',
                theory_answers: {},
                feedback: feedback || '',
                cheating_detected: cheatingDetected,
            });
        } catch (err) {
            console.error('Failed to sync assessment:', err);
        }
    })();

    return entry;
};

/**
 * Get performance summary for a candidate
 */
export const getPerformanceSummary = (candidateId: string): PerformanceSummary => {
    const history = loadAssessmentHistory(candidateId);

    if (history.length === 0) {
        return {
            totalAssessments: 0,
            passedAssessments: 0,
            failedAssessments: 0,
            passRate: 0,
            averageScore: 0,
            bestScore: 0,
            worstScore: 0,
            totalTimeSpent: 0,
            skillsAssessed: [],
            categoriesAssessed: [],
            recentActivity: [],
            trends: []
        };
    }

    const scores = history.map(h => h.score);
    const passedCount = history.filter(h => h.passed).length;
    const skillsSet = new Set(history.map(h => h.skill));
    const categoriesSet = new Set(history.map(h => h.category));

    // Calculate trends per skill
    const skillGroups: Record<string, AssessmentHistoryEntry[]> = {};
    history.forEach(entry => {
        if (!skillGroups[entry.skill]) {
            skillGroups[entry.skill] = [];
        }
        skillGroups[entry.skill].push(entry);
    });

    const trends: AssessmentTrend[] = Object.entries(skillGroups).map(([skill, entries]) => {
        // Sort by date
        const sorted = entries.sort((a, b) =>
            new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        );

        const skillScores = sorted.map(e => e.score);
        const firstScore = skillScores[0];
        const lastScore = skillScores[skillScores.length - 1];
        const improvement = firstScore > 0 ? ((lastScore - firstScore) / firstScore) * 100 : 0;

        return {
            skill,
            attempts: sorted.map(e => ({
                date: e.completedAt,
                score: e.score,
                passed: e.passed
            })),
            averageScore: Math.round(skillScores.reduce((a, b) => a + b, 0) / skillScores.length),
            bestScore: Math.max(...skillScores),
            improvement: Math.round(improvement),
            totalAttempts: sorted.length
        };
    });

    // Sort trends by most recent activity
    trends.sort((a, b) => {
        const aLatest = new Date(a.attempts[a.attempts.length - 1].date).getTime();
        const bLatest = new Date(b.attempts[b.attempts.length - 1].date).getTime();
        return bLatest - aLatest;
    });

    // Get recent activity (last 10)
    const recentActivity = [...history]
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, 10);

    return {
        totalAssessments: history.length,
        passedAssessments: passedCount,
        failedAssessments: history.length - passedCount,
        passRate: Math.round((passedCount / history.length) * 100),
        averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        bestScore: Math.max(...scores),
        worstScore: Math.min(...scores),
        totalTimeSpent: history.reduce((sum, h) => sum + h.timeSpentSeconds, 0),
        skillsAssessed: Array.from(skillsSet),
        categoriesAssessed: Array.from(categoriesSet),
        recentActivity,
        trends
    };
};

/**
 * Get assessment attempts for a specific skill
 */
export const getSkillHistory = (candidateId: string, skill: string): AssessmentHistoryEntry[] => {
    const history = loadAssessmentHistory(candidateId);
    return history
        .filter(h => h.skill === skill)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
};

/**
 * Check if candidate can retake an assessment (e.g., cooldown period)
 */
export const canRetakeAssessment = (
    candidateId: string,
    skill: string,
    cooldownHours: number = 24
): { canRetake: boolean; nextRetakeAt?: Date; lastAttempt?: AssessmentHistoryEntry } => {
    const skillHistory = getSkillHistory(candidateId, skill);

    if (skillHistory.length === 0) {
        return { canRetake: true };
    }

    const lastAttempt = skillHistory[0];
    const lastAttemptDate = new Date(lastAttempt.completedAt);
    const cooldownEnd = new Date(lastAttemptDate.getTime() + cooldownHours * 60 * 60 * 1000);
    const now = new Date();

    if (now >= cooldownEnd) {
        return { canRetake: true, lastAttempt };
    }

    return {
        canRetake: false,
        nextRetakeAt: cooldownEnd,
        lastAttempt
    };
};

/**
 * Get number of attempts for a specific skill (regardless of pass/fail)
 */
export const getSkillAttemptCount = (candidateId: string, skill: string): number => {
    return getSkillHistory(candidateId, skill).length;
};

/**
 * Check whether the candidate has at least one passed assessment (required to mint passport)
 */
export const hasPassedAnyAssessment = (candidateId: string): boolean => {
    return loadAssessmentHistory(candidateId).some(h => h.passed);
};

/**
 * Get improvement suggestions based on history
 */
export const getImprovementSuggestions = (candidateId: string): string[] => {
    const summary = getPerformanceSummary(candidateId);
    const suggestions: string[] = [];

    if (summary.totalAssessments === 0) {
        suggestions.push("Take your first assessment to start building your skill profile!");
        return suggestions;
    }

    // Check pass rate
    if (summary.passRate < 50) {
        suggestions.push("Focus on improving your foundational skills before attempting advanced assessments.");
    }

    // Check for skills with declining scores
    summary.trends.forEach(trend => {
        if (trend.improvement < -10 && trend.totalAttempts >= 2) {
            suggestions.push(`Your ${trend.skill} scores have declined. Consider reviewing the fundamentals.`);
        }
    });

    // Check for skills that haven't been retaken after failing
    summary.trends.forEach(trend => {
        const lastAttempt = trend.attempts[trend.attempts.length - 1];
        if (!lastAttempt.passed && trend.totalAttempts === 1) {
            suggestions.push(`Retake the ${trend.skill} assessment to improve your score.`);
        }
    });

    // Encourage diversification
    if (summary.skillsAssessed.length < 3 && summary.totalAssessments >= 3) {
        suggestions.push("Try assessments in different skill areas to broaden your profile.");
    }

    // Celebrate improvement
    const improvingSkills = summary.trends.filter(t => t.improvement > 20);
    if (improvingSkills.length > 0) {
        suggestions.push(`Great progress on ${improvingSkills[0].skill}! Keep up the momentum.`);
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
};

/**
 * Clear assessment history (for testing/reset)
 */
export const clearAssessmentHistory = (candidateId?: string): void => {
    if (candidateId) {
        const history = loadAssessmentHistory();
        const filtered = history.filter(h => h.candidateId !== candidateId);
        saveAssessmentHistory(filtered);
    } else {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
};

/**
 * Format time spent in human readable format
 */
export const formatTimeSpent = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
};

export default {
    initializeAssessmentHistory,
    loadAssessmentHistory,
    addAssessmentEntry,
    getPerformanceSummary,
    getSkillHistory,
    canRetakeAssessment,
    getSkillAttemptCount,
    hasPassedAnyAssessment,
    getImprovementSuggestions,
    clearAssessmentHistory,
    formatTimeSpent
};
