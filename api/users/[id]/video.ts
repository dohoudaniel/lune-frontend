import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../../lib/cors';
import { authenticate, requireRole } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { handleError, sendSuccess, ApiError } from '../../../lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const user = await authenticate(req);
        const { id } = req.query;

        if (typeof id !== 'string') {
            throw new ApiError(400, 'Invalid user ID');
        }

        if (user.id !== id) {
            throw new ApiError(403, 'Cannot upload video for another user');
        }

        requireRole(user, ['candidate']);

        const { videoUrl } = req.body;

        if (!videoUrl) {
            throw new ApiError(400, 'Video URL is required');
        }

        // Update candidate profile with video URL
        await supabase
            .from('candidate_profiles')
            .update({ video_intro_url: videoUrl })
            .eq('user_id', id);

        sendSuccess(res, { message: 'Video uploaded successfully', videoUrl });

    } catch (error) {
        handleError(error, res);
    }
}
