import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../lib/cors';
import { supabaseAdmin } from '../../lib/supabase';
import { handleError, sendCreated, ApiError } from '../../lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password, name, role } = req.body;

        // Validate input
        if (!email || !password || !name || !role) {
            throw new ApiError(400, 'Email, password, name, and role are required');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ApiError(400, 'Invalid email format');
        }

        if (!['candidate', 'employer'].includes(role)) {
            throw new ApiError(400, 'Role must be either "candidate" or "employer"');
        }

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Auto-confirm for development
        });

        if (authError || !authData.user) {
            throw new ApiError(400, authError?.message || 'Failed to create user');
        }

        // Create user profile
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                name,
                role
            });

        if (profileError) {
            // Rollback auth user creation
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw new ApiError(500, 'Failed to create user profile');
        }

        // Create role-specific profile
        if (role === 'candidate') {
            await supabaseAdmin
                .from('candidate_profiles')
                .insert({
                    user_id: authData.user.id,
                    title: 'Software Developer',
                    location: 'Remote'
                });
        } else {
            await supabaseAdmin
                .from('employer_profiles')
                .insert({
                    user_id: authData.user.id,
                    company_name: 'Company Name'
                });
        }

        sendCreated(res, {
            message: 'User created successfully',
            user: {
                id: authData.user.id,
                email,
                name,
                role
            }
        });

    } catch (error) {
        handleError(error, res);
    }
}
