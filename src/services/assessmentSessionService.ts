/**
 * Assessment Session Service
 * Tracks assessment sessions and ensures question exclusivity
 * Prevents candidates from receiving duplicate questions across multiple attempts
 */

export interface AssessmentSession {
    candidateId: string;
    skill: string;
    difficulty: string;
    sessionId: string;
    usedQuestionHashes: string[];
    createdAt: string;
    completedAt?: string;
}

const SESSIONS_KEY = 'lune_assessment_sessions';
const MAX_SESSIONS_PER_CANDIDATE = 50; // Prevent unlimited storage growth

/**
 * Generate a simple hash from a string (for question uniqueness tracking)
 */
const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
};

import { api } from '../lib/api';

let cachedSessions: AssessmentSession[] = [];
let defaultUserId: string | null = null;

/**
 * Initialize sessions from DB
 */
export const initializeSessions = async (userId: string) => {
    defaultUserId = userId;
    try {
        const data = await api.get(`/users/${userId}/preferences`);
        if (data && data.sessions) {
            cachedSessions = data.sessions;
            localStorage.setItem(SESSIONS_KEY, JSON.stringify(cachedSessions));
        } else {
            const stored = localStorage.getItem(SESSIONS_KEY);
            if (stored) {
                cachedSessions = JSON.parse(stored);
            }
        }
    } catch (err) {
        console.error('Failed to init sessions:', err);
    }
};

/**
 * Get all stored sessions from cache or localStorage
 */
const getStoredSessions = (): AssessmentSession[] => {
    if (cachedSessions.length > 0) return cachedSessions;
    try {
        const stored = localStorage.getItem(SESSIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

/**
 * Save sessions to cache, localStorage, and Supabase
 */
const saveSessions = (sessions: AssessmentSession[]): void => {
    cachedSessions = sessions;
    try {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

        // Background sync
        if (defaultUserId) {
            api.get(`/users/${defaultUserId}/preferences`)
                .then(async (data) => {
                    const prefs = data || {};
                    prefs.sessions = sessions;
                    await api.put(`/users/${defaultUserId}/preferences`, prefs);
                })
                .catch(error => {
                    console.error('Failed to sync sessions', error);
                });
        }
    } catch (error) {
        console.error('Failed to save assessment sessions:', error);
    }
};

/**
 * Generate a unique session ID
 */
export const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Create a new assessment session
 */
export const createAssessmentSession = (
    candidateId: string,
    skill: string,
    difficulty: string
): string => {
    const sessions = getStoredSessions();
    const sessionId = generateSessionId();

    const newSession: AssessmentSession = {
        candidateId,
        skill,
        difficulty,
        sessionId,
        usedQuestionHashes: [],
        createdAt: new Date().toISOString()
    };

    // Add new session
    sessions.push(newSession);

    // Clean up old sessions if too many for this candidate
    const candidateSessions = sessions.filter(s => s.candidateId === candidateId);
    if (candidateSessions.length > MAX_SESSIONS_PER_CANDIDATE) {
        // Remove oldest sessions
        const toRemove = candidateSessions
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .slice(0, candidateSessions.length - MAX_SESSIONS_PER_CANDIDATE)
            .map(s => s.sessionId);

        const cleanedSessions = sessions.filter(s => !toRemove.includes(s.sessionId));
        saveSessions(cleanedSessions);
    } else {
        saveSessions(sessions);
    }

    return sessionId;
};

/**
 * Get all previously used question hashes for a candidate's skill/difficulty
 */
export const getUsedQuestionHashes = (
    candidateId: string,
    skill: string,
    difficulty: string
): string[] => {
    const sessions = getStoredSessions();

    // Get all completed sessions for this candidate, skill, and difficulty
    const relevantSessions = sessions.filter(
        s => s.candidateId === candidateId &&
            s.skill === skill &&
            s.difficulty === difficulty &&
            s.completedAt // Only include completed assessments
    );

    // Combine all used question hashes
    const allHashes = relevantSessions.flatMap(s => s.usedQuestionHashes);

    // Return unique hashes
    return Array.from(new Set(allHashes));
};

/**
 * Record questions used in a session
 */
export const recordUsedQuestions = (
    sessionId: string,
    questions: Array<{ scenario?: string; question: string }>
): void => {
    const sessions = getStoredSessions();
    const session = sessions.find(s => s.sessionId === sessionId);

    if (!session) {
        return;
    }

    // Generate hashes for each question
    const questionHashes = questions.map(q => {
        const content = `${q.scenario || ''} ${q.question}`.trim();
        return simpleHash(content);
    });

    session.usedQuestionHashes = questionHashes;
    session.completedAt = new Date().toISOString();

    saveSessions(sessions);
};

/**
 * Check if a question has been used before
 */
export const isQuestionUsed = (
    candidateId: string,
    skill: string,
    difficulty: string,
    question: { scenario?: string; question: string }
): boolean => {
    const usedHashes = getUsedQuestionHashes(candidateId, skill, difficulty);
    const content = `${question.scenario || ''} ${question.question}`.trim();
    const questionHash = simpleHash(content);

    return usedHashes.includes(questionHash);
};

/**
 * Get session statistics for a candidate
 */
export const getCandidateStats = (candidateId: string): {
    totalAssessments: number;
    completedAssessments: number;
    skillBreakdown: Record<string, number>;
} => {
    const sessions = getStoredSessions();
    const candidateSessions = sessions.filter(s => s.candidateId === candidateId);

    const skillBreakdown: Record<string, number> = {};
    candidateSessions.forEach(s => {
        skillBreakdown[s.skill] = (skillBreakdown[s.skill] || 0) + 1;
    });

    return {
        totalAssessments: candidateSessions.length,
        completedAssessments: candidateSessions.filter(s => s.completedAt).length,
        skillBreakdown
    };
};

/**
 * Clear all sessions (for testing/admin purposes)
 */
export const clearAllSessions = (): void => {
    localStorage.removeItem(SESSIONS_KEY);
};
