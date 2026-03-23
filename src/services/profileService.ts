import { api } from '../lib/api';
import { CandidateProfile } from '../types';

export interface UserSession {
    id: string;
    ip_address: string | null;
    device_name: string;
    user_agent: string;
    created_at: string;
    last_active_at: string;
    is_active: boolean;
}

export const getActiveSessions = async (): Promise<UserSession[]> => {
    try {
        return (await api.get('/users/me/sessions/')) as UserSession[];
    } catch (error) {
        console.error('Error fetching active sessions:', error);
        return [];
    }
};

export const terminateSession = async (sessionId: string): Promise<boolean> => {
    try {
        await api.delete(`/users/me/sessions/${sessionId}/`);
        return true;
    } catch (error) {
        console.error('Error terminating session:', error);
        return false;
    }
};

export const uploadProfileImage = async (file: File): Promise<string | null> => {
    try {
        const formData = new FormData();
        formData.append('image', file);
        const response = await api.postForm('/profiles/upload-image/', formData);
        return response.url ?? null;
    } catch (error) {
        console.error('Error uploading profile image:', error);
        return null;
    }
};

export const generatePassport = async (): Promise<{ passportId: string; txHash: string } | null> => {
    try {
        return await api.post('/profiles/generate-passport/');
    } catch (error) {
        console.error('Error generating passport:', error);
        return null;
    }
};

export const getCandidateProfile = async (_userId?: string): Promise<Partial<CandidateProfile> | null> => {
    try {
        // Always fetch via the authenticated endpoint — avoids UUID lookup failures
        // that silently return null and leave the dashboard with stale/default data.
        const data = await api.get('/profiles/candidate/') as any;
        if (!data) return null;
        // Normalise backend snake_case field names → frontend camelCase CandidateProfile shape
        return {
            ...data,
            image: data.image_url ?? data.image ?? undefined,
            yearsOfExperience: data.years_of_experience ?? data.yearsOfExperience ?? undefined,
            preferredWorkMode: data.preferred_work_mode ?? data.preferredWorkMode ?? undefined,
            videoIntroUrl: data.video_intro_url ?? data.videoIntroUrl ?? undefined,
        };
    } catch (error) {
        console.error('Error in getCandidateProfile:', error);
        return null;
    }
};

export const updateCandidateProfile = async (userId: string, updates: Partial<CandidateProfile>): Promise<boolean> => {
    try {
        await api.put(`/profiles/candidate/`, updates);
        return true;
    } catch (error) {
        console.error('Error in updateCandidateProfile:', error);
        return false;
    }
};
export const getEmployerProfile = async (userId: string): Promise<any | null> => {
    try {
        return await api.get(`/profiles/employer/${userId}/`);
    } catch (error) {
        console.error('Error in getEmployerProfile:', error);
        return null;
    }
};

export const updateEmployerProfile = async (updates: any): Promise<boolean> => {
    try {
        await api.put(`/profiles/employer/`, updates);
        return true;
    } catch (error) {
        console.error('Error in updateEmployerProfile:', error);
        return false;
    }
};
