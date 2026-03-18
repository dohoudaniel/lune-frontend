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

import { api } from '../lib/api';

export const getEnterpriseAnalytics = async (
    companyId: string,
    dateRange: { start: Date; end: Date }
): Promise<EnterpriseAnalytics> => {
    const days = Math.round((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    return api.get(`/profiles/employer-analytics/?days=${days}`);
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
