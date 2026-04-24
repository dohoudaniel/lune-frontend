import {
  AssessmentContent,
  Job,
  RecommendedCertification,
  InterviewFeedback,
  DifficultyLevel,
  AssessmentType,
  SkillCategory,
} from "../types";
import { api } from "../lib/api";
import { logger } from "../lib/logger";

// Skill to Category Mapping (static helper)
const SKILL_CATEGORY_MAP: Record<string, SkillCategory> = {
  // Frontend
  React: "frontend",
  Vue: "frontend",
  Angular: "frontend",
  CSS: "frontend",
  "CSS / Tailwind": "frontend",
  JavaScript: "frontend",
  TypeScript: "frontend",
  "Next.js": "frontend",
  // Backend
  "Node.js": "backend",
  Python: "backend",
  Java: "backend",
  Go: "backend",
  "Django / FastAPI": "backend",
  "REST API Design": "backend",
  PostgreSQL: "backend",
  MongoDB: "backend",
  // Mobile
  "React Native": "frontend",
  Flutter: "frontend",
  "iOS (Swift)": "frontend",
  "Android (Kotlin)": "frontend",
  Expo: "frontend",
  // Cloud / DevOps
  AWS: "cloud",
  Azure: "cloud",
  GCP: "cloud",
  "Google Cloud": "cloud",
  Docker: "devops",
  Kubernetes: "devops",
  "CI/CD": "devops",
  "CI/CD Pipelines": "devops",
  Terraform: "devops",
  // Architecture / SE
  "System Design": "architect",
  Microservices: "architect",
  "Data Structures & Algorithms": "architect",
  "Security Best Practices": "architect",
  // Developer Relations
  "Technical Writing": "generalist",
  "API Documentation": "generalist",
  "Community Management": "generalist",
  "Developer Advocacy": "generalist",
  // Customer Service
  "Customer Support Representative": "customer_service",
  "Call Center Agent": "customer_service",
  "Help Desk / IT Support": "customer_service",
  "Client Success Manager": "customer_service",
  "Live Chat Support": "customer_service",
  "Help Desk Support": "customer_service",
  // Sales
  "Sales Representative": "sales",
  "Sales Development Representative (SDR)": "sales",
  "Business Development": "sales",
  "Account Executive": "sales",
  "Lead Generation": "sales",
  "Cold Outreach / Email Sales": "sales",
  // Marketing
  "Digital Marketing": "marketing",
  "Social Media Manager": "marketing",
  "Social Media Management": "marketing",
  "Content Creator": "marketing",
  "Content Creation & Strategy": "marketing",
  "SEO Specialist": "marketing",
  "SEO & SEM": "marketing",
  "Email Marketing": "marketing",
  "Paid Advertising (Meta/Google)": "marketing",
  "Influencer Marketing": "marketing",
  // Admin / VA / E-Commerce
  "Virtual Assistant": "admin",
  "Executive Virtual Assistant": "admin",
  "Administrative VA": "admin",
  "Research & Data VA": "admin",
  "Calendar & Email Management": "admin",
  "Client Onboarding VA": "admin",
  "Executive Assistant": "admin",
  "Data Entry Specialist": "admin",
  "Office Administrator": "admin",
  "Shopify Management": "admin",
  "Amazon Seller Central": "admin",
  "Product Listing Optimization": "admin",
  "Order Fulfilment & Logistics": "admin",
  "Customer Returns Handling": "admin",
  // Project Management / HR
  "Project Manager": "generalist",
  "Scrum Master / Agile": "generalist",
  "Operations Manager": "generalist",
  "Program Coordinator": "generalist",
  "HR Coordinator": "generalist",
  "Talent Sourcing": "generalist",
  "Technical Recruiter": "generalist",
  "Onboarding Specialist": "generalist",
  "Quality Assurance": "generalist",
  Recruiter: "generalist",
  // Communication
  "Public Speaking": "communication",
  "Presentation Skills": "communication",
  "Business Writing": "communication",
  Negotiation: "communication",
  "Active Listening": "communication",
  // Office Tools
  "Microsoft Excel": "office_tools",
  "Microsoft Word": "office_tools",
  "Microsoft PowerPoint": "office_tools",
  "Google Workspace": "office_tools",
  "Notion / Airtable": "office_tools",
};

const NON_TECH_CATEGORIES: SkillCategory[] = [
  "customer_service",
  "sales",
  "marketing",
  "admin",
  "generalist",
  "communication",
  "office_tools",
];

export const getSkillCategory = (skill: string): SkillCategory => {
  return SKILL_CATEGORY_MAP[skill] || "generalist";
};

export const isNonTechSkill = (skill: string): boolean => {
  const category = getSkillCategory(skill);
  return NON_TECH_CATEGORIES.includes(category);
};

export const getAssessmentType = (skill: string): AssessmentType => {
  const category = getSkillCategory(skill);
  switch (category) {
    case "office_tools":
      if (skill.includes("Excel")) return "spreadsheet";
      if (skill.includes("PowerPoint")) return "presentation";
      if (skill.includes("Word")) return "text_editor";
      return "scenario";
    case "communication":
    case "sales":
    case "customer_service":
      return "video_verification";
    default:
      return NON_TECH_CATEGORIES.includes(category) ? "scenario" : "code";
  }
};

// Interfaces
export interface ScenarioAssessmentContent {
  title: string;
  description: string;
  difficulty: string;
  roleContext: string;
  uniqueId: string;
  situationalQuestions: {
    id: number;
    scenario: string;
    question: string;
    options?: string[];
    isOpenEnded: boolean;
    requiresOralResponse?: boolean;
    taskType: "multiple_choice" | "written_task" | "oral_response";
  }[];
  writtenTask?: {
    prompt: string;
    wordLimit: number;
    evaluationCriteria: string[];
  };
  rolePlayScenario?: {
    context: string;
    customerProfile: string;
    objective: string;
  };
  oralResponseTask?: {
    prompt: string;
    evaluationCriteria: string[];
    maxDurationSeconds: number;
  };
}

export interface CheatingMetrics {
  tabSwitches: number;
  pasteEvents: number;
  suspiciousEyemovements: number;
  typingBursts: number;
  pasteContentWarnings: number;
}

export interface SkillPassportAnalysis {
  strengths: {
    skill: string;
    score: number;
    evidence: string;
    category: string;
  }[];
  weaknesses: {
    skill: string;
    score: number;
    recommendation: string;
    resources: string[];
    category: string;
  }[];
  opportunities: {
    jobTitle: string;
    company: string;
    matchScore: number;
    reason: string;
    salaryRange: string;
    location: string;
  }[];
  overallProfile: {
    summary: string;
    readinessScore: number;
    topCategory: string;
    growthAreas: string[];
  };
}

export interface AssessmentHistoryItem {
  skill: string;
  score: number;
  passed: boolean;
  difficulty: DifficultyLevel;
  completedAt: string;
  category?: string;
}

export interface CertificationItem {
  skill: string;
  score: number;
  issuedAt: string;
  certificateId: string;
}

// =====================================================
// API CLIENT FUNCTIONS (PROXY)
// =====================================================

const callBackend = async (endpoint: string, body: any) => {
  try {
    return await api.post(`/ai/${endpoint}/`, body);
  } catch (error) {
    logger.error(`API Error (${endpoint})`, error);
    throw error;
  }
};

export const generateAssessment = async (
  skillName: string,
  difficulty: DifficultyLevel,
): Promise<AssessmentContent> => {
  return callBackend("generate-assessment", { skillName, difficulty });
};

export const generateScenarioAssessment = async (
  skill: string,
  difficulty: DifficultyLevel,
): Promise<ScenarioAssessmentContent> => {
  return callBackend("generate-scenario", { skill, difficulty });
};

export const evaluateCodeSubmission = async (
  code: string,
  language: string,
  taskDescription: string,
  theoryAnswers: string,
): Promise<{ score: number; feedback: string; eval_token?: string }> => {
  try {
    return await callBackend("evaluate-submission", {
      code,
      language,
      taskDescription,
      theoryAnswers,
    });
  } catch (e) {
    return { score: 0, feedback: "Evaluation failed." };
  }
};

export const generateCheatingAnalysis = async (
  events: string[],
  metrics: CheatingMetrics,
  codeSnapshot: string,
): Promise<{ isCheating: boolean; reason: string }> => {
  try {
    return await callBackend("analyze-cheating", {
      events,
      metrics,
      codeSnapshot,
    });
  } catch (e) {
    return { isCheating: false, reason: "Analysis failed" };
  }
};

export const evaluateScenarioResponse = async (
  skill: string,
  responses: {
    situationalAnswers: Record<number, string>;
    writtenResponse: string;
    oralResponseTranscript?: string;
  },
  assessmentContent: ScenarioAssessmentContent,
): Promise<{
  score: number;
  feedback: string;
  categoryScores: Record<string, number>;
  verbalCommunicationScore?: number;
  eval_token?: string;
}> => {
  try {
    return await callBackend("evaluate-scenario", {
      skill,
      responses,
      assessmentContent,
    });
  } catch (e) {
    return { score: 0, feedback: "Evaluation failed.", categoryScores: {} };
  }
};

export const getCareerRecommendations = async (
  skills: Record<string, number>,
): Promise<{ certifications: RecommendedCertification[]; jobs: Job[] }> => {
  try {
    const cacheKey = `career-recommendations-${JSON.stringify(skills)}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return data;
        }
      } catch (e) {
        // ignore cache parse error
      }
    }
    const result = await callBackend("career-recommendations", { skills });
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({ data: result, timestamp: Date.now() }),
    );
    return result;
  } catch (e) {
    return { certifications: [], jobs: [] };
  }
};

export const matchCandidatesToJob = async (
  jobDescription: string,
  candidates: any[],
): Promise<{ candidateId: string; matchReason: string; score: number }[]> => {
  try {
    return await callBackend("match-candidates", {
      jobDescription,
      candidates,
    });
  } catch (e) {
    return [];
  }
};

export const generateInterviewQuestion = async (
  role: string,
  topic: "behavioral" | "technical",
  profileContext?: { skills?: string; experienceYears?: string; bio?: string; cvText?: string },
): Promise<string> => {
  try {
    const res = await callBackend("interview-question", {
      role,
      topic,
      ...(profileContext ?? {}),
    });
    return res.question;
  } catch (e) {
    return "Tell me about a time you had to work under tight deadlines. How did you manage it?";
  }
};

export const evaluateInterviewResponse = async (
  question: string,
  answer: string,
): Promise<InterviewFeedback> => {
  try {
    return await callBackend("evaluate-interview", { question, answer });
  } catch (e) {
    return {
      clarity: 0,
      confidence: 0,
      relevance: 0,
      feedback: "Error",
      improvedAnswer: "",
    };
  }
};

export const generateSkillPassport = async (
  assessmentHistory: AssessmentHistoryItem[],
  certifications: CertificationItem[],
  candidateName: string,
): Promise<SkillPassportAnalysis> => {
  return callBackend("generate-passport", {
    assessmentHistory,
    certifications,
    candidateName,
  });
};
