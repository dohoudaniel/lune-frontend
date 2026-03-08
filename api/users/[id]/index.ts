import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../../lib/cors';
import { authenticate } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { handleError, sendSuccess, ApiError } from '../../../lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    try {
        const user = await authenticate(req);
        const { id } = req.query;

        if (typeof id !== 'string') {
            throw new ApiError(400, 'Invalid user ID');
        }

        if (req.method === 'GET') {
            // Get user profile
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (userError || !userData) {
                throw new ApiError(404, 'User not found');
            }

            // Get role-specific profile
            let profile = null;
            if (userData.role === 'candidate') {
                const { data: candidateProfile } = await supabase
                    .from('candidate_profiles')
                    .select('*')
                    .eq('user_id', id)
                    .single();
                profile = candidateProfile;

                // Get skills and certifications
                const { data: certifications } = await supabase
                    .from('certifications')
                    .select('*, skills(name)')
                    .eq('user_id', id);

                if (profile) {
                    profile.certifications = certifications || [];
                }
            } else {
                const { data: employerProfile } = await supabase
                    .from('employer_profiles')
                    .select('*')
                    .eq('user_id', id)
                    .single();
                profile = employerProfile;
            }

            sendSuccess(res, {
                user: {
                    ...userData,
                    profile
                }
            });
        } else if (req.method === 'PUT') {
            // Verify user can only update their own profile
            if (user.id !== id) {
                throw new ApiError(403, 'Cannot update another user\'s profile');
            }

            const updates = req.body;

            // Update base user info
            if (updates.name) {
                await supabase
                    .from('users')
                    .update({ name: updates.name })
                    .eq('id', id);
            }

            // Update role-specific profile
            if (user.role === 'candidate') {
                const candidateUpdates: any = {};
                if (updates.title) candidateUpdates.title = updates.title;
                if (updates.location) candidateUpdates.location = updates.location;
                if (updates.bio) candidateUpdates.bio = updates.bio;
                if (updates.experience) candidateUpdates.experience = updates.experience;
                if (updates.years_of_experience) candidateUpdates.years_of_experience = updates.years_of_experience;
                if (updates.preferred_work_mode) candidateUpdates.preferred_work_mode = updates.preferred_work_mode;

                if (Object.keys(candidateUpdates).length > 0) {
                    await supabase
                        .from('candidate_profiles')
                        .update(candidateUpdates)
                        .eq('user_id', id);
                }
            } else {
                const employerUpdates: any = {};
                if (updates.company_name) employerUpdates.company_name = updates.company_name;
                if (updates.company_website) employerUpdates.company_website = updates.company_website;
                if (updates.company_size) employerUpdates.company_size = updates.company_size;
                if (updates.industry) employerUpdates.industry = updates.industry;

                if (Object.keys(employerUpdates).length > 0) {
                    await supabase
                        .from('employer_profiles')
                        .update(employerUpdates)
                        .eq('user_id', id);
                }
            }

            sendSuccess(res, { message: 'Profile updated successfully' });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        handleError(error, res);
    }
}
