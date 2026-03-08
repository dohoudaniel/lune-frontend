import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../lib/cors';
import { authenticate, requireRole } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { handleError, sendSuccess, ApiError } from '../../lib/errors';
import * as pwrService from '../../lib/pwr';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const user = await authenticate(req);
        requireRole(user, ['candidate']);

        const { submissionId } = req.body;

        if (!submissionId) {
            throw new ApiError(400, 'Submission ID is required');
        }

        // Get submission details
        const { data: submission, error: submissionError } = await supabase
            .from('assessment_submissions')
            .select(`
                *,
                assessments (
                    *,
                    skills (*)
                )
            `)
            .eq('id', submissionId)
            .eq('user_id', user.id)
            .single();

        if (submissionError || !submission) {
            throw new ApiError(404, 'Submission not found');
        }

        // Verify submission passed
        if (!submission.passed) {
            throw new ApiError(400, 'Cannot mint certificate for failed assessment');
        }

        // Check if certificate already exists
        const { data: existingCert } = await supabase
            .from('certifications')
            .select('*')
            .eq('submission_id', submissionId)
            .single();

        if (existingCert) {
            return sendSuccess(res, {
                message: 'Certificate already exists',
                certificate: existingCert
            });
        }

        // Get user profile
        const { data: userProfile } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();

        // Mint certificate on PWRCHAIN
        const blockchainHash = await pwrService.mintCertificate({
            candidateName: userProfile?.name || 'Candidate',
            skill: submission.assessments.skills.name,
            score: submission.score,
            difficulty: submission.assessments.difficulty,
            timestamp: new Date().toISOString()
        });

        // Store certificate in database
        const { data: certificate, error: certError } = await supabase
            .from('certifications')
            .insert({
                user_id: user.id,
                skill_id: submission.assessments.skill_id,
                submission_id: submissionId,
                blockchain_hash: blockchainHash,
                score: submission.score,
                difficulty: submission.assessments.difficulty
            })
            .select()
            .single();

        if (certError || !certificate) {
            throw new ApiError(500, 'Failed to store certificate');
        }

        sendSuccess(res, {
            message: 'Certificate minted successfully',
            certificate: {
                id: certificate.id,
                blockchainHash: certificate.blockchain_hash,
                skill: submission.assessments.skills.name,
                score: certificate.score,
                difficulty: certificate.difficulty,
                issuedAt: certificate.issued_at,
                explorerUrl: pwrService.getExplorerUrl(blockchainHash)
            }
        });

    } catch (error) {
        handleError(error, res);
    }
}
