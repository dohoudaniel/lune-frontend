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
        if (import.meta.env.DEV) { console.error('Error fetching active sessions:', error); } else { console.error('Error fetching active sessions:'); }
        return [];
    }
};

export const terminateSession = async (sessionId: string): Promise<boolean> => {
    try {
        await api.delete(`/users/me/sessions/${sessionId}/`);
        return true;
    } catch (error) {
        if (import.meta.env.DEV) { console.error('Error terminating session:', error); } else { console.error('Error terminating session:'); }
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
        if (import.meta.env.DEV) { console.error('Error uploading profile image:', error); } else { console.error('Error uploading profile image:'); }
        return null;
    }
};

export const generatePassport = async (): Promise<{ passportId: string; txHash: string } | null> => {
    try {
        return await api.post('/profiles/generate-passport/');
    } catch (error) {
        if (import.meta.env.DEV) { console.error('Error generating passport:', error); } else { console.error('Error generating passport:'); }
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
            cvText: data.cv_text ?? data.cvText ?? undefined,
            cvFileUrl: data.cv_file_url ?? data.cvFileUrl ?? undefined,
            // Guard arrays/objects so they never override defaults with undefined
            certifications: data.certifications ?? [],
            skills: data.skills ?? {},
        };
    } catch (error) {
        if (import.meta.env.DEV) { console.error('Error in getCandidateProfile:', error); } else { console.error('Error in getCandidateProfile:'); }
        return null;
    }
};

export const updateCandidateProfile = async (userId: string, updates: Partial<CandidateProfile>): Promise<boolean> => {
    try {
        await api.put(`/profiles/candidate/`, updates);
        return true;
    } catch (error) {
        if (import.meta.env.DEV) { console.error('Error in updateCandidateProfile:', error); } else { console.error('Error in updateCandidateProfile:'); }
        return false;
    }
};
export const getEmployerProfile = async (userId: string): Promise<any | null> => {
    try {
        return await api.get(`/profiles/employer/${userId}/`);
    } catch (error) {
        if (import.meta.env.DEV) { console.error('Error in getEmployerProfile:', error); } else { console.error('Error in getEmployerProfile:'); }
        return null;
    }
};

export const updateEmployerProfile = async (updates: any): Promise<boolean> => {
    try {
        await api.put(`/profiles/employer/`, updates);
        return true;
    } catch (error) {
        if (import.meta.env.DEV) { console.error('Error in updateEmployerProfile:', error); } else { console.error('Error in updateEmployerProfile:'); }
        return false;
    }
};
