import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../lib/cors';
import { authenticate, requireRole } from '../../lib/auth';
import { handleError, sendSuccess, ApiError } from '../../lib/errors';
import * as geminiService from '../../lib/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const user = await authenticate(req);
        requireRole(user, ['candidate']);

        const { role, topic } = req.body;

        if (!role || !topic) {
            throw new ApiError(400, 'Role and topic are required');
        }

        if (!['behavioral', 'technical'].includes(topic)) {
            throw new ApiError(400, 'Topic must be either "behavioral" or "technical"');
        }

        // Generate interview question using Gemini AI
        const question = await geminiService.generateInterviewQuestion(role, topic);

        sendSuccess(res, {
            question,
            role,
            topic
        });

    } catch (error) {
        handleError(error, res);
    }
}
