import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../lib/cors';
import { supabase } from '../../lib/supabase';
import { handleError, sendSuccess, ApiError } from '../../lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ApiError(400, 'Email and password are required');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error || !data.user) {
            throw new ApiError(401, 'Invalid credentials');
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            throw new ApiError(500, 'Failed to fetch user profile');
        }

        sendSuccess(res, {
            message: 'Login successful',
            user: profile,
            session: {
                access_token: data.session?.access_token,
                refresh_token: data.session?.refresh_token,
                expires_at: data.session?.expires_at
            }
        });

    } catch (error) {
        handleError(error, res);
    }
}
