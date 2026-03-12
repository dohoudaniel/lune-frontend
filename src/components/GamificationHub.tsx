import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Star, Trophy, Flame, Target, Award, Gift, Crown,
    ChevronUp, Lock, CheckCircle, TrendingUp, Calendar,
    Users, Medal, Sparkles, ArrowUp, Timer, Shield
} from 'lucide-react';
import {
    getUserGamification,
    updateStreak,
    checkAchievements,
    getLeaderboard,
    getUserRank,
    UserGamification,
    Achievement,
    LeaderboardEntry
} from '../services/gamificationService';

interface GamificationHubProps {
    userId: string;
    userName: string;
}

export const GamificationHub: React.FC<GamificationHubProps> = ({ userId, userName }) => {
    const [data, setData] = useState<UserGamification | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'challenges' | 'leaderboard'>('overview');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<number>(0);
    const [showAchievementModal, setShowAchievementModal] = useState<Achievement | null>(null);

    useEffect(() => {
        const gamification = getUserGamification(userId);
        setData(gamification);
        setLeaderboard(getLeaderboard('xp', 10));
        setUserRank(getUserRank(userId));

        // Update streak on load
        updateStreak(userId);
    }, [userId]);

    if (!data) return null;

    const xpProgress = (data.currentXP / data.xpToNextLevel) * 100;
    const unlockedAchievements = data.achievements.filter(a => a.unlocked);
    const lockedAchievements = data.achievements.filter(a => !a.unlocked);

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'from-gray-400 to-gray-500';
            case 'rare': return 'from-blue-400 to-blue-600';
            case 'epic': return 'from-purple-400 to-purple-600';
            case 'legendary': return 'from-yellow-400 to-orange-500';
            default: return 'from-gray-400 to-gray-500';
        }
    };

    const getRarityBg = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'bg-gray-100';
            case 'rare': return 'bg-blue-50';
            case 'epic': return 'bg-purple-50';
            case 'legendary': return 'bg-gradient-to-r from-yellow-50 to-orange-50';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/20"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            {/* Level Badge */}
                            <div className="relative">
                                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
                                    <span className="text-4xl font-bold text-white">{data.level}</span>
                                </div>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-0.5 rounded-full">
                                    <span className="text-xs text-white font-medium">Level</span>
                                </div>
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">{userName}</h1>
                                <div className="flex items-center gap-2 text-purple-300">
                                    <Trophy className="w-4 h-4" />
                                    <span>Rank #{userRank}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-6">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                                    <Flame className="w-5 h-5" />
                                    <span className="text-2xl font-bold">{data.streak.current}</span>
                                </div>
                                <p className="text-xs text-purple-300">Day Streak</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                                    <Star className="w-5 h-5" />
                                    <span className="text-2xl font-bold">{unlockedAchievements.length}</span>
                                </div>
                                <p className="text-xs text-purple-300">Achievements</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                                    <Zap className="w-5 h-5" />
                                    <span className="text-2xl font-bold">{data.totalXP.toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-purple-300">Total XP</p>
                            </div>
                        </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-sm text-purple-300 mb-2">
                            <span>Level {data.level}</span>
                            <span>{data.currentXP} / {data.xpToNextLevel} XP</span>
                            <span>Level {data.level + 1}</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${xpProgress}%` }}
                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { id: 'overview', label: 'Overview', icon: Target },
                        { id: 'achievements', label: 'Achievements', icon: Award },
                        { id: 'challenges', label: 'Challenges', icon: Timer },
                        { id: 'leaderboard', label: 'Leaderboard', icon: Crown }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition ${activeTab === tab.id
                                ? 'bg-white text-purple-900'
                                : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Daily Challenges */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl p-6 shadow-xl"
                        >
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-500" />
                                Daily Challenges
                            </h3>
                            <div className="space-y-3">
                                {data.dailyChallenges.map(challenge => (
                                    <div
                                        key={challenge.id}
                                        className={`p-4 rounded-xl border ${challenge.completed
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-900">{challenge.title}</span>
                                            <span className="text-xs font-bold text-purple-600">+{challenge.xpReward} XP</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">{challenge.description}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${challenge.completed ? 'bg-green-500' : 'bg-purple-500'}`}
                                                    style={{
                                                        width: `${(challenge.requirement.current / challenge.requirement.target) * 100}%`
                                                    }}
                                                />
                                            </div>
                                            {challenge.completed ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <span className="text-xs text-gray-500">
                                                    {challenge.requirement.current}/{challenge.requirement.target}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Weekly Progress */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl p-6 shadow-xl"
                        >
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-purple-500" />
                                Weekly Goals
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(data.weeklyProgress.goals).map(([key, goal]) => {
                                    const typedGoal = goal as { current: number; target: number };
                                    return (
                                        <div key={key}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="capitalize text-gray-700">{key}</span>
                                                <span className="text-gray-500">{typedGoal.current} / {typedGoal.target}</span>
                                            </div>
                                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${typedGoal.current >= typedGoal.target
                                                        ? 'bg-green-500'
                                                        : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                                                        }`}
                                                    style={{ width: `${Math.min((typedGoal.current / typedGoal.target) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-purple-700">Complete all goals for bonus:</span>
                                    <span className="font-bold text-purple-600">+{data.weeklyProgress.bonusXP} XP</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Recent Achievements */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl p-6 shadow-xl md:col-span-2"
                        >
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                Recent Achievements
                            </h3>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {unlockedAchievements.slice(0, 5).map(achievement => (
                                    <button
                                        key={achievement.id}
                                        onClick={() => setShowAchievementModal(achievement)}
                                        className="flex-shrink-0 w-24 text-center"
                                    >
                                        <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${getRarityColor(achievement.rarity)} rounded-xl flex items-center justify-center text-2xl shadow-lg mb-2`}>
                                            {achievement.icon}
                                        </div>
                                        <p className="text-xs font-medium text-gray-700 truncate">{achievement.name}</p>
                                    </button>
                                ))}
                                {unlockedAchievements.length === 0 && (
                                    <p className="text-gray-500 text-sm">Complete assessments to earn achievements!</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Achievements Tab */}
                {activeTab === 'achievements' && (
                    <div className="space-y-6">
                        {/* Unlocked */}
                        <div className="bg-white rounded-2xl p-6 shadow-xl">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-yellow-500" />
                                Unlocked ({unlockedAchievements.length})
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {unlockedAchievements.map(achievement => (
                                    <motion.button
                                        key={achievement.id}
                                        whileHover={{ scale: 1.05 }}
                                        onClick={() => setShowAchievementModal(achievement)}
                                        className={`p-4 rounded-xl ${getRarityBg(achievement.rarity)} border-2 border-transparent hover:border-purple-300 transition`}
                                    >
                                        <div className={`w-12 h-12 mx-auto bg-gradient-to-br ${getRarityColor(achievement.rarity)} rounded-xl flex items-center justify-center text-xl shadow-md mb-2`}>
                                            {achievement.icon}
                                        </div>
                                        <p className="font-medium text-gray-900 text-sm">{achievement.name}</p>
                                        <p className="text-xs text-purple-600">+{achievement.xpReward} XP</p>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Locked */}
                        <div className="bg-white rounded-2xl p-6 shadow-xl">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-gray-400" />
                                Locked ({lockedAchievements.length})
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {lockedAchievements.map(achievement => (
                                    <div
                                        key={achievement.id}
                                        className="p-4 rounded-xl bg-gray-50 border border-gray-200 opacity-60"
                                    >
                                        <div className="w-12 h-12 mx-auto bg-gray-200 rounded-xl flex items-center justify-center text-xl mb-2">
                                            <Lock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <p className="font-medium text-gray-500 text-sm">{achievement.name}</p>
                                        <div className="mt-2">
                                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gray-400 rounded-full"
                                                    style={{ width: `${((achievement.progress || 0) / achievement.requirement.target) * 100}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {achievement.progress || 0}/{achievement.requirement.target}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Challenges Tab */}
                {activeTab === 'challenges' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl p-6 shadow-xl"
                        >
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-500" />
                                Today's Challenges
                            </h3>
                            <div className="space-y-4">
                                {data.dailyChallenges.map((challenge, idx) => (
                                    <motion.div
                                        key={challenge.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`p-4 rounded-xl border-2 ${challenge.completed
                                            ? 'bg-green-50 border-green-300'
                                            : 'bg-white border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{challenge.title}</h4>
                                                <p className="text-sm text-gray-500">{challenge.description}</p>
                                            </div>
                                            <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-sm font-bold">
                                                <Zap className="w-3 h-3" />
                                                {challenge.xpReward}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(challenge.requirement.current / challenge.requirement.target) * 100}%` }}
                                                    className={`h-full rounded-full ${challenge.completed ? 'bg-green-500' : 'bg-purple-500'
                                                        }`}
                                                />
                                            </div>
                                            {challenge.completed ? (
                                                <CheckCircle className="w-6 h-6 text-green-500" />
                                            ) : (
                                                <span className="text-sm font-medium text-gray-600">
                                                    {challenge.requirement.current}/{challenge.requirement.target}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl p-6 shadow-xl"
                        >
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-500" />
                                Streak Stats
                            </h3>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-xl p-4 text-center">
                                    <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                    <p className="text-3xl font-bold text-gray-900">{data.streak.current}</p>
                                    <p className="text-sm text-gray-600">Current Streak</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl p-4 text-center">
                                    <Trophy className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                                    <p className="text-3xl font-bold text-gray-900">{data.streak.longest}</p>
                                    <p className="text-sm text-gray-600">Longest Streak</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-600 mb-2">Daily streak bonus:</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-purple-600">+{Math.min(data.streak.current * 50, 500)}</span>
                                    <span className="text-purple-600">XP per day</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Max bonus: 500 XP at 10+ day streak</p>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Leaderboard Tab */}
                {activeTab === 'leaderboard' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Crown className="w-5 h-5 text-yellow-500" />
                                Global Leaderboard
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {leaderboard.map((entry, idx) => (
                                <motion.div
                                    key={entry.userId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`p-4 flex items-center gap-4 ${entry.userId === userId ? 'bg-purple-50' : ''
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                                        entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
                                            entry.rank === 3 ? 'bg-orange-400 text-orange-900' :
                                                'bg-gray-100 text-gray-600'
                                        }`}>
                                        {entry.rank <= 3 ? (
                                            <Medal className="w-5 h-5" />
                                        ) : (
                                            entry.rank
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            {entry.userName}
                                            {entry.userId === userId && <span className="text-purple-600 ml-2">(You)</span>}
                                        </p>
                                        <p className="text-sm text-gray-500">Level {entry.level}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {entry.badges.map((badge, i) => (
                                            <span key={i} className="text-lg">{badge}</span>
                                        ))}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-purple-600">{entry.score.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">XP</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Your Position */}
                        {userRank > 10 && (
                            <div className="p-4 bg-purple-50 border-t border-purple-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center font-bold text-purple-700">
                                        {userRank}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{userName} (You)</p>
                                        <p className="text-sm text-purple-600">Level {data.level}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-purple-600">{data.totalXP.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">XP</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Achievement Modal */}
            <AnimatePresence>
                {showAchievementModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowAchievementModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full text-center p-8"
                        >
                            <div className={`w-24 h-24 mx-auto bg-gradient-to-br ${getRarityColor(showAchievementModal.rarity)} rounded-2xl flex items-center justify-center text-4xl shadow-lg mb-4`}>
                                {showAchievementModal.icon}
                            </div>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 ${showAchievementModal.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' :
                                showAchievementModal.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                                    showAchievementModal.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                }`}>
                                {showAchievementModal.rarity}
                            </span>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{showAchievementModal.name}</h3>
                            <p className="text-gray-500 mb-4">{showAchievementModal.description}</p>
                            <div className="bg-purple-50 rounded-xl p-3 inline-flex items-center gap-2">
                                <Zap className="w-5 h-5 text-purple-500" />
                                <span className="font-bold text-purple-700">+{showAchievementModal.xpReward} XP</span>
                            </div>
                            <button
                                onClick={() => setShowAchievementModal(null)}
                                className="w-full mt-6 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GamificationHub;
