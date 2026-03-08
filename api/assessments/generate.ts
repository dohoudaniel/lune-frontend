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

        const { skillName, difficulty } = req.body;

        if (!skillName || !difficulty) {
            throw new ApiError(400, 'Skill name and difficulty are required');
        }

        const validDifficulties = ['Beginner', 'Mid-Level', 'Advanced'];
        if (!validDifficulties.includes(difficulty)) {
            throw new ApiError(400, 'Invalid difficulty level');
        }

        // Get skill from database
        const { data: skill, error: skillError } = await supabase
            .from('skills')
            .select('*')
            .eq('name', skillName)
            .single();

        if (skillError || !skill) {
            throw new ApiError(404, 'Skill not found');
        }

        // Generate assessment using Gemini AI
        const assessmentContent = await geminiService.generateAssessment(
            skillName,
            difficulty
        );

        // Store assessment in database (without correct answers for security)
        const { data: assessment, error: assessmentError } = await supabase
            .from('assessments')
            .insert({
                skill_id: skill.id,
                difficulty,
                title: assessmentContent.title,
                description: assessmentContent.description,
                starter_code: assessmentContent.starterCode,
                theory_questions: assessmentContent.theoryQuestions.map(q => ({
                    id: q.id,
                    question: q.question,
                    options: q.options
                    // correctAnswer is NOT sent to client
                }))
            })
            .select()
            .single();

        if (assessmentError || !assessment) {
            throw new ApiError(500, 'Failed to create assessment');
        }

        // Return assessment without correct answers
        sendSuccess(res, {
            assessment: {
                id: assessment.id,
                skill: skillName,
                difficulty,
                title: assessment.title,
                description: assessment.description,
                starterCode: assessment.starter_code,
                theoryQuestions: assessment.theory_questions
            }
        });

    } catch (error) {
        handleError(error, res);
    }
}
