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
            return await api.get('/jobs');
        } catch (error) {
            console.error('Error fetching jobs:', error);
            return [];
        }
    },

    async getJobById(id: string): Promise<Job | null> {
        try {
            return await api.get(`/jobs/${id}`);
        } catch (error) {
            console.error('Error fetching job:', error);
            return null;
        }
    },

    async createJob(job: Omit<Job, 'id' | 'created_at'>): Promise<Job | null> {
        try {
            return await api.post('/jobs', job);
        } catch (error) {
            console.error('Error creating job:', error);
            throw error;
        }
    },

    async getCandidates(): Promise<CandidateProfile[]> {
        try {
            return await api.get('/candidates');
        } catch (error) {
            console.error('Error fetching candidates:', error);
            return [];
        }
    },

    async getAssessments(): Promise<Assessment[]> {
        try {
            return await api.get('/assessments');
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
            return await api.get('/recordings');
        } catch (error) {
            console.error('Error fetching recordings:', error);
            return [];
        }
    }
};
