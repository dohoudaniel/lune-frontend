import { supabase } from '../lib/supabase';
import { Job, CandidateProfile } from '../types';

// Local Assessment interface for dashboard usage
interface Assessment {
    id: string;
    name: string;
    skill: string;
    difficulty: string;
    questionsCount: number;
    timeLimit: number;
    candidatesInvited: number;
    candidatesCompleted: number;
    createdAt: string;
    status: string;
}

export const dataService = {
    // --- Jobs ---

    async getJobs(): Promise<Job[]> {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching jobs:', error);
            throw error;
        }

        return data || [];
    },

    async getJobById(id: string): Promise<Job | null> {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching job:', error);
            return null;
        }

        return data;
    },

    async createJob(job: Omit<Job, 'id' | 'created_at'>): Promise<Job | null> {
        const { data, error } = await supabase
            .from('jobs')
            .insert([job])
            .select()
            .single();

        if (error) {
            console.error('Error creating job:', error);
            throw error;
        }

        return data;
    },

    // --- Candidates ---

    async getCandidates(): Promise<CandidateProfile[]> {
        // Fetch candidate profiles with user data and assessment submissions
        const { data, error } = await supabase
            .from('candidate_profiles')
            .select(`
                *,
                user:user_id (
                    name,
                    email
                ),
                assessment_submissions:user_id (
                    id,
                    score,
                    passed,
                    submitted_at
                )
            `)
            .order('verified', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching candidates:', error);
            return [];
        }

        // Map database shape to UI CandidateProfile shape
        // A candidate is "verified" if they have at least one passed assessment
        return data.map((profile: any) => {
            const submissions = profile.assessment_submissions || [];
            // If RLS blocks submissions or it's empty, fallback to counting skills in profile
            const passedCount = submissions.length > 0
                ? submissions.filter((s: any) => s.passed).length
                : Object.keys(profile.skills || {}).length;

            const hasPassedAssessment = passedCount > 0;

            return {
                id: profile.user_id,
                name: profile.user?.name || 'Unknown Candidate',
                title: profile.title || 'Software Engineer',
                location: profile.location || 'Remote',
                image: profile.image_url,
                videoIntroUrl: profile.video_intro_url,
                skills: profile.skills || {},
                certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
                bio: profile.bio,
                experience: profile.experience,
                yearsOfExperience: profile.years_of_experience,
                preferredWorkMode: profile.preferred_work_mode,
                // Verified if profile flag is set OR has passed at least one assessment
                verified: profile.verified || hasPassedAssessment,
                // Extra data for employer view
                passedAssessments: passedCount,
                totalAssessments: submissions.length
            };
        });
    },


    // --- Assessments ---

    async getAssessments(): Promise<Assessment[]> {
        const { data, error } = await supabase
            .from('assessments')
            .select('*, skills(name)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching assessments:', error);
            return [];
        }

        return data.map((a: any) => ({
            id: a.id,
            name: a.title,
            skill: a.skills?.name || 'Unknown',
            difficulty: a.difficulty,
            questionsCount: a.theory_questions?.length || 0,
            timeLimit: a.time_limit || 45,
            candidatesInvited: a.candidates_invited || 0,
            candidatesCompleted: a.candidates_completed || 0,
            createdAt: a.created_at,
            status: a.status || 'active'
        }));
    },

    // --- Live Sessions (Proctoring) ---

    async getLiveSessions(): Promise<any[]> {
        // Return empty for now as requested
        return [];
    },

    async getRecordings(): Promise<any[]> {
        const { data, error } = await supabase
            .from('assessment_submissions')
            .select(`
            *,
            assessment:assessment_id (title, difficulty),
            user:user_id (name) 
        `)
            //.not('video_url', 'is', null) 
            .limit(20);

        if (error) {
            console.error('Error fetching recordings:', error);
            return [];
        }

        return data || [];
    }
};
