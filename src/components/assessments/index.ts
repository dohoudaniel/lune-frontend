// Assessment Components Export
// VA-Specific Assessment Components

export { TypingTest } from './TypingTest';
export { GoogleWorkspaceQuiz } from './GoogleWorkspaceQuiz';
export { WritingAssessment } from './WritingAssessment';

// Re-export types from service
export type {
    TypingTestResult,
    TypingTestConfig
} from '../../services/vaAssessmentService';
