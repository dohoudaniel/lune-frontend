import { api } from '../lib/api';
import { CandidateProfile } from '../types';

export const getCandidateProfile = async (userId: string): Promise<Partial<CandidateProfile> | null> => {
    try {
        const data = await api.get(`/profiles/candidate/${userId}/`);
        return data; // Assume backend returns correctly mapped data
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
