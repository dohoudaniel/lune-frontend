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

        const {
            assessmentId,
            codeSubmission,
            theoryAnswers,
            proctoringMetrics
        } = req.body;

        if (!assessmentId || !codeSubmission || !theoryAnswers) {
            throw new ApiError(400, 'Assessment ID, code submission, and theory answers are required');
        }

        // Get assessment
        const { data: assessment, error: assessmentError } = await supabase
            .from('assessments')
            .select('*, skills(*)')
            .eq('id', assessmentId)
            .single();

        if (assessmentError || !assessment) {
            throw new ApiError(404, 'Assessment not found');
        }

        // Extract correct answers (server-side only)
        const correctAnswers: Record<number, number> = {};
        assessment.theory_questions.forEach((q: any) => {
            if (q.correctAnswer !== undefined) {
                correctAnswers[q.id] = q.correctAnswer;
            }
        });

        // Evaluate code submission
        const evaluation = await geminiService.evaluateCodeSubmission(
            codeSubmission,
            assessment.skills.name,
            assessment.description,
            theoryAnswers,
            correctAnswers
        );

        // Analyze proctoring data if provided
        let cheatingDetected = false;
        let cheatingReason = null;

        if (proctoringMetrics) {
            const cheatingAnalysis = await geminiService.generateCheatingAnalysis(
                proctoringMetrics.events || [],
                {
                    tabSwitches: proctoringMetrics.tabSwitches || 0,
                    pasteEvents: proctoringMetrics.pasteEvents || 0,
                    suspiciousEyemovements: proctoringMetrics.suspiciousEyemovements || 0,
                    typingBursts: proctoringMetrics.typingBursts || 0,
                    pasteContentWarnings: proctoringMetrics.pasteContentWarnings || 0
                },
                codeSubmission
            );

            cheatingDetected = cheatingAnalysis.isCheating;
            cheatingReason = cheatingAnalysis.reason;
        }

        // Determine if passed (score >= 70 and no cheating)
        const passed = evaluation.score >= 70 && !cheatingDetected;

        // Store submission
        const { data: submission, error: submissionError } = await supabase
            .from('assessment_submissions')
            .insert({
                user_id: user.id,
                assessment_id: assessmentId,
                code_submission: codeSubmission,
                theory_answers: theoryAnswers,
                score: evaluation.score,
                feedback: evaluation.feedback,
                passed,
                cheating_detected: cheatingDetected,
                cheating_reason: cheatingReason
            })
            .select()
            .single();

        if (submissionError || !submission) {
            throw new ApiError(500, 'Failed to save submission');
        }

        sendSuccess(res, {
            submission: {
                id: submission.id,
                score: evaluation.score,
                feedback: evaluation.feedback,
                passed,
                cheatingDetected,
                cheatingReason
            }
        });

    } catch (error) {
        handleError(error, res);
    }
}
