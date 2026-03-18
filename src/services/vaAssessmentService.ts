/**
 * Virtual Assistant Assessment Service
 * Specific assessment types for VA roles: typing, workspace, communication, writing
 */

// =====================================================
// INTERFACES
// =====================================================

export interface TypingTestResult {
    wordsPerMinute: number;
    accuracy: number;
    totalCharacters: number;
    correctCharacters: number;
    errors: number;
    duration: number; // seconds
    passed: boolean;
}

export interface TypingTestConfig {
    minimumWPM: number;
    minimumAccuracy: number;
    duration: number; // seconds
}

export interface GoogleWorkspaceQuestion {
    id: string;
    tool: 'docs' | 'sheets' | 'slides' | 'calendar' | 'gmail';
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface CommunicationScenario {
    id: string;
    type: 'email_response' | 'meeting_notes' | 'client_message' | 'escalation';
    context: string;
    prompt: string;
    evaluationCriteria: string[];
    exampleGoodResponse?: string;
}

export interface WritingTask {
    id: string;
    type: 'memo' | 'summary' | 'meeting_notes' | 'sop' | 'email_draft';
    title: string;
    instructions: string;
    context: string;
    requirements: string[];
    wordLimit?: { min: number; max: number };
}

// =====================================================
// TYPING TEST PASSAGES
// =====================================================

export const TYPING_TEST_PASSAGES = [
    // Professional VA-relevant passages
    `Thank you for reaching out regarding your upcoming meeting schedule. I have reviewed your calendar and identified several time slots that work well for the conference call with the international team. Please let me know which option works best for you, and I will send out the calendar invites to all participants.`,

    `I am writing to confirm the details of tomorrow's executive briefing. The meeting will take place in Conference Room B at 10:00 AM. I have prepared the presentation materials and distributed the agenda to all attendees. Please let me know if you need any additional information before the meeting.`,

    `Following up on our conversation from earlier today, I have completed the expense report and attached all necessary receipts. The total amount for reimbursement is $847.50, which includes travel expenses, meals, and accommodation for the client visit last week.`,

    `Dear Team, This is a reminder that the quarterly reports are due by end of day Friday. Please ensure all data is accurate and properly formatted before submission. If you have any questions or need assistance with the template, feel free to reach out to me directly.`,

    `I wanted to update you on the status of the vendor contracts. I have reviewed all documentation and flagged two items that require your attention. Please find the detailed summary attached. I recommend scheduling a brief call to discuss the next steps before the deadline.`
];

// =====================================================
// GOOGLE WORKSPACE QUESTIONS
// =====================================================

export const GOOGLE_WORKSPACE_QUESTIONS: GoogleWorkspaceQuestion[] = [
    // Google Docs
    {
        id: 'docs-1',
        tool: 'docs',
        question: 'How do you share a Google Doc so that recipients can only view but not edit?',
        options: [
            'File > Share > Set to "Viewer"',
            'Right-click > Download as PDF',
            'File > Print > Save as PDF',
            'Tools > Protect document'
        ],
        correctAnswer: 0,
        explanation: 'When sharing, you can set permission levels: Viewer (view only), Commenter (view and comment), or Editor (full edit access).',
        difficulty: 'easy'
    },
    {
        id: 'docs-2',
        tool: 'docs',
        question: 'What is the keyboard shortcut to add a comment in Google Docs?',
        options: [
            'Ctrl/Cmd + Alt + M',
            'Ctrl/Cmd + C',
            'Ctrl/Cmd + Shift + C',
            'Ctrl/Cmd + K'
        ],
        correctAnswer: 0,
        explanation: 'Ctrl+Alt+M (Windows) or Cmd+Option+M (Mac) opens the comment dialog for the selected text.',
        difficulty: 'medium'
    },
    {
        id: 'docs-3',
        tool: 'docs',
        question: 'How can you see who made specific changes to a shared document?',
        options: [
            'File > Version history > See version history',
            'View > Show edits',
            'Tools > Review changes',
            'Edit > Find and replace'
        ],
        correctAnswer: 0,
        explanation: 'Version history shows all changes made to the document, who made them, and when.',
        difficulty: 'easy'
    },

    // Google Sheets
    {
        id: 'sheets-1',
        tool: 'sheets',
        question: 'Which function would you use to find a value in the first column of a range and return a value in the same row from another column?',
        options: [
            'VLOOKUP',
            'HLOOKUP',
            'INDEX',
            'SEARCH'
        ],
        correctAnswer: 0,
        explanation: 'VLOOKUP (Vertical Lookup) searches vertically in the first column and returns a value from a specified column.',
        difficulty: 'medium'
    },
    {
        id: 'sheets-2',
        tool: 'sheets',
        question: 'What formula would calculate the sum of cells A1 through A10?',
        options: [
            '=SUM(A1:A10)',
            '=ADD(A1:A10)',
            '=TOTAL(A1:A10)',
            '=A1+A10'
        ],
        correctAnswer: 0,
        explanation: 'SUM is the standard function for adding a range of cells.',
        difficulty: 'easy'
    },
    {
        id: 'sheets-3',
        tool: 'sheets',
        question: 'How do you freeze the top row so it stays visible when scrolling?',
        options: [
            'View > Freeze > 1 row',
            'Format > Lock row',
            'Insert > Frozen row',
            'Data > Filter > Freeze'
        ],
        correctAnswer: 0,
        explanation: 'View > Freeze allows you to freeze rows or columns to keep them visible while scrolling.',
        difficulty: 'easy'
    },
    {
        id: 'sheets-4',
        tool: 'sheets',
        question: 'Which function counts only cells that meet a specific condition?',
        options: [
            'COUNTIF',
            'COUNT',
            'COUNTA',
            'SUMIF'
        ],
        correctAnswer: 0,
        explanation: 'COUNTIF counts cells that match a specified criteria. SUMIF adds values that match criteria.',
        difficulty: 'medium'
    },

    // Google Slides
    {
        id: 'slides-1',
        tool: 'slides',
        question: 'How do you apply the same formatting changes to all slides at once?',
        options: [
            'Edit the Master slide (Slide > Edit theme)',
            'Select all slides and format each',
            'Use Format Painter on each slide',
            'Copy and paste individual elements'
        ],
        correctAnswer: 0,
        explanation: 'The Master slide controls the default layout and formatting for all slides in the presentation.',
        difficulty: 'medium'
    },
    {
        id: 'slides-2',
        tool: 'slides',
        question: 'What is the best way to add speaker notes that only you can see during a presentation?',
        options: [
            'Click on "Click to add speaker notes" at the bottom',
            'Insert > Text box in corner',
            'Add a hidden slide',
            'Use View > Grid view'
        ],
        correctAnswer: 0,
        explanation: 'Speaker notes appear below each slide and are visible to the presenter but not the audience.',
        difficulty: 'easy'
    },

    // Google Calendar
    {
        id: 'calendar-1',
        tool: 'calendar',
        question: 'How do you schedule a recurring meeting that happens every Monday at 9 AM?',
        options: [
            'Create event > Click "Does not repeat" > Select "Weekly on Monday"',
            'Create 52 individual events',
            'Use the "Clone event" feature',
            'Import a CSV file'
        ],
        correctAnswer: 0,
        explanation: 'When creating an event, click the repeat dropdown to set up recurring meetings.',
        difficulty: 'easy'
    },
    {
        id: 'calendar-2',
        tool: 'calendar',
        question: 'How can you check if attendees are available before scheduling a meeting?',
        options: [
            'Use "Find a time" when creating the event',
            'Call each person individually',
            'Send a poll via email',
            'Check their out-of-office status'
        ],
        correctAnswer: 0,
        explanation: '"Find a time" shows the availability of all invited attendees in a visual timeline.',
        difficulty: 'easy'
    },
    {
        id: 'calendar-3',
        tool: 'calendar',
        question: 'What happens when you set an event as "Out of office"?',
        options: [
            'It automatically declines new meeting invites during that time',
            'It deletes all existing meetings',
            'It sends an email to all contacts',
            'It only changes the event color'
        ],
        correctAnswer: 0,
        explanation: 'Out of office events can automatically decline new invitations and show you as unavailable.',
        difficulty: 'medium'
    },

    // Gmail
    {
        id: 'gmail-1',
        tool: 'gmail',
        question: 'How do you schedule an email to be sent at a later time?',
        options: [
            'Click the arrow next to Send > Schedule send',
            'Save as draft and set a reminder',
            'Use the Snooze feature',
            'Gmail cannot schedule emails'
        ],
        correctAnswer: 0,
        explanation: 'Schedule send allows you to compose now and have Gmail send the email at a specified time.',
        difficulty: 'easy'
    },
    {
        id: 'gmail-2',
        tool: 'gmail',
        question: 'What is the correct way to set up a professional email signature in Gmail?',
        options: [
            'Settings (gear icon) > See all settings > General > Signature',
            'Compose > Insert > Signature',
            'Right-click in compose window',
            'Add signature text to each email manually'
        ],
        correctAnswer: 0,
        explanation: 'Email signatures are configured in Gmail settings and automatically added to outgoing emails.',
        difficulty: 'easy'
    },
    {
        id: 'gmail-3',
        tool: 'gmail',
        question: 'How do you create a filter to automatically label emails from a specific sender?',
        options: [
            'Search for the sender > Click the filter icon > Create filter',
            'Right-click the email > Add label',
            'Settings > Labels > Auto-label',
            'Drag the email to a label folder'
        ],
        correctAnswer: 0,
        explanation: 'Filters automate email organization by applying actions (labels, archive, etc.) to matching emails.',
        difficulty: 'medium'
    }
];

// =====================================================
// COMMUNICATION SCENARIOS
// =====================================================

export const COMMUNICATION_SCENARIOS: CommunicationScenario[] = [
    {
        id: 'comm-1',
        type: 'email_response',
        context: 'You are an Executive Assistant. Your manager is in meetings all day and cannot be disturbed. An external client sends an urgent email requesting an immediate callback about a "critical issue" with their account.',
        prompt: 'Draft a professional response to the client that acknowledges urgency, sets expectations, and maintains a positive relationship.',
        evaluationCriteria: [
            'Professional tone',
            'Acknowledgment of urgency',
            'Clear timeline/expectations',
            'Offers alternative solutions',
            'Maintains client relationship'
        ],
        exampleGoodResponse: 'Dear [Client],\n\nThank you for reaching out. I understand this is an urgent matter and want to assure you that it is our top priority.\n\n[Manager name] is currently in back-to-back meetings today, but I have flagged your message as high priority. I expect they will be able to return your call by [time] today, or first thing tomorrow morning at the latest.\n\nIn the meantime, if there is anything I can help clarify or any information I can gather to expedite the resolution, please let me know.\n\nBest regards,\n[Your name]'
    },
    {
        id: 'comm-2',
        type: 'client_message',
        context: 'A long-time client is frustrated because they received the wrong shipment. They are threatening to cancel their account.',
        prompt: 'Write a response that de-escalates the situation and offers a solution.',
        evaluationCriteria: [
            'Empathy and understanding',
            'Takes responsibility (no blame shifting)',
            'Offers concrete solution',
            'Provides timeline for resolution',
            'Reassures about future service'
        ]
    },
    {
        id: 'comm-3',
        type: 'meeting_notes',
        context: 'You just attended a 45-minute team meeting. Topics discussed: Q3 sales targets (up 15%), new CRM system rollout scheduled for October, hiring two new sales reps, and Marketing wants to collaborate on a joint campaign.',
        prompt: 'Write concise meeting notes that capture key decisions and action items.',
        evaluationCriteria: [
            'Clear structure and formatting',
            'Key decisions captured',
            'Action items with owners',
            'Concise but complete',
            'Professional language'
        ]
    },
    {
        id: 'comm-4',
        type: 'escalation',
        context: 'A team member has missed a critical deadline for the third time this month, impacting the entire project timeline. You need to escalate this to your manager.',
        prompt: 'Write an internal escalation email that is factual, professional, and solution-oriented.',
        evaluationCriteria: [
            'Factual, not emotional',
            'Clearly states the issue',
            'Impact is quantified',
            'Suggests next steps',
            'Maintains professionalism'
        ]
    }
];

// =====================================================
// WRITING TASKS
// =====================================================

export const WRITING_TASKS: WritingTask[] = [
    {
        id: 'write-1',
        type: 'memo',
        title: 'Office Policy Update Memo',
        instructions: 'Write a formal internal memo announcing a new hybrid work policy.',
        context: 'The company is implementing a new policy: employees must be in-office Tuesday through Thursday, with Monday and Friday optional for remote work. This starts next month.',
        requirements: [
            'Professional memo format',
            'Clear explanation of the new policy',
            'Effective date mentioned',
            'Contact for questions',
            'Positive, supportive tone'
        ],
        wordLimit: { min: 150, max: 300 }
    },
    {
        id: 'write-2',
        type: 'summary',
        title: 'Executive Summary',
        instructions: 'Write an executive summary of a quarterly performance report.',
        context: 'Q3 Results: Revenue up 12% YoY, new customer acquisition up 25%, customer churn reduced by 8%, launched 2 new product features, expanded to 3 new markets, hired 15 new employees.',
        requirements: [
            'Concise and scannable',
            'Key metrics highlighted',
            'Structured format',
            'Forward-looking statement',
            'Professional tone'
        ],
        wordLimit: { min: 100, max: 200 }
    },
    {
        id: 'write-3',
        type: 'meeting_notes',
        title: 'Client Meeting Summary',
        instructions: 'Create professional meeting notes from a client call.',
        context: 'Meeting with Acme Corp about their software renewal. Discussed: current usage (150 users), pain points (slow support response), renewal pricing (15% increase proposed), timeline (contract expires in 60 days). They want to see a demo of new features before deciding.',
        requirements: [
            'Attendees and date placeholder',
            'Discussion points summarized',
            'Action items with owners',
            'Next steps and deadlines',
            'Distributed-ready format'
        ],
        wordLimit: { min: 150, max: 250 }
    },
    {
        id: 'write-4',
        type: 'sop',
        title: 'Standard Operating Procedure',
        instructions: 'Write a simple SOP for onboarding new team members.',
        context: 'Create a step-by-step guide for the first-day checklist when a new employee joins the team. Include IT setup, HR paperwork, team introductions, and initial training.',
        requirements: [
            'Numbered steps',
            'Clear and actionable',
            'Responsible parties noted',
            'Checkboxes or completion indicators',
            'Easy to follow for anyone'
        ],
        wordLimit: { min: 200, max: 350 }
    }
];

// =====================================================
// DEFAULT CONFIGS
// =====================================================

export const DEFAULT_TYPING_CONFIG: TypingTestConfig = {
    minimumWPM: 40,
    minimumAccuracy: 95,
    duration: 60 // 1 minute
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate typing test results
 */
export const calculateTypingResult = (
    originalText: string,
    typedText: string,
    durationSeconds: number,
    config: TypingTestConfig = DEFAULT_TYPING_CONFIG
): TypingTestResult => {
    const originalWords = originalText.trim().split(/\s+/);
    const typedWords = typedText.trim().split(/\s+/);

    // Calculate accuracy by comparing characters
    let correctChars = 0;
    const minLength = Math.min(originalText.length, typedText.length);

    for (let i = 0; i < minLength; i++) {
        if (originalText[i] === typedText[i]) {
            correctChars++;
        }
    }

    const totalChars = typedText.length;
    const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 0;
    const errors = totalChars - correctChars;

    // Calculate WPM (standard: 5 characters = 1 word)
    const wordsTyped = typedText.length / 5;
    const minutes = durationSeconds / 60;
    const wpm = minutes > 0 ? Math.round(wordsTyped / minutes) : 0;

    return {
        wordsPerMinute: wpm,
        accuracy: Math.round(accuracy * 10) / 10,
        totalCharacters: totalChars,
        correctCharacters: correctChars,
        errors,
        duration: durationSeconds,
        passed: wpm >= config.minimumWPM && accuracy >= config.minimumAccuracy
    };
};

/**
 * Get random typing passage
 */
export const getRandomTypingPassage = (): string => {
    const index = Math.floor(Math.random() * TYPING_TEST_PASSAGES.length);
    return TYPING_TEST_PASSAGES[index];
};

/**
 * Get Google Workspace questions by tool
 */
export const getQuestionsByTool = (tool: GoogleWorkspaceQuestion['tool']): GoogleWorkspaceQuestion[] => {
    return GOOGLE_WORKSPACE_QUESTIONS.filter(q => q.tool === tool);
};

/**
 * Get random subset of worksheet questions
 */
export const getRandomWorkspaceQuestions = (count: number = 10): GoogleWorkspaceQuestion[] => {
    const shuffled = [...GOOGLE_WORKSPACE_QUESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

/**
 * Score Google Workspace answers
 */
export const scoreWorkspaceAnswers = (
    questions: GoogleWorkspaceQuestion[],
    answers: number[]
): { score: number; correct: number; total: number; passed: boolean } => {
    let correct = 0;
    questions.forEach((q, i) => {
        if (answers[i] === q.correctAnswer) {
            correct++;
        }
    });

    const score = Math.round((correct / questions.length) * 100);
    return {
        score,
        correct,
        total: questions.length,
        passed: score >= 70
    };
};

/**
 * Get random communication scenario
 */
export const getRandomCommunicationScenario = (): CommunicationScenario => {
    const index = Math.floor(Math.random() * COMMUNICATION_SCENARIOS.length);
    return COMMUNICATION_SCENARIOS[index];
};

/**
 * Get random writing task
 */
export const getRandomWritingTask = (): WritingTask => {
    const index = Math.floor(Math.random() * WRITING_TASKS.length);
    return WRITING_TASKS[index];
};
