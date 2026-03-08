import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

let ai: GoogleGenAI | null = null;
const modelId = 'gemini-2.0-flash-exp';

// Lazy initialization for serverless
const getAI = (): GoogleGenAI => {
    if (!ai) {
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is required');
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

export type DifficultyLevel = 'Beginner' | 'Mid-Level' | 'Advanced';

export interface AssessmentContent {
    title: string;
    description: string;
    difficulty: string;
    starterCode: string;
    theoryQuestions: {
        id: number;
        question: string;
        options: string[];
        correctAnswer?: number;
    }[];
}

export interface CheatingMetrics {
    tabSwitches: number;
    pasteEvents: number;
    suspiciousEyemovements: number;
    typingBursts: number;
    pasteContentWarnings: number;
}

/**
 * Generate a technical assessment for a skill
 */
export const generateAssessment = async (
    skill: string,
    difficulty: DifficultyLevel
): Promise<AssessmentContent> => {
    const prompt = `
    Generate a technical skill assessment for a candidate applying for a ${skill} role.
    Difficulty Level: ${difficulty}.
    
    Difficulty Context:
    - Beginner: Focus on syntax, basic concepts, and simple logic. Questions should test fundamental understanding.
    - Mid-Level: Focus on best practices, optimization, common patterns, and intermediate algorithms.
    - Advanced: Focus on system architecture, edge cases, performance tuning, complex algorithms, and design patterns.

    Include:
    1. A coding challenge with a clear title, detailed description, and appropriate starter code.
    2. Three theoretical multiple choice questions appropriate for the ${difficulty} level.
       Each question should have 4 options and indicate which option is correct (0-3 index).
    
    The assessment should be challenging but fair for the specified difficulty level.
    Output JSON format.
  `;

    try {
        const response = await getAI().models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        difficulty: { type: Type.STRING },
                        starterCode: { type: Type.STRING },
                        theoryQuestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.INTEGER },
                                    question: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correctAnswer: { type: Type.INTEGER }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) {
            const assessment = JSON.parse(response.text);
            return assessment;
        }

        throw new Error('No response text from Gemini');
    } catch (error) {
        console.error('Gemini Generation Error:', error);

        // Fallback assessment
        return {
            title: `${skill} Implementation (${difficulty})`,
            description: 'Create a function that handles data processing efficiently.',
            difficulty: difficulty,
            starterCode: '// Write your code here\nfunction solution() {\n  \n}',
            theoryQuestions: [
                {
                    id: 1,
                    question: 'What is the time complexity of QuickSort in the average case?',
                    options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(1)'],
                    correctAnswer: 1
                },
                {
                    id: 2,
                    question: 'Which principle is part of SOLID?',
                    options: ['Single Responsibility', 'Loose Coupling', 'High Cohesion', 'All of the above'],
                    correctAnswer: 0
                },
                {
                    id: 3,
                    question: `What is a key feature of ${skill}?`,
                    options: ['Performance', 'Scalability', 'Developer Experience', 'All of the above'],
                    correctAnswer: 3
                }
            ]
        };
    }
};

/**
 * Evaluate code submission and theory answers
 */
export const evaluateCodeSubmission = async (
    code: string,
    language: string,
    taskDescription: string,
    theoryAnswers: Record<number, number>,
    correctAnswers: Record<number, number>
): Promise<{ score: number; feedback: string }> => {

    // Calculate theory score
    let theoryScore = 0;
    const totalQuestions = Object.keys(correctAnswers).length;

    Object.entries(theoryAnswers).forEach(([questionId, answerIndex]) => {
        if (correctAnswers[parseInt(questionId)] === answerIndex) {
            theoryScore += 1;
        }
    });

    const theoryPercentage = (theoryScore / totalQuestions) * 100;

    const prompt = `
    You are a senior technical interviewer evaluating a coding assessment.
    
    Task Description: ${taskDescription}
    Language: ${language}
    
    Candidate Code Submission:
    \`\`\`${language}
    ${code}
    \`\`\`

    Theory Questions Score: ${theoryScore}/${totalQuestions} (${theoryPercentage.toFixed(1)}%)
    
    Evaluate the code based on:
    1. Correctness - Does it solve the problem?
    2. Code Quality - Is it clean, readable, and well-structured?
    3. Efficiency - Is the algorithm optimal?
    4. Best Practices - Does it follow language conventions?
    
    Provide:
    - A code quality score (0-100)
    - Detailed constructive feedback
    
    The final score will be weighted: 60% code quality + 40% theory score.
    Return JSON with codeScore and feedback.
  `;

    try {
        const response = await getAI().models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        codeScore: { type: Type.NUMBER },
                        feedback: { type: Type.STRING }
                    },
                    required: ['codeScore', 'feedback']
                }
            }
        });

        if (response.text) {
            const result = JSON.parse(response.text);

            // Calculate weighted final score
            const finalScore = Math.round((result.codeScore * 0.6) + (theoryPercentage * 0.4));

            const detailedFeedback = `
**Theory Questions:** ${theoryScore}/${totalQuestions} correct (${theoryPercentage.toFixed(1)}%)
**Code Quality:** ${result.codeScore}/100

${result.feedback}

**Final Score:** ${finalScore}/100 (60% code + 40% theory)
      `.trim();

            return {
                score: finalScore,
                feedback: detailedFeedback
            };
        }

        throw new Error('No response text');
    } catch (error) {
        console.error('Gemini Evaluation Error:', error);

        // Fallback evaluation
        const fallbackScore = Math.round(theoryPercentage * 0.7);
        return {
            score: fallbackScore,
            feedback: `Evaluation completed. Theory score: ${theoryScore}/${totalQuestions}. Code submission received.`
        };
    }
};

/**
 * Analyze proctoring data for cheating detection
 */
export const generateCheatingAnalysis = async (
    events: string[],
    metrics: CheatingMetrics,
    codeSnapshot: string
): Promise<{ isCheating: boolean; reason: string }> => {

    const prompt = `
    Act as a strict AI Proctor for a technical certification exam.
    Analyze the following session telemetry and code snapshot to detect academic dishonesty.

    Telemetry Metrics:
    - Tab Switches (Focus Lost): ${metrics.tabSwitches}
    - Paste Events: ${metrics.pasteEvents}
    - Suspicious Content in Pastes (LLM markers): ${metrics.pasteContentWarnings}
    - Implausible Typing Bursts: ${metrics.typingBursts}
    - Suspicious Gaze Alerts: ${metrics.suspiciousEyemovements}

    Event Log Timeline:
    ${JSON.stringify(events.slice(-20))} // Last 20 events

    Code Snapshot (First 500 chars):
    "${codeSnapshot.substring(0, 500)}..."

    Evaluation Rules:
    1. Tab Switching: More than 5 switches or extended absence > 10s is highly suspicious
    2. Paste Events: More than 3 paste events is suspicious
    3. LLM Markers: Any AI-generated content markers = immediate flag
    4. Typing Bursts: Large code blocks without paste events indicates script injection
    5. Gaze: Frequent looking away combined with pauses suggests secondary device

    Output a JSON object determining if the candidate should be flagged for cheating.
    "reason" should be a professional, evidence-based statement.
  `;

    try {
        const response = await getAI().models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isCheating: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING }
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }

        throw new Error('No analysis generated');
    } catch (error) {
        console.error('Proctoring AI Error:', error);

        // Fallback heuristics
        if (metrics.pasteContentWarnings > 0 || metrics.typingBursts > 3) {
            return {
                isCheating: true,
                reason: 'Automated Flag: Anomalous code insertion patterns detected (AI markers or scripting).'
            };
        }

        if (metrics.tabSwitches > 5 || metrics.pasteEvents > 3) {
            return {
                isCheating: true,
                reason: `Automated Flag: Excessive environment violations detected (Tabs: ${metrics.tabSwitches}, Pastes: ${metrics.pasteEvents}).`
            };
        }

        return { isCheating: false, reason: 'Session Verified Secure' };
    }
};

/**
 * Match candidates to a job description
 */
export const matchCandidatesToJob = async (
    jobDescription: string,
    candidates: any[]
): Promise<Array<{ candidateId: string; matchReason: string; score: number }>> => {

    const prompt = `
    Job Description: "${jobDescription}"
    
    Candidates: ${JSON.stringify(candidates.map(c => ({
        id: c.id,
        name: c.name,
        title: c.title,
        skills: c.skills,
        yearsOfExperience: c.years_of_experience,
        certifications: c.certifications?.length || 0
    })))}

    Rank the candidates based on the job description.
    Consider their skills match, years of experience, and certifications.
    
    Return a list of objects with candidateId, matchReason (one sentence), and score (0-100).
    Sort by score descending.
  `;

    try {
        const response = await getAI().models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            candidateId: { type: Type.STRING },
                            matchReason: { type: Type.STRING },
                            score: { type: Type.NUMBER }
                        }
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }

        return [];
    } catch (error) {
        console.error('Candidate matching error:', error);
        return [];
    }
};

/**
 * Generate interview question
 */
export const generateInterviewQuestion = async (
    role: string,
    topic: 'behavioral' | 'technical'
): Promise<string> => {

    const prompt = `
    Act as a senior interviewer.
    Generate a single, challenging ${topic} interview question for a ${role} candidate.
    The question should test their depth of knowledge or problem-solving ability.
    
    Output a JSON object with a "question" property.
  `;

    try {
        const response = await getAI().models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING }
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text).question;
        }

        return 'Tell me about a challenging project you worked on.';
    } catch (error) {
        console.error('Interview question generation error:', error);
        return 'Tell me about a challenging project you worked on.';
    }
};

/**
 * Evaluate interview response
 */
export const evaluateInterviewResponse = async (
    question: string,
    answer: string
): Promise<{
    clarity: number;
    confidence: number;
    relevance: number;
    feedback: string;
    improvedAnswer: string;
}> => {

    const prompt = `
    Question: "${question}"
    Candidate Answer: "${answer}"

    Evaluate the answer for:
    1. Communication Clarity (0-100) - How clear and structured is the answer?
    2. Confidence Tone (0-100) - Does the language show conviction?
    3. Content Relevance (0-100) - Does it actually answer the question?

    Provide constructive feedback and a specific "improvedAnswer" that refines the candidate's thoughts into a star-performer response.
    Output JSON.
  `;

    try {
        const response = await getAI().models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        clarity: { type: Type.NUMBER },
                        confidence: { type: Type.NUMBER },
                        relevance: { type: Type.NUMBER },
                        feedback: { type: Type.STRING },
                        improvedAnswer: { type: Type.STRING }
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }

        throw new Error('Failed to generate feedback');
    } catch (error) {
        console.error('Interview evaluation error:', error);
        return {
            clarity: 0,
            confidence: 0,
            relevance: 0,
            feedback: 'Unable to analyze response at this time.',
            improvedAnswer: ''
        };
    }
};
