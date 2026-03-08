import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../lib/cors';
import { authenticate, requireRole } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { handleError, sendSuccess, sendCreated, ApiError } from '../../lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    try {
        const user = await authenticate(req);

        if (req.method === 'GET') {
            // Get all jobs
            const { data: jobs, error } = await supabase
                .from('jobs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw new ApiError(500, 'Failed to fetch jobs');
            }

            sendSuccess(res, { jobs });

        } else if (req.method === 'POST') {
            // Create a job (employers only)
            requireRole(user, ['employer']);

            const {
                title,
                company,
                location,
                type,
                salary,
                description,
                required_skills
            } = req.body;

            if (!title || !company || !location || !type || !salary || !description) {
                throw new ApiError(400, 'All job fields are required');
            }

            const { data: job, error } = await supabase
                .from('jobs')
                .insert({
                    employer_id: user.id,
                    title,
                    company,
                    location,
                    type,
                    salary,
                    description,
                    required_skills: required_skills || []
                })
                .select()
                .single();

            if (error || !job) {
                throw new ApiError(500, 'Failed to create job');
            }

            sendCreated(res, { job });

        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        handleError(error, res);
    }
}
