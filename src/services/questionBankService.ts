/**
 * Question Bank Service
 * Manages a repository of manually curated assessment questions
 */

import { DifficultyLevel, AssessmentType } from '../types';

// =====================================================
// INTERFACES
// =====================================================

export interface Question {
    id: string;
    skill: string;
    category: string;
    difficulty: DifficultyLevel;
    assessmentType: AssessmentType;

    // Question Content
    type: 'multiple_choice' | 'open_ended' | 'code' | 'scenario' | 'written';
    question: string;
    context?: string; // Background information for scenario questions

    // For multiple choice
    options?: string[];
    correctAnswer?: string;

    // For code questions
    codeTemplate?: string;
    testCases?: { input: string; expectedOutput: string }[];
    language?: string;

    // For written/scenario
    rubric?: {
        criteria: string;
        weight: number;
        description: string;
    }[];
    sampleAnswer?: string;
    wordLimit?: number;

    // Metadata
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    timesUsed: number;
    avgScore: number;
    tags: string[];
    isActive: boolean;

    // Review status
    reviewStatus: 'draft' | 'pending_review' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewNotes?: string;
}

export interface QuestionBank {
    id: string;
    name: string;
    description: string;
    skill: string;
    category: string;
    questions: string[]; // Question IDs
    createdBy: string;
    createdAt: string;
    isPublic: boolean;
}

export interface QuestionFilter {
    skill?: string;
    category?: string;
    difficulty?: DifficultyLevel;
    type?: Question['type'];
    assessmentType?: AssessmentType;
    reviewStatus?: Question['reviewStatus'];
    tags?: string[];
    isActive?: boolean;
}

// =====================================================
// STORAGE
// =====================================================

const QUESTIONS_KEY = 'lune_question_bank';
const BANKS_KEY = 'lune_question_banks';

const getStoredQuestions = (): Question[] => {
    try {
        const stored = localStorage.getItem(QUESTIONS_KEY);
        return stored ? JSON.parse(stored) : getSeedQuestions();
    } catch {
        return getSeedQuestions();
    }
};

const saveQuestions = (questions: Question[]): void => {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
};

const getStoredBanks = (): QuestionBank[] => {
    try {
        const stored = localStorage.getItem(BANKS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveBanks = (banks: QuestionBank[]): void => {
    localStorage.setItem(BANKS_KEY, JSON.stringify(banks));
};

// =====================================================
// SEED DATA
// =====================================================

const getSeedQuestions = (): Question[] => [
    // React Questions
    {
        id: 'q_react_1',
        skill: 'React',
        category: 'frontend',
        difficulty: 'Beginner',
        assessmentType: 'code',
        type: 'multiple_choice',
        question: 'What hook would you use to perform side effects in a functional component?',
        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
        correctAnswer: 'useEffect',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timesUsed: 0,
        avgScore: 0,
        tags: ['hooks', 'basics', 'functional-components'],
        isActive: true,
        reviewStatus: 'approved'
    },
    {
        id: 'q_react_2',
        skill: 'React',
        category: 'frontend',
        difficulty: 'Mid-Level',
        assessmentType: 'code',
        type: 'code',
        question: 'Create a custom hook called useDebounce that delays updating a value.',
        context: 'Debouncing is useful for search inputs to avoid making API calls on every keystroke.',
        codeTemplate: `import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {
  // Implement debounce logic here
  
}`,
        testCases: [
            { input: 'useDebounce("test", 500)', expectedOutput: 'Returns debounced value after delay' }
        ],
        language: 'typescript',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timesUsed: 0,
        avgScore: 0,
        tags: ['hooks', 'custom-hooks', 'performance'],
        isActive: true,
        reviewStatus: 'approved'
    },
    // Customer Service Questions
    {
        id: 'q_cs_1',
        skill: 'Customer Support Representative',
        category: 'customer_service',
        difficulty: 'Beginner',
        assessmentType: 'scenario',
        type: 'scenario',
        question: 'How would you handle a customer who is upset about a delayed order?',
        context: 'A customer calls in frustrated because their order was supposed to arrive 3 days ago. They have an important event tomorrow and needed the item for it.',
        rubric: [
            { criteria: 'Empathy', weight: 25, description: 'Shows understanding of customer frustration' },
            { criteria: 'Problem Solving', weight: 30, description: 'Offers concrete solutions' },
            { criteria: 'Communication', weight: 25, description: 'Clear and professional tone' },
            { criteria: 'Resolution', weight: 20, description: 'Provides satisfactory outcome' }
        ],
        sampleAnswer: 'I completely understand how frustrating this must be, especially with your important event tomorrow. Let me look into this right away. I see the delay was due to a shipping issue. I can offer you expedited overnight shipping at no extra cost, or if you prefer, a full refund plus a discount on your next order. Which would work better for you?',
        wordLimit: 200,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timesUsed: 0,
        avgScore: 0,
        tags: ['complaint-handling', 'empathy', 'problem-solving'],
        isActive: true,
        reviewStatus: 'approved'
    },
    // Sales Questions
    {
        id: 'q_sales_1',
        skill: 'Sales Representative',
        category: 'sales',
        difficulty: 'Mid-Level',
        assessmentType: 'scenario',
        type: 'scenario',
        question: 'How would you handle a prospect who says "Your product is too expensive"?',
        context: 'You are selling a SaaS product to a mid-size company. After your demo, the decision-maker expresses concern about the price being 30% higher than competitors.',
        rubric: [
            { criteria: 'Value Articulation', weight: 30, description: 'Clearly explains value vs price' },
            { criteria: 'Objection Handling', weight: 25, description: 'Addresses concern professionally' },
            { criteria: 'Discovery', weight: 20, description: 'Asks questions to understand needs' },
            { criteria: 'Closing', weight: 25, description: 'Moves conversation forward' }
        ],
        sampleAnswer: 'I appreciate you sharing that concern. Before we discuss pricing, may I ask - what would the cost be to your business if you continue with your current solution? Our clients typically see a 40% reduction in manual work within 3 months. When you factor in time savings and error reduction, the ROI usually exceeds the price difference within the first quarter. Would it help if we looked at a pilot program to demonstrate this value?',
        wordLimit: 250,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timesUsed: 0,
        avgScore: 0,
        tags: ['objection-handling', 'price-negotiation', 'value-selling'],
        isActive: true,
        reviewStatus: 'approved'
    },
    // Excel Questions
    {
        id: 'q_excel_1',
        skill: 'Microsoft Excel',
        category: 'office_tools',
        difficulty: 'Beginner',
        assessmentType: 'spreadsheet',
        type: 'multiple_choice',
        question: 'Which formula would you use to find the average of values in cells A1 through A10?',
        options: ['=SUM(A1:A10)', '=AVERAGE(A1:A10)', '=MEAN(A1:A10)', '=AVG(A1:A10)'],
        correctAnswer: '=AVERAGE(A1:A10)',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timesUsed: 0,
        avgScore: 0,
        tags: ['formulas', 'basics'],
        isActive: true,
        reviewStatus: 'approved'
    },
    // Python Questions
    {
        id: 'q_python_1',
        skill: 'Python',
        category: 'backend',
        difficulty: 'Advanced',
        assessmentType: 'code',
        type: 'code',
        question: 'Implement a function that finds the longest palindromic substring.',
        context: 'A palindrome reads the same forwards and backwards. Your solution should be O(n²) or better.',
        codeTemplate: `def longest_palindrome(s: str) -> str:
    """
    Find the longest palindromic substring in s.
    
    Args:
        s: Input string
    Returns:
        The longest palindromic substring
    """
    # Your implementation here
    pass`,
        testCases: [
            { input: '"babad"', expectedOutput: '"bab" or "aba"' },
            { input: '"cbbd"', expectedOutput: '"bb"' },
            { input: '"a"', expectedOutput: '"a"' }
        ],
        language: 'python',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timesUsed: 0,
        avgScore: 0,
        tags: ['algorithms', 'strings', 'dynamic-programming'],
        isActive: true,
        reviewStatus: 'approved'
    }
];

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Get all questions with optional filtering
 */
export const getQuestions = (filter?: QuestionFilter): Question[] => {
    let questions = getStoredQuestions();

    if (filter) {
        if (filter.skill) {
            questions = questions.filter(q => q.skill === filter.skill);
        }
        if (filter.category) {
            questions = questions.filter(q => q.category === filter.category);
        }
        if (filter.difficulty) {
            questions = questions.filter(q => q.difficulty === filter.difficulty);
        }
        if (filter.type) {
            questions = questions.filter(q => q.type === filter.type);
        }
        if (filter.assessmentType) {
            questions = questions.filter(q => q.assessmentType === filter.assessmentType);
        }
        if (filter.reviewStatus) {
            questions = questions.filter(q => q.reviewStatus === filter.reviewStatus);
        }
        if (filter.isActive !== undefined) {
            questions = questions.filter(q => q.isActive === filter.isActive);
        }
        if (filter.tags && filter.tags.length > 0) {
            questions = questions.filter(q =>
                filter.tags!.some(tag => q.tags.includes(tag))
            );
        }
    }

    return questions;
};

/**
 * Get a single question by ID
 */
export const getQuestionById = (id: string): Question | null => {
    const questions = getStoredQuestions();
    return questions.find(q => q.id === id) || null;
};

/**
 * Create a new question
 */
export const createQuestion = (
    question: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'timesUsed' | 'avgScore'>
): Question => {
    const questions = getStoredQuestions();

    const newQuestion: Question = {
        ...question,
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timesUsed: 0,
        avgScore: 0
    };

    questions.push(newQuestion);
    saveQuestions(questions);

    return newQuestion;
};

/**
 * Update an existing question
 */
export const updateQuestion = (id: string, updates: Partial<Question>): Question | null => {
    const questions = getStoredQuestions();
    const index = questions.findIndex(q => q.id === id);

    if (index === -1) return null;

    questions[index] = {
        ...questions[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    saveQuestions(questions);
    return questions[index];
};

/**
 * Delete a question
 */
export const deleteQuestion = (id: string): boolean => {
    const questions = getStoredQuestions();
    const filtered = questions.filter(q => q.id !== id);

    if (filtered.length === questions.length) return false;

    saveQuestions(filtered);
    return true;
};

/**
 * Toggle question active status
 */
export const toggleQuestionActive = (id: string): Question | null => {
    const question = getQuestionById(id);
    if (!question) return null;

    return updateQuestion(id, { isActive: !question.isActive });
};

/**
 * Update question review status
 */
export const reviewQuestion = (
    id: string,
    status: Question['reviewStatus'],
    reviewedBy: string,
    notes?: string
): Question | null => {
    return updateQuestion(id, {
        reviewStatus: status,
        reviewedBy,
        reviewNotes: notes
    });
};

/**
 * Record question usage and update stats
 */
export const recordQuestionUsage = (id: string, score: number): void => {
    const question = getQuestionById(id);
    if (!question) return;

    const newTimesUsed = question.timesUsed + 1;
    const newAvgScore = ((question.avgScore * question.timesUsed) + score) / newTimesUsed;

    updateQuestion(id, {
        timesUsed: newTimesUsed,
        avgScore: Math.round(newAvgScore * 100) / 100
    });
};

// =====================================================
// QUESTION BANK OPERATIONS
// =====================================================

/**
 * Get all question banks
 */
export const getQuestionBanks = (): QuestionBank[] => {
    return getStoredBanks();
};

/**
 * Create a new question bank
 */
export const createQuestionBank = (
    bank: Omit<QuestionBank, 'id' | 'createdAt'>
): QuestionBank => {
    const banks = getStoredBanks();

    const newBank: QuestionBank = {
        ...bank,
        id: `bank_${Date.now()}`,
        createdAt: new Date().toISOString()
    };

    banks.push(newBank);
    saveBanks(banks);

    return newBank;
};

/**
 * Add question to bank
 */
export const addQuestionToBank = (bankId: string, questionId: string): boolean => {
    const banks = getStoredBanks();
    const bank = banks.find(b => b.id === bankId);

    if (!bank) return false;
    if (bank.questions.includes(questionId)) return false;

    bank.questions.push(questionId);
    saveBanks(banks);

    return true;
};

/**
 * Remove question from bank
 */
export const removeQuestionFromBank = (bankId: string, questionId: string): boolean => {
    const banks = getStoredBanks();
    const bank = banks.find(b => b.id === bankId);

    if (!bank) return false;

    bank.questions = bank.questions.filter(id => id !== questionId);
    saveBanks(banks);

    return true;
};

// =====================================================
// RANDOM QUESTION SELECTION
// =====================================================

/**
 * Get random questions for an assessment
 */
export const getRandomQuestions = (
    skill: string,
    difficulty: DifficultyLevel,
    count: number
): Question[] => {
    const questions = getQuestions({
        skill,
        difficulty,
        isActive: true,
        reviewStatus: 'approved'
    });

    // Shuffle and take count
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

/**
 * Get questions for a complete assessment
 * Returns a mix of difficulties based on overall difficulty level
 */
export const getAssessmentQuestions = (
    skill: string,
    overallDifficulty: DifficultyLevel,
    totalCount: number = 5
): Question[] => {
    const questions: Question[] = [];

    const difficultyMix: Record<DifficultyLevel, { Beginner: number; 'Mid-Level': number; Advanced: number }> = {
        'Beginner': { 'Beginner': 4, 'Mid-Level': 1, 'Advanced': 0 },
        'Mid-Level': { 'Beginner': 1, 'Mid-Level': 3, 'Advanced': 1 },
        'Advanced': { 'Beginner': 0, 'Mid-Level': 2, 'Advanced': 3 }
    };

    const mix = difficultyMix[overallDifficulty];

    Object.entries(mix).forEach(([diff, count]) => {
        if (count > 0) {
            const diffQuestions = getRandomQuestions(skill, diff as DifficultyLevel, count);
            questions.push(...diffQuestions);
        }
    });

    return questions.sort(() => Math.random() - 0.5).slice(0, totalCount);
};

// =====================================================
// ANALYTICS
// =====================================================

/**
 * Get question statistics by skill
 */
export const getQuestionStats = (skill?: string): {
    total: number;
    byDifficulty: Record<string, number>;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    avgPassRate: number;
} => {
    let questions = getStoredQuestions();

    if (skill) {
        questions = questions.filter(q => q.skill === skill);
    }

    const byDifficulty: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalScore = 0;
    let scoredCount = 0;

    questions.forEach(q => {
        byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
        byType[q.type] = (byType[q.type] || 0) + 1;
        byStatus[q.reviewStatus] = (byStatus[q.reviewStatus] || 0) + 1;

        if (q.timesUsed > 0) {
            totalScore += q.avgScore;
            scoredCount += 1;
        }
    });

    return {
        total: questions.length,
        byDifficulty,
        byType,
        byStatus,
        avgPassRate: scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0
    };
};
