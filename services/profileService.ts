import { supabase } from '../lib/supabase';
import { CandidateProfile } from '../types';

export const getCandidateProfile = async (userId: string): Promise<Partial<CandidateProfile> | null> => {
    try {
        const { data, error } = await supabase
            .from('candidate_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return null;
        }

        // Map from snake_case DB columns to camelCase frontend interface
        return {
            title: data.title,
            location: data.location,
            bio: data.bio || undefined,
            experience: data.experience || undefined,
            yearsOfExperience: data.years_of_experience || 0,
            preferredWorkMode: data.preferred_work_mode || 'Remote',
            videoIntroUrl: data.video_intro_url || undefined,
            image: data.image_url || undefined,
            skills: typeof data.skills === 'string' ? JSON.parse(data.skills) : data.skills || {},
            certifications: typeof data.certifications === 'string' ? JSON.parse(data.certifications) : data.certifications || [],
            passportId: data.passport_id || undefined,
            passportTxHash: data.passport_tx_hash || undefined
        };
    } catch (error) {
        console.error('Error in getCandidateProfile:', error);
        return null;
    }
};

export const updateCandidateProfile = async (userId: string, updates: Partial<CandidateProfile>): Promise<boolean> => {
    try {
        const dbUpdates: any = {};

        // Map from camelCase to snake_case
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.location !== undefined) dbUpdates.location = updates.location;
        if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
        if (updates.experience !== undefined) dbUpdates.experience = updates.experience;
        if (updates.yearsOfExperience !== undefined) dbUpdates.years_of_experience = updates.yearsOfExperience;
        if (updates.preferredWorkMode !== undefined) dbUpdates.preferred_work_mode = updates.preferredWorkMode;
        if (updates.videoIntroUrl !== undefined) dbUpdates.video_intro_url = updates.videoIntroUrl;
        if (updates.image !== undefined) dbUpdates.image_url = updates.image;
        if (updates.skills !== undefined) dbUpdates.skills = updates.skills;
        if (updates.certifications !== undefined) dbUpdates.certifications = updates.certifications;
        if (updates.passportId !== undefined) dbUpdates.passport_id = updates.passportId;
        if (updates.passportTxHash !== undefined) dbUpdates.passport_tx_hash = updates.passportTxHash;

        if (Object.keys(dbUpdates).length === 0) return true;

        // Note: The table might not automatically handle image_url, skills, or certifications.
        // For simplicity we will blindly push the updates. If it fails, we catch the error.
        const { error } = await supabase
            .from('candidate_profiles')
            .update(dbUpdates)
            .eq('user_id', userId);

        if (error) {
            console.error('Failed to update candidate profile in Supabase:', error);

            // Try to upsert if the record doesn't exist
            if (error.code === 'PGRST116') {
                const { error: insertError } = await supabase
                    .from('candidate_profiles')
                    .insert({ user_id: userId, ...dbUpdates });

                if (insertError) {
                    console.error('Failed to insert new candidate profile:', insertError);
                    return false;
                }
                return true;
            }
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in updateCandidateProfile:', error);
        return false;
    }
};
