import React, { useState, useEffect, Suspense, lazy, Component, ErrorInfo, ReactNode } from 'react';
import { Landing } from './components/Landing';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { CheckEmail } from './components/auth/CheckEmail';
import { InstallPrompt, registerServiceWorker } from './components/InstallPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CertificateData } from './services/certificateBadgeService';
import { onboardingService } from './services/onboardingService';
import { ViewState, UserRole, EvaluationResult, CandidateProfile, DifficultyLevel, AssessmentType } from './types';
import { CheckCircle, AlertCircle, Code, ArrowLeft, ArrowRight, Award, ShieldCheck, Share2, Copy, Linkedin, Download, ExternalLink, X, Sparkles, Building2, Video, FileSpreadsheet, Presentation as PresentationIcon, FileText, Brain } from 'lucide-react';
import { ToastProvider, useToast } from './lib/toast';
import { celebrateSuccess } from './lib/confetti';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssessmentType, getSkillCategory } from './services/geminiService';
import { addAssessmentEntry } from './services/assessmentHistoryService';
import { VideoVerificationResult } from './services/videoAnalysisService';
import { seedService } from './services/seedService';

// Expose seedService to window for development only
if (import.meta.env.DEV) {
  (window as any).seedService = seedService;
}

import { getCandidateProfile, updateCandidateProfile, getEmployerProfile } from './services/profileService';
import { initializeAssessmentHistory } from './services/assessmentHistoryService';
import { initializeSessions } from './services/assessmentSessionService';
import { initializeGamification } from './services/gamificationService';
import { initializeAiLearning } from './services/aiLearningService';
import { initializeNotifications } from './services/notificationService';

// Lazy-loaded components for code splitting
const Assessment = lazy(() => import('./components/Assessment').then(m => ({ default: m.Assessment })));
const EmployerDashboard = lazy(() => import('./components/EmployerDashboard').then(m => ({ default: m.EmployerDashboard })));
const CandidateDashboard = lazy(() => import('./components/CandidateDashboard').then(m => ({ default: m.CandidateDashboard })));
const EnterpriseDashboard = lazy(() => import('./components/EnterpriseDashboard').then(m => ({ default: m.EnterpriseDashboard })));
const CertificateBadge = lazy(() => import('./components/CertificateBadge').then(m => ({ default: m.CertificateBadge })));
const VideoAnalyzer = lazy(() => import('./components/VideoAnalyzer').then(m => ({ default: m.VideoAnalyzer })));
const OnboardingTour = lazy(() => import('./components/OnboardingTour').then(m => ({ default: m.OnboardingTour })));
const WelcomeBanner = lazy(() => import('./components/WelcomeBanner').then(m => ({ default: m.WelcomeBanner })));
const ScenarioAssessment = lazy(() => import('./components/ScenarioAssessment').then(m => ({ default: m.ScenarioAssessment })));
const SpreadsheetAssessment = lazy(() => import('./components/SpreadsheetAssessment').then(m => ({ default: m.SpreadsheetAssessment })));
const TextEditorAssessment = lazy(() => import('./components/TextEditorAssessment').then(m => ({ default: m.TextEditorAssessment })));
const PresentationAssessment = lazy(() => import('./components/PresentationAssessment').then(m => ({ default: m.PresentationAssessment })));
const VerifyEmail = lazy(() => import('./components/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const VideoVerificationAssessment = lazy(() => import('./components/VideoVerificationAssessment').then(m => ({ default: m.VideoVerificationAssessment })));
const SkillPassport = lazy(() => import('./components/SkillPassport').then(m => ({ default: m.SkillPassport })));
const PermissionCheckModal = lazy(() => import('./components/PermissionCheckModal').then(m => ({ default: m.PermissionCheckModal })));
const LiveAssessmentViewer = lazy(() => import('./components/LiveAssessmentViewer').then(m => ({ default: m.LiveAssessmentViewer })));
const QuestionBankManager = lazy(() => import('./components/QuestionBankManager').then(m => ({ default: m.QuestionBankManager })));
const DataConsentModal = lazy(() => import('./components/DataConsentModal').then(m => ({ default: m.DataConsentModal })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-cream">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-500">Loading...</p>
    </div>
  </div>
);



// Storage key for profile persistence
const PROFILE_STORAGE_KEY = 'lune_candidate_profile';

// Default profile for new users
const DEFAULT_PROFILE: CandidateProfile = {
  id: '123',
  name: 'Jordan Lee',
  title: 'Junior Developer',
  location: 'San Francisco, CA',
  yearsOfExperience: 2,
  preferredWorkMode: 'Hybrid',
  skills: {},
  certifications: []
};

// Load profile from localStorage or return default
const loadProfileFromStorage = (): CandidateProfile => {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading profile from storage:', error);
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
    console.error('Error saving profile to storage:', error);
  }
};

function AppContent() {
  const toast = useToast();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LANDING);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('Mid-Level');
  const [assessmentResult, setAssessmentResult] = useState<EvaluationResult | null>(null);
  const [candidateProfile, setCandidateProfileState] = useState<CandidateProfile>(loadProfileFromStorage);

  // Wrapper to persist profile changes to localStorage and Supabase
  const setCandidateProfile = (updater: CandidateProfile | ((prev: CandidateProfile) => CandidateProfile)) => {
    setCandidateProfileState((prev) => {
      const newProfile = typeof updater === 'function' ? updater(prev) : updater;
      saveProfileToStorage(newProfile);

      // Sync to Supabase in the background
      if (user && user.role === 'candidate') {
        updateCandidateProfile(user.id, newProfile).catch(err =>
          console.error('Failed to sync profile to Supabase:', err)
        );
      }

      return newProfile;
    });
  };
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // New state for integrated components
  const [showCertificateBadge, setShowCertificateBadge] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);
  const [showVideoAnalyzer, setShowVideoAnalyzer] = useState(false);
  const [showEnterpriseDashboard, setShowEnterpriseDashboard] = useState(false);

  // New Phase 2-7 component states
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('code');
  const [showLiveViewer, setShowLiveViewer] = useState(false);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showDataConsent, setShowDataConsent] = useState(false);
  const [showSkillPassport, setShowSkillPassport] = useState(false);

  // Onboarding state
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

  // Permission modal state for assessments
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Update profile when user changes and check for onboarding
  // Handle initial routing based on URL path
  useEffect(() => {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    if (path === '/verify-email') {
      setCurrentView(ViewState.VERIFY_EMAIL);
    } else if (path === '/reset-password') {
      setCurrentView(ViewState.RESET_PASSWORD);
    } else if (path === '/login') {
      setCurrentView(ViewState.LOGIN);
    } else if (path === '/signup') {
      setCurrentView(ViewState.SIGNUP);
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'candidate') {
        // Fetch real profile from Supabase
        getCandidateProfile(user.id).then((profileData) => {
          if (profileData) {
            setCandidateProfileState((prev) => {
              const merged = { ...prev, ...profileData, id: user.id, name: user.name };
              saveProfileToStorage(merged);
              return merged;
            });
          } else {
            // Fallback to updating ID/Name only
            setCandidateProfileState(prev => ({
              ...prev,
              id: user.id,
              name: user.name
            }));
          }
        });

        // Initialize other state from Backend
        initializeAssessmentHistory(user.id);
        initializeSessions(user.id);
        initializeGamification(user.id);
        initializeAiLearning(user.id);
        initializeNotifications(user.id);
        onboardingService.setUserId(user.id);
      } else {
        // Fetch real profile from Backend
        getEmployerProfile(user.id).then((profileData) => {
          setCandidateProfileState(prev => ({
            ...prev,
            id: user.id,
            name: user.name,
            ...profileData
          }));
        });

        initializeNotifications(user.id);
      }

      setUserRole(user.role === 'candidate' ? UserRole.CANDIDATE : UserRole.EMPLOYER);

      // Handle login redirect - if modal was open and user just authenticated
      // This ensures we use the actual user role from the database, not form state
      if (authModalOpen) {
        setAuthModalOpen(false);
        // Redirect to appropriate dashboard based on actual user role
        if (user.role === 'employer') {
          setCurrentView(ViewState.EMPLOYER_DASHBOARD);
        } else {
          setCurrentView(ViewState.CANDIDATE_DASHBOARD);
        }
        setShowWelcomeBanner(true);
      }

      // Session restore on page refresh: if user is authenticated but still on LANDING,
      // redirect to their dashboard automatically
      // OR if we were on a verification page and just finished, we want to go home (which will be dashboard)
      if (currentView === ViewState.LANDING || currentView === ViewState.VERIFY_EMAIL || currentView === ViewState.RESET_PASSWORD) {
        if (user.role === 'employer') {
          setCurrentView(ViewState.EMPLOYER_DASHBOARD);
        } else {
          setCurrentView(ViewState.CANDIDATE_DASHBOARD);
        }
      }

      // Initialize onboarding service for this user
      onboardingService.setUserId(user.id);

      // Check if first-time user and show tour
      if (onboardingService.shouldShowTour()) {
        setShowOnboardingTour(true);
      }

      // Mark first login
      onboardingService.markFirstLogin();
    }
  }, [user, authModalOpen, currentView]);

  const handleNavigate = (view: ViewState, role?: UserRole) => {
    if (role) setUserRole(role);

    if (view === ViewState.AUTH_SELECTION || view === ViewState.SIGNUP) {
      setCurrentView(ViewState.SIGNUP);
      return;
    }

    setCurrentView(view);
  };

  const handleAuthSuccess = (role: 'candidate' | 'employer') => {
    if (role === 'candidate') {
      setUserRole(UserRole.CANDIDATE);
      setCurrentView(ViewState.CANDIDATE_DASHBOARD);
    } else {
      setUserRole(UserRole.EMPLOYER);
      setCurrentView(ViewState.EMPLOYER_DASHBOARD);
    }
    // Show welcome banner for new users
    setShowWelcomeBanner(true);
  };

  // Onboarding handlers
  const handleTourComplete = () => {
    onboardingService.completeTour();
    setShowOnboardingTour(false);
    toast.success('🎉 Welcome aboard! You\'re ready to explore Lune.');
  };

  const handleTourSkip = () => {
    onboardingService.skipTour();
    setShowOnboardingTour(false);
  };

  const handleStartTour = () => {
    setShowOnboardingTour(true);
  };

  const handleLogout = async () => {
    await logout();
    setUserRole(null);
    setCurrentView(ViewState.LANDING);
    toast.success('👋 Logged out successfully!');
  };

  const handleStartAssessment = (skill?: string) => {
    if (skill) {
      setSelectedSkill(skill);
      // Determine the assessment type based on skill
      const type = getAssessmentType(skill);
      setAssessmentType(type);
      setCurrentView(ViewState.SKILL_SELECTION);
    } else {
      setCurrentView(ViewState.SKILL_SELECTION);
    }
  };

  const startAssessmentFlow = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty);
    setShowPermissionModal(true); // Show permission modal first
  };

  const handlePermissionGranted = () => {
    setShowPermissionModal(false);
    setCurrentView(ViewState.ASSESSMENT);
  };

  const handleAssessmentComplete = (result: EvaluationResult) => {
    setAssessmentResult(result);
    setCurrentView(ViewState.ASSESSMENT_RESULT);

    // Save to assessment history
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
      result.certificationHash
    );

    // Update local profile if passed - save skills regardless of certificate hash
    if (result.passed) {
      // Always update skills when passed
      setCandidateProfile(prev => ({
        ...prev,
        skills: {
          ...prev.skills,
          [selectedSkill]: result.score
        },
        // Only add to certifications if hash exists
        certifications: result.certificationHash
          ? [...prev.certifications, result.certificationHash]
          : prev.certifications
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
          certificateId: `cert-${Date.now()}`
        });
      }

      // Celebrate with confetti!
      celebrateSuccess();
      toast.success(`🎉 Congratulations! You scored ${result.score}/100 on ${selectedSkill}!`);
    } else if (result.cheatingDetected) {
      toast.error('❌ Assessment invalidated due to integrity concerns.');
    } else {
      toast.warning(`Keep practicing! You scored ${result.score}/100. Need 70+ to pass.`);
    }
  };

  // Handler specifically for video verification assessments
  const handleVideoVerificationComplete = async (result: VideoVerificationResult, passed: boolean) => {
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
        'Communication Style': result.communicationStyleScore,
        'Pronunciation': result.pronunciationScore,
        'Grammar': result.grammarScore,
        'Intonation': result.intonationScore,
        'Confidence': result.confidenceScore,
        'Clarity': result.clarityScore,
        'Professionalism': result.professionalismScore,
        'Empathy': result.empathyScore,
        'Persuasion': result.persuasionScore
      },
      cheatingDetected: false,
      integrityScore: 100
    };

    // Call the existing assessment complete handler
    handleAssessmentComplete(evaluationResult);
  };

  const handleViewCertificate = () => {
    if (selectedCertificate) {
      setShowCertificateBadge(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://lune.platform/verify/${assessmentResult?.certificationHash}`);
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
      const fullSentence = trimmed.endsWith('.') ? trimmed : trimmed + '.';

      // Check if sentence mentions a task (Task 1, Task 2, etc.)
      const taskMatch = fullSentence.match(/\(Task \d+\)/);

      // Start new paragraph for task mentions or after 2-3 sentences
      if (taskMatch || currentParagraph.length >= 3) {
        if (currentParagraph.length > 0) {
          paragraphs.push(
            <p key={`para-${paragraphs.length}`} className="mb-3 leading-relaxed">
              {currentParagraph.join(' ')}
            </p>
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
          {currentParagraph.join(' ')}
        </p>
      );
    }

    return <div className="space-y-0">{paragraphs}</div>;
  };

  const handleShare = () => {
    const text = `I just verified my ${selectedSkill} skills on Lune with a score of ${assessmentResult?.score}/100! #LuneVerified #Web3`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast.info("📤 Opening Twitter to share...");
  };

  const handleShareToLinkedIn = () => {
    if (!selectedCertificate || !assessmentResult) return;

    // LinkedIn Share URL format
    const certificateUrl = `https://lune.app/verify/${selectedCertificate}`;

const shareText = `🎓 I just earned a verified ${selectedSkill} certificate on Lune with a score of ${assessmentResult.score}/100!

My skills are verified on Lune.

Verify my certificate: ${certificateUrl}

#LuneVerified #SkillCertification #BlockchainVerification #${selectedSkill.replace(/\s+/g, '')}`;

    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl)}`;

    // Open LinkedIn share dialog
    window.open(linkedInUrl, '_blank', 'width=600,height=600');

    // Also copy the text to clipboard for easy pasting
    navigator.clipboard.writeText(shareText);

    toast.success("📋 LinkedIn opened! Share text copied to clipboard - paste it in your post.");
  };

  const addToLinkedInProfile = () => {
    if (!selectedCertificate || !selectedSkill) return;

    const certData = {
      name: `${selectedSkill} - Verified by Lune`,
      issuedBy: 'Lune Skills Verification Platform',
      issuedDate: new Date().toISOString().split('T')[0],
      credentialUrl: `https://lune.app/verify/${selectedCertificate}`,
      credentialId: selectedCertificate
    };

    // LinkedIn Add Certification URL
    const linkedInAddUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION&name=${encodeURIComponent(certData.name)}&organizationName=${encodeURIComponent(certData.issuedBy)}&issueYear=${new Date().getFullYear()}&issueMonth=${new Date().getMonth() + 1}&certUrl=${encodeURIComponent(certData.credentialUrl)}&certId=${encodeURIComponent(String(certData.credentialId))}`;

    window.open(linkedInAddUrl, '_blank');
    toast.success("🎓 Opening LinkedIn to add your certificate to your profile!");
  };

  const renderAuthSelection = () => (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-2 text-teal-900">Welcome to Lune</h2>
        <p className="text-gray-500 mb-8">Select your role to continue</p>

        <div className="space-y-4">
          <button
            onClick={() => handleNavigate(ViewState.CANDIDATE_DASHBOARD, UserRole.CANDIDATE)}
            className="w-full p-4 border-2 border-gray-100 rounded-xl hover:border-orange hover:bg-orange/5 transition flex items-center gap-4 group text-left"
          >
            <div className="bg-orange/10 p-3 rounded-lg text-orange group-hover:bg-orange group-hover:text-white transition">
              <Code size={24} />
            </div>
            <div>
              <div className="font-bold text-slate-900">I am a Candidate</div>
              <div className="text-xs text-slate-500">Verify skills & get certified</div>
            </div>
          </button>

          <button
            onClick={() => handleNavigate(ViewState.EMPLOYER_DASHBOARD, UserRole.EMPLOYER)}
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
          onClick={() => setCurrentView(ViewState.LANDING)}
          className="mt-8 text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto"
        >
          <ArrowLeft size={14} /> Back to Home
        </button>
      </div>
    </div>
  );

  // Combined Skill & Difficulty Selection
  const renderSkillSelection = () => (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="flex items-center mb-8">
          <button onClick={() => setCurrentView(ViewState.CANDIDATE_DASHBOARD)} className="bg-white p-2 rounded-full hover:bg-gray-100 mr-4">
            <ArrowLeft />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {selectedSkill ? 'Select Difficulty' : 'Select a Skill to Verify'}
            </h2>
            <p className="text-gray-500">
              {selectedSkill ? `Choose the level for your ${selectedSkill} assessment.` : 'Choose a domain to start your proctored assessment.'}
            </p>
          </div>
        </div>

        {!selectedSkill ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Frontend Engineering', 'Backend Engineering', 'Cloud Architecture'].map((domain) => (
              <div key={domain} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
                <h3 className="font-bold text-lg mb-4 text-teal-800">{domain}</h3>
                <div className="flex flex-wrap gap-2">
                  {(domain === 'Frontend Engineering' ? ['React', 'Vue', 'CSS'] :
                    domain === 'Backend Engineering' ? ['Node.js', 'Python', 'Java'] :
                      ['AWS', 'Docker', 'Kubernetes']).map(skill => (
                        <button
                          key={skill}
                          onClick={() => setSelectedSkill(skill)}
                          className="px-3 py-1.5 border border-gray-200 rounded-full text-sm hover:bg-teal hover:text-white hover:border-teal transition"
                        >
                          {skill}
                        </button>
                      ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['Beginner', 'Mid-Level', 'Advanced'] as DifficultyLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => startAssessmentFlow(level)}
                className="bg-white p-8 rounded-2xl border-2 border-transparent hover:border-teal hover:shadow-lg transition text-left group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${level === 'Beginner' ? 'bg-green-100 text-green-700' : level === 'Mid-Level' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {level}
                  </span>
                  <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 text-teal transition-opacity" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{level}</h3>
                <p className="text-sm text-gray-500">
                  {level === 'Beginner' ? 'Basic syntax and core concepts.' :
                    level === 'Mid-Level' ? 'Best practices, patterns, and optimization.' :
                      'System design, edge cases, and performance.'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderResult = () => {
    if (!assessmentResult) return null;

    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          <div className={`md:w-1/3 p-8 ${assessmentResult.passed ? 'bg-teal' : 'bg-red-500'} flex flex-col items-center justify-center text-white`}>
            {assessmentResult.passed ? <ShieldCheck size={80} className="mb-4" /> : <AlertCircle size={80} className="mb-4" />}
            <h2 className="text-2xl font-bold text-center mb-2">
              {assessmentResult.passed ? 'Verified!' : 'Not Passed'}
            </h2>
            <div className="text-5xl font-bold my-2">{assessmentResult.score}</div>
            <div className="text-sm opacity-80">{selectedDifficulty} • {selectedSkill}</div>
          </div>

          <div className="p-8 flex-1 flex flex-col">
            <div className="flex-1">
              <div className="bg-white p-6 rounded-2xl text-left border border-gray-200 shadow-sm mb-6">
                <div className="flex items-start gap-2 mb-4">
                  <Brain className="text-teal-600 flex-shrink-0 mt-1" size={20} />
                  <h3 className="font-bold text-lg text-gray-900">AI Performance Analysis</h3>
                </div>
                <div className="text-sm text-gray-700 prose prose-sm max-w-none">
                  {formatAIFeedback(assessmentResult.feedback)}
                </div>
              </div>

              {assessmentResult.cheatingDetected && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 text-sm mb-6 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Integrity Flag Raised:</strong> {assessmentResult.cheatingReason}
                  </div>
                </div>
              )}

              {assessmentResult.certificationHash && (
                <div className="mb-6">
                  <div className="text-xs uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                    <Award size={12} /> Verified Certificate
                  </div>
                  <div className="font-mono text-xs bg-gray-100 p-3 rounded border border-gray-200 text-teal-700 break-all">
                    {assessmentResult.certificationHash}
                  </div>
                </div>
              )}
            </div>

            {assessmentResult.passed && (
              <div className="space-y-3 mt-4">
                {/* View Certificate Badge Button */}
                {selectedCertificate && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleViewCertificate}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:opacity-90 transition"
                  >
                    <Sparkles size={18} />
                    View NFT Badge
                  </motion.button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleCopyLink} className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
                    <Copy size={16} /> Copy Link
                  </button>
                  <button onClick={handleShare} className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
                    <Share2 size={16} /> Share
                  </button>
                  <button
                    onClick={addToLinkedInProfile}
                    className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#0A66C2] text-white text-sm font-bold hover:bg-[#004182] transition shadow-sm"
                  >
                    <Linkedin size={16} /> Add to LinkedIn Profile
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setCurrentView(ViewState.CANDIDATE_DASHBOARD)}
              className="mt-4 text-center text-gray-400 text-sm hover:text-gray-600"
            >
              Return to Dashboard
            </button>
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
      case ViewState.CANDIDATE_DASHBOARD:
        return (
          <CandidateDashboard
            candidate={candidateProfile}
            onStartAssessment={handleStartAssessment}
            onLogout={handleLogout}
            onUpdateProfile={(updates) => setCandidateProfile(prev => ({ ...prev, ...updates }))}
            onOpenVideoAnalyzer={() => setShowVideoAnalyzer(true)}
            onStartTour={handleStartTour}
          />
        );
      case ViewState.EMPLOYER_DASHBOARD:
        return (
          <EmployerDashboard
            onLogout={handleLogout}
            onOpenEnterpriseDashboard={() => setShowEnterpriseDashboard(true)}
            onStartTour={handleStartTour}
            userName={user?.name || 'Employer'}
          />
        );
      case ViewState.SKILL_SELECTION:
        return renderSkillSelection();
      case ViewState.ASSESSMENT:
        return renderAssessment();
      case ViewState.ASSESSMENT_RESULT:
        return renderResult();
      case ViewState.LOGIN:
        return <LoginPage onNavigate={handleNavigate} />;
      case ViewState.SIGNUP:
        return <SignupPage onNavigate={handleNavigate} onSuccess={handleAuthSuccess} />;
      case ViewState.FORGOT_PASSWORD:
        return <ForgotPasswordPage onNavigate={handleNavigate} />;
      case ViewState.RESET_PASSWORD:
        return <ResetPasswordPage onNavigate={handleNavigate} />;
      case ViewState.CHECK_EMAIL:
        return <CheckEmail onNavigate={handleNavigate} />;
      case ViewState.AUTH_SELECTION: // Fallback directly to signup
        return <SignupPage onNavigate={handleNavigate} onSuccess={handleAuthSuccess} />;
      case ViewState.VERIFY_EMAIL:
        return <VerifyEmail />;
      default:
        return <Landing onNavigate={handleNavigate} />;
    }
  };

  const renderAssessment = () => {
    if (assessmentType === 'code') {
      return <Assessment skill={selectedSkill} difficulty={selectedDifficulty} onComplete={handleAssessmentComplete} />;
    } else if (assessmentType === 'scenario') {
      return <ScenarioAssessment skill={selectedSkill} difficulty={selectedDifficulty} candidateId={user?.id || ''} onComplete={handleAssessmentComplete} onCancel={() => setCurrentView(ViewState.CANDIDATE_DASHBOARD)} />;
    } else if (assessmentType === 'spreadsheet') {
      return <SpreadsheetAssessment skill={selectedSkill} difficulty={selectedDifficulty} onComplete={handleAssessmentComplete} onCancel={() => setCurrentView(ViewState.CANDIDATE_DASHBOARD)} />;
    } else if (assessmentType === 'text_editor') {
      return <TextEditorAssessment skill={selectedSkill} difficulty={selectedDifficulty} onComplete={handleAssessmentComplete} onCancel={() => setCurrentView(ViewState.CANDIDATE_DASHBOARD)} />;
    } else if (assessmentType === 'presentation') {
      return <PresentationAssessment skill={selectedSkill} difficulty={selectedDifficulty} onComplete={handleAssessmentComplete} onCancel={() => setCurrentView(ViewState.CANDIDATE_DASHBOARD)} />;
    } else if (assessmentType === 'video_verification') {
      return <VideoVerificationAssessment skill={selectedSkill} difficulty={selectedDifficulty} onComplete={handleVideoVerificationComplete} onCancel={() => setCurrentView(ViewState.CANDIDATE_DASHBOARD)} />;
    }
    return null;
  };

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        {renderContent()}
      </Suspense>

      {/* Permission Check Modal for Assessments */}
      <Suspense fallback={null}>
        <PermissionCheckModal
          isOpen={showPermissionModal}
          onClose={() => setShowPermissionModal(false)}
          onPermissionsGranted={handlePermissionGranted}
          assessmentType={selectedSkill || 'Skill'}
        />
      </Suspense>

      {/* Certificate Badge Modal */}
      <AnimatePresence>
        {showCertificateBadge && selectedCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCertificateBadge(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative"
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

      {/* Video Analyzer Modal */}
      <AnimatePresence>
        {showVideoAnalyzer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowVideoAnalyzer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full my-8"
            >
              <button
                onClick={() => setShowVideoAnalyzer(false)}
                className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-10"
              >
                <X size={20} />
              </button>
              <VideoAnalyzer
                onAnalysisComplete={(result) => {
                  toast.success(`Video analyzed! Overall score: ${result.overallScore}/100`);
                }}
              />
            </motion.div>
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
              companyId={user?.id || 'demo-company'}
              companyName={user?.name ? `${user.name}'s Company` : 'Demo Enterprise'}
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
              adminId={user?.id || 'admin'}
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
                <SkillPassport
                  candidate={candidateProfile}
                />
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
        userRole={userRole === UserRole.EMPLOYER ? 'employer' : 'candidate'}
      />
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
      <InstallPrompt />

      {/* Main App */}
      <AppContent />
    </ErrorBoundary>
  );
}


export default App;