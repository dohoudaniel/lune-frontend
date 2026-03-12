/**
 * Assessment Templates Library
 * Pre-built assessment configurations for common roles
 */

import { DifficultyLevel, AssessmentType } from '../types';

// =====================================================
// INTERFACES
// =====================================================

export interface AssessmentTemplate {
    id: string;
    name: string;
    role: string;
    category: 'engineering' | 'product' | 'design' | 'sales' | 'customer_success' | 'data' | 'operations';
    difficulty: DifficultyLevel;
    description: string;
    skills: string[];
    estimatedTime: number; // minutes
    sections: TemplateSection[];
    passingScore: number;
    recommendedFor: string[];
    tags: string[];
    popularity: number; // 0-100
    successRate: number; // Historical pass rate
}

export interface TemplateSection {
    id: string;
    name: string;
    type: AssessmentType;
    weight: number; // Percentage weight in final score
    questionCount: number;
    timeLimit: number; // minutes
    description: string;
    skills: string[];
}

// =====================================================
// TEMPLATE LIBRARY
// =====================================================

export const ASSESSMENT_TEMPLATES: AssessmentTemplate[] = [
    // Engineering Templates
    {
        id: 'frontend-senior-react',
        name: 'Senior Frontend Engineer (React)',
        role: 'Senior Frontend Engineer',
        category: 'engineering',
        difficulty: 'Advanced',
        description: 'Comprehensive assessment for senior React developers covering modern React patterns, performance optimization, and system design.',
        skills: ['React', 'TypeScript', 'CSS', 'Performance Optimization', 'System Design'],
        estimatedTime: 90,
        sections: [
            {
                id: 's1',
                name: 'React Fundamentals',
                type: 'code',
                weight: 25,
                questionCount: 3,
                timeLimit: 20,
                description: 'Core React concepts, hooks, and component patterns',
                skills: ['React', 'Hooks', 'Components']
            },
            {
                id: 's2',
                name: 'TypeScript & Type Safety',
                type: 'code',
                weight: 20,
                questionCount: 3,
                timeLimit: 15,
                description: 'TypeScript generics, utility types, and type-safe patterns',
                skills: ['TypeScript', 'Generics']
            },
            {
                id: 's3',
                name: 'Live Coding Challenge',
                type: 'code',
                weight: 30,
                questionCount: 1,
                timeLimit: 35,
                description: 'Build a feature with real-time requirements',
                skills: ['React', 'Problem Solving']
            },
            {
                id: 's4',
                name: 'System Design',
                type: 'scenario',
                weight: 25,
                questionCount: 1,
                timeLimit: 20,
                description: 'Design a scalable frontend architecture',
                skills: ['System Design', 'Architecture']
            }
        ],
        passingScore: 70,
        recommendedFor: ['Tech Lead', 'Senior Engineer', 'Staff Engineer'],
        tags: ['react', 'typescript', 'frontend', 'senior'],
        popularity: 92,
        successRate: 48
    },
    {
        id: 'frontend-mid-react',
        name: 'Frontend Engineer (React)',
        role: 'Frontend Engineer',
        category: 'engineering',
        difficulty: 'Mid-Level',
        description: 'Assessment for mid-level React developers focusing on component development and state management.',
        skills: ['React', 'JavaScript', 'CSS', 'State Management'],
        estimatedTime: 60,
        sections: [
            {
                id: 's1',
                name: 'JavaScript Fundamentals',
                type: 'code',
                weight: 25,
                questionCount: 4,
                timeLimit: 15,
                description: 'ES6+, async programming, and core concepts',
                skills: ['JavaScript', 'ES6']
            },
            {
                id: 's2',
                name: 'React Components',
                type: 'code',
                weight: 35,
                questionCount: 3,
                timeLimit: 25,
                description: 'Component patterns, hooks, and lifecycle',
                skills: ['React', 'Components']
            },
            {
                id: 's3',
                name: 'Styling & CSS',
                type: 'code',
                weight: 20,
                questionCount: 2,
                timeLimit: 10,
                description: 'CSS layouts, responsive design, and styling approaches',
                skills: ['CSS', 'Responsive Design']
            },
            {
                id: 's4',
                name: 'Practical Challenge',
                type: 'code',
                weight: 20,
                questionCount: 1,
                timeLimit: 10,
                description: 'Debug and enhance a React component',
                skills: ['React', 'Debugging']
            }
        ],
        passingScore: 70,
        recommendedFor: ['Frontend Developer', 'Software Engineer'],
        tags: ['react', 'javascript', 'frontend', 'mid-level'],
        popularity: 88,
        successRate: 62
    },
    {
        id: 'backend-senior-python',
        name: 'Senior Backend Engineer (Python)',
        role: 'Senior Backend Engineer',
        category: 'engineering',
        difficulty: 'Advanced',
        description: 'Comprehensive Python backend assessment covering APIs, databases, and distributed systems.',
        skills: ['Python', 'FastAPI/Django', 'PostgreSQL', 'Redis', 'System Design'],
        estimatedTime: 90,
        sections: [
            {
                id: 's1',
                name: 'Python Proficiency',
                type: 'code',
                weight: 20,
                questionCount: 3,
                timeLimit: 15,
                description: 'Advanced Python patterns, decorators, async',
                skills: ['Python', 'Async Programming']
            },
            {
                id: 's2',
                name: 'API Design',
                type: 'code',
                weight: 25,
                questionCount: 2,
                timeLimit: 25,
                description: 'RESTful API design and implementation',
                skills: ['REST', 'API Design']
            },
            {
                id: 's3',
                name: 'Database Design',
                type: 'scenario',
                weight: 25,
                questionCount: 2,
                timeLimit: 20,
                description: 'Schema design, queries, and optimization',
                skills: ['PostgreSQL', 'Database Design']
            },
            {
                id: 's4',
                name: 'System Design',
                type: 'scenario',
                weight: 30,
                questionCount: 1,
                timeLimit: 30,
                description: 'Design a scalable backend system',
                skills: ['System Design', 'Distributed Systems']
            }
        ],
        passingScore: 70,
        recommendedFor: ['Senior Backend Engineer', 'Tech Lead'],
        tags: ['python', 'backend', 'api', 'senior'],
        popularity: 85,
        successRate: 45
    },
    {
        id: 'fullstack-nodejs',
        name: 'Full Stack Engineer (Node.js)',
        role: 'Full Stack Engineer',
        category: 'engineering',
        difficulty: 'Mid-Level',
        description: 'Full stack assessment covering both frontend React and backend Node.js development.',
        skills: ['Node.js', 'React', 'TypeScript', 'MongoDB', 'REST APIs'],
        estimatedTime: 75,
        sections: [
            {
                id: 's1',
                name: 'Node.js Backend',
                type: 'code',
                weight: 30,
                questionCount: 3,
                timeLimit: 25,
                description: 'Express/Fastify APIs and middleware',
                skills: ['Node.js', 'Express']
            },
            {
                id: 's2',
                name: 'React Frontend',
                type: 'code',
                weight: 30,
                questionCount: 3,
                timeLimit: 20,
                description: 'React components and state management',
                skills: ['React', 'State Management']
            },
            {
                id: 's3',
                name: 'Full Stack Challenge',
                type: 'code',
                weight: 40,
                questionCount: 1,
                timeLimit: 30,
                description: 'Build a complete feature end-to-end',
                skills: ['Full Stack', 'Integration']
            }
        ],
        passingScore: 70,
        recommendedFor: ['Full Stack Developer', 'Software Engineer'],
        tags: ['nodejs', 'react', 'fullstack', 'javascript'],
        popularity: 82,
        successRate: 55
    },

    // Product Templates
    {
        id: 'product-manager',
        name: 'Product Manager',
        role: 'Product Manager',
        category: 'product',
        difficulty: 'Mid-Level',
        description: 'Product management assessment covering strategy, analytics, and stakeholder management.',
        skills: ['Product Strategy', 'User Research', 'Analytics', 'Prioritization'],
        estimatedTime: 60,
        sections: [
            {
                id: 's1',
                name: 'Product Strategy',
                type: 'scenario',
                weight: 30,
                questionCount: 2,
                timeLimit: 20,
                description: 'Define product vision and roadmap',
                skills: ['Strategy', 'Vision']
            },
            {
                id: 's2',
                name: 'Case Study',
                type: 'scenario',
                weight: 40,
                questionCount: 1,
                timeLimit: 25,
                description: 'Analyze a product problem and propose solutions',
                skills: ['Problem Solving', 'Analysis']
            },
            {
                id: 's3',
                name: 'Metrics & Analytics',
                type: 'spreadsheet',
                weight: 30,
                questionCount: 2,
                timeLimit: 15,
                description: 'Define KPIs and analyze product metrics',
                skills: ['Analytics', 'Data Analysis']
            }
        ],
        passingScore: 70,
        recommendedFor: ['Product Manager', 'Product Owner', 'Associate PM'],
        tags: ['product', 'strategy', 'analytics'],
        popularity: 78,
        successRate: 58
    },

    // Sales Templates
    {
        id: 'sales-ae',
        name: 'Account Executive',
        role: 'Account Executive',
        category: 'sales',
        difficulty: 'Mid-Level',
        description: 'Sales assessment covering discovery calls, objection handling, and deal closing.',
        skills: ['Sales', 'Negotiation', 'Communication', 'CRM'],
        estimatedTime: 45,
        sections: [
            {
                id: 's1',
                name: 'Discovery Call Simulation',
                type: 'video_verification',
                weight: 35,
                questionCount: 1,
                timeLimit: 15,
                description: 'Conduct a discovery call with a prospect',
                skills: ['Discovery', 'Questioning']
            },
            {
                id: 's2',
                name: 'Objection Handling',
                type: 'scenario',
                weight: 30,
                questionCount: 3,
                timeLimit: 15,
                description: 'Handle common sales objections',
                skills: ['Objection Handling', 'Persuasion']
            },
            {
                id: 's3',
                name: 'Pitch Presentation',
                type: 'presentation',
                weight: 35,
                questionCount: 1,
                timeLimit: 15,
                description: 'Create and deliver a product pitch',
                skills: ['Presentation', 'Storytelling']
            }
        ],
        passingScore: 70,
        recommendedFor: ['Account Executive', 'Sales Rep', 'BDR'],
        tags: ['sales', 'b2b', 'closing'],
        popularity: 75,
        successRate: 52
    },
    {
        id: 'sales-sdr',
        name: 'Sales Development Rep',
        role: 'SDR',
        category: 'sales',
        difficulty: 'Beginner',
        description: 'Entry-level sales assessment for prospecting and cold outreach.',
        skills: ['Prospecting', 'Cold Calling', 'Email Outreach', 'CRM'],
        estimatedTime: 30,
        sections: [
            {
                id: 's1',
                name: 'Cold Call Simulation',
                type: 'video_verification',
                weight: 40,
                questionCount: 1,
                timeLimit: 10,
                description: 'Make a cold call to book a meeting',
                skills: ['Cold Calling', 'Confidence']
            },
            {
                id: 's2',
                name: 'Email Sequences',
                type: 'text_editor',
                weight: 30,
                questionCount: 2,
                timeLimit: 10,
                description: 'Write effective outreach emails',
                skills: ['Email', 'Copywriting']
            },
            {
                id: 's3',
                name: 'Prospecting',
                type: 'scenario',
                weight: 30,
                questionCount: 2,
                timeLimit: 10,
                description: 'Identify and qualify prospects',
                skills: ['Research', 'Qualification']
            }
        ],
        passingScore: 65,
        recommendedFor: ['SDR', 'BDR', 'Inside Sales'],
        tags: ['sales', 'entry-level', 'prospecting'],
        popularity: 72,
        successRate: 68
    },

    // Customer Success Templates
    {
        id: 'customer-success-manager',
        name: 'Customer Success Manager',
        role: 'Customer Success Manager',
        category: 'customer_success',
        difficulty: 'Mid-Level',
        description: 'Assessment for customer success roles covering retention, upselling, and relationship management.',
        skills: ['Customer Success', 'Communication', 'Product Knowledge', 'Analytics'],
        estimatedTime: 50,
        sections: [
            {
                id: 's1',
                name: 'Customer Onboarding',
                type: 'scenario',
                weight: 30,
                questionCount: 2,
                timeLimit: 15,
                description: 'Design an onboarding experience',
                skills: ['Onboarding', 'Training']
            },
            {
                id: 's2',
                name: 'Churn Prevention',
                type: 'scenario',
                weight: 35,
                questionCount: 2,
                timeLimit: 20,
                description: 'Handle at-risk customer scenarios',
                skills: ['Retention', 'Problem Solving']
            },
            {
                id: 's3',
                name: 'QBR Presentation',
                type: 'presentation',
                weight: 35,
                questionCount: 1,
                timeLimit: 15,
                description: 'Create a quarterly business review',
                skills: ['Presentation', 'Analytics']
            }
        ],
        passingScore: 70,
        recommendedFor: ['CSM', 'Account Manager', 'Relationship Manager'],
        tags: ['customer-success', 'retention', 'b2b'],
        popularity: 70,
        successRate: 60
    },

    // Data Templates
    {
        id: 'data-analyst',
        name: 'Data Analyst',
        role: 'Data Analyst',
        category: 'data',
        difficulty: 'Mid-Level',
        description: 'Data analysis assessment covering SQL, Excel, and data visualization.',
        skills: ['SQL', 'Excel', 'Data Visualization', 'Statistics'],
        estimatedTime: 60,
        sections: [
            {
                id: 's1',
                name: 'SQL Queries',
                type: 'code',
                weight: 35,
                questionCount: 4,
                timeLimit: 20,
                description: 'Write complex SQL queries',
                skills: ['SQL', 'Databases']
            },
            {
                id: 's2',
                name: 'Excel Analysis',
                type: 'spreadsheet',
                weight: 30,
                questionCount: 2,
                timeLimit: 20,
                description: 'Analyze data using spreadsheets',
                skills: ['Excel', 'Formulas']
            },
            {
                id: 's3',
                name: 'Data Storytelling',
                type: 'presentation',
                weight: 35,
                questionCount: 1,
                timeLimit: 20,
                description: 'Present insights from data',
                skills: ['Visualization', 'Communication']
            }
        ],
        passingScore: 70,
        recommendedFor: ['Data Analyst', 'Business Analyst', 'Analytics'],
        tags: ['data', 'sql', 'analytics', 'excel'],
        popularity: 76,
        successRate: 54
    },
    {
        id: 'data-scientist',
        name: 'Data Scientist',
        role: 'Data Scientist',
        category: 'data',
        difficulty: 'Advanced',
        description: 'Advanced data science assessment covering ML, statistics, and Python.',
        skills: ['Python', 'Machine Learning', 'Statistics', 'SQL'],
        estimatedTime: 90,
        sections: [
            {
                id: 's1',
                name: 'Python for Data Science',
                type: 'code',
                weight: 25,
                questionCount: 3,
                timeLimit: 25,
                description: 'Data manipulation with pandas and numpy',
                skills: ['Python', 'Pandas', 'NumPy']
            },
            {
                id: 's2',
                name: 'Machine Learning',
                type: 'code',
                weight: 35,
                questionCount: 2,
                timeLimit: 30,
                description: 'Build and evaluate ML models',
                skills: ['Machine Learning', 'Scikit-learn']
            },
            {
                id: 's3',
                name: 'Statistical Analysis',
                type: 'scenario',
                weight: 20,
                questionCount: 2,
                timeLimit: 15,
                description: 'Apply statistical methods',
                skills: ['Statistics', 'Hypothesis Testing']
            },
            {
                id: 's4',
                name: 'Case Study',
                type: 'scenario',
                weight: 20,
                questionCount: 1,
                timeLimit: 20,
                description: 'End-to-end data science project',
                skills: ['Problem Framing', 'Communication']
            }
        ],
        passingScore: 70,
        recommendedFor: ['Data Scientist', 'ML Engineer', 'Research Scientist'],
        tags: ['data-science', 'ml', 'python', 'advanced'],
        popularity: 80,
        successRate: 42
    },

    // DevOps Templates
    {
        id: 'devops-engineer',
        name: 'DevOps Engineer',
        role: 'DevOps Engineer',
        category: 'engineering',
        difficulty: 'Mid-Level',
        description: 'DevOps assessment covering CI/CD, cloud infrastructure, and containerization.',
        skills: ['Docker', 'Kubernetes', 'AWS/GCP', 'CI/CD', 'Linux'],
        estimatedTime: 75,
        sections: [
            {
                id: 's1',
                name: 'Docker & Containers',
                type: 'code',
                weight: 25,
                questionCount: 3,
                timeLimit: 20,
                description: 'Containerization and Docker',
                skills: ['Docker', 'Containers']
            },
            {
                id: 's2',
                name: 'CI/CD Pipelines',
                type: 'code',
                weight: 25,
                questionCount: 2,
                timeLimit: 20,
                description: 'Build deployment pipelines',
                skills: ['CI/CD', 'GitHub Actions']
            },
            {
                id: 's3',
                name: 'Cloud Infrastructure',
                type: 'scenario',
                weight: 30,
                questionCount: 2,
                timeLimit: 20,
                description: 'Design cloud architectures',
                skills: ['AWS', 'Infrastructure']
            },
            {
                id: 's4',
                name: 'Troubleshooting',
                type: 'scenario',
                weight: 20,
                questionCount: 2,
                timeLimit: 15,
                description: 'Debug production issues',
                skills: ['Linux', 'Debugging']
            }
        ],
        passingScore: 70,
        recommendedFor: ['DevOps Engineer', 'SRE', 'Platform Engineer'],
        tags: ['devops', 'cloud', 'docker', 'kubernetes'],
        popularity: 74,
        successRate: 50
    },

    // Virtual Assistant Templates
    {
        id: 'va-executive-assistant',
        name: 'Executive Virtual Assistant',
        role: 'Executive Assistant',
        category: 'operations',
        difficulty: 'Mid-Level',
        description: 'Comprehensive assessment for executive-level virtual assistants covering communication, organization, and Google Workspace proficiency.',
        skills: ['Communication', 'Google Workspace', 'Calendar Management', 'Email Management', 'Documentation'],
        estimatedTime: 45,
        sections: [
            {
                id: 's1',
                name: 'Typing Speed Test',
                type: 'scenario',
                weight: 15,
                questionCount: 1,
                timeLimit: 5,
                description: 'Measure typing speed and accuracy',
                skills: ['Typing', 'Accuracy']
            },
            {
                id: 's2',
                name: 'Google Workspace Proficiency',
                type: 'scenario',
                weight: 25,
                questionCount: 10,
                timeLimit: 15,
                description: 'Test knowledge of Docs, Sheets, Slides, Calendar, Gmail',
                skills: ['Google Docs', 'Google Sheets', 'Gmail']
            },
            {
                id: 's3',
                name: 'Email Communication',
                type: 'text_editor',
                weight: 30,
                questionCount: 2,
                timeLimit: 15,
                description: 'Draft professional email responses',
                skills: ['Email Writing', 'Professional Tone']
            },
            {
                id: 's4',
                name: 'Document Drafting',
                type: 'text_editor',
                weight: 30,
                questionCount: 1,
                timeLimit: 10,
                description: 'Create professional memos and meeting notes',
                skills: ['Documentation', 'Writing']
            }
        ],
        passingScore: 70,
        recommendedFor: ['Executive Assistant', 'Personal Assistant', 'Chief of Staff'],
        tags: ['va', 'executive', 'communication', 'google-workspace'],
        popularity: 88,
        successRate: 62
    },
    {
        id: 'va-customer-support',
        name: 'Customer Support Specialist',
        role: 'Customer Support VA',
        category: 'operations',
        difficulty: 'Beginner',
        description: 'Assessment for customer-facing virtual assistants focusing on communication, problem-solving, and de-escalation.',
        skills: ['Customer Service', 'Communication', 'Problem Solving', 'Empathy', 'Typing'],
        estimatedTime: 35,
        sections: [
            {
                id: 's1',
                name: 'Typing Speed Test',
                type: 'scenario',
                weight: 15,
                questionCount: 1,
                timeLimit: 5,
                description: 'Fast and accurate typing is essential for chat support',
                skills: ['Typing', 'Speed']
            },
            {
                id: 's2',
                name: 'Customer Scenarios',
                type: 'scenario',
                weight: 40,
                questionCount: 3,
                timeLimit: 15,
                description: 'Handle difficult customer situations',
                skills: ['De-escalation', 'Problem Solving']
            },
            {
                id: 's3',
                name: 'Written Responses',
                type: 'text_editor',
                weight: 30,
                questionCount: 2,
                timeLimit: 10,
                description: 'Write professional support responses',
                skills: ['Writing', 'Empathy']
            },
            {
                id: 's4',
                name: 'Google Workspace Basics',
                type: 'scenario',
                weight: 15,
                questionCount: 5,
                timeLimit: 5,
                description: 'Basic productivity tool knowledge',
                skills: ['Gmail', 'Google Docs']
            }
        ],
        passingScore: 70,
        recommendedFor: ['Customer Support Rep', 'Chat Support', 'Help Desk'],
        tags: ['va', 'customer-support', 'communication', 'beginner'],
        popularity: 85,
        successRate: 72
    },
    {
        id: 'va-general-admin',
        name: 'General Administrative Assistant',
        role: 'Administrative VA',
        category: 'operations',
        difficulty: 'Beginner',
        description: 'Entry-level assessment for general virtual assistants covering essential administrative and organizational skills.',
        skills: ['Typing', 'Organization', 'Communication', 'Google Workspace', 'Time Management'],
        estimatedTime: 30,
        sections: [
            {
                id: 's1',
                name: 'Typing Assessment',
                type: 'scenario',
                weight: 20,
                questionCount: 1,
                timeLimit: 5,
                description: 'Baseline typing speed and accuracy',
                skills: ['Typing']
            },
            {
                id: 's2',
                name: 'Google Workspace',
                type: 'scenario',
                weight: 30,
                questionCount: 8,
                timeLimit: 10,
                description: 'Essential Docs, Sheets, and Gmail skills',
                skills: ['Google Docs', 'Google Sheets', 'Gmail']
            },
            {
                id: 's3',
                name: 'Professional Writing',
                type: 'text_editor',
                weight: 30,
                questionCount: 1,
                timeLimit: 10,
                description: 'Draft a professional memo or summary',
                skills: ['Writing', 'Clarity']
            },
            {
                id: 's4',
                name: 'Communication Scenario',
                type: 'text_editor',
                weight: 20,
                questionCount: 1,
                timeLimit: 5,
                description: 'Respond to a workplace situation',
                skills: ['Communication', 'Judgment']
            }
        ],
        passingScore: 65,
        recommendedFor: ['Administrative Assistant', 'Virtual Assistant', 'Office Manager'],
        tags: ['va', 'admin', 'entry-level', 'general'],
        popularity: 90,
        successRate: 75
    }
];

// =====================================================
// SERVICE FUNCTIONS
// =====================================================

/**
 * Get all templates
 */
export const getAllTemplates = (): AssessmentTemplate[] => {
    return ASSESSMENT_TEMPLATES;
};

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): AssessmentTemplate | undefined => {
    return ASSESSMENT_TEMPLATES.find(t => t.id === id);
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: AssessmentTemplate['category']): AssessmentTemplate[] => {
    return ASSESSMENT_TEMPLATES.filter(t => t.category === category);
};

/**
 * Get templates by difficulty
 */
export const getTemplatesByDifficulty = (difficulty: DifficultyLevel): AssessmentTemplate[] => {
    return ASSESSMENT_TEMPLATES.filter(t => t.difficulty === difficulty);
};

/**
 * Search templates
 */
export const searchTemplates = (query: string): AssessmentTemplate[] => {
    const lowerQuery = query.toLowerCase();
    return ASSESSMENT_TEMPLATES.filter(t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.role.toLowerCase().includes(lowerQuery) ||
        t.skills.some(s => s.toLowerCase().includes(lowerQuery)) ||
        t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
};

/**
 * Get popular templates
 */
export const getPopularTemplates = (limit: number = 5): AssessmentTemplate[] => {
    return [...ASSESSMENT_TEMPLATES]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit);
};

/**
 * Get recommended templates based on skills
 */
export const getRecommendedTemplates = (skills: string[], limit: number = 3): AssessmentTemplate[] => {
    const scored = ASSESSMENT_TEMPLATES.map(template => {
        const matchScore = template.skills.filter(s =>
            skills.some(us => us.toLowerCase() === s.toLowerCase())
        ).length;
        return { template, score: matchScore };
    });

    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.template);
};

/**
 * Clone template for customization
 */
export const cloneTemplate = (templateId: string, customizations?: Partial<AssessmentTemplate>): AssessmentTemplate | null => {
    const template = getTemplateById(templateId);
    if (!template) return null;

    return {
        ...template,
        ...customizations,
        id: `custom-${Date.now()}`,
        name: customizations?.name || `${template.name} (Copy)`
    };
};

/**
 * Get template categories with counts
 */
export const getCategories = (): { category: string; count: number; label: string }[] => {
    const categoryLabels: Record<string, string> = {
        engineering: 'Engineering',
        product: 'Product',
        design: 'Design',
        sales: 'Sales',
        customer_success: 'Customer Success',
        data: 'Data & Analytics',
        operations: 'Operations'
    };

    const counts: Record<string, number> = {};
    ASSESSMENT_TEMPLATES.forEach(t => {
        counts[t.category] = (counts[t.category] || 0) + 1;
    });

    return Object.entries(counts).map(([category, count]) => ({
        category,
        count,
        label: categoryLabels[category] || category
    }));
};
