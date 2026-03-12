/**
 * Enterprise Analytics Service
 * Provides analytics and metrics for enterprise dashboards
 */

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'recruiter' | 'hiring_manager';
    avatar?: string;
    joinedAt: Date;
    lastActive: Date;
}

export interface HiringMetrics {
    totalJobPosts: number;
    activeJobPosts: number;
    totalApplications: number;
    candidatesScreened: number;
    interviewsScheduled: number;
    offersExtended: number;
    offerAcceptanceRate: number;
    averageTimeToHire: number; // days
    costPerHire: number;
}

export interface TalentPoolMetrics {
    totalCandidates: number;
    verifiedCandidates: number;
    candidatesBySkill: Record<string, number>;
    candidatesByExperience: Record<string, number>;
    averageScore: number;
    topSkills: { skill: string; count: number; avgScore: number }[];
}

export interface TimelineDataPoint {
    date: string;
    applications: number;
    hires: number;
    interviews: number;
}

export interface PipelineStage {
    name: string;
    count: number;
    percentage: number;
    conversionRate: number;
}

export interface EnterpriseAnalytics {
    hiringMetrics: HiringMetrics;
    talentPool: TalentPoolMetrics;
    timeline: TimelineDataPoint[];
    pipeline: PipelineStage[];
    teamActivity: TeamActivityMetric[];
}

export interface TeamActivityMetric {
    memberId: string;
    memberName: string;
    candidatesReviewed: number;
    interviewsConducted: number;
    offersExtended: number;
    avgResponseTime: number; // hours
}

/**
 * Mock enterprise analytics data generator
 * In production, this would fetch from Supabase
 */
export const getEnterpriseAnalytics = async (
    companyId: string,
    dateRange: { start: Date; end: Date }
): Promise<EnterpriseAnalytics> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        hiringMetrics: generateHiringMetrics(),
        talentPool: generateTalentPoolMetrics(),
        timeline: generateTimelineData(dateRange),
        pipeline: generatePipelineData(),
        teamActivity: generateTeamActivity(),
    };
};

const generateHiringMetrics = (): HiringMetrics => ({
    totalJobPosts: Math.floor(Math.random() * 50) + 10,
    activeJobPosts: Math.floor(Math.random() * 20) + 5,
    totalApplications: Math.floor(Math.random() * 500) + 100,
    candidatesScreened: Math.floor(Math.random() * 200) + 50,
    interviewsScheduled: Math.floor(Math.random() * 100) + 20,
    offersExtended: Math.floor(Math.random() * 30) + 5,
    offerAcceptanceRate: Math.floor(Math.random() * 30) + 60,
    averageTimeToHire: Math.floor(Math.random() * 20) + 15,
    costPerHire: Math.floor(Math.random() * 3000) + 2000,
});

const generateTalentPoolMetrics = (): TalentPoolMetrics => ({
    totalCandidates: Math.floor(Math.random() * 1000) + 500,
    verifiedCandidates: Math.floor(Math.random() * 500) + 200,
    candidatesBySkill: {
        'React': Math.floor(Math.random() * 200) + 50,
        'Node.js': Math.floor(Math.random() * 150) + 40,
        'Python': Math.floor(Math.random() * 180) + 60,
        'AWS': Math.floor(Math.random() * 100) + 30,
        'TypeScript': Math.floor(Math.random() * 120) + 35,
    },
    candidatesByExperience: {
        '0-2 years': Math.floor(Math.random() * 200) + 100,
        '3-5 years': Math.floor(Math.random() * 300) + 150,
        '5-10 years': Math.floor(Math.random() * 200) + 80,
        '10+ years': Math.floor(Math.random() * 100) + 30,
    },
    averageScore: Math.floor(Math.random() * 20) + 70,
    topSkills: [
        { skill: 'React', count: 180, avgScore: 82 },
        { skill: 'Python', count: 150, avgScore: 78 },
        { skill: 'Node.js', count: 130, avgScore: 80 },
        { skill: 'AWS', count: 95, avgScore: 75 },
        { skill: 'TypeScript', count: 85, avgScore: 84 },
    ],
});

const generateTimelineData = (dateRange: { start: Date; end: Date }): TimelineDataPoint[] => {
    const data: TimelineDataPoint[] = [];
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
        data.push({
            date: current.toISOString().split('T')[0],
            applications: Math.floor(Math.random() * 20) + 5,
            hires: Math.floor(Math.random() * 3),
            interviews: Math.floor(Math.random() * 8) + 2,
        });
        current.setDate(current.getDate() + 1);
    }

    return data.slice(-30); // Last 30 days
};

const generatePipelineData = (): PipelineStage[] => {
    const applied = Math.floor(Math.random() * 300) + 200;
    const screened = Math.floor(applied * (0.4 + Math.random() * 0.2));
    const interviewed = Math.floor(screened * (0.3 + Math.random() * 0.2));
    const offered = Math.floor(interviewed * (0.4 + Math.random() * 0.2));
    const hired = Math.floor(offered * (0.6 + Math.random() * 0.2));

    return [
        { name: 'Applied', count: applied, percentage: 100, conversionRate: 100 },
        { name: 'Screened', count: screened, percentage: Math.round(screened / applied * 100), conversionRate: Math.round(screened / applied * 100) },
        { name: 'Interviewed', count: interviewed, percentage: Math.round(interviewed / applied * 100), conversionRate: Math.round(interviewed / screened * 100) },
        { name: 'Offered', count: offered, percentage: Math.round(offered / applied * 100), conversionRate: Math.round(offered / interviewed * 100) },
        { name: 'Hired', count: hired, percentage: Math.round(hired / applied * 100), conversionRate: Math.round(hired / offered * 100) },
    ];
};

const generateTeamActivity = (): TeamActivityMetric[] => {
    const names = ['Sarah Miller', 'John Davis', 'Emily Chen', 'Michael Brown', 'Lisa Wang'];

    return names.map((name, i) => ({
        memberId: `member-${i + 1}`,
        memberName: name,
        candidatesReviewed: Math.floor(Math.random() * 50) + 10,
        interviewsConducted: Math.floor(Math.random() * 20) + 5,
        offersExtended: Math.floor(Math.random() * 5) + 1,
        avgResponseTime: Math.floor(Math.random() * 24) + 4,
    }));
};

/**
 * Calculate hiring funnel conversion rates
 */
export const calculateFunnelMetrics = (
    pipeline: PipelineStage[]
): { overallConversion: number; bottleneck: string } => {
    let lowestConversion = 100;
    let bottleneck = '';

    for (let i = 1; i < pipeline.length; i++) {
        if (pipeline[i].conversionRate < lowestConversion) {
            lowestConversion = pipeline[i].conversionRate;
            bottleneck = `${pipeline[i - 1].name} → ${pipeline[i].name}`;
        }
    }

    const overallConversion = pipeline.length > 0
        ? Math.round(pipeline[pipeline.length - 1].count / pipeline[0].count * 100)
        : 0;

    return { overallConversion, bottleneck };
};

/**
 * Get skill gap analysis for hiring needs
 */
export const getSkillGapAnalysis = async (
    requiredSkills: string[],
    talentPool: TalentPoolMetrics
): Promise<{ skill: string; gap: number; recommendation: string }[]> => {
    return requiredSkills.map(skill => {
        const available = talentPool.candidatesBySkill[skill] || 0;
        const needed = Math.floor(Math.random() * 20) + 10; // Mock needed count
        const gap = Math.max(0, needed - available);

        let recommendation = '';
        if (gap === 0) {
            recommendation = 'Sufficient talent available';
        } else if (gap < 5) {
            recommendation = 'Consider broadening search criteria';
        } else if (gap < 10) {
            recommendation = 'Recommend targeted recruiting campaign';
        } else {
            recommendation = 'Consider upskilling existing team or hiring contractors';
        }

        return { skill, gap, recommendation };
    });
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Format number with abbreviation
 */
export const formatNumber = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};
