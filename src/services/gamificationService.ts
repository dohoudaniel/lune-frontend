/**
 * Gamification Service
 * Manages achievements, XP, streaks, and leaderboards
 */

// =====================================================
// INTERFACES
// =====================================================

export interface UserGamification {
    userId: string;
    level: number;
    currentXP: number;
    totalXP: number;
    xpToNextLevel: number;
    streak: {
        current: number;
        longest: number;
        lastActivityDate: string;
    };
    achievements: Achievement[];
    unlockedAt: Record<string, string>; // achievementId -> date
    dailyChallenges: DailyChallenge[];
    weeklyProgress: WeeklyProgress;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'assessment' | 'streak' | 'social' | 'mastery' | 'special';
    xpReward: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    requirement: {
        type: string;
        target: number;
    };
    progress?: number;
    unlocked: boolean;
}

export interface DailyChallenge {
    id: string;
    title: string;
    description: string;
    type: 'assessment' | 'learning' | 'practice';
    xpReward: number;
    requirement: {
        type: string;
        target: number;
        current: number;
    };
    completed: boolean;
    expiresAt: string;
}

export interface WeeklyProgress {
    weekStart: string;
    goals: {
        assessments: { target: number; current: number };
        score: { target: number; current: number };
        streak: { target: number; current: number };
    };
    bonusXP: number;
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    userName: string;
    userAvatar?: string;
    score: number;
    level: number;
    badges: string[];
}

// =====================================================
// CONSTANTS
// =====================================================

const STORAGE_KEY = 'lune_gamification';
const XP_PER_LEVEL = 1000;
const STREAK_BONUS_XP = 50;
const DAILY_CHALLENGE_COUNT = 3;

// Achievement definitions
const ACHIEVEMENTS: Omit<Achievement, 'progress' | 'unlocked'>[] = [
    // Assessment achievements
    {
        id: 'first_assessment',
        name: 'First Steps',
        description: 'Complete your first assessment',
        icon: '🎯',
        category: 'assessment',
        xpReward: 100,
        rarity: 'common',
        requirement: { type: 'assessments_completed', target: 1 }
    },
    {
        id: 'assessment_10',
        name: 'Getting Started',
        description: 'Complete 10 assessments',
        icon: '📊',
        category: 'assessment',
        xpReward: 250,
        rarity: 'common',
        requirement: { type: 'assessments_completed', target: 10 }
    },
    {
        id: 'assessment_50',
        name: 'Assessment Pro',
        description: 'Complete 50 assessments',
        icon: '🏆',
        category: 'assessment',
        xpReward: 500,
        rarity: 'rare',
        requirement: { type: 'assessments_completed', target: 50 }
    },
    {
        id: 'perfect_score',
        name: 'Perfectionist',
        description: 'Score 100% on any assessment',
        icon: '💯',
        category: 'assessment',
        xpReward: 300,
        rarity: 'rare',
        requirement: { type: 'perfect_scores', target: 1 }
    },
    {
        id: 'high_scorer',
        name: 'High Achiever',
        description: 'Score 90%+ on 10 assessments',
        icon: '⭐',
        category: 'assessment',
        xpReward: 500,
        rarity: 'epic',
        requirement: { type: 'high_scores', target: 10 }
    },

    // Streak achievements
    {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        category: 'streak',
        xpReward: 200,
        rarity: 'common',
        requirement: { type: 'streak_days', target: 7 }
    },
    {
        id: 'streak_30',
        name: 'Monthly Master',
        description: 'Maintain a 30-day streak',
        icon: '🌟',
        category: 'streak',
        xpReward: 500,
        rarity: 'rare',
        requirement: { type: 'streak_days', target: 30 }
    },
    {
        id: 'streak_100',
        name: 'Unstoppable',
        description: 'Maintain a 100-day streak',
        icon: '💎',
        category: 'streak',
        xpReward: 1500,
        rarity: 'legendary',
        requirement: { type: 'streak_days', target: 100 }
    },

    // Mastery achievements
    {
        id: 'first_certificate',
        name: 'Certified',
        description: 'Earn your first certificate',
        icon: '📜',
        category: 'mastery',
        xpReward: 200,
        rarity: 'common',
        requirement: { type: 'certificates_earned', target: 1 }
    },
    {
        id: 'multi_skill',
        name: 'Multi-Talented',
        description: 'Earn certificates in 5 different skills',
        icon: '🌈',
        category: 'mastery',
        xpReward: 750,
        rarity: 'epic',
        requirement: { type: 'unique_skills', target: 5 }
    },
    {
        id: 'advanced_master',
        name: 'Advanced Master',
        description: 'Pass 3 advanced-level assessments',
        icon: '🎖️',
        category: 'mastery',
        xpReward: 600,
        rarity: 'epic',
        requirement: { type: 'advanced_passed', target: 3 }
    },

    // Special achievements
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Complete an assessment before 8 AM',
        icon: '🌅',
        category: 'special',
        xpReward: 150,
        rarity: 'rare',
        requirement: { type: 'early_assessment', target: 1 }
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete an assessment after 10 PM',
        icon: '🦉',
        category: 'special',
        xpReward: 150,
        rarity: 'rare',
        requirement: { type: 'late_assessment', target: 1 }
    },
    {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete an assessment in under 5 minutes',
        icon: '⚡',
        category: 'special',
        xpReward: 200,
        rarity: 'rare',
        requirement: { type: 'fast_completion', target: 1 }
    },
    {
        id: 'comeback_kid',
        name: 'Comeback Kid',
        description: 'Pass an assessment after failing it twice',
        icon: '💪',
        category: 'special',
        xpReward: 300,
        rarity: 'epic',
        requirement: { type: 'comeback_victory', target: 1 }
    }
];

// =====================================================
// STORAGE
// =====================================================

import { api } from '../lib/api';

let cachedGamificationData: Record<string, UserGamification> = {};

export const initializeGamification = async (userId: string) => {
    try {
        const [stats, achievementsData] = await Promise.all([
            api.get('/users/me/statistics/'),
            api.get('/users/me/achievements/'),
        ]);

        if (stats) {
            const user = initializeUser(userId);
            // Always use server values — do not override with stale localStorage
            user.totalXP = (stats as any).total_points ?? 0;
            user.currentXP = user.totalXP % XP_PER_LEVEL;
            user.level = Math.floor(user.totalXP / XP_PER_LEVEL) + 1;
            user.xpToNextLevel = calculateXPForLevel(user.level + 1);
            user.streak.current = (stats as any).current_streak ?? 0;
            user.streak.longest = (stats as any).longest_streak ?? 0;

            if (Array.isArray(achievementsData)) {
                (achievementsData as any[]).forEach((a: any) => {
                    const localAch = user.achievements.find(la => la.id === a.achievement_id);
                    if (localAch) {
                        localAch.unlocked = true;
                        user.unlockedAt[a.achievement_id] = a.earned_at;
                    }
                });
            }

            const data = getStoredData();
            data[userId] = user;
            saveData(data);
        }
    } catch (err) {
        console.error('Failed to init gamification:', err);
    }
};

// In-memory only — streak & XP are the authoritative backend values.
// localStorage is no longer used as source of truth.
const getStoredData = (): Record<string, UserGamification> => {
    return cachedGamificationData;
};

const saveData = (data: Record<string, UserGamification>): void => {
    // Only update the in-memory cache. Streak/XP are computed server-side via
    // recalculate_user_stats and fetched on login via initializeGamification.
    cachedGamificationData = data;
};

// =====================================================
// USER GAMIFICATION
// =====================================================

/**
 * Initialize gamification for a new user
 */
export const initializeUser = (userId: string): UserGamification => {
    const data = getStoredData();

    if (data[userId]) {
        return data[userId];
    }

    const newUser: UserGamification = {
        userId,
        level: 1,
        currentXP: 0,
        totalXP: 0,
        xpToNextLevel: XP_PER_LEVEL,
        streak: {
            current: 0,
            longest: 0,
            lastActivityDate: ''
        },
        achievements: ACHIEVEMENTS.map(a => ({ ...a, progress: 0, unlocked: false })),
        unlockedAt: {},
        dailyChallenges: generateDailyChallenges(),
        weeklyProgress: generateWeeklyProgress()
    };

    data[userId] = newUser;
    saveData(data);

    return newUser;
};

/**
 * Get user gamification data
 */
export const getUserGamification = (userId: string): UserGamification => {
    const data = getStoredData();
    return data[userId] || initializeUser(userId);
};

/**
 * Award XP to user
 */
export const awardXP = (userId: string, amount: number, reason: string): {
    newXP: number;
    leveledUp: boolean;
    newLevel?: number;
} => {
    const data = getStoredData();
    const user = data[userId] || initializeUser(userId);

    user.currentXP += amount;
    user.totalXP += amount;

    let leveledUp = false;
    let newLevel = user.level;

    // Check for level up
    while (user.currentXP >= user.xpToNextLevel) {
        user.currentXP -= user.xpToNextLevel;
        user.level += 1;
        user.xpToNextLevel = calculateXPForLevel(user.level + 1);
        leveledUp = true;
        newLevel = user.level;
    }

    data[userId] = user;
    saveData(data);

    return { newXP: user.currentXP, leveledUp, newLevel: leveledUp ? newLevel : undefined };
};

/**
 * Calculate XP needed for a level
 */
const calculateXPForLevel = (level: number): number => {
    return Math.floor(XP_PER_LEVEL * Math.pow(1.1, level - 1));
};

/**
 * Update streak — streak is now computed server-side by recalculate_user_stats().
 * This function refreshes the local cache from the backend and returns the
 * server-authoritative streak value. Call after every assessment submission.
 */
export const updateStreak = async (userId: string): Promise<{
    newStreak: number;
    bonus: number;
    streakBroken: boolean;
}> => {
    try {
        const stats = await api.get('/users/me/statistics/') as any;
        const data = getStoredData();
        const user = data[userId] || initializeUser(userId);

        const prevStreak = user.streak.current;
        user.streak.current = stats?.current_streak ?? user.streak.current;
        user.streak.longest = stats?.longest_streak ?? user.streak.longest;
        user.totalXP = stats?.total_points ?? user.totalXP;
        user.currentXP = user.totalXP % XP_PER_LEVEL;
        user.level = Math.floor(user.totalXP / XP_PER_LEVEL) + 1;

        data[userId] = user;
        saveData(data);

        const streakBroken = user.streak.current < prevStreak && prevStreak > 0;
        const bonus = user.streak.current > prevStreak ? STREAK_BONUS_XP * Math.min(user.streak.current, 10) : 0;
        return { newStreak: user.streak.current, bonus, streakBroken };
    } catch {
        const user = getStoredData()[userId];
        return { newStreak: user?.streak?.current ?? 0, bonus: 0, streakBroken: false };
    }
};

/**
 * Check and unlock achievements
 */
export const checkAchievements = (userId: string, stats: {
    assessmentsCompleted?: number;
    perfectScores?: number;
    highScores?: number;
    certificatesEarned?: number;
    uniqueSkills?: number;
    advancedPassed?: number;
    streakDays?: number;
    earlyAssessment?: boolean;
    lateAssessment?: boolean;
    fastCompletion?: boolean;
    comebackVictory?: boolean;
}): Achievement[] => {
    const data = getStoredData();
    const user = data[userId] || initializeUser(userId);

    const newlyUnlocked: Achievement[] = [];

    user.achievements.forEach(achievement => {
        if (achievement.unlocked) return;

        let currentProgress = 0;
        const reqType = achievement.requirement.type;

        switch (reqType) {
            case 'assessments_completed':
                currentProgress = stats.assessmentsCompleted || 0;
                break;
            case 'perfect_scores':
                currentProgress = stats.perfectScores || 0;
                break;
            case 'high_scores':
                currentProgress = stats.highScores || 0;
                break;
            case 'certificates_earned':
                currentProgress = stats.certificatesEarned || 0;
                break;
            case 'unique_skills':
                currentProgress = stats.uniqueSkills || 0;
                break;
            case 'advanced_passed':
                currentProgress = stats.advancedPassed || 0;
                break;
            case 'streak_days':
                currentProgress = stats.streakDays || user.streak.current;
                break;
            case 'early_assessment':
                currentProgress = stats.earlyAssessment ? 1 : 0;
                break;
            case 'late_assessment':
                currentProgress = stats.lateAssessment ? 1 : 0;
                break;
            case 'fast_completion':
                currentProgress = stats.fastCompletion ? 1 : 0;
                break;
            case 'comeback_victory':
                currentProgress = stats.comebackVictory ? 1 : 0;
                break;
        }

        achievement.progress = currentProgress;

        if (currentProgress >= achievement.requirement.target) {
            achievement.unlocked = true;
            user.unlockedAt[achievement.id] = new Date().toISOString();
            newlyUnlocked.push(achievement);
        }
    });

    data[userId] = user;
    saveData(data);

    // Persist newly unlocked achievements to backend
    if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach(ach => {
            api.post('/users/me/achievements/', {
                achievement_id: ach.id,
                achievement_type: ach.category,
                achievement_name: ach.name,
                description: ach.description,
                points: ach.xpReward,
            }).catch(() => {});  // fire-and-forget, non-fatal
        });
    }

    return newlyUnlocked;
};

/**
 * Generate daily challenges
 */
const generateDailyChallenges = (): DailyChallenge[] => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return [
        {
            id: 'daily_1',
            title: 'Quick Learner',
            description: 'Complete any assessment',
            type: 'assessment',
            xpReward: 50,
            requirement: { type: 'complete_assessment', target: 1, current: 0 },
            completed: false,
            expiresAt: tomorrow.toISOString()
        },
        {
            id: 'daily_2',
            title: 'Score High',
            description: 'Score 80% or higher on an assessment',
            type: 'assessment',
            xpReward: 75,
            requirement: { type: 'score_80_plus', target: 1, current: 0 },
            completed: false,
            expiresAt: tomorrow.toISOString()
        },
        {
            id: 'daily_3',
            title: 'Practice Makes Perfect',
            description: 'Spend 15 minutes practicing',
            type: 'practice',
            xpReward: 40,
            requirement: { type: 'practice_minutes', target: 15, current: 0 },
            completed: false,
            expiresAt: tomorrow.toISOString()
        }
    ];
};

/**
 * Generate weekly progress goals
 */
const generateWeeklyProgress = (): WeeklyProgress => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    return {
        weekStart: weekStart.toISOString(),
        goals: {
            assessments: { target: 5, current: 0 },
            score: { target: 75, current: 0 },
            streak: { target: 7, current: 0 }
        },
        bonusXP: 500
    };
};

/**
 * Update daily challenge progress
 */
export const updateDailyChallenge = (userId: string, challengeId: string, progress: number): boolean => {
    const data = getStoredData();
    const user = data[userId] || initializeUser(userId);

    const challenge = user.dailyChallenges.find(c => c.id === challengeId);
    if (!challenge || challenge.completed) return false;

    challenge.requirement.current = progress;

    if (challenge.requirement.current >= challenge.requirement.target) {
        challenge.completed = true;
        user.currentXP += challenge.xpReward;
        user.totalXP += challenge.xpReward;

        data[userId] = user;
        saveData(data);
        return true;
    }

    data[userId] = user;
    saveData(data);
    return false;
};

/**
 * Get leaderboard
 */
export const getLeaderboard = (type: 'xp' | 'streak' | 'assessments' = 'xp', limit: number = 10): LeaderboardEntry[] => {
    const data = getStoredData();

    const entries: LeaderboardEntry[] = (Object.values(data) as UserGamification[]).map(user => ({
        rank: 0,
        userId: user.userId,
        userName: `User ${user.userId.slice(-4)}`, // Anonymous
        score: type === 'xp' ? user.totalXP : type === 'streak' ? user.streak.longest : user.achievements.filter(a => a.unlocked).length,
        level: user.level,
        badges: user.achievements.filter(a => a.unlocked && a.rarity === 'legendary').map(a => a.icon)
    }));

    entries.sort((a, b) => b.score - a.score);

    return entries.slice(0, limit).map((entry, idx) => ({
        ...entry,
        rank: idx + 1
    }));
};

/**
 * Get user rank
 */
export const getUserRank = (userId: string): number => {
    const leaderboard = getLeaderboard('xp', 1000);
    const userEntry = leaderboard.find(e => e.userId === userId);
    return userEntry?.rank || leaderboard.length + 1;
};
