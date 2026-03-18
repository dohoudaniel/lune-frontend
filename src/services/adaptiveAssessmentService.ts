/**
 * Adaptive Assessment Engine
 * Dynamically adjusts question difficulty based on candidate performance
 */

import { DifficultyLevel, AssessmentType } from '../types';

// =====================================================
// INTERFACES
// =====================================================

export interface AdaptiveQuestion {
    id: string;
    skill: string;
    difficulty: number; // 1-10 scale (more granular than Beginner/Mid/Advanced)
    question: string;
    type: 'multiple_choice' | 'code' | 'open_ended';
    options?: string[];
    correctAnswer?: string;
    points: number;
    timeLimit: number; // seconds
    hints: string[];
    explanation: string;
}

export interface CandidateState {
    currentAbility: number; // Estimated ability level (1-10)
    confidence: number; // How confident we are in the estimate (0-1)
    questionsAnswered: number;
    correctAnswers: number;
    consecutiveCorrect: number;
    consecutiveIncorrect: number;
    responseHistory: ResponseRecord[];
    difficultyHistory: number[];
}

export interface ResponseRecord {
    questionId: string;
    difficulty: number;
    isCorrect: boolean;
    responseTime: number;
    partialCredit?: number; // 0-1 for partial credit questions
}

export interface AdaptiveSessionConfig {
    skill: string;
    targetQuestions: number; // Total questions to ask
    minQuestions: number; // Minimum before early termination
    maxTimeMinutes: number;
    startingDifficulty: number; // 1-10
    adaptationRate: number; // How quickly to adjust (0.1-1.0)
    terminationConfidence: number; // Confidence level to stop early
}

export interface AdaptiveResult {
    estimatedAbility: number; // 1-10
    abilityLevel: DifficultyLevel; // Beginner/Mid/Advanced
    confidence: number;
    percentileRank: number;
    questionsAnswered: number;
    accuracy: number;
    averageResponseTime: number;
    strengthAreas: string[];
    weaknessAreas: string[];
    recommendedLevel: DifficultyLevel;
}

// =====================================================
// QUESTION BANK (Difficulty-Scored)
// =====================================================

const ADAPTIVE_QUESTIONS: Record<string, AdaptiveQuestion[]> = {
    'React': [
        // Difficulty 1-2: Beginner
        {
            id: 'react_1',
            skill: 'React',
            difficulty: 1,
            question: 'What is JSX in React?',
            type: 'multiple_choice',
            options: [
                'A JavaScript extension that allows writing HTML in JavaScript',
                'A CSS preprocessor',
                'A testing framework',
                'A database query language'
            ],
            correctAnswer: 'A JavaScript extension that allows writing HTML in JavaScript',
            points: 10,
            timeLimit: 30,
            hints: ['Think about how React components are written'],
            explanation: 'JSX is a syntax extension for JavaScript that lets you write HTML-like code inside JavaScript files.'
        },
        {
            id: 'react_2',
            skill: 'React',
            difficulty: 2,
            question: 'Which hook is used to manage state in a functional component?',
            type: 'multiple_choice',
            options: ['useEffect', 'useState', 'useContext', 'useCallback'],
            correctAnswer: 'useState',
            points: 10,
            timeLimit: 30,
            hints: ['It has "state" in the name'],
            explanation: 'useState is the primary hook for adding state to functional components.'
        },
        // Difficulty 3-4: Elementary
        {
            id: 'react_3',
            skill: 'React',
            difficulty: 3,
            question: 'What is the purpose of the useEffect hook?',
            type: 'multiple_choice',
            options: [
                'To create reusable components',
                'To perform side effects in components',
                'To style components',
                'To handle routing'
            ],
            correctAnswer: 'To perform side effects in components',
            points: 15,
            timeLimit: 45,
            hints: ['Think about data fetching, subscriptions'],
            explanation: 'useEffect is used for side effects like data fetching, subscriptions, or DOM mutations.'
        },
        {
            id: 'react_4',
            skill: 'React',
            difficulty: 4,
            question: 'What is the virtual DOM in React?',
            type: 'multiple_choice',
            options: [
                'The actual browser DOM',
                'A lightweight copy of the real DOM for efficient updates',
                'A database for storing components',
                'A styling engine'
            ],
            correctAnswer: 'A lightweight copy of the real DOM for efficient updates',
            points: 15,
            timeLimit: 45,
            hints: ['React uses it for performance optimization'],
            explanation: 'The virtual DOM is a programming concept where an ideal, or "virtual", representation of a UI is kept in memory.'
        },
        // Difficulty 5-6: Mid-Level
        {
            id: 'react_5',
            skill: 'React',
            difficulty: 5,
            question: 'What is the correct way to prevent a useEffect from running on every render?',
            type: 'multiple_choice',
            options: [
                'Use useCallback inside useEffect',
                'Pass an empty dependency array',
                'Use useState instead',
                'Wrap in React.memo'
            ],
            correctAnswer: 'Pass an empty dependency array',
            points: 20,
            timeLimit: 60,
            hints: ['Think about the second argument of useEffect'],
            explanation: 'An empty dependency array [] causes useEffect to run only on mount and unmount.'
        },
        {
            id: 'react_6',
            skill: 'React',
            difficulty: 6,
            question: 'What is the purpose of React.memo()?',
            type: 'multiple_choice',
            options: [
                'To memoize state values',
                'To prevent unnecessary re-renders of components',
                'To store data in localStorage',
                'To create higher-order components'
            ],
            correctAnswer: 'To prevent unnecessary re-renders of components',
            points: 20,
            timeLimit: 60,
            hints: ['It is a performance optimization technique'],
            explanation: 'React.memo is a higher-order component that memoizes the result of a component.'
        },
        // Difficulty 7-8: Advanced
        {
            id: 'react_7',
            skill: 'React',
            difficulty: 7,
            question: 'What is the difference between useCallback and useMemo?',
            type: 'open_ended',
            points: 25,
            timeLimit: 120,
            hints: ['One returns a function, one returns a value'],
            explanation: 'useCallback memoizes a function, while useMemo memoizes the result of a function call.'
        },
        {
            id: 'react_8',
            skill: 'React',
            difficulty: 8,
            question: 'Explain how React\'s reconciliation algorithm works and when it performs O(n) vs O(n³) updates.',
            type: 'open_ended',
            points: 30,
            timeLimit: 180,
            hints: ['Consider the key prop and tree diffing'],
            explanation: 'React uses keys to efficiently diff lists. Without keys, worst case is O(n³).'
        },
        // Difficulty 9-10: Expert
        {
            id: 'react_9',
            skill: 'React',
            difficulty: 9,
            question: 'How would you implement an optimistic UI update pattern with error recovery in a React application?',
            type: 'open_ended',
            points: 35,
            timeLimit: 240,
            hints: ['Think about state snapshots and rollback'],
            explanation: 'Optimistic updates show expected state immediately, then rollback on error.'
        },
        {
            id: 'react_10',
            skill: 'React',
            difficulty: 10,
            question: 'Design a React architecture for a real-time collaborative editing application. Address state synchronization, conflict resolution, and offline support.',
            type: 'open_ended',
            points: 40,
            timeLimit: 300,
            hints: ['Consider CRDT, operational transform, WebSockets'],
            explanation: 'This requires understanding of distributed systems concepts in a React context.'
        }
    ],
    'Python': [
        // Similar structure for Python...
        {
            id: 'python_1',
            skill: 'Python',
            difficulty: 1,
            question: 'What keyword is used to define a function in Python?',
            type: 'multiple_choice',
            options: ['function', 'def', 'fn', 'define'],
            correctAnswer: 'def',
            points: 10,
            timeLimit: 30,
            hints: ['It is a short word'],
            explanation: 'The "def" keyword is used to define functions in Python.'
        },
        {
            id: 'python_5',
            skill: 'Python',
            difficulty: 5,
            question: 'What is a Python decorator?',
            type: 'multiple_choice',
            options: [
                'A way to add visual decorations to output',
                'A function that modifies the behavior of other functions',
                'A CSS styling method',
                'A type of loop'
            ],
            correctAnswer: 'A function that modifies the behavior of other functions',
            points: 20,
            timeLimit: 60,
            hints: ['Uses @ symbol'],
            explanation: 'Decorators are a way to modify or extend functions without changing their code.'
        },
        {
            id: 'python_9',
            skill: 'Python',
            difficulty: 9,
            question: 'Explain how Python\'s GIL works and strategies to achieve true parallelism.',
            type: 'open_ended',
            points: 35,
            timeLimit: 240,
            hints: ['Global Interpreter Lock, multiprocessing'],
            explanation: 'GIL prevents true multi-threading. Use multiprocessing or async for parallelism.'
        }
    ]
};

// =====================================================
// ADAPTIVE ENGINE
// =====================================================

/**
 * Initialize a new adaptive session
 */
export const initializeSession = (config: AdaptiveSessionConfig): CandidateState => {
    return {
        currentAbility: config.startingDifficulty,
        confidence: 0.3, // Low initial confidence
        questionsAnswered: 0,
        correctAnswers: 0,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        responseHistory: [],
        difficultyHistory: [config.startingDifficulty]
    };
};

/**
 * Select the next question based on current ability estimate
 */
export const selectNextQuestion = (
    skill: string,
    state: CandidateState,
    usedQuestionIds: Set<string>
): AdaptiveQuestion | null => {
    const questions = ADAPTIVE_QUESTIONS[skill] || [];

    // Filter out already used questions
    const available = questions.filter(q => !usedQuestionIds.has(q.id));
    if (available.length === 0) return null;

    // Target difficulty based on current ability (with slight challenge)
    const targetDifficulty = Math.min(10, state.currentAbility + 0.5);

    // Find closest match
    const sorted = available.sort((a, b) =>
        Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty)
    );

    return sorted[0];
};

/**
 * Update ability estimate based on response using IRT-like model
 */
export const updateAbilityEstimate = (
    state: CandidateState,
    response: ResponseRecord,
    adaptationRate: number = 0.5
): CandidateState => {
    const { difficulty, isCorrect, responseTime, partialCredit = isCorrect ? 1 : 0 } = response;

    // Calculate expected probability of correct response at this difficulty
    const expectedProb = 1 / (1 + Math.exp(-(state.currentAbility - difficulty)));

    // Update based on actual result vs expected
    let abilityDelta: number;
    if (isCorrect) {
        // Correct answer above expected difficulty -> increase more
        abilityDelta = adaptationRate * (1 - expectedProb) * partialCredit;
    } else {
        // Incorrect answer below expected difficulty -> decrease more
        abilityDelta = -adaptationRate * expectedProb;
    }

    // Time-based adjustment (faster = higher ability)
    const timeFactor = Math.max(0.8, Math.min(1.2, 30 / responseTime));
    abilityDelta *= timeFactor;

    const newAbility = Math.max(1, Math.min(10, state.currentAbility + abilityDelta));

    // Update confidence (increases with more questions)
    const newConfidence = Math.min(0.95, 0.3 + (state.questionsAnswered + 1) * 0.1);

    // Track consecutive correct/incorrect
    const newConsecCorrect = isCorrect ? state.consecutiveCorrect + 1 : 0;
    const newConsecIncorrect = isCorrect ? 0 : state.consecutiveIncorrect + 1;

    return {
        currentAbility: newAbility,
        confidence: newConfidence,
        questionsAnswered: state.questionsAnswered + 1,
        correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
        consecutiveCorrect: newConsecCorrect,
        consecutiveIncorrect: newConsecIncorrect,
        responseHistory: [...state.responseHistory, response],
        difficultyHistory: [...state.difficultyHistory, newAbility]
    };
};

/**
 * Check if assessment should terminate early
 */
export const shouldTerminate = (
    state: CandidateState,
    config: AdaptiveSessionConfig
): { terminate: boolean; reason?: string } => {
    // Minimum questions not met
    if (state.questionsAnswered < config.minQuestions) {
        return { terminate: false };
    }

    // Maximum questions reached
    if (state.questionsAnswered >= config.targetQuestions) {
        return { terminate: true, reason: 'Maximum questions reached' };
    }

    // High confidence in ability estimate
    if (state.confidence >= config.terminationConfidence) {
        return { terminate: true, reason: 'Confidence threshold reached' };
    }

    // Consistent performance (5+ consecutive correct/incorrect)
    if (state.consecutiveCorrect >= 5) {
        return { terminate: true, reason: 'Consistent high performance' };
    }
    if (state.consecutiveIncorrect >= 4) {
        return { terminate: true, reason: 'Consistent low performance' };
    }

    return { terminate: false };
};

/**
 * Convert numeric ability to difficulty level
 */
export const abilityToLevel = (ability: number): DifficultyLevel => {
    if (ability <= 3) return 'Beginner';
    if (ability <= 7) return 'Mid-Level';
    return 'Advanced';
};

/**
 * Calculate percentile rank from ability
 */
export const abilityToPercentile = (ability: number): number => {
    // Simple sigmoid transformation
    const percentile = 100 / (1 + Math.exp(-(ability - 5) * 0.8));
    return Math.round(percentile);
};

/**
 * Generate final result from session state
 */
export const generateResult = (
    state: CandidateState,
    skill: string
): AdaptiveResult => {
    const accuracy = state.questionsAnswered > 0
        ? (state.correctAnswers / state.questionsAnswered) * 100
        : 0;

    const avgResponseTime = state.responseHistory.length > 0
        ? state.responseHistory.reduce((sum, r) => sum + r.responseTime, 0) / state.responseHistory.length
        : 0;

    // Identify strength/weakness areas based on difficulty performance
    const byDifficulty: Record<string, { correct: number; total: number }> = {};
    state.responseHistory.forEach(r => {
        const diffRange = r.difficulty <= 3 ? 'basics' : r.difficulty <= 6 ? 'intermediate' : 'advanced';
        if (!byDifficulty[diffRange]) byDifficulty[diffRange] = { correct: 0, total: 0 };
        byDifficulty[diffRange].total++;
        if (r.isCorrect) byDifficulty[diffRange].correct++;
    });

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    Object.entries(byDifficulty).forEach(([range, stats]) => {
        const rate = stats.correct / stats.total;
        if (rate >= 0.7) {
            strengths.push(`Strong ${range} ${skill} knowledge`);
        } else if (rate < 0.4 && stats.total >= 2) {
            weaknesses.push(`${range.charAt(0).toUpperCase() + range.slice(1)} ${skill} concepts need review`);
        }
    });

    return {
        estimatedAbility: Math.round(state.currentAbility * 10) / 10,
        abilityLevel: abilityToLevel(state.currentAbility),
        confidence: Math.round(state.confidence * 100) / 100,
        percentileRank: abilityToPercentile(state.currentAbility),
        questionsAnswered: state.questionsAnswered,
        accuracy: Math.round(accuracy),
        averageResponseTime: Math.round(avgResponseTime / 1000), // seconds
        strengthAreas: strengths.length > 0 ? strengths : ['Consistent performance across levels'],
        weaknessAreas: weaknesses.length > 0 ? weaknesses : ['Keep practicing for mastery'],
        recommendedLevel: abilityToLevel(state.currentAbility)
    };
};

/**
 * Get questions for a skill (for preview/admin)
 */
export const getQuestionsForSkill = (skill: string): AdaptiveQuestion[] => {
    return ADAPTIVE_QUESTIONS[skill] || [];
};

/**
 * Get all available skills with adaptive questions
 */
export const getAvailableSkills = (): string[] => {
    return Object.keys(ADAPTIVE_QUESTIONS);
};
