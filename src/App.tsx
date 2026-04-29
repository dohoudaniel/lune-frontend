import React, {
  useState,
  useEffect,
  Suspense,
  lazy,
  startTransition,
  Component,
  ErrorInfo,
  ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { Landing } from "./components/Landing";
import { AppShell } from "./components/AppShell";
import { NotFoundPage } from "./components/NotFoundPage";
import { LoginPage } from "./components/auth/LoginPage";
import { SignupPage } from "./components/auth/SignupPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/auth/ResetPasswordPage";
import { CheckEmail } from "./components/auth/CheckEmail";
import {
  InstallPrompt,
  registerServiceWorker,
} from "./components/InstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { MobileOverlay } from "./components/MobileOverlay";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CertificateData } from "./services/certificateBadgeService";
import { onboardingService } from "./services/onboardingService";
import {
  ViewState,
  UserRole,
  EvaluationResult,
  CandidateProfile,
  DifficultyLevel,
  AssessmentType,
} from "./types";
import {
  CheckCircle,
  AlertCircle,
  Code,
  ArrowLeft,
  ArrowRight,
  Award,
  ShieldCheck,
  Share2,
  Copy,
  Linkedin,
  Download,
  ExternalLink,
  X,
  Sparkles,
  Building2,
  Video,
  FileSpreadsheet,
  Presentation as PresentationIcon,
  FileText,
  Brain,
  RefreshCw,
} from "lucide-react";
import { ToastProvider, useToast } from "./lib/toast";
import { celebrateSuccess } from "./lib/confetti";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { getAssessmentType, getSkillCategory } from "./services/geminiService";
import {
  addAssessmentEntry,
  getSkillAttemptCount,
  invalidateHistory,
} from "./services/assessmentHistoryService";
import { VideoVerificationResult } from "./services/videoAnalysisService";
import { seedService } from "./services/seedService";

// Expose seedService to window for development only
if (import.meta.env.DEV) {
  (window as any).seedService = seedService;
}

import {
  getCandidateProfile,
  updateCandidateProfile,
  getEmployerProfile,
} from "./services/profileService";
import { initializeAssessmentHistory } from "./services/assessmentHistoryService";
import { initializeSessions } from "./services/assessmentSessionService";
import { initializeGamification } from "./services/gamificationService";
import { initializeAiLearning } from "./services/aiLearningService";
import { initializeNotifications } from "./services/notificationService";

// Lazy-loaded components for code splitting
const Assessment = lazy(() =>
  import("./components/Assessment").then((m) => ({ default: m.Assessment })),
);
const EmployerDashboard = lazy(() =>
  import("./components/EmployerDashboard").then((m) => ({
    default: m.EmployerDashboard,
  })),
);
const CandidateDashboard = lazy(() =>
  import("./components/CandidateDashboard").then((m) => ({
    default: m.CandidateDashboard,
  })),
);
const EnterpriseDashboard = lazy(() =>
  import("./components/EnterpriseDashboard").then((m) => ({
    default: m.EnterpriseDashboard,
  })),
);
const CertificateBadge = lazy(() =>
  import("./components/CertificateBadge").then((m) => ({
    default: m.CertificateBadge,
  })),
);
const VideoAnalyzer = lazy(() =>
  import("./components/VideoAnalyzer").then((m) => ({
    default: m.VideoAnalyzer,
  })),
);
const OnboardingTour = lazy(() =>
  import("./components/OnboardingTour").then((m) => ({
    default: m.OnboardingTour,
  })),
);
const WelcomeBanner = lazy(() =>
  import("./components/WelcomeBanner").then((m) => ({
    default: m.WelcomeBanner,
  })),
);
const ScenarioAssessment = lazy(() =>
  import("./components/ScenarioAssessment").then((m) => ({
    default: m.ScenarioAssessment,
  })),
);
const SpreadsheetAssessment = lazy(() =>
  import("./components/SpreadsheetAssessment").then((m) => ({
    default: m.SpreadsheetAssessment,
  })),
);
const TextEditorAssessment = lazy(() =>
  import("./components/TextEditorAssessment").then((m) => ({
    default: m.TextEditorAssessment,
  })),
);
const PresentationAssessment = lazy(() =>
  import("./components/PresentationAssessment").then((m) => ({
    default: m.PresentationAssessment,
  })),
);
const VerifyEmail = lazy(() =>
  import("./components/VerifyEmail").then((m) => ({ default: m.VerifyEmail })),
);
const VideoVerificationAssessment = lazy(() =>
  import("./components/VideoVerificationAssessment").then((m) => ({
    default: m.VideoVerificationAssessment,
  })),
);
const SkillPassport = lazy(() =>
  import("./components/SkillPassport").then((m) => ({
    default: m.SkillPassport,
  })),
);
const PermissionCheckModal = lazy(() =>
  import("./components/PermissionCheckModal").then((m) => ({
    default: m.PermissionCheckModal,
  })),
);
const LiveAssessmentViewer = lazy(() =>
  import("./components/LiveAssessmentViewer").then((m) => ({
    default: m.LiveAssessmentViewer,
  })),
);
const QuestionBankManager = lazy(() =>
  import("./components/QuestionBankManager").then((m) => ({
    default: m.QuestionBankManager,
  })),
);
const DataConsentModal = lazy(() =>
  import("./components/DataConsentModal").then((m) => ({
    default: m.DataConsentModal,
  })),
);
const AdminDashboard = lazy(() =>
  import("./components/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const ProfilePage = lazy(() =>
  import("./components/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const MockInterview = lazy(() =>
  import("./components/MockInterview").then((m) => ({
    default: m.MockInterview,
  })),
);
const AssessmentHistory = lazy(() =>
  import("./components/AssessmentHistory").then((m) => ({
    default: m.AssessmentHistory,
  })),
);
const MessagingUI = lazy(() =>
  import("./components/messaging/MessagingUI").then((m) => ({
    default: m.MessagingUI,
  })),
);
const CVViewerPage = lazy(() =>
  import("./components/CVViewerPage").then((m) => ({
    default: m.CVViewerPage,
  })),
);
const LeaderboardPage = lazy(() =>
  import("./components/LeaderboardPage").then((m) => ({
    default: m.LeaderboardPage,
  })),
);
const PublicPassportPage = lazy(() =>
  import("./components/PublicPassportPage").then((m) => ({
    default: m.PublicPassportPage,
  })),
);
const SubscriptionPage = lazy(() =>
  import("./components/SubscriptionPage").then((m) => ({
    default: m.SubscriptionPage,
  })),
);

const ProfileCompletionGate = lazy(() =>
  import("./components/ProfileCompletionGate").then((m) => ({
    default: m.ProfileCompletionGate,
  })),
);

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-cream">
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <img
          src="/icons/icon.svg"
          alt="Lune"
          className="w-16 h-16 rounded-2xl shadow-lg"
        />
        <div
          className="absolute -inset-2 rounded-[28px] border-[3px] border-teal/20 border-t-teal animate-spin"
          style={{ animationDuration: "1s" }}
        />
      </div>
      <div className="text-center">
        <p className="text-slate-700 font-semibold text-sm tracking-wide">
          lune
        </p>
        <p className="text-slate-400 text-xs mt-0.5">Loading your workspace…</p>
      </div>
    </div>
  </div>
);

// Storage key for profile persistence
const PROFILE_STORAGE_KEY = "lune_candidate_profile";

// Default profile for new users
const DEFAULT_PROFILE: CandidateProfile = {
  id: "123",
  name: "Jordan Lee",
  title: "Junior Developer",
  location: "San Francisco, CA",
  yearsOfExperience: 2,
  preferredWorkMode: "Hybrid",
  skills: {},
  certifications: [],
};

// Load profile from localStorage or return default
const loadProfileFromStorage = (): CandidateProfile => {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error loading profile from storage:", error);
    } else {
      console.error("Error loading profile from storage:");
    }
  }
  return DEFAULT_PROFILE;
};

// Save profile to localStorage (strip heavy base-64 fields)
const saveProfileToStorage = (profile: CandidateProfile) => {
  try {
    const minProfile = { ...profile };
    // Prevent QuotaExceededError by removing potentially massive strings
    delete minProfile.image;
    delete minProfile.videoIntroUrl;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(minProfile));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error saving profile to storage:", error);
    } else {
      console.error("Error saving profile to storage:");
    }
  }
};

/**
 * Maps the current URL path to a ViewState
 */
const getViewFromPath = (): ViewState => {
  const path = window.location.pathname;
  if (path === "/verify-email") return ViewState.VERIFY_EMAIL;
  if (path === "/reset-password") return ViewState.RESET_PASSWORD;
  if (path === "/login") return ViewState.LOGIN;
  if (path === "/signup") return ViewState.SIGNUP;
  if (path === "/forgot-password") return ViewState.FORGOT_PASSWORD;
  if (path === "/check-email") return ViewState.CHECK_EMAIL;
  if (path === "/dashboard") return ViewState.CANDIDATE_DASHBOARD;
  if (path === "/dashboard/interview") return ViewState.CANDIDATE_INTERVIEW;
  if (path === "/dashboard/progress") return ViewState.CANDIDATE_PROGRESS;
  if (path === "/dashboard/community") return ViewState.CANDIDATE_COMMUNITY;
  if (path === "/leaderboard") return ViewState.LEADERBOARD;
  if (path === "/dashboard/assess") return ViewState.SKILL_SELECTION;
  if (path === "/dashboard/assessment") return ViewState.ASSESSMENT;
  if (path === "/dashboard/result") return ViewState.ASSESSMENT_RESULT;
  if (path === "/employer") return ViewState.EMPLOYER_DASHBOARD;
  if (path === "/admin") return ViewState.ADMIN_DASHBOARD;
  if (path === "/profile") return ViewState.PROFILE;
  if (path.startsWith("/app/user/view-cv/")) return ViewState.VIEW_CV;
  if (path.startsWith("/passport/")) return ViewState.PUBLIC_PASSPORT;
  if (path === "/subscription") return ViewState.SUBSCRIPTION;
  if (path === "/") return ViewState.LANDING;
  return ViewState.NOT_FOUND;
};

function AppContent() {
  const toast = useToast();
  const { user, isAuthenticated, isLoading, logout, markOnboardingComplete } =
    useAuth();
  const [currentView, setCurrentView] = useState<ViewState>(getViewFromPath);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyLevel>("Mid-Level");
  const [assessmentResult, setAssessmentResult] =
    useState<EvaluationResult | null>(null);
  const [candidateProfile, setCandidateProfileState] =
    useState<CandidateProfile>(loadProfileFromStorage);

  // Wrapper to persist profile changes to localStorage and Supabase
  const setCandidateProfile = (
    updater: CandidateProfile | ((prev: CandidateProfile) => CandidateProfile),
  ) => {
    setCandidateProfileState((prev) => {
      const newProfile =
        typeof updater === "function" ? updater(prev) : updater;
      saveProfileToStorage(newProfile);

      // Sync to Supabase in the background
      if (user && user.role === "candidate") {
        updateCandidateProfile(user.id, newProfile).catch((err) =>
          console.error("Failed to sync profile to Supabase:", err),
        );
      }

      return newProfile;
    });
  };
  const [employerActiveTab, setEmployerActiveTab] = useState<"candidates" | "jobs">("candidates");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // New state for integrated components
  const [showCertificateBadge, setShowCertificateBadge] = useState(false);
  const [selectedCertificate, setSelectedCertificate] =
    useState<CertificateData | null>(null);
  const [showVideoAnalyzer, setShowVideoAnalyzer] = useState(false);
  const [showEnterpriseDashboard, setShowEnterpriseDashboard] = useState(false);

  // New Phase 2-7 component states
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("code");
  const [showLiveViewer, setShowLiveViewer] = useState(false);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showDataConsent, setShowDataConsent] = useState(false);
  const [showSkillPassport, setShowSkillPassport] = useState(false);
  const [showProfileCompletionGate, setShowProfileCompletionGate] =
    useState(false);

  // Onboarding state
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

  const [signingOut, setSigningOut] = useState(false);

  // Permission modal state for assessments
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Retake confirmation dialog
  const [retakeDialog, setRetakeDialog] = useState<{
    skill: string;
    attempts: number;
  } | null>(null);

  // Admin impersonation state
  const [impersonationToken, setImpersonationToken] = useState<string | null>(
    null,
  );
  const [impersonatedUser, setImpersonatedUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: "candidate" | "employer";
  } | null>(null);

  // Routes that require an authenticated session
  const PROTECTED_VIEWS: ViewState[] = [
    ViewState.CANDIDATE_DASHBOARD,
    ViewState.CANDIDATE_INTERVIEW,
    ViewState.CANDIDATE_PROGRESS,
    ViewState.CANDIDATE_COMMUNITY,
    ViewState.LEADERBOARD,
    ViewState.EMPLOYER_DASHBOARD,
    ViewState.ADMIN_DASHBOARD,
    ViewState.PROFILE,
    ViewState.SKILL_SELECTION,
    ViewState.ASSESSMENT,
    ViewState.ASSESSMENT_RESULT,
    ViewState.SUBSCRIPTION,
  ];

  // Check if profile completion gate should be shown
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      !user.onboarding_completed &&
      PROTECTED_VIEWS.includes(currentView)
    ) {
      React.startTransition(() => {
        setShowProfileCompletionGate(true);
      });
    } else {
      React.startTransition(() => {
        setShowProfileCompletionGate(false);
      });
    }
  }, [user, isAuthenticated, currentView]);

  // Redirect to login when session expires or user logs out while on a protected route
  useEffect(() => {
    if (!isLoading && !user && PROTECTED_VIEWS.includes(currentView)) {
      handleNavigate(ViewState.LOGIN);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, currentView]);

  // Show a toast + redirect when the API detects a fully expired session
  useEffect(() => {
    const handleSessionExpired = () => {
      toast.warning("Your session has expired. Please log in again.");
    };
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [toast]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getViewFromPath());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === "candidate") {
        // Fetch real profile from Supabase
        getCandidateProfile(user.id).then((profileData) => {
          if (profileData) {
            setCandidateProfileState((prev) => {
              const merged = {
                ...prev,
                ...profileData,
                id: user.id,
                name: user.name,
              };
              saveProfileToStorage(merged);
              return merged;
            });
          } else {
            // Fallback to updating ID/Name only
            setCandidateProfileState((prev) => ({
              ...prev,
              id: user.id,
              name: user.name,
            }));
          }
        });

        // Initialize other state from Backend
        initializeAssessmentHistory(user.id);
        initializeSessions(user.id);
        initializeGamification(user.id);
        initializeAiLearning(user.id);
        initializeNotifications(user.id);
      } else {
        // Fetch real profile from Backend
        getEmployerProfile(user.id).then((profileData) => {
          setCandidateProfileState((prev) => ({
            ...prev,
            id: user.id,
            name: user.name,
            ...profileData,
          }));
        });

        initializeNotifications(user.id);
      }

      setUserRole(
        user.role === "candidate"
          ? UserRole.CANDIDATE
          : user.role === "employer"
            ? UserRole.EMPLOYER
            : UserRole.ADMIN,
      );

      // Handle login redirect - if modal was open and user just authenticated
      if (authModalOpen) {
        setAuthModalOpen(false);
        if (user.role === "employer") {
          handleNavigate(ViewState.EMPLOYER_DASHBOARD);
        } else if (user.role === "admin") {
          handleNavigate(ViewState.ADMIN_DASHBOARD);
        } else {
          handleNavigate(ViewState.CANDIDATE_DASHBOARD);
        }
        setShowWelcomeBanner(true);
      }

      // Session restore on page refresh: redirect authenticated users away from auth/landing pages
      if (
        currentView === ViewState.LANDING ||
        currentView === ViewState.LOGIN ||
        currentView === ViewState.SIGNUP
      ) {
        if (user.role === "employer") {
          handleNavigate(ViewState.EMPLOYER_DASHBOARD);
        } else if (user.role === "admin") {
          handleNavigate(ViewState.ADMIN_DASHBOARD);
        } else {
          handleNavigate(ViewState.CANDIDATE_DASHBOARD);
        }
      }

      // Initialize onboarding service for this user
      onboardingService.setUserId(user.id).then(() => {
        if (user.onboarding_completed) {
          onboardingService.updateProgress({ profileCompleted: true });
        }
      });

      // Check if first-time user and show tour (only on dashboard routes)
      const isDashboard =
        currentView === ViewState.CANDIDATE_DASHBOARD ||
        currentView === ViewState.EMPLOYER_DASHBOARD;
      if (isDashboard && onboardingService.shouldShowTour()) {
        setShowOnboardingTour(true);
      }

      // Mark first login
      onboardingService.markFirstLogin();
    }
  }, [user, authModalOpen, currentView]);

  const handleNavigate = (view: ViewState, role?: UserRole) => {
    if (role) setUserRole(role);

    let path = "/";
    switch (view) {
      case ViewState.LOGIN:
        path = "/login";
        break;
      case ViewState.SIGNUP:
        path = "/signup";
        break;
      case ViewState.FORGOT_PASSWORD:
        path = "/forgot-password";
        break;
      case ViewState.RESET_PASSWORD:
        path = "/reset-password";
        break;
      case ViewState.VERIFY_EMAIL:
        path = "/verify-email";
        break;
      case ViewState.CHECK_EMAIL:
        path = "/check-email";
        break;
      case ViewState.CANDIDATE_DASHBOARD:
        path = "/dashboard";
        break;
      case ViewState.CANDIDATE_INTERVIEW:
        path = "/dashboard/interview";
        break;
      case ViewState.CANDIDATE_PROGRESS:
        path = "/dashboard/progress";
        break;
      case ViewState.CANDIDATE_COMMUNITY:
        path = "/dashboard/community";
        break;
      case ViewState.LEADERBOARD:
        path = "/leaderboard";
        break;
      case ViewState.SKILL_SELECTION:
        path = "/dashboard/assess";
        break;
      case ViewState.ASSESSMENT:
        path = "/dashboard/assessment";
        break;
      case ViewState.ASSESSMENT_RESULT:
        path = "/dashboard/result";
        break;
      case ViewState.EMPLOYER_DASHBOARD:
        path = "/employer";
        break;
      case ViewState.ADMIN_DASHBOARD:
        path = "/admin";
        break;
      case ViewState.PROFILE:
        path = "/profile";
        break;
      case ViewState.LANDING:
        path = "/";
        break;
      case ViewState.SUBSCRIPTION:
        path = "/subscription";
        break;
      // VIEW_CV and PUBLIC_PASSPORT paths are set externally via window.history.pushState before calling navigate
      default:
        path = window.location.pathname;
        break;
    }

    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }

    if (view === ViewState.AUTH_SELECTION || view === ViewState.SIGNUP) {
      startTransition(() => setCurrentView(ViewState.SIGNUP));
    } else {
      startTransition(() => setCurrentView(view));
    }
  };

  const handleAuthSuccess = (role: "candidate" | "employer" | "admin") => {
    if (role === "candidate") {
      handleNavigate(ViewState.CANDIDATE_DASHBOARD, UserRole.CANDIDATE);
    } else if (role === "employer") {
      handleNavigate(ViewState.EMPLOYER_DASHBOARD, UserRole.EMPLOYER);
    } else {
      handleNavigate(ViewState.ADMIN_DASHBOARD, UserRole.ADMIN);
    }
    // Show welcome banner for new users
    setShowWelcomeBanner(true);
  };

  const handleImpersonate = (
    token: string,
    targetUser: {
      id: string;
      name: string;
      email: string;
      role: "candidate" | "employer";
    },
  ) => {
    setImpersonationToken(token);
    setImpersonatedUser(targetUser);
    if (targetUser.role === "candidate") {
      handleNavigate(ViewState.CANDIDATE_DASHBOARD);
    } else {
      handleNavigate(ViewState.EMPLOYER_DASHBOARD);
    }
  };

  const handleStopImpersonation = () => {
    setImpersonationToken(null);
    setImpersonatedUser(null);
    handleNavigate(ViewState.ADMIN_DASHBOARD);
  };

  // Onboarding handlers
  const handleTourComplete = () => {
    onboardingService.completeTour();
    setShowOnboardingTour(false);
    toast.success("🎉 Welcome aboard! You're ready to explore Lune.");
  };

  const handleTourSkip = () => {
    onboardingService.skipTour();
    setShowOnboardingTour(false);
  };

  const handleStartTour = () => {
    setShowOnboardingTour(true);
  };

  const handleLogout = async () => {
    flushSync(() => setSigningOut(true));
    const [_] = await Promise.all([
      logout(),
      new Promise((r) => setTimeout(r, 900)),
    ]);
    setUserRole(null);
    handleNavigate(ViewState.LANDING);
    setSigningOut(false);
  };

  const handleStartAssessment = (skill?: string) => {
    if (skill) {
      const attempts = getSkillAttemptCount(candidateProfile.id, skill);
      if (attempts > 0) {
        // Candidate already attempted this skill — show retake confirmation (costs 1 credit)
        setRetakeDialog({ skill, attempts });
        return;
      }
      setSelectedSkill(skill);
      const type = getAssessmentType(skill);
      setAssessmentType(type);
      handleNavigate(ViewState.SKILL_SELECTION);
    } else {
      handleNavigate(ViewState.SKILL_SELECTION);
    }
  };

  const handleConfirmRetake = async () => {
    if (!retakeDialog) return;
    // Call backend to deduct 1 credit before proceeding
    try {
      const res = (await import("./lib/api").then((m) =>
        m.api.post("/users/me/deduct-credit/", {}),
      )) as any;
      // Refresh the user profile so credits display updates
      if (typeof res?.credits_remaining === "number") {
        getCandidateProfile()
          .then((fresh) => {
            if (fresh) setCandidateProfile((prev) => ({ ...prev, ...fresh }));
          })
          .catch(() => {});
      }
    } catch (err: any) {
      if (err?.response?.status === 402 || err?.status === 402) {
        toast.error("No credits remaining. Upgrade your plan to retake.");
        setRetakeDialog(null);
        return;
      }
      // If deduction fails for any other reason, still allow retake (non-blocking)
    }
    setSelectedSkill(retakeDialog.skill);
    const type = getAssessmentType(retakeDialog.skill);
    setAssessmentType(type);
    setRetakeDialog(null);
    handleNavigate(ViewState.SKILL_SELECTION);
  };

  const startAssessmentFlow = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty);
    startTransition(() => setShowPermissionModal(true)); // Show permission modal first
  };

  const handlePermissionGranted = () => {
    setShowPermissionModal(false);
    handleNavigate(ViewState.ASSESSMENT);
  };

  const handleAssessmentComplete = (result: EvaluationResult) => {
    setAssessmentResult(result);
    handleNavigate(ViewState.ASSESSMENT_RESULT);

    // Save to assessment history, then immediately invalidate the in-memory
    // cache so the dashboard fetches fresh data (PERF-F1).
    addAssessmentEntry(
      candidateProfile.id,
      selectedSkill,
      result.score,
      result.passed,
      selectedDifficulty,
      result.timeSpentSeconds || 0,
      result.cheatingDetected || false,
      result.integrityScore || 100,
      result.feedback,
      result.categoryScores,
      result.certificationHash,
      result.evalToken,
    );
    invalidateHistory();

    // When a skill is passed, invalidate the cached Skill Passport so it regenerates with new data
    if (result.passed) {
      localStorage.removeItem("lune_skill_passport_v1");
    }

    // Update local profile if passed - save skills regardless of certificate hash
    if (result.passed) {
      // Always update skills when passed
      setCandidateProfile((prev) => ({
        ...prev,
        skills: {
          ...prev.skills,
          [selectedSkill]: result.score,
        },
        // Only add to certifications if hash exists
        certifications: result.certificationHash
          ? [...prev.certifications, result.certificationHash]
          : prev.certifications,
      }));

      // Create certificate data for badge display only if hash exists
      if (result.certificationHash) {
        setSelectedCertificate({
          recipientName: candidateProfile.name,
          skill: selectedSkill,
          score: result.score,
          difficulty: selectedDifficulty,
          issuedAt: new Date(),
          verificationId: result.certificationHash,
          certificateId: `cert-${Date.now()}`,
        });
      }

      // Celebrate with confetti!
      celebrateSuccess();
      toast.success(
        `🎉 Congratulations! You scored ${result.score}/100 on ${selectedSkill}!`,
      );
    } else if (result.cheatingDetected) {
      toast.error("❌ Assessment invalidated due to integrity concerns.");
    } else {
      toast.warning(
        `Keep practicing! You scored ${result.score}/100. Need 70+ to pass.`,
      );
    }
  };

  // Handler specifically for video verification assessments
  const handleVideoVerificationComplete = async (
    result: VideoVerificationResult,
    passed: boolean,
  ) => {
    // Generate certificate hash if passed
    let certificationHash: string | undefined;
    if (passed) {
      certificationHash = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Convert VideoVerificationResult to EvaluationResult format
    const evaluationResult: EvaluationResult = {
      score: result.overallScore,
      passed: passed,
      feedback: result.summary,
      certificationHash: certificationHash,
      timeSpentSeconds: Math.round(result.duration),
      categoryScores: {
        "Communication Style": result.communicationStyleScore,
        Pronunciation: result.pronunciationScore,
        Grammar: result.grammarScore,
        Intonation: result.intonationScore,
        Confidence: result.confidenceScore,
        Clarity: result.clarityScore,
        Professionalism: result.professionalismScore,
        Empathy: result.empathyScore,
        Persuasion: result.persuasionScore,
      },
      cheatingDetected: false,
      integrityScore: 100,
      evalToken: result.eval_token,
    };

    // Call the existing assessment complete handler
    handleAssessmentComplete(evaluationResult);
  };

  const handleViewCertificate = () => {
    if (selectedCertificate) {
      startTransition(() => setShowCertificateBadge(true));
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `https://lune.platform/verify/${assessmentResult?.certificationHash}`,
    );
    toast.success("🔗 Verification link copied to clipboard!");
  };

  // Helper function to format AI feedback with proper paragraphs and styling
  const formatAIFeedback = (feedback: string) => {
    if (!feedback) return null;

    // Split feedback into sentences
    const sentences = feedback.split(/\.\s+/);
    const paragraphs: React.JSX.Element[] = [];
    let currentParagraph: string[] = [];

    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      if (!trimmed) return;

      // Add period back if it was removed
      const fullSentence = trimmed.endsWith(".") ? trimmed : trimmed + ".";

      // Check if sentence mentions a task (Task 1, Task 2, etc.)
      const taskMatch = fullSentence.match(/\(Task \d+\)/);

      // Start new paragraph for task mentions or after 2-3 sentences
      if (taskMatch || currentParagraph.length >= 3) {
        if (currentParagraph.length > 0) {
          paragraphs.push(
            <p
              key={`para-${paragraphs.length}`}
              className="mb-3 leading-relaxed"
            >
              {currentParagraph.join(" ")}
            </p>,
          );
          currentParagraph = [];
        }
      }

      currentParagraph.push(fullSentence);
    });

    // Add remaining sentences
    if (currentParagraph.length > 0) {
      paragraphs.push(
        <p key={`para-${paragraphs.length}`} className="mb-3 leading-relaxed">
          {currentParagraph.join(" ")}
        </p>,
      );
    }

    return <div className="space-y-0">{paragraphs}</div>;
  };

  const handleShare = () => {
    const text = `I just verified my ${selectedSkill} skills on Lune with a score of ${assessmentResult?.score}/100! #LuneVerified #Web3`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    toast.info("📤 Opening Twitter to share...");
  };

  const handleShareToLinkedIn = () => {
    if (!selectedCertificate || !assessmentResult) return;

    // LinkedIn Share URL format
    const certificateUrl = `https://lune.app/verify/${selectedCertificate}`;

    const shareText = `🎓 I just earned a verified ${selectedSkill} certificate on Lune with a score of ${assessmentResult.score}/100!

My skills are verified on Lune.

Verify my certificate: ${certificateUrl}

#LuneVerified #SkillCertification #BlockchainVerification #${selectedSkill.replace(/\s+/g, "")}`;

    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl)}`;

    // Open LinkedIn share dialog
    window.open(linkedInUrl, "_blank", "width=600,height=600");

    // Also copy the text to clipboard for easy pasting
    navigator.clipboard.writeText(shareText);

    toast.success(
      "📋 LinkedIn opened! Share text copied to clipboard - paste it in your post.",
    );
  };

  const addToLinkedInProfile = () => {
    if (!selectedCertificate || !selectedSkill) return;

    const certData = {
      name: `${selectedSkill} - Verified by Lune`,
      issuedBy: "Lune Skills Verification Platform",
      issuedDate: new Date().toISOString().split("T")[0],
      credentialUrl: `https://lune.app/verify/${selectedCertificate}`,
      credentialId: selectedCertificate,
    };

    // LinkedIn Add Certification URL
    const linkedInAddUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION&name=${encodeURIComponent(certData.name)}&organizationName=${encodeURIComponent(certData.issuedBy)}&issueYear=${new Date().getFullYear()}&issueMonth=${new Date().getMonth() + 1}&certUrl=${encodeURIComponent(certData.credentialUrl)}&certId=${encodeURIComponent(String(certData.credentialId))}`;

    window.open(linkedInAddUrl, "_blank");
    toast.success(
      "🎓 Opening LinkedIn to add your certificate to your profile!",
    );
  };

  const renderAuthSelection = () => (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-2 text-teal-900">
          Welcome to Lune
        </h2>
        <p className="text-gray-500 mb-8">Select your role to continue</p>

        <div className="space-y-4">
          <button
            onClick={() =>
              handleNavigate(ViewState.CANDIDATE_DASHBOARD, UserRole.CANDIDATE)
            }
            className="w-full p-4 border-2 border-gray-100 rounded-xl hover:border-orange hover:bg-orange/5 transition flex items-center gap-4 group text-left"
          >
            <div className="bg-orange/10 p-3 rounded-lg text-orange group-hover:bg-orange group-hover:text-white transition">
              <Code size={24} />
            </div>
            <div>
              <div className="font-bold text-slate-900">I am a Candidate</div>
              <div className="text-xs text-slate-500">
                Verify skills & get certified
              </div>
            </div>
          </button>

          <button
            onClick={() =>
              handleNavigate(ViewState.EMPLOYER_DASHBOARD, UserRole.EMPLOYER)
            }
            className="w-full p-4 border-2 border-gray-100 rounded-xl hover:border-teal hover:bg-teal/5 transition flex items-center gap-4 group text-left"
          >
            <div className="bg-teal/10 p-3 rounded-lg text-teal group-hover:bg-teal group-hover:text-white transition">
              <CheckCircle size={24} />
            </div>
            <div>
              <div className="font-bold text-slate-900">I am an Employer</div>
              <div className="text-xs text-slate-500">Find verified talent</div>
            </div>
          </button>
        </div>
        <button
          onClick={() => handleNavigate(ViewState.LANDING)}
          className="mt-8 text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto"
        >
          <ArrowLeft size={14} /> Back to Home
        </button>
      </div>
    </div>
  );

  // Combined Skill & Difficulty Selection
  const renderSkillSelection = () => {
    // No skill pre-selected → send back to dashboard where they can pick from the full list
    if (!selectedSkill) {
      handleNavigate(ViewState.CANDIDATE_DASHBOARD);
      return null;
    }

    const SKILL_NOTES: Record<string, [string, string, string]> = {
      React: [
        "Components, JSX, props, hooks, and basic state management.",
        "Context API, performance optimisation, and advanced hook patterns.",
        "SSR / RSC, micro-frontend architecture, and rendering deep-dives.",
      ],
      Vue: [
        "Templates, directives, reactivity, and basic component model.",
        "Composition API, Pinia, Vue Router, and real-world patterns.",
        "Nuxt, SSR, performance profiling, and plugin authoring.",
      ],
      "CSS / Tailwind": [
        "Selectors, box model, flexbox, and responsive basics.",
        "Grid, animations, custom properties, and Tailwind internals.",
        "Performance, theming systems, and scalable CSS architecture.",
      ],
      TypeScript: [
        "Type annotations, interfaces, enums, and basic generics.",
        "Advanced generics, utility types, and type inference patterns.",
        "Declaration files, compiler API, and strict type-safe architecture.",
      ],
      "Next.js": [
        "Pages router, file-based routing, and basic data fetching.",
        "App router, server components, and middleware.",
        "Streaming, ISR, edge runtimes, and deployment optimisation.",
      ],
      "Node.js": [
        "Modules, async/await, event loop, and REST basics.",
        "Middleware, streams, error handling, and database access.",
        "Clustering, security hardening, and microservice patterns.",
      ],
      Python: [
        "Syntax, data types, control flow, and functions.",
        "OOP, decorators, error handling, and popular libraries.",
        "Concurrency, metaclasses, design patterns, and API design.",
      ],
      Django: [
        "Models, views, templates, and the request/response cycle.",
        "DRF, signals, caching, and authentication.",
        "Async Django, custom middleware, and scaling strategies.",
      ],
      "Django / FastAPI": [
        "Models, views, templates, and the request/response cycle.",
        "DRF, signals, caching, and authentication.",
        "Async support, custom middleware, and scaling strategies.",
      ],
      Java: [
        "Syntax, OOP fundamentals, collections, and exceptions.",
        "Generics, concurrency, streams API, and Spring basics.",
        "JVM internals, enterprise patterns, and security best practices.",
      ],
      Go: [
        "Syntax, goroutines, channels, and standard library basics.",
        "Interfaces, concurrency patterns, and error handling idioms.",
        "Runtime internals, cgo, high-performance service design.",
      ],
      "REST API Design": [
        "HTTP methods, status codes, and resource modelling.",
        "Authentication, versioning, pagination, and error formats.",
        "Hypermedia, rate limiting, and API governance.",
      ],
      AWS: [
        "Core services — S3, EC2, IAM, and VPC basics.",
        "Serverless, auto-scaling, cost management, and CloudFormation.",
        "Multi-region, advanced security, and Well-Architected Framework.",
      ],
      "Google Cloud": [
        "GCP console, Compute Engine, Cloud Storage, and IAM.",
        "GKE, Cloud Run, Pub/Sub, and data services.",
        "Multi-cloud strategy, advanced networking, and cost optimisation.",
      ],
      Docker: [
        "Images, containers, Dockerfiles, and CLI basics.",
        "Compose, networking, volumes, and multi-stage builds.",
        "Orchestration, CI/CD integration, and security hardening.",
      ],
      Kubernetes: [
        "Pods, services, deployments, and basic kubectl.",
        "Ingress, RBAC, Helm charts, and namespaces.",
        "Autoscaling, multi-cluster federation, and platform engineering.",
      ],
      "System Design": [
        "Fundamentals: load balancing, caching, and databases.",
        "Distributed systems, CAP theorem, and API design.",
        "Large-scale architecture, trade-off analysis, and real-world case studies.",
      ],
      "Data Structures & Algorithms": [
        "Arrays, linked lists, stacks, queues, and Big-O basics.",
        "Trees, graphs, sorting algorithms, and dynamic programming.",
        "Advanced graph algorithms, NP-hard problems, and competitive patterns.",
      ],
      "SQL (Advanced)": [
        "SELECT, JOIN, GROUP BY, and basic indexing.",
        "Window functions, CTEs, stored procedures, and query optimisation.",
        "Partitioning, execution plans, and database internals.",
      ],
      Figma: [
        "Frames, components, auto-layout, and basic prototyping.",
        "Variables, design tokens, advanced components, and dev mode.",
        "Plugin development, design system governance, and handoff workflows.",
      ],
    };

    const DEFAULT_NOTES: [string, string, string] = [
      "Fundamentals, core concepts, and entry-level patterns.",
      "Best practices, real-world problem-solving, and intermediate depth.",
      "Advanced architecture, performance edge cases, and expert-level nuance.",
    ];

    const notes = SKILL_NOTES[selectedSkill] ?? DEFAULT_NOTES;

    const levels: {
      id: DifficultyLevel;
      label: string;
      subtitle: string;
      note: string;
      accentColor: string;
      badgeBg: string;
      badgeText: string;
      questions: string;
      time: string;
      icon: React.ReactNode;
    }[] = [
      {
        id: "Beginner",
        label: "Beginner",
        subtitle: "Foundation",
        note: notes[0],
        accentColor: "#22c55e",
        badgeBg: "bg-green-50",
        badgeText: "text-green-700",
        questions: "10 questions",
        time: "~15 min",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="#22c55e" strokeWidth="1.5" />
            <path d="M7 10l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        id: "Mid-Level",
        label: "Mid-Level",
        subtitle: "Practitioner",
        note: notes[1],
        accentColor: "#F26430",
        badgeBg: "bg-orange-50",
        badgeText: "text-orange-700",
        questions: "12 questions",
        time: "~20 min",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <polygon points="10,2 13,8 19,9 14.5,13.5 15.5,19.5 10,17 4.5,19.5 5.5,13.5 1,9 7,8" stroke="#F26430" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        id: "Advanced",
        label: "Advanced",
        subtitle: "Expert",
        note: notes[2],
        accentColor: "#1F4D48",
        badgeBg: "bg-teal/8",
        badgeText: "text-teal",
        questions: "15 questions",
        time: "~25 min",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L3 9l7 9 7-9-7-7z" stroke="#1F4D48" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          </svg>
        ),
      },
    ];

    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "linear-gradient(160deg, #F5F3EE 0%, #EEF0EA 60%, #F0EDE8 100%)" }}
      >
        {/* Dot grid */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #1F4D4810 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        {/* Top bar */}
        <div className="relative z-10 flex items-center gap-4 px-6 sm:px-10 pt-8 pb-4">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigate(ViewState.CANDIDATE_DASHBOARD)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-slate-700 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
          >
            <ArrowLeft size={15} />
            Back to Dashboard
          </motion.button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 font-medium">
            <span>Dashboard</span>
            <ArrowRight size={11} />
            <span className="text-slate-600 font-semibold">{selectedSkill}</span>
            <ArrowRight size={11} />
            <span>Select Difficulty</span>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-4xl"
          >
            {/* Header */}
            <div className="text-center mb-12">
              {/* Skill badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08, duration: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold mb-5"
                style={{ borderColor: "#1F4D4828", color: "#1F4D48", background: "#1F4D4808" }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#1F4D48" }}
                />
                {selectedSkill}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.4 }}
                className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3"
              >
                Choose your level
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-slate-500 text-base max-w-sm mx-auto"
              >
                Pick the difficulty that matches your experience. Your webcam will be active during the assessment.
              </motion.p>
            </div>

            {/* Difficulty cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {levels.map((lvl, i) => (
                <motion.button
                  key={lvl.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.26 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startAssessmentFlow(lvl.id)}
                  className="group relative bg-white rounded-2xl p-7 text-left border-2 border-gray-100 hover:border-current shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden"
                  style={{ "--hover-color": lvl.accentColor } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = lvl.accentColor;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#f3f4f6";
                  }}
                >
                  {/* Accent strip */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: `linear-gradient(90deg, ${lvl.accentColor}, ${lvl.accentColor}00)` }}
                  />

                  {/* Top row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${lvl.accentColor}12` }}
                      >
                        {lvl.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-400 leading-none mb-0.5">
                          {lvl.subtitle}
                        </div>
                        <div className="font-black text-slate-900 text-base leading-none">
                          {lvl.label}
                        </div>
                      </div>
                    </div>
                    <ArrowRight
                      size={16}
                      className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ color: lvl.accentColor }}
                    />
                  </div>

                  {/* Note */}
                  <p className="text-sm text-slate-500 leading-relaxed mb-6 min-h-[3.5rem]">
                    {lvl.note}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-400">{lvl.questions}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="text-xs font-semibold text-gray-400">{lvl.time}</span>
                    <span className="ml-auto">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lvl.badgeBg} ${lvl.badgeText}`}
                      >
                        {lvl.label}
                      </span>
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Footer note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs text-gray-400 font-medium"
            >
              {[
                { icon: <ShieldCheck size={13} />, text: "Proctored by webcam" },
                { icon: <CheckCircle size={13} />, text: "AI-graded instantly" },
                { icon: <Award size={13} />, text: "Score saved to your profile" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <span className="text-teal">{icon}</span>
                  {text}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!assessmentResult) return null;

    const passed = assessmentResult.passed;
    const score = assessmentResult.score;
    const hasCategoryScores =
      assessmentResult.categoryScores &&
      Object.keys(assessmentResult.categoryScores).length > 0;

    const RING_RADIUS = 52;
    const RING_CIRC = 2 * Math.PI * RING_RADIUS;
    const ringOffset = RING_CIRC * (1 - score / 100);

    return (
      <div
        className="min-h-screen overflow-y-auto"
        style={{
          background:
            "linear-gradient(160deg, #F5F3EE 0%, #EEF0EA 50%, #F0EDE8 100%)",
        }}
      >
        {/* Dot grid */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, #1F4D4812 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 max-w-4xl mx-auto">
          <button
            onClick={() => handleNavigate(ViewState.CANDIDATE_DASHBOARD)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#1F4D48] transition-colors"
          >
            <ArrowLeft size={15} />
            Dashboard
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-black"
              style={{ background: "#1F4D48" }}
            >
              L
            </div>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide">
              Lune · Assessment Result
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 pb-14">
          {/* Hero card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl overflow-hidden mb-5"
            style={{
              background: passed
                ? "linear-gradient(135deg, #1F4D48 0%, #2a6b64 100%)"
                : "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)",
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative flex flex-col md:flex-row items-center gap-8 p-7 md:p-10">
              {/* Score ring */}
              <div className="flex-shrink-0">
                <div className="relative w-36 h-36">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r={RING_RADIUS}
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="7"
                    />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r={RING_RADIUS}
                      fill="none"
                      stroke={passed ? "#F26430" : "#fca5a5"}
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRC}
                      initial={{ strokeDashoffset: RING_CIRC }}
                      animate={{ strokeDashoffset: ringOffset }}
                      transition={{
                        duration: 1.4,
                        delay: 0.3,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.5,
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="text-4xl font-black text-white leading-none tabular-nums"
                    >
                      {score}
                    </motion.span>
                    <span className="text-white/60 text-sm font-semibold">
                      / 100
                    </span>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 text-center md:text-left">
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.45 }}
                  className="flex items-center gap-2 justify-center md:justify-start mb-3"
                >
                  {passed ? (
                    <ShieldCheck size={18} className="text-white/70" />
                  ) : (
                    <AlertCircle size={18} className="text-white/70" />
                  )}
                  <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-white/60">
                    {passed ? "Skill Verified" : "Not Passed — Keep Practicing"}
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.45 }}
                  className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight"
                >
                  {passed
                    ? `${selectedSkill} Verified`
                    : score < 50
                      ? "Keep Practicing"
                      : "Almost There"}
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                  className="flex items-center gap-2.5 flex-wrap justify-center md:justify-start"
                >
                  {[
                    selectedSkill,
                    selectedDifficulty,
                    "Pass mark: 70+",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border"
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        borderColor: "rgba(255,255,255,0.2)",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </motion.div>

                {passed && assessmentResult.certificationHash && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.4 }}
                    className="mt-4 flex items-center gap-2 justify-center md:justify-start"
                  >
                    <Award size={13} style={{ color: "#F26430" }} />
                    <span className="font-mono text-[10px] text-white/55 truncate max-w-[280px]">
                      {assessmentResult.certificationHash}
                    </span>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Body: two-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Left col */}
            <div className="md:col-span-2 space-y-4">
              {/* Category scores */}
              {hasCategoryScores && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42, duration: 0.45 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
                >
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-4">
                    Category Breakdown
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(assessmentResult.categoryScores!).map(
                      ([cat, catScore], idx) => (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-600 truncate max-w-[145px]">
                              {cat}
                            </span>
                            <span
                              className="text-xs font-black tabular-nums"
                              style={{
                                color: catScore >= 70 ? "#1F4D48" : "#F26430",
                              }}
                            >
                              {catScore}
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                background:
                                  catScore >= 70 ? "#1F4D48" : "#F26430",
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${catScore}%` }}
                              transition={{
                                delay: 0.52 + idx * 0.06,
                                duration: 0.7,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                            />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </motion.div>
              )}

              {/* Integrity */}
              {assessmentResult.integrityScore !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.48, duration: 0.45 }}
                  className={`rounded-2xl border p-5 ${
                    assessmentResult.cheatingDetected
                      ? "bg-red-50 border-red-100"
                      : "bg-white border-slate-100 shadow-sm"
                  }`}
                >
                  <h3
                    className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3"
                    style={{
                      color: assessmentResult.cheatingDetected
                        ? "#dc2626"
                        : "#94a3b8",
                    }}
                  >
                    Integrity Score
                  </h3>
                  <div className="flex items-end gap-1.5 mb-2">
                    <span
                      className="text-3xl font-black"
                      style={{
                        color: assessmentResult.cheatingDetected
                          ? "#dc2626"
                          : "#1F4D48",
                      }}
                    >
                      {assessmentResult.integrityScore}
                    </span>
                    <span className="text-slate-400 text-sm mb-1">/ 100</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: assessmentResult.cheatingDetected
                          ? "#dc2626"
                          : "#1F4D48",
                      }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${assessmentResult.integrityScore}%`,
                      }}
                      transition={{
                        delay: 0.6,
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </div>
                  {assessmentResult.cheatingDetected && (
                    <p className="text-xs text-red-600 font-medium leading-snug">
                      <strong>Flag raised:</strong>{" "}
                      {assessmentResult.cheatingReason}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Time spent */}
              {assessmentResult.timeSpentSeconds !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.53, duration: 0.4 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#1F4D4810" }}
                  >
                    <RefreshCw size={17} style={{ color: "#1F4D48" }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                      Time Spent
                    </p>
                    <p className="text-lg font-black text-slate-800 tabular-nums">
                      {Math.floor(assessmentResult.timeSpentSeconds / 60)}m{" "}
                      {assessmentResult.timeSpentSeconds % 60}s
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right col */}
            <div className="md:col-span-3 space-y-4">
              {/* AI Feedback */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.45 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "#1F4D4810" }}
                  >
                    <Brain size={14} style={{ color: "#1F4D48" }} />
                  </div>
                  <h3 className="font-bold text-sm text-slate-700">
                    AI Performance Analysis
                  </h3>
                </div>
                <div className="text-sm text-slate-600 leading-relaxed">
                  {formatAIFeedback(assessmentResult.feedback)}
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.48, duration: 0.4 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
              >
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-4">
                  {passed ? "Share Your Achievement" : "Next Steps"}
                </h3>

                {passed ? (
                  <div className="space-y-2.5">
                    {selectedCertificate && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleViewCertificate}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition shadow-sm"
                        style={{
                          background:
                            "linear-gradient(135deg, #7c3aed, #3b82f6)",
                        }}
                      >
                        <Sparkles size={15} />
                        View Certificate Badge
                      </motion.button>
                    )}
                    <button
                      onClick={addToLinkedInProfile}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition"
                      style={{ background: "#0A66C2" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.background =
                          "#004182")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.background =
                          "#0A66C2")
                      }
                    >
                      <Linkedin size={15} />
                      Add to LinkedIn Profile
                    </button>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                        style={{ borderColor: "#1F4D4825" }}
                      >
                        <Copy size={13} /> Copy Link
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                        style={{ borderColor: "#1F4D4825" }}
                      >
                        <Share2 size={13} /> Share on X
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500 leading-relaxed">
                      You need{" "}
                      <strong className="text-slate-700">70+</strong> to earn a
                      verified badge. Review the feedback above and retry when
                      ready.
                    </p>
                    <button
                      onClick={() =>
                        handleNavigate(ViewState.CANDIDATE_DASHBOARD)
                      }
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition"
                      style={{
                        background:
                          "linear-gradient(135deg, #1F4D48, #2a6b64)",
                      }}
                    >
                      Practice More Skills
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Return link */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                onClick={() => handleNavigate(ViewState.CANDIDATE_DASHBOARD)}
                className="w-full py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-[#1F4D48] hover:bg-white/60 transition"
              >
                Return to Dashboard
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the appropriate view based on state
  const renderContent = () => {
    switch (currentView) {
      case ViewState.LANDING:
        return <Landing onNavigate={handleNavigate} />;
      case ViewState.LEADERBOARD:
        if (!user) return <LoginPage onNavigate={handleNavigate} />;
        return (
          <AppShell
            user={user}
            userImage={candidateProfile.image}
            userSubtitle={
              candidateProfile.title && candidateProfile.title !== "Candidate"
                ? candidateProfile.title
                : undefined
            }
            currentView={currentView}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            employerActiveTab={employerActiveTab}
            onEmployerTabChange={setEmployerActiveTab}
          >
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              <Suspense fallback={<LoadingFallback />}>
                <LeaderboardPage />
              </Suspense>
            </div>
          </AppShell>
        );
      case ViewState.CANDIDATE_DASHBOARD:
      case ViewState.CANDIDATE_INTERVIEW:
      case ViewState.CANDIDATE_PROGRESS:
      case ViewState.CANDIDATE_COMMUNITY:
        if (!user) return <LoginPage onNavigate={handleNavigate} />;
        if (user.role !== "candidate" && !(impersonatedUser?.role === "candidate"))
          return (
            <NotFoundPage
              type="403"
              onGoHome={() => handleNavigate(ViewState.LANDING)}
              onGoBack={window.history.length > 1 ? () => window.history.back() : undefined}
            />
          );
        return (
          <>
            {impersonatedUser && (
              <div className="fixed top-0 left-0 right-0 z-[9999] bg-orange text-white text-center text-xs py-2 font-semibold flex items-center justify-center gap-3">
                <span>
                  Admin view: impersonating{" "}
                  <strong>{impersonatedUser.name}</strong> (
                  {impersonatedUser.email})
                </span>
                <button
                  onClick={handleStopImpersonation}
                  className="underline hover:no-underline"
                >
                  Exit impersonation
                </button>
              </div>
            )}
            <div className={impersonatedUser ? "pt-8" : ""}>
              <AppShell
                user={user}
                userImage={candidateProfile.image}
                userSubtitle={
                  candidateProfile.title && candidateProfile.title !== "Candidate"
                    ? candidateProfile.title
                    : undefined
                }
                currentView={currentView}
                onNavigate={handleNavigate}
                onLogout={impersonatedUser ? handleStopImpersonation : handleLogout}
              >
                {currentView === ViewState.CANDIDATE_DASHBOARD && (
                  <CandidateDashboard
                    candidate={candidateProfile}
                    onStartAssessment={handleStartAssessment}
                    onUpdateProfile={(updates) =>
                      setCandidateProfile((prev) => ({ ...prev, ...updates }))
                    }
                    onOpenVideoAnalyzer={() =>
                      startTransition(() => setShowVideoAnalyzer(true))
                    }
                    onStartTour={handleStartTour}
                    onNavigateProfile={
                      !impersonatedUser
                        ? () => handleNavigate(ViewState.PROFILE)
                        : undefined
                    }
                  />
                )}
                {currentView === ViewState.CANDIDATE_INTERVIEW && (
                  <div className="px-4 sm:px-6 lg:px-8 py-8">
                    <MockInterview candidate={candidateProfile} />
                  </div>
                )}
                {currentView === ViewState.CANDIDATE_PROGRESS && (
                  <div className="px-4 sm:px-6 lg:px-8 py-8">
                    <AssessmentHistory
                      candidateId={candidateProfile.id}
                      onRetakeAssessment={handleStartAssessment}
                    />
                  </div>
                )}
                {currentView === ViewState.CANDIDATE_COMMUNITY && (
                  <div className="px-4 sm:px-6 lg:px-8 py-8">
                    <MessagingUI />
                  </div>
                )}
              </AppShell>
            </div>
          </>
        );
      case ViewState.EMPLOYER_DASHBOARD:
        if (!user) return <LoginPage onNavigate={handleNavigate} />;
        if (user.role !== "employer" && !(impersonatedUser?.role === "employer"))
          return (
            <NotFoundPage
              type="403"
              onGoHome={() => handleNavigate(ViewState.LANDING)}
              onGoBack={window.history.length > 1 ? () => window.history.back() : undefined}
            />
          );
        return (
          <>
            {impersonatedUser && (
              <div className="fixed top-0 left-0 right-0 z-[9999] bg-orange text-white text-center text-xs py-2 font-semibold flex items-center justify-center gap-3">
                <span>
                  Admin view: impersonating{" "}
                  <strong>{impersonatedUser.name}</strong> (
                  {impersonatedUser.email})
                </span>
                <button
                  onClick={handleStopImpersonation}
                  className="underline hover:no-underline"
                >
                  Exit impersonation
                </button>
              </div>
            )}
            <div className={impersonatedUser ? "pt-8" : ""}>
              <AppShell
                user={user}
                currentView={currentView}
                onNavigate={handleNavigate}
                onLogout={impersonatedUser ? handleStopImpersonation : handleLogout}
                employerActiveTab={employerActiveTab}
                onEmployerTabChange={setEmployerActiveTab}
              >
                <EmployerDashboard
                  activeTab={employerActiveTab}
                  onTabChange={setEmployerActiveTab}
                  onOpenEnterpriseDashboard={() =>
                    startTransition(() => setShowEnterpriseDashboard(true))
                  }
                  onStartTour={handleStartTour}
                  userName={user?.name || "Employer"}
                  onNavigateProfile={
                    !impersonatedUser
                      ? () => handleNavigate(ViewState.PROFILE)
                      : undefined
                  }
                />
              </AppShell>
            </div>
          </>
        );
      case ViewState.SKILL_SELECTION:
        if (!user) return <LoginPage onNavigate={handleNavigate} />;
        return renderSkillSelection();
      case ViewState.ASSESSMENT:
        if (!user) return <LoginPage onNavigate={handleNavigate} />;
        return renderAssessment();
      case ViewState.ASSESSMENT_RESULT:
        if (!user) return <LoginPage onNavigate={handleNavigate} />;
        return renderResult();
      case ViewState.LOGIN:
        if (isAuthenticated && user) return <LoadingFallback />;
        return <LoginPage onNavigate={handleNavigate} />;
      case ViewState.SIGNUP:
        if (isAuthenticated && user) return <LoadingFallback />;
        return (
          <SignupPage
            onNavigate={handleNavigate}
            onSuccess={handleAuthSuccess}
          />
        );
      case ViewState.FORGOT_PASSWORD:
        if (isAuthenticated && user) return <LoadingFallback />;
        return <ForgotPasswordPage onNavigate={handleNavigate} />;
      case ViewState.RESET_PASSWORD:
        return <ResetPasswordPage onNavigate={handleNavigate} />;
      case ViewState.CHECK_EMAIL:
        return <CheckEmail onNavigate={handleNavigate} />;
      case ViewState.AUTH_SELECTION: // Fallback directly to signup
        if (isAuthenticated && user) return <LoadingFallback />;
        return (
          <SignupPage
            onNavigate={handleNavigate}
            onSuccess={handleAuthSuccess}
          />
        );
      case ViewState.VERIFY_EMAIL:
        return <VerifyEmail onNavigate={handleNavigate} />;
      case ViewState.ADMIN_DASHBOARD:
        if (!user) return <LoginPage onNavigate={handleNavigate} />;
        if (user.role !== "admin")
          return (
            <NotFoundPage
              type="403"
              onGoHome={() => handleNavigate(ViewState.LANDING)}
              onGoBack={window.history.length > 1 ? () => window.history.back() : undefined}
            />
          );
        return (
          <AdminDashboard
            onLogout={handleLogout}
            onImpersonate={handleImpersonate}
          />
        );
      case ViewState.PROFILE:
        if (!user) return <LoginPage onNavigate={handleNavigate} />;
        return (
          <AppShell
            user={user}
            userImage={candidateProfile.image}
            userSubtitle={
              user.role === "candidate" &&
              candidateProfile.title &&
              candidateProfile.title !== "Candidate"
                ? candidateProfile.title
                : undefined
            }
            currentView={currentView}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            employerActiveTab={employerActiveTab}
            onEmployerTabChange={setEmployerActiveTab}
          >
            <ProfilePage
              user={user}
              onBack={() => {
                if (user.role === "employer")
                  handleNavigate(ViewState.EMPLOYER_DASHBOARD);
                else if (user.role === "admin")
                  handleNavigate(ViewState.ADMIN_DASHBOARD);
                else handleNavigate(ViewState.CANDIDATE_DASHBOARD);
              }}
              onLogout={handleLogout}
              onStartAssessment={(skill) => {
                setSelectedSkill(skill);
                handleNavigate(ViewState.SKILL_SELECTION);
              }}
              onProfileUpdated={(updates) => {
                setCandidateProfile((prev) => ({
                  ...prev,
                  ...(updates.image !== undefined
                    ? { image: updates.image }
                    : {}),
                  ...(updates.title !== undefined
                    ? { title: updates.title! }
                    : {}),
                  ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
                  ...(updates.location !== undefined
                    ? { location: updates.location! }
                    : {}),
                  ...(updates.yearsOfExperience !== undefined
                    ? { yearsOfExperience: updates.yearsOfExperience }
                    : {}),
                  ...(updates.preferredWorkMode !== undefined
                    ? { preferredWorkMode: updates.preferredWorkMode as any }
                    : {}),
                }));
              }}
            />
          </AppShell>
        );
      case ViewState.VIEW_CV: {
        const cvUserId = window.location.pathname
          .replace("/app/user/view-cv/", "")
          .split("/")[0];
        return (
          <CVViewerPage
            userId={cvUserId}
            onBack={() =>
              window.history.length > 1
                ? window.history.back()
                : handleNavigate(ViewState.LANDING)
            }
          />
        );
      }
      case ViewState.SUBSCRIPTION:
        if (!user) return <LoginPage onNavigate={handleNavigate} />;
        return (
          <AppShell
            user={user}
            userImage={candidateProfile.image}
            userSubtitle={
              user.role === "candidate" &&
              candidateProfile.title &&
              candidateProfile.title !== "Candidate"
                ? candidateProfile.title
                : undefined
            }
            currentView={currentView}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            employerActiveTab={employerActiveTab}
            onEmployerTabChange={setEmployerActiveTab}
          >
            <Suspense fallback={<LoadingFallback />}>
              <SubscriptionPage
                onBack={() =>
                  user.role === "employer"
                    ? handleNavigate(ViewState.EMPLOYER_DASHBOARD)
                    : handleNavigate(ViewState.CANDIDATE_DASHBOARD)
                }
              />
            </Suspense>
          </AppShell>
        );
      case ViewState.PUBLIC_PASSPORT: {
        const passportId = window.location.pathname
          .replace("/passport/", "")
          .split("/")[0];
        return (
          <Suspense fallback={<LoadingFallback />}>
            <PublicPassportPage
              passportId={passportId}
              isAuthenticated={isAuthenticated}
              onLogin={() => handleNavigate(ViewState.LOGIN)}
            />
          </Suspense>
        );
      }
      case ViewState.NOT_FOUND:
        return (
          <NotFoundPage
            onGoHome={() => handleNavigate(ViewState.LANDING)}
            onGoBack={
              window.history.length > 1
                ? () => window.history.back()
                : undefined
            }
          />
        );
      default:
        return <Landing onNavigate={handleNavigate} />;
    }
  };

  const renderAssessment = () => {
    if (assessmentType === "code") {
      return (
        <Assessment
          skill={selectedSkill}
          difficulty={selectedDifficulty}
          onComplete={handleAssessmentComplete}
        />
      );
    } else if (assessmentType === "scenario") {
      return (
        <ScenarioAssessment
          skill={selectedSkill}
          difficulty={selectedDifficulty}
          candidateId={user?.id || ""}
          onComplete={handleAssessmentComplete}
          onCancel={() => handleNavigate(ViewState.CANDIDATE_DASHBOARD)}
        />
      );
    } else if (assessmentType === "spreadsheet") {
      return (
        <SpreadsheetAssessment
          skill={selectedSkill}
          difficulty={selectedDifficulty}
          onComplete={handleAssessmentComplete}
          onCancel={() => handleNavigate(ViewState.CANDIDATE_DASHBOARD)}
        />
      );
    } else if (assessmentType === "text_editor") {
      return (
        <TextEditorAssessment
          skill={selectedSkill}
          difficulty={selectedDifficulty}
          onComplete={handleAssessmentComplete}
          onCancel={() => handleNavigate(ViewState.CANDIDATE_DASHBOARD)}
        />
      );
    } else if (assessmentType === "presentation") {
      return (
        <PresentationAssessment
          skill={selectedSkill}
          difficulty={selectedDifficulty}
          onComplete={handleAssessmentComplete}
          onCancel={() => handleNavigate(ViewState.CANDIDATE_DASHBOARD)}
        />
      );
    } else if (assessmentType === "video_verification") {
      return (
        <VideoVerificationAssessment
          skill={selectedSkill}
          difficulty={selectedDifficulty}
          onComplete={handleVideoVerificationComplete}
          onCancel={() => handleNavigate(ViewState.CANDIDATE_DASHBOARD)}
        />
      );
    }
    return null;
  };

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <>
      {/* PERF-F6: ErrorBoundary around Suspense so chunk-load failures show a
          retry UI instead of a blank white screen. The existing ErrorBoundary
          component already handles the auto-reload guard. */}
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>{renderContent()}</Suspense>
      </ErrorBoundary>

      {/* Permission Check Modal for Assessments */}
      <Suspense fallback={null}>
        <PermissionCheckModal
          isOpen={showPermissionModal}
          onClose={() => setShowPermissionModal(false)}
          onPermissionsGranted={handlePermissionGranted}
          assessmentType={selectedSkill || "Skill"}
        />
      </Suspense>

      {/* Certificate Badge Modal */}
      <AnimatePresence>
        {showCertificateBadge && selectedCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowCertificateBadge(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative my-auto"
            >
              <button
                onClick={() => setShowCertificateBadge(false)}
                className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-10"
              >
                <X size={20} />
              </button>
              <CertificateBadge
                certificate={selectedCertificate}
                onClose={() => setShowCertificateBadge(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Retake Confirmation Dialog */}
      <AnimatePresence>
        {retakeDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setRetakeDialog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-7 h-7 text-orange" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Retake Assessment
                </h3>
                <p className="text-slate-500 mt-2">
                  You've attempted <strong>{retakeDialog.skill}</strong>{" "}
                  {retakeDialog.attempts} time
                  {retakeDialog.attempts !== 1 ? "s" : ""}. Each retake uses{" "}
                  <strong>1 credit</strong> from your account.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 mb-6">
                <strong>Note:</strong> Credits are deducted per attempt
                regardless of pass/fail. Retaking helps you improve your score
                and unlock your Skill Passport.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRetakeDialog(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRetake}
                  className="flex-1 py-3 rounded-xl bg-teal text-white font-semibold hover:opacity-90 transition"
                >
                  Use 1 Credit &amp; Retake
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Analyzer Modal */}
      <AnimatePresence>
        {showVideoAnalyzer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
            onClick={() => setShowVideoAnalyzer(false)}
          >
            {/* min-h-full + flex centers when content is short; scrolls when content overflows */}
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl"
              >
                <button
                  onClick={() => setShowVideoAnalyzer(false)}
                  className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-10"
                >
                  <X size={20} />
                </button>
                <VideoAnalyzer
                  existingVideoUrl={candidateProfile.videoIntroUrl}
                  onAnalysisComplete={(result) => {
                    if (result.videoUrl) {
                      setCandidateProfile((prev) => ({
                        ...prev,
                        videoIntroUrl: result.videoUrl,
                      }));
                    }
                    toast.success(
                      `Video analyzed! Overall score: ${result.overallScore}/100`,
                    );
                  }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enterprise Dashboard Full Screen */}
      <AnimatePresence>
        {showEnterpriseDashboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-50"
          >
            <button
              onClick={() => setShowEnterpriseDashboard(false)}
              className="fixed top-4 right-4 z-50 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <EnterpriseDashboard
              companyId={user?.id || "demo-company"}
              companyName={
                user?.name ? `${user.name}'s Company` : "Demo Enterprise"
              }
              onBack={() => setShowEnterpriseDashboard(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Assessment Viewer (Employer) */}
      <AnimatePresence>
        {showLiveViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <LiveAssessmentViewer
              mode="live"
              onClose={() => setShowLiveViewer(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Bank Manager (Admin) */}
      <AnimatePresence>
        {showQuestionBank && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <QuestionBankManager
              adminId={user?.id || "admin"}
              onClose={() => setShowQuestionBank(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Consent Modal */}
      <DataConsentModal
        candidateId={candidateProfile.id}
        candidateName={candidateProfile.name}
        isOpen={showDataConsent}
        onClose={() => setShowDataConsent(false)}
      />

      {/* Skill Passport Modal */}
      <AnimatePresence>
        {showSkillPassport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto p-4"
            onClick={() => setShowSkillPassport(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl mx-auto my-8"
            >
              <button
                onClick={() => setShowSkillPassport(false)}
                className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-10"
              >
                <X size={20} />
              </button>
              <Suspense fallback={<LoadingFallback />}>
                <SkillPassport candidate={candidateProfile} />
              </Suspense>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showOnboardingTour}
        onClose={handleTourSkip}
        onComplete={handleTourComplete}
        userRole={userRole === UserRole.EMPLOYER ? "employer" : "candidate"}
      />

      {/* Profile Completion Gate - Mandatory for new users */}
      <Suspense fallback={null}>
        <ProfileCompletionGate
          isOpen={showProfileCompletionGate}
          onComplete={() => {
            setShowProfileCompletionGate(false);
            markOnboardingComplete();
          }}
          minimumCompletion={100}
        />
      </Suspense>

      {/* Sign Out Loading Overlay */}
      {signingOut && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "1rem",
              boxShadow: "0 25px 50px rgba(0,0,0,0.18)",
              padding: "2.5rem 3rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "4px solid #e5e7eb",
                borderTopColor: "#1F4D48",
                animation: "spin 0.75s linear infinite",
              }}
            />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: 0 }}>
              Signing You Out...
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// Main App wrapper with PWA components
function App() {
  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ErrorBoundary>
      {/* PWA Components */}
      <OfflineIndicator />
      <MobileOverlay />
      <InstallPrompt />

      {/* Main App */}
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
