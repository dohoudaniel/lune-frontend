
export enum ViewState {
  LANDING = 'LANDING',
  AUTH_SELECTION = 'AUTH_SELECTION',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  CANDIDATE_DASHBOARD = 'CANDIDATE_DASHBOARD',
  SKILL_SELECTION = 'SKILL_SELECTION',
  ASSESSMENT = 'ASSESSMENT',
  ASSESSMENT_RESULT = 'ASSESSMENT_RESULT',
  EMPLOYER_DASHBOARD = 'EMPLOYER_DASHBOARD',
}

export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  EMPLOYER = 'EMPLOYER',
}

export type DifficultyLevel = 'Beginner' | 'Mid-Level' | 'Advanced';

export interface Skill {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'cloud' | 'devops' | 'architect' | 'generalist' | 'customer_service' | 'marketing' | 'admin' | 'sales' | 'communication' | 'office_tools';
}

export type AssessmentType = 'code' | 'text_editor' | 'spreadsheet' | 'presentation' | 'video_verification' | 'scenario';

export type SkillCategory = Skill['category'];

export interface CandidateProfile {
  id: string;
  name: string;
  title: string;
  location: string;
  image?: string;
  videoIntroUrl?: string;
  skills: Record<string, number>; // skillId -> percentage
  certifications: string[]; // PWR Chain Transaction Hashes
  bio?: string;
  experience?: string; // Text summary
  yearsOfExperience?: number; // Numeric
  preferredWorkMode?: 'Remote' | 'Hybrid' | 'On-site';
  verified?: boolean; // UI helper
  passportId?: string;
  passportTxHash?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description?: string;
  matchScore?: number;
  matchReason?: string;
}

export interface RecommendedCertification {
  name: string;
  provider: string;
  reason: string;
}

export interface EvaluationResult {
  score: number; // 0-100
  feedback: string;
  passed: boolean;
  cheatingDetected: boolean;
  cheatingReason?: string;
  certificationHash?: string;
  timeSpentSeconds?: number;
  integrityScore?: number;
  categoryScores?: Record<string, number>;
}

export interface AssessmentContent {
  title: string;
  description: string;
  difficulty: string;
  starterCode: string;
  theoryQuestions: {
    id: number;
    question: string;
    options: string[];
  }[];
}

export interface CertificateDetails {
  hash: string;
  candidateId?: string;
  candidateName: string;
  skill: string;
  level?: DifficultyLevel;
  score: number;
  timestamp: string;
  isValid: boolean;
  issuer: string;
}

export interface InterviewFeedback {
  clarity: number;
  confidence: number;
  relevance: number;
  feedback: string;
  improvedAnswer: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'certificate_verified' | 'certificate_minted' | 'job_match' | 'profile_view';
  title: string;
  message: string;
  relatedData?: {
    certificateHash?: string;
    skill?: string;
    companyName?: string;
    employerName?: string;
  };
  read: boolean;
  createdAt: string;
}

export interface VerificationEvent {
  id: string;
  certificateHash: string;
  candidateId: string;
  candidateName: string;
  skill: string;
  verifiedBy: string; // Employer company name
  verifiedAt: string;
}