import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, MessageSquare, Send, Sparkles, Target, TrendingUp,
    Briefcase, GraduationCap, DollarSign, MapPin, Clock, ChevronRight,
    FileText, Award, Lightbulb, BarChart2, Users, Star, Zap,
    RefreshCw, ThumbsUp, ThumbsDown, Bookmark, Share2, X
} from 'lucide-react';

interface AICareerCoachProps {
    userId: string;
    userName: string;
    currentSkills: Record<string, number>;
    experience: number;
    currentRole?: string;
    onClose?: () => void;
}

interface CoachMessage {
    id: string;
    role: 'coach' | 'user';
    content: string;
    timestamp: Date;
    suggestions?: string[];
    resources?: Resource[];
}

interface Resource {
    title: string;
    type: 'course' | 'article' | 'job' | 'skill';
    url?: string;
    description: string;
}

interface CareerPath {
    role: string;
    company: string;
    salary: string;
    timeline: string;
    requiredSkills: string[];
    matchScore: number;
}

interface SalaryData {
    role: string;
    location: string;
    low: number;
    median: number;
    high: number;
}

const CAREER_PATHS: CareerPath[] = [
    {
        role: 'Senior Frontend Engineer',
        company: 'Tech Startup',
        salary: '$150K - $180K',
        timeline: '1-2 years',
        requiredSkills: ['React', 'TypeScript', 'System Design'],
        matchScore: 85
    },
    {
        role: 'Tech Lead',
        company: 'Mid-size Company',
        salary: '$170K - $210K',
        timeline: '2-3 years',
        requiredSkills: ['React', 'Leadership', 'Architecture'],
        matchScore: 72
    },
    {
        role: 'Staff Engineer',
        company: 'FAANG',
        salary: '$250K - $350K',
        timeline: '4-5 years',
        requiredSkills: ['React', 'System Design', 'Mentoring'],
        matchScore: 58
    },
    {
        role: 'Engineering Manager',
        company: 'Enterprise',
        salary: '$180K - $240K',
        timeline: '3-4 years',
        requiredSkills: ['Leadership', 'Team Management', 'Strategy'],
        matchScore: 45
    }
];

const SALARY_DATA: SalaryData[] = [
    { role: 'Junior Frontend Developer', location: 'US', low: 70000, median: 85000, high: 100000 },
    { role: 'Mid Frontend Developer', location: 'US', low: 100000, median: 125000, high: 150000 },
    { role: 'Senior Frontend Developer', location: 'US', low: 140000, median: 165000, high: 200000 },
    { role: 'Tech Lead', location: 'US', low: 160000, median: 190000, high: 230000 },
    { role: 'Staff Engineer', location: 'US', low: 200000, median: 280000, high: 400000 }
];

export const AICareerCoach: React.FC<AICareerCoachProps> = ({
    userId,
    userName,
    currentSkills,
    experience,
    currentRole = 'Frontend Developer',
    onClose
}) => {
    const [messages, setMessages] = useState<CoachMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'paths' | 'salary' | 'resume'>('chat');
    const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);

    // Initialize with greeting
    useEffect(() => {
        const greeting: CoachMessage = {
            id: 'greeting',
            role: 'coach',
            content: `Hi ${userName}! 👋 I'm your AI Career Coach. Based on your profile, I see you're a ${currentRole} with ${experience} years of experience and skills in ${Object.keys(currentSkills).slice(0, 3).join(', ')}.\n\nHow can I help you today?`,
            timestamp: new Date(),
            suggestions: [
                'What career paths are available to me?',
                'How can I increase my salary?',
                'What skills should I learn next?',
                'Help me prepare for interviews'
            ]
        };
        setMessages([greeting]);
    }, [userName, currentRole, experience, currentSkills]);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: CoachMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Simulate AI response
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

        const response = generateCoachResponse(text, currentSkills, experience);
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
    };

    const generateCoachResponse = (
        query: string,
        skills: Record<string, number>,
        exp: number
    ): CoachMessage => {
        const lowerQuery = query.toLowerCase();
        let content = '';
        let suggestions: string[] = [];
        let resources: Resource[] = [];

        if (lowerQuery.includes('career') || lowerQuery.includes('path')) {
            content = `Based on your current skills and experience, here are the most promising career paths:\n\n` +
                `1. **Senior Frontend Engineer** - You're 85% ready! Focus on system design and advanced React patterns.\n\n` +
                `2. **Tech Lead** - Great option in 2-3 years. Start building leadership skills now.\n\n` +
                `3. **Staff Engineer** - Long-term goal. Requires deep technical expertise and cross-team impact.\n\n` +
                `Would you like me to create a personalized roadmap for any of these?`;
            suggestions = ['Tell me more about Tech Lead path', 'What skills do I need for Staff Engineer?', 'How do I build leadership skills?'];
        } else if (lowerQuery.includes('salary') || lowerQuery.includes('pay') || lowerQuery.includes('money')) {
            const currentSalary = SALARY_DATA[Math.min(exp, 2)];
            content = `Let's talk compensation! 💰\n\n` +
                `For your level (${exp} years experience), the market rates are:\n` +
                `• **Low**: $${currentSalary.low.toLocaleString()}\n` +
                `• **Median**: $${currentSalary.median.toLocaleString()}\n` +
                `• **High**: $${currentSalary.high.toLocaleString()}\n\n` +
                `**Tips to maximize your salary:**\n` +
                `1. Get certifications in high-demand skills (TypeScript, AWS)\n` +
                `2. Build a strong portfolio with measurable achievements\n` +
                `3. Practice salary negotiation techniques\n` +
                `4. Consider Remote positions for higher pay`;
            suggestions = ['How do I negotiate salary?', 'What certifications increase pay?', 'Should I switch jobs for higher salary?'];
        } else if (lowerQuery.includes('skill') || lowerQuery.includes('learn')) {
            const topSkills = Object.entries(skills).sort((a, b) => b[1] - a[1]);
            const strongSkills = topSkills.filter(([_, score]) => score >= 70);
            const weakSkills = topSkills.filter(([_, score]) => score < 70);

            content = `Great question! Here's my skill analysis:\n\n` +
                `**Your Strengths (Keep sharp):**\n${strongSkills.map(([s, score]) => `• ${s}: ${score}%`).join('\n') || '• Building your foundation'}\n\n` +
                `**Priority Skills to Develop:**\n` +
                `1. **TypeScript** - Essential for senior roles, high market demand\n` +
                `2. **System Design** - Required for Tech Lead and above\n` +
                `3. **Testing** - Often overlooked but highly valued\n\n` +
                `**Emerging Skills to Watch:**\n` +
                `• AI/ML integration in frontend\n` +
                `• Web3 technologies\n` +
                `• Edge computing`;
            suggestions = ['How do I learn system design?', 'Best TypeScript resources?', 'Is Web3 worth learning?'];
            resources = [
                { title: 'TypeScript Deep Dive', type: 'course', description: 'Master TypeScript in 4 weeks' },
                { title: 'System Design Primer', type: 'article', description: 'Essential patterns for interviews' }
            ];
        } else if (lowerQuery.includes('interview')) {
            content = `Let's get you interview-ready! 🎯\n\n` +
                `**Based on your target roles, focus on:**\n\n` +
                `1. **Technical Coding** (40% of interviews)\n` +
                `   • Practice 2-3 LeetCode problems daily\n` +
                `   • Focus on arrays, strings, and trees\n\n` +
                `2. **System Design** (30% of interviews)\n` +
                `   • Study distributed systems basics\n` +
                `   • Practice designing real products\n\n` +
                `3. **Behavioral** (30% of interviews)\n` +
                `   • Prepare 5-7 STAR stories\n` +
                `   • Research company values\n\n` +
                `Would you like to do a mock interview with me?`;
            suggestions = ['Start mock interview', 'Give me coding problems', 'Help with behavioral stories'];
        } else if (lowerQuery.includes('resume') || lowerQuery.includes('cv')) {
            content = `Let me help optimize your resume! 📄\n\n` +
                `**Key improvements for your level:**\n\n` +
                `1. **Quantify achievements** - "Improved performance by 40%" beats "Improved performance"\n\n` +
                `2. **Highlight impact** - Show business outcomes, not just tasks\n\n` +
                `3. **Keywords matter** - Include: React, TypeScript, Performance, Scalability\n\n` +
                `4. **Keep it concise** - One page for < 10 years experience\n\n` +
                `Upload your resume and I'll give specific feedback!`;
            suggestions = ['Review my resume', 'What keywords are important?', 'Show me resume examples'];
        } else {
            content = `That's a great question! Let me think about the best way to help you with that.\n\n` +
                `Based on your profile as a ${currentRole}, here are some thoughts:\n\n` +
                `Your strongest skills (${Object.keys(skills).slice(0, 2).join(', ')}) position you well in the market. ` +
                `With ${exp} years of experience, you're at an exciting point where career acceleration is very achievable.\n\n` +
                `What specific aspect would you like to explore further?`;
            suggestions = ['Career path options', 'Salary expectations', 'Skills to develop', 'Interview preparation'];
        }

        return {
            id: `coach-${Date.now()}`,
            role: 'coach',
            content,
            timestamp: new Date(),
            suggestions,
            resources
        };
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">AI Career Coach</h1>
                            <p className="text-sm text-gray-500">Your personal career advisor</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Tabs */}
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                            {[
                                { id: 'chat', label: 'Chat', icon: MessageSquare },
                                { id: 'paths', label: 'Paths', icon: TrendingUp },
                                { id: 'salary', label: 'Salary', icon: DollarSign },
                                { id: 'resume', label: 'Resume', icon: FileText }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${activeTab === tab.id
                                            ? 'bg-white shadow text-indigo-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {onClose && (
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {/* Chat Tab */}
                {activeTab === 'chat' && (
                    <div className="h-full flex flex-col">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map(message => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-2xl ${message.role === 'user' ? 'order-2' : ''}`}>
                                        {message.role === 'coach' && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                                    <Brain className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">Career Coach</span>
                                            </div>
                                        )}
                                        <div className={`p-4 rounded-2xl ${message.role === 'user'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white border border-gray-200 shadow-sm'
                                            }`}>
                                            <div className={`whitespace-pre-wrap ${message.role === 'coach' ? 'prose prose-sm max-w-none' : ''}`}>
                                                {message.content}
                                            </div>
                                        </div>

                                        {/* Suggestions */}
                                        {message.suggestions && message.suggestions.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {message.suggestions.map((suggestion, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => sendMessage(suggestion)}
                                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm hover:bg-indigo-100 transition"
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Resources */}
                                        {message.resources && message.resources.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {message.resources.map((resource, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                            {resource.type === 'course' ? <GraduationCap className="w-4 h-4 text-purple-600" /> :
                                                                resource.type === 'article' ? <FileText className="w-4 h-4 text-purple-600" /> :
                                                                    <Briefcase className="w-4 h-4 text-purple-600" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900 text-sm">{resource.title}</p>
                                                            <p className="text-xs text-gray-500">{resource.description}</p>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                        <Brain className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-200">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
                                    placeholder="Ask about careers, skills, salaries, interviews..."
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={() => sendMessage(input)}
                                    disabled={!input.trim()}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Career Paths Tab */}
                {activeTab === 'paths' && (
                    <div className="h-full overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Career Paths</h2>
                            <p className="text-gray-500 mb-6">Based on your skills and experience</p>

                            <div className="grid gap-4">
                                {CAREER_PATHS.map(path => (
                                    <motion.div
                                        key={path.role}
                                        whileHover={{ scale: 1.01 }}
                                        className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition"
                                        onClick={() => setSelectedPath(path)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{path.role}</h3>
                                                <p className="text-gray-500">{path.company}</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${path.matchScore >= 80 ? 'bg-green-100 text-green-700' :
                                                    path.matchScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {path.matchScore}% match
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mt-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Salary Range</p>
                                                <p className="font-bold text-green-600">{path.salary}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Timeline</p>
                                                <p className="font-bold text-gray-900">{path.timeline}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Key Skills</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {path.requiredSkills.slice(0, 2).map(skill => (
                                                        <span key={skill} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Salary Tab */}
                {activeTab === 'salary' && (
                    <div className="h-full overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Salary Insights</h2>
                            <p className="text-gray-500 mb-6">Market rates for your career progression</p>

                            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                                <h3 className="font-bold text-gray-900 mb-4">Salary by Level (US Market)</h3>
                                <div className="space-y-6">
                                    {SALARY_DATA.map(data => (
                                        <div key={data.role}>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="font-medium text-gray-700">{data.role}</span>
                                                <span className="text-gray-500">
                                                    ${data.low.toLocaleString()} - ${data.high.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="relative h-8 bg-gray-100 rounded-lg">
                                                <div
                                                    className="absolute h-full bg-gradient-to-r from-green-400 to-green-600 rounded-lg"
                                                    style={{
                                                        left: `${(data.low / 400000) * 100}%`,
                                                        width: `${((data.high - data.low) / 400000) * 100}%`
                                                    }}
                                                />
                                                <div
                                                    className="absolute w-4 h-4 bg-white border-2 border-green-600 rounded-full top-1/2 -translate-y-1/2 shadow"
                                                    style={{ left: `${(data.median / 400000) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                        Salary Boosters
                                    </h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3">
                                            <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-gray-900">TypeScript certification</p>
                                                <p className="text-sm text-gray-500">+$10-15K average increase</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-gray-900">AWS certification</p>
                                                <p className="text-sm text-gray-500">+$15-20K average increase</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-gray-900">Remote FAANG position</p>
                                                <p className="text-sm text-gray-500">+30-50% vs local companies</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 text-purple-500" />
                                        Negotiation Tips
                                    </h3>
                                    <ul className="space-y-3 text-sm text-gray-700">
                                        <li className="flex items-start gap-2">
                                            <Star className="w-4 h-4 text-purple-400 mt-0.5" />
                                            Never give the first number
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Star className="w-4 h-4 text-purple-400 mt-0.5" />
                                            Research market rates before negotiating
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Star className="w-4 h-4 text-purple-400 mt-0.5" />
                                            Negotiate total comp, not just base
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Star className="w-4 h-4 text-purple-400 mt-0.5" />
                                            Get competing offers when possible
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resume Tab */}
                {activeTab === 'resume' && (
                    <div className="h-full overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume Optimizer</h2>
                            <p className="text-gray-500 mb-6">AI-powered resume feedback</p>

                            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center mb-6">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="font-bold text-gray-900 mb-2">Upload Your Resume</h3>
                                <p className="text-gray-500 mb-4">Get instant AI feedback and optimization suggestions</p>
                                <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
                                    Upload PDF or DOCX
                                </button>
                            </div>

                            <div className="bg-indigo-50 rounded-xl p-6">
                                <h3 className="font-bold text-indigo-900 mb-4">Resume Tips for Your Level</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">✅ Do</h4>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li>• Quantify achievements with numbers</li>
                                            <li>• Use action verbs (Led, Built, Optimized)</li>
                                            <li>• Include relevant keywords</li>
                                            <li>• Keep to 1 page</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">❌ Don't</h4>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li>• List every technology you've touched</li>
                                            <li>• Use generic job descriptions</li>
                                            <li>• Include personal photo</li>
                                            <li>• Forget to proofread</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AICareerCoach;
