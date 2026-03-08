import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../lib/cors';
import { authenticate, requireRole } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
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

        const { question, answer, role, topic } = req.body;

        if (!question || !answer || !role || !topic) {
            throw new ApiError(400, 'Question, answer, role, and topic are required');
        }

        // Get AI feedback on the answer
        const feedback = await geminiService.evaluateInterviewResponse(question, answer);

        // Store interview session
        const { data: interview, error } = await supabase
            .from('mock_interviews')
            .insert({
                user_id: user.id,
                role,
                topic,
                question,
                answer,
                clarity_score: feedback.clarity,
                confidence_score: feedback.confidence,
                relevance_score: feedback.relevance,
                feedback: feedback.feedback,
                improved_answer: feedback.improvedAnswer
            })
            .select()
            .single();

        if (error || !interview) {
            throw new ApiError(500, 'Failed to save interview session');
        }

        sendSuccess(res, {
            feedback: {
                clarity: feedback.clarity,
                confidence: feedback.confidence,
                relevance: feedback.relevance,
                feedback: feedback.feedback,
                improvedAnswer: feedback.improvedAnswer
            },
            interviewId: interview.id
        });

    } catch (error) {
        handleError(error, res);
    }
}
