import { api } from '../lib/api';
import { Job, CandidateProfile } from '../types';

interface Assessment {
    id: string;
    name: string;
    skill: string;
    difficulty: string;
    questionsCount: number;
    timeLimit: number;
    candidatesInvited: number;
    candidatesCompleted: number;
    createdAt: string;
    status: string;
}

export const dataService = {
    async getJobs(): Promise<Job[]> {
        try {
            return await api.get('/jobs/');
        } catch (error) {
            console.error('Error fetching jobs:', error);
            return [];
        }
    },

    async getJobById(id: string): Promise<Job | null> {
        try {
            return await api.get(`/jobs/${id}/`);
        } catch (error) {
            console.error('Error fetching job:', error);
            return null;
        }
    },

    async createJob(job: Omit<Job, 'id' | 'created_at'>): Promise<Job | null> {
        try {
            return await api.post('/jobs/', job);
        } catch (error) {
            console.error('Error creating job:', error);
            throw error;
        }
    },

    // PERF-F2: paginated fetch — returns one page (20 candidates) and the total count.
    async getCandidatesPage(page = 1, pageSize = 20): Promise<{ results: CandidateProfile[]; count: number; next: string | null }> {
        try {
            const data = await api.get(`/candidates/?page=${page}&page_size=${pageSize}`);
            // Backend returns DRF paginated shape: { count, next, previous, results }
            if (data && Array.isArray((data as any).results)) {
                return data as { results: CandidateProfile[]; count: number; next: string | null };
            }
            // Fallback if backend returns a plain array (non-paginated)
            return { results: Array.isArray(data) ? data : [], count: 0, next: null };
        } catch (error) {
            console.error('Error fetching candidates:', error);
            return { results: [], count: 0, next: null };
        }
    },

    async getCandidates(): Promise<CandidateProfile[]> {
        const { results } = await this.getCandidatesPage(1, 20);
        return results;
    },

    async getAssessments(): Promise<Assessment[]> {
        try {
            return await api.get('/assessments/');
        } catch (error) {
            console.error('Error fetching assessments:', error);
            return [];
        }
    },

    async getLiveSessions(): Promise<any[]> {
        return [];
    },

    async getRecordings(): Promise<any[]> {
        try {
            return await api.get('/recordings/');
        } catch (error) {
            console.error('Error fetching recordings:', error);
            return [];
        }
    }
};
