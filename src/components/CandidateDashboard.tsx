import React, {
  useState,
  useEffect,
  useRef,
  lazy,
  Suspense,
  useMemo,
} from "react";
import {
  Award,
  TrendingUp,
  Briefcase,
  MapPin,
  Sparkles,
  CheckCircle,
  Loader,
  ArrowRight,
  X,
  Bookmark,
  Star,
  Share2,
  Shield,
  Eye,
  Search,
  Zap,
  Target,
} from "lucide-react";
import { CandidateProfile, RecommendedCertification, Job } from "../types";
import { getCareerRecommendations } from "../services/geminiService";
import { WelcomeBanner } from "./WelcomeBanner";
import { SEO } from "./SEO";
import { useToast } from "../lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { onboardingService } from "../services/onboardingService";
import {
  generatePassport,
  getCandidateProfile,
} from "../services/profileService";
import {
  hasPassedAnyAssessment,
  getSkillAttemptCount,
  canGeneratePassport,
  getTotalAssessmentCount,
  MIN_PASSPORT_SESSIONS,
} from "../services/assessmentHistoryService";

// Lazy load SkillPassport for performance
const SkillPassport = lazy(() =>
  import("./SkillPassport").then((m) => ({ default: m.SkillPassport })),
);

interface CandidateDashboardProps {
  candidate: CandidateProfile;
  onStartAssessment: (skill?: string) => void;
  onUpdateProfile: (profile: Partial<CandidateProfile>) => void;
  onOpenVideoAnalyzer?: () => void;
  onStartTour?: () => void;
  onNavigateProfile?: () => void;
}

const AVAILABLE_ASSESSMENTS: Record<string, string[]> = {
  // ── Frontend Engineering ──────────────────────────────────────────────
  "Frontend Development": [
    "React", "Vue.js", "Angular", "Svelte", "SolidJS",
    "TypeScript", "JavaScript (ES2024)", "Next.js", "Nuxt.js", "Astro",
    "CSS / Tailwind", "CSS Animations", "Web Accessibility (WCAG)",
    "Webpack / Vite", "Testing (Jest / Vitest)", "Storybook",
  ],

  // ── Backend Engineering ───────────────────────────────────────────────
  "Backend Development": [
    "Node.js", "Python", "Java", "Go", "Rust", "C#", "PHP", "Ruby",
    "Django", "FastAPI", "Flask", "Spring Boot", "NestJS", "Laravel",
    "REST API Design", "GraphQL", "gRPC", "WebSockets",
    "Authentication & OAuth2", "Rate Limiting & Caching",
  ],

  // ── Mobile Development ────────────────────────────────────────────────
  "Mobile Development": [
    "React Native", "Flutter", "iOS (Swift)", "Android (Kotlin)",
    "Expo", "SwiftUI", "Jetpack Compose", "Capacitor / Ionic",
    "Mobile App Architecture", "Push Notifications", "App Store Optimisation",
  ],

  // ── Cloud & Infrastructure ────────────────────────────────────────────
  "Cloud & DevOps": [
    "AWS Core Services", "AWS Solutions Architect",
    "Google Cloud Platform", "Microsoft Azure",
    "Docker", "Kubernetes", "Helm", "Terraform", "Pulumi",
    "CI/CD Pipelines", "GitHub Actions", "Jenkins", "ArgoCD",
    "Linux Administration", "Bash Scripting", "Nginx / Load Balancing",
    "Monitoring (Datadog / Grafana)", "Site Reliability Engineering",
  ],

  // ── Data & AI ─────────────────────────────────────────────────────────
  "Data Engineering": [
    "SQL (Advanced)", "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "Apache Spark", "Apache Kafka", "Airflow", "dbt",
    "Data Warehousing (Snowflake / BigQuery)", "ETL / ELT Pipelines",
    "Data Modelling", "Stream Processing",
  ],
  "Data Science & Analytics": [
    "Python for Data Science", "R Programming",
    "Pandas / NumPy", "Data Visualisation (Matplotlib / Seaborn)",
    "Statistics & Probability", "A/B Testing",
    "Tableau", "Power BI", "Looker", "Excel Data Analysis",
  ],
  "Machine Learning & AI": [
    "Machine Learning Fundamentals", "Deep Learning",
    "Natural Language Processing", "Computer Vision",
    "PyTorch", "TensorFlow / Keras", "Scikit-learn",
    "Prompt Engineering", "LLM Fine-Tuning", "RAG Systems",
    "MLOps & Model Deployment", "AI Ethics & Bias",
  ],

  // ── Security ──────────────────────────────────────────────────────────
  "Cybersecurity": [
    "Web Application Security (OWASP)", "Network Security",
    "Penetration Testing", "Threat Modelling",
    "SIEM & Log Analysis", "Incident Response",
    "Security Compliance (SOC2 / ISO27001)", "Identity & Access Management",
    "Cloud Security", "Cryptography Fundamentals",
  ],

  // ── Software Craft ────────────────────────────────────────────────────
  "Software Engineering": [
    "System Design", "Distributed Systems",
    "Data Structures & Algorithms", "Clean Code & SOLID",
    "Microservices Architecture", "Event-Driven Architecture",
    "Software Testing (Unit / Integration / E2E)",
    "Database Design", "Code Review Best Practices",
  ],

  // ── Design ────────────────────────────────────────────────────────────
  "UI/UX Design": [
    "Figma", "Adobe XD", "Sketch",
    "User Research & Interviews", "Wireframing & Prototyping",
    "Design Systems", "Interaction Design",
    "Usability Testing", "Information Architecture",
    "Motion Design", "Accessibility Design",
  ],
  "Graphic Design": [
    "Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign",
    "Brand Identity Design", "Typography",
    "Logo Design", "Print Design", "Packaging Design",
    "Social Media Graphics", "Canva",
  ],
  "Product Design": [
    "Product Thinking", "Jobs-to-be-Done Framework",
    "Design Sprints", "Competitive Analysis",
    "User Personas & Journey Mapping", "OKR-Driven Design",
    "Handoff & Developer Collaboration",
  ],

  // ── Product & Engineering Leadership ─────────────────────────────────
  "Product Management": [
    "Product Strategy", "Roadmap Planning", "PRD Writing",
    "User Story Mapping", "Prioritisation Frameworks (RICE / ICE)",
    "Metrics & KPIs", "Product Analytics",
    "Go-to-Market Strategy", "Competitive Intelligence",
    "Stakeholder Management", "Agile Product Management",
  ],
  "Engineering Management": [
    "Team Leadership", "Technical Interviews",
    "Architecture Decision Records", "Sprint Planning",
    "Engineering Metrics (DORA)", "Hiring & Performance Reviews",
    "Technical Roadmapping", "Cross-Functional Collaboration",
  ],

  // ── DevRel & Technical Content ────────────────────────────────────────
  "Developer Relations": [
    "Technical Writing", "API Documentation",
    "Developer Advocacy", "Community Management",
    "Tutorial & Sample Code Creation", "Conference Speaking",
    "Open Source Contribution", "SDK Design",
  ],

  // ── Operations & Support ──────────────────────────────────────────────
  "Customer Service": [
    "Customer Support Representative", "Call Centre Agent",
    "Help Desk / IT Support", "Client Success Manager",
    "Live Chat Support", "Escalation Handling",
    "CSAT & NPS Improvement", "CRM Tools (Zendesk / Freshdesk)",
  ],
  "Virtual Assistant": [
    "Executive Virtual Assistant", "Administrative VA",
    "Research & Data VA", "Calendar & Email Management",
    "Client Onboarding VA", "Travel Coordination",
    "Document Preparation", "Bookkeeping Support",
  ],
  "E-Commerce": [
    "Shopify Management", "WooCommerce", "Amazon Seller Central",
    "Product Listing Optimisation", "Order Fulfilment & Logistics",
    "Inventory Management", "Customer Returns Handling",
    "Marketplace Advertising", "Conversion Rate Optimisation",
  ],

  // ── Finance & Accounting ──────────────────────────────────────────────
  "Finance & Accounting": [
    "Financial Modelling", "Excel for Finance",
    "Bookkeeping & Accounts", "Management Accounting",
    "Financial Reporting (IFRS / GAAP)", "Budgeting & Forecasting",
    "Payroll Processing", "Tax Compliance",
    "QuickBooks / Xero", "Audit & Internal Controls",
  ],

  // ── Sales ─────────────────────────────────────────────────────────────
  "Sales": [
    "Sales Development Representative (SDR)", "Account Executive",
    "Business Development", "Lead Generation",
    "Cold Outreach / Email Sales", "Sales Copywriting",
    "CRM (Salesforce / HubSpot)", "Sales Analytics",
    "Enterprise Sales", "Channel & Partner Sales",
  ],

  // ── Marketing ────────────────────────────────────────────────────────
  "Digital Marketing": [
    "Social Media Management", "SEO & SEM",
    "Content Creation & Strategy", "Email Marketing",
    "Paid Advertising (Meta / Google)", "Influencer Marketing",
    "Marketing Analytics (GA4)", "Conversion Optimisation",
    "Brand Strategy", "Community Building",
    "Video Marketing", "Podcast Production",
  ],

  // ── Management & People ───────────────────────────────────────────────
  "Project Management": [
    "Project Manager", "Scrum Master / Agile",
    "Operations Manager", "Program Coordinator",
    "PMP Principles", "Jira / Asana / Linear",
    "Risk Management", "Change Management",
    "Stakeholder Communication", "Budget Management",
  ],
  "HR & Recruiting": [
    "HR Coordinator", "Talent Sourcing",
    "Technical Recruiter", "Onboarding Specialist",
    "Compensation & Benefits", "HR Information Systems (HRIS)",
    "Performance Management", "DEI Practices",
    "Labour Law Basics", "Employee Relations",
  ],

  // ── Soft Skills ───────────────────────────────────────────────────────
  "Communication": [
    "Public Speaking", "Presentation Skills",
    "Business Writing", "Negotiation",
    "Active Listening", "Executive Communication",
    "Cross-Cultural Communication", "Conflict Resolution",
  ],
  "Office Productivity": [
    "Microsoft Word", "Microsoft Excel", "Microsoft PowerPoint",
    "Google Workspace", "Notion / Airtable",
    "Slack Workflows", "Zoom & Remote Collaboration",
    "Time Management", "Process Documentation",
  ],

  // ── Legal & Compliance ────────────────────────────────────────────────
  "Legal & Compliance": [
    "Contract Review Basics", "GDPR / Data Privacy",
    "Intellectual Property Fundamentals", "Employment Law Basics",
    "Regulatory Compliance", "Corporate Governance",
  ],

  // ── Creative ─────────────────────────────────────────────────────────
  "Content & Copywriting": [
    "SEO Content Writing", "Copywriting",
    "Long-Form Editorial", "UX Writing",
    "Social Media Copywriting", "Email Copywriting",
    "Ghostwriting", "Research Writing",
    "Technical Documentation",
  ],
  "Video & Audio Production": [
    "Video Editing (Premiere / DaVinci)", "After Effects",
    "YouTube Production", "Short-Form Video (TikTok / Reels)",
    "Podcast Editing (Audacity / Descript)",
    "Audio Mixing", "Scriptwriting", "Storyboarding",
  ],
};

const ASSESSMENT_TRACKS: Record<string, string[]> = {
  "All": Object.keys(AVAILABLE_ASSESSMENTS),
  "Tech": [
    "Frontend Development", "Backend Development", "Mobile Development",
    "Cloud & DevOps", "Data Engineering", "Data Science & Analytics",
    "Machine Learning & AI", "Cybersecurity", "Software Engineering",
    "Developer Relations",
  ],
  "Design": ["UI/UX Design", "Graphic Design", "Product Design"],
  "Business": [
    "Product Management", "Engineering Management", "Project Management",
    "HR & Recruiting", "Finance & Accounting", "Sales", "Digital Marketing",
    "Legal & Compliance",
  ],
  "Operations": ["Customer Service", "Virtual Assistant", "E-Commerce"],
  "Creative": [
    "Content & Copywriting", "Video & Audio Production",
    "Communication", "Office Productivity",
  ],
};

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  candidate,
  onStartAssessment,
  onUpdateProfile,
  onOpenVideoAnalyzer,
  onStartTour,
  onNavigateProfile,
}) => {
  const toast = useToast();

  // A profile is "ready" once at least title, bio and one skill are filled
  const isProfileComplete = (): boolean => {
    const hasTitle = !!candidate.title && candidate.title !== "Candidate";
    const hasBio = !!(candidate.bio && candidate.bio.trim());
    const hasSkills = !!(
      candidate.skills && Object.keys(candidate.skills).length > 0
    );
    return hasTitle && hasBio && hasSkills;
  };

  const handleApplyNow = (jobTitle: string, company: string) => {
    if (!isProfileComplete()) {
      toast.warning(
        "Please complete your profile before applying — add your title, bio, and at least one skill.",
      );
      onNavigateProfile?.();
      return;
    }

    if (!hasPassedAnyAssessment(candidate.id)) {
      toast.warning(
        "You must pass at least one assessment to unlock job applications.",
      );
      return;
    }

    window.open(
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(jobTitle + " " + company)}`,
      "_blank",
    );
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTrack, setActiveTrack] = useState<string>("All");
  const [recommendations, setRecommendations] = useState<{
    certifications: RecommendedCertification[];
    jobs: Job[];
  } | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<
    string | null
  >(null);

  // Filter assessments based on track + search query
  const filteredAssessments = useMemo(() => {
    const trackCategories = ASSESSMENT_TRACKS[activeTrack] ?? Object.keys(AVAILABLE_ASSESSMENTS);
    const trackFiltered: Record<string, string[]> = {};
    trackCategories.forEach((cat) => {
      if (AVAILABLE_ASSESSMENTS[cat]) trackFiltered[cat] = AVAILABLE_ASSESSMENTS[cat];
    });

    if (!searchQuery.trim()) return trackFiltered;

    const query = searchQuery.toLowerCase();
    const result: Record<string, string[]> = {};
    Object.entries(trackFiltered).forEach(([category, skills]) => {
      const matchingSkills = skills.filter((s) => s.toLowerCase().includes(query));
      const categoryMatches = category.toLowerCase().includes(query);
      if (matchingSkills.length > 0 || categoryMatches) {
        result[category] = categoryMatches ? skills : matchingSkills;
      }
    });
    return result;
  }, [searchQuery, activeTrack]);

  // Skill Passport State
  const [isGeneratingPassport, setIsGeneratingPassport] = useState(false);
  const [passportData, setPassportData] = useState<{
    txHash: string;
    passportId: string;
  } | null>(null);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  const getJobKey = (job: Job) => `${job.title}-${job.company}`;

  const [userStats, setUserStats] = useState<{
    total_assessments: number;
    passed_assessments: number;
    average_score: number;
    total_points: number;
    current_streak: number;
    longest_streak: number;
  } | null>(null);

  // Fetch user stats on profile change
  useEffect(() => {
    api
      .get("/users/me/statistics/")
      .then((stats: any) => {
        setUserStats(stats);
        if (stats) {
          if (stats.total_assessments > 0) {
            onboardingService.updateProgress({ firstAssessmentTaken: true });
          }
          if (stats.passed_assessments > 0) {
            onboardingService.updateProgress({ firstCertificateEarned: true });
          }
        }
      })
      .catch((err) => console.error("Failed to fetch user stats:", err));

    if (candidate.videoIntroUrl) {
      onboardingService.updateProgress({ videoUploaded: true });
    }
  }, [candidate.id, candidate.videoIntroUrl]);


  // Sync fresh profile data from backend on every dashboard mount so the
  // completion bar and profile card always reflect the actual saved state.
  useEffect(() => {
    getCandidateProfile()
      .then((fresh) => {
        if (!fresh) return;
        // Merge skills carefully: take the best score per skill from both sources
        // so a recent local pass is never overwritten by a stale backend fetch.
        const freshSkills = (fresh.skills as Record<string, number>) || {};
        const localSkills = (candidate.skills as Record<string, number>) || {};
        const mergedSkills: Record<string, number> = { ...freshSkills };
        for (const [skill, score] of Object.entries(localSkills)) {
          if ((score as number) > (mergedSkills[skill] || 0)) {
            mergedSkills[skill] = score as number;
          }
        }
        onUpdateProfile({
          ...fresh,
          skills: mergedSkills,
        } as Partial<CandidateProfile>);
      })
      .catch(() => {
        /* silently ignore — stale local data is acceptable fallback */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    setRecommendationsError(null);
    try {
      const result = await getCareerRecommendations(candidate.skills);
      setRecommendations(result);
    } catch (err) {
      console.error("Failed to fetch career recommendations:", err);
      setRecommendationsError(
        "Failed to load recommendations. Please try again.",
      );
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Generate Skill Passport
  const handleGeneratePassport = async () => {
    if (!canGeneratePassport(candidate.id)) {
      const count = getTotalAssessmentCount(candidate.id);
      const remaining = MIN_PASSPORT_SESSIONS - count;
      toast.warning(
        `Complete ${remaining} more assessment session${remaining !== 1 ? "s" : ""} to unlock your Skill Passport (${count}/${MIN_PASSPORT_SESSIONS} done).`,
      );
      return;
    }

    if (!hasPassedAnyAssessment(candidate.id)) {
      toast.warning(
        "You need to pass at least one assessment before minting your Skill Passport.",
      );
      return;
    }

    setIsGeneratingPassport(true);
    try {
      const result = await generatePassport();
      if (!result) throw new Error("No result from server");
      setPassportData(result);
      toast.success("🎉 Skill Passport generated successfully!");
      onUpdateProfile({
        certifications: [...(candidate.certifications || []), result.txHash],
        passportId: result.passportId,
      });
    } catch (error) {
      toast.error("Failed to generate passport. Please try again.");
      if (import.meta.env.DEV) console.error(error);
    } finally {
      setIsGeneratingPassport(false);
    }
  };

  // Share Passport
  const handleSharePassport = () => {
    const passportId =
      passportData?.passportId || (candidate as any).passportId;
    if (!passportId) {
      toast.warning("Generate your passport first to share it.");
      return;
    }
    const shareLink = `${window.location.origin}/passport/${passportId}`;
    navigator.clipboard.writeText(shareLink);
    toast.success("📋 Passport link copied to clipboard!");
  };

  // Helper function to convert file to base64 data URL for persistence
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 75) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-orange-600 bg-orange-50 border-orange-200";
  };

  const getMatchLabel = (score: number) => {
    if (score >= 90) return "Excellent Match";
    if (score >= 75) return "Strong Match";
    return "Potential Match";
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <SEO pageType="candidate-dashboard" />
      {/* Welcome Banner */}
        <WelcomeBanner
          userName={candidate.name}
          userRole="candidate"
          onStartTour={onStartTour}
          onCompleteProfile={onNavigateProfile}
          onStartAssessment={() => onStartAssessment()}
          onOpenVideoAnalyzer={onOpenVideoAnalyzer}
          className="mb-0"
        />

        {/* Streak Hero Banner */}
        {userStats && userStats.current_streak >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-md shadow-amber-200"
          >
            <div className="text-3xl select-none">🔥</div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">
                {userStats.current_streak}-day streak — keep it going!
              </p>
              <p className="text-amber-100 text-xs mt-0.5">
                Take an assessment today to protect your streak. Best ever: {userStats.longest_streak} days.
              </p>
            </div>
          </motion.div>
        )}
        {userStats && userStats.current_streak === 1 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-4"
          >
            <div className="text-2xl select-none">⚡</div>
            <div className="flex-1 min-w-0">
              <p className="text-amber-800 font-bold text-sm leading-tight">
                Streak started — don't let it die today!
              </p>
              <p className="text-amber-600 text-xs mt-0.5">
                Complete another assessment to build your streak to 2 days.
              </p>
            </div>
          </motion.div>
        )}

        {/* Stats Overview */}
        {userStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {[
              {
                icon: <Target size={20} />,
                value: userStats.total_assessments,
                label: "Assessments",
                sublabel: "Total attempts",
                bg: "bg-orange/8",
                iconColor: "text-orange",
                accent: "border-orange/20",
              },
              {
                icon: <Award size={20} />,
                value: userStats.passed_assessments,
                label: "Certified",
                sublabel: "Skills verified",
                bg: "bg-teal/8",
                iconColor: "text-teal",
                accent: "border-teal/20",
              },
              {
                icon: <TrendingUp size={20} />,
                value: userStats.total_points.toLocaleString(),
                label: "Points",
                sublabel: "Total earned",
                bg: "bg-purple-50",
                iconColor: "text-purple-600",
                accent: "border-purple-100",
              },
              {
                icon: <Zap size={20} />,
                value: `${userStats.current_streak}d`,
                label: "Streak",
                sublabel: `Best: ${userStats.longest_streak}d`,
                bg: "bg-amber-50",
                iconColor: "text-amber-500",
                accent: "border-amber-100",
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -2 }}
                className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border ${stat.accent} flex flex-col gap-3 transition-shadow hover:shadow-md`}
              >
                <div
                  className={`${stat.bg} ${stat.iconColor} w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}
                >
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-none">
                    {stat.value}
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mt-1">
                    {stat.label}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {stat.sublabel}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left Sidebar: Verified Skills + Skill Passport */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-4 space-y-6"
          >
            {/* Verified Skills Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Award className="text-teal-600" size={20} /> Verified Skills
                </h3>
              </div>
              <div className="space-y-4 mb-6">
                {Object.entries(candidate.skills).map(([skill, score]) => {
                  const pct = Math.min(
                    100,
                    Math.max(0, Math.round(Number(score) || 0)),
                  );
                  const barStyle: React.CSSProperties = {
                    width: `${pct}%`,
                    background:
                      pct >= 80
                        ? "linear-gradient(to right, #1F4D48, #34d399)"
                        : "linear-gradient(to right, #F26430, #fb923c)",
                    transition: "width 0.7s ease-out",
                  };
                  return (
                    <div
                      key={skill}
                      className={
                        pct >= 80
                          ? "ring-1 ring-teal/20 rounded-xl p-2 -mx-2"
                          : ""
                      }
                    >
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-700">
                          {skill}
                        </span>
                        <span
                          className={`font-bold ${pct >= 80 ? "text-teal" : "text-slate-600"}`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div className="h-full rounded-full" style={barStyle} />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(candidate.skills).length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    No skills verified yet.
                  </p>
                )}
              </div>

              {/* Avg Score / Passed quick stats */}
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-4">
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {Math.round(userStats?.average_score || 0)}%
                  </div>
                  <div className="text-xs text-slate-500">Avg. Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {userStats?.passed_assessments ||
                      (candidate.certifications ?? []).length}
                  </div>
                  <div className="text-xs text-slate-500">Passed</div>
                </div>
              </div>
            </div>

            {/* Skill Passport Card */}
            <div className="bg-gradient-to-br from-orange to-red-600 rounded-2xl p-6 shadow-lg border border-orange-500/20 text-white relative overflow-hidden">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, 0] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full mix-blend-overlay filter blur-2xl -translate-y-1/2 translate-x-1/2"
              />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <Shield className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Skill Passport</h3>
                    <p className="text-orange-100 text-xs">
                      Verified credentials
                    </p>
                  </div>
                </div>

                {passportData || (candidate as any).passportId ? (
                  <div className="space-y-3">
                    <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                      <div className="text-xs text-orange-200 mb-1">
                        Passport ID
                      </div>
                      <div className="font-mono text-sm font-bold truncate">
                        {passportData?.passportId ||
                          (candidate as any).passportId}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSharePassport}
                        className="flex-1 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition backdrop-blur-sm"
                      >
                        <Share2 size={14} /> Share
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowPassportModal(true)}
                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition backdrop-blur-sm"
                      >
                        <Eye size={14} /> View
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-orange-100 text-sm">
                      Generate your verified skill passport and share with
                      employers.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGeneratePassport}
                      disabled={
                        isGeneratingPassport ||
                        !canGeneratePassport(candidate.id) ||
                        !hasPassedAnyAssessment(candidate.id)
                      }
                      className="w-full bg-white text-orange px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {isGeneratingPassport ? (
                        <span className="flex items-center gap-2">
                          <Loader className="animate-spin" size={16} />{" "}
                          Generating Passport...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Shield size={16} /> Generate Skill Passport
                        </span>
                      )}
                    </motion.button>
                    {!canGeneratePassport(candidate.id) && (
                      <p className="text-orange-200 text-xs text-center">
                        {getTotalAssessmentCount(candidate.id)}/
                        {MIN_PASSPORT_SESSIONS} sessions completed
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Content */}
          <motion.div variants={itemVariants} className="lg:col-span-8">
            <div>
                  {/* AI Recommendation Banner */}
                  <div className="bg-gradient-to-br from-orange to-slate-900 rounded-2xl p-8 text-white mb-8 relative overflow-hidden shadow-2xl shadow-orange/20">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
                      transition={{ duration: 10, repeat: Infinity }}
                      className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"
                    />
                    <div className="relative z-10">
                      <div className="flex items-start gap-4">
                        <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                          <Sparkles className="text-yellow-400" size={24} />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold mb-2">
                            Unlock your Career Path
                          </h2>
                          <p className="text-orange-100 mb-6 max-w-lg">
                            Let our AI analyze your verified skills to suggest
                            the best certifications and job opportunities for
                            you.
                          </p>

                          {!recommendations ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={fetchRecommendations}
                              disabled={loadingRecommendations}
                              className="bg-white text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-gray-50 transition flex items-center gap-2 shadow-xl disabled:opacity-80"
                            >
                              {loadingRecommendations ? (
                                <Loader className="animate-spin" size={18} />
                              ) : (
                                <Sparkles
                                  size={18}
                                  className="animate-wiggle"
                                />
                              )}
                              {loadingRecommendations
                                ? "Analyzing Profile..."
                                : "Generate Recommendations"}
                            </motion.button>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-lg border border-green-500/30 backdrop-blur-sm font-medium"
                            >
                              <CheckCircle size={16} /> Analysis Complete
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable recommendations content — fixed height so it never pushes the skills section down */}
                  <div className="overflow-y-auto h-[320px] custom-scrollbar pr-1">

                  {/* Recommendations Error State */}
                  {recommendationsError && !loadingRecommendations && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
                      <div className="text-red-500 mt-0.5">
                        <X size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-red-700 font-semibold mb-1">
                          Something went wrong
                        </p>
                        <p className="text-red-600 text-sm mb-3">
                          {recommendationsError}
                        </p>
                        <button
                          onClick={fetchRecommendations}
                          className="text-sm font-bold text-red-700 border border-red-300 px-4 py-1.5 rounded-lg hover:bg-red-100 transition"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Loading Skeleton */}
                  {loadingRecommendations && (
                    <div className="space-y-3 mb-8">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-20 bg-gray-100 rounded-xl animate-pulse"
                        />
                      ))}
                    </div>
                  )}

                  {/* Recommendations Content */}
                  {recommendations &&
                    !loadingRecommendations &&
                    recommendations.jobs.length === 0 &&
                    recommendations.certifications.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Briefcase className="mx-auto mb-3" size={40} />
                        <p>
                          No recommendations yet — complete more assessments to
                          unlock personalized matches.
                        </p>
                      </div>
                    )}
                  {recommendations &&
                    !loadingRecommendations &&
                    (recommendations.jobs.length > 0 ||
                      recommendations.certifications.length > 0) && (
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: {},
                          visible: { transition: { staggerChildren: 0.1 } },
                        }}
                        className="space-y-10"
                      >
                        {/* Recommended Jobs */}
                        <motion.div variants={itemVariants}>
                          <h3 className="font-bold text-xl text-slate-900 mb-6 flex items-center gap-2">
                            <Briefcase className="text-orange" />
                            Job Matches
                            <span className="bg-orange-50 text-orange text-xs px-2 py-1 rounded-full font-bold">
                              {recommendations.jobs.length}
                            </span>
                          </h3>
                          <div className="grid grid-cols-1 gap-6">
                            {recommendations.jobs.map((job, i) => (
                              <motion.div
                                key={i}
                                variants={itemVariants}
                                whileHover={{
                                  y: -5,
                                  transition: { duration: 0.2 },
                                }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden"
                              >
                                <div className="p-6">
                                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                    <div className="flex-1">
                                      <h4 className="font-bold text-xl text-slate-900 group-hover:text-orange transition-colors mb-1">
                                        {job.title}
                                      </h4>
                                      <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                        <Briefcase size={14} />
                                        <span>{job.company}</span>
                                      </div>
                                    </div>

                                    {/* Match Score Badge */}
                                    {job.matchScore && (
                                      <div
                                        className={`flex flex-col items-end`}
                                      >
                                        <div
                                          className={`px-3 py-1 rounded-full border font-bold text-sm flex items-center gap-1.5 ${getMatchColor(job.matchScore)}`}
                                        >
                                          <Star size={14} fill="currentColor" />
                                          {job.matchScore}% Match
                                        </div>
                                        <span className="text-xs text-slate-400 mt-1 font-medium">
                                          {getMatchLabel(job.matchScore)}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Job Details Grid */}
                                  <div className="flex flex-wrap gap-3 mb-6">
                                    <div className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 flex items-center gap-1.5">
                                      <MapPin size={12} /> {job.location}
                                    </div>
                                    <div className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 flex items-center gap-1.5">
                                      <Briefcase size={12} /> {job.type}
                                    </div>
                                    <div className="px-3 py-1.5 bg-green-50 rounded-lg text-xs font-semibold text-green-700 border border-green-200 flex items-center gap-1.5">
                                      <span className="font-sans">$</span>{" "}
                                      {job.salary}
                                    </div>
                                  </div>

                                  {/* AI Reasoning Box */}
                                  {job.matchReason && (
                                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 mb-6 relative">
                                      <div className="absolute -left-1 top-4 bottom-4 w-1 bg-orange-400 rounded-r-full"></div>
                                      <div className="flex items-start gap-3">
                                        <div className="bg-white p-1.5 rounded-full shadow-sm text-orange mt-0.5">
                                          <Sparkles size={14} />
                                        </div>
                                        <div>
                                          <h5 className="text-orange-900 font-bold text-sm mb-1">
                                            Why this is a great fit
                                          </h5>
                                          <p className="text-sm text-orange-900/80 leading-relaxed">
                                            {job.matchReason}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="flex-1 bg-black text-white py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition"
                                      onClick={() =>
                                        handleApplyNow(job.title, job.company)
                                      }
                                    >
                                      Apply Now
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
                                      aria-label="Bookmark job"
                                      onClick={() => {
                                        const key = getJobKey(job);
                                        setSavedJobs((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(key)) {
                                            next.delete(key);
                                            toast.info(
                                              "Job removed from saved list",
                                            );
                                          } else {
                                            next.add(key);
                                            toast.success("Job saved!");
                                          }
                                          return next;
                                        });
                                      }}
                                    >
                                      <Bookmark
                                        size={20}
                                        fill={
                                          savedJobs.has(getJobKey(job))
                                            ? "currentColor"
                                            : "none"
                                        }
                                        className={
                                          savedJobs.has(getJobKey(job))
                                            ? "text-orange"
                                            : ""
                                        }
                                      />
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>

                        {/* Recommended Certifications */}
                        <motion.div variants={itemVariants}>
                          <h3 className="font-bold text-xl text-slate-900 mb-6 flex items-center gap-2">
                            <Award className="text-orange" />
                            Recommended Certifications
                          </h3>
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendations.certifications.map((cert, i) => (
                              <motion.div
                                key={i}
                                variants={itemVariants}
                                whileHover={{
                                  y: -5,
                                  transition: { duration: 0.2 },
                                }}
                                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 flex flex-col h-full group"
                              >
                                <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center text-orange mb-4 group-hover:scale-110 transition-transform">
                                  <Award size={24} />
                                </div>

                                <h4 className="font-bold text-lg text-slate-900 mb-1 leading-tight">
                                  {cert.name}
                                </h4>
                                <p className="text-xs font-bold text-orange uppercase tracking-wider mb-4">
                                  {cert.provider}
                                </p>

                                <div className="flex-1">
                                  <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                    {cert.reason}
                                  </p>
                                </div>

                                <button
                                  className="mt-auto w-full py-2.5 rounded-lg border border-orange-100 text-orange-700 text-sm font-bold hover:bg-orange-50 transition flex items-center justify-center gap-2 group-hover:border-orange-200"
                                  onClick={() =>
                                    window.open(
                                      `https://www.google.com/search?q=${encodeURIComponent(cert.name + " " + cert.provider + " course")}`,
                                      "_blank",
                                    )
                                  }
                                >
                                  Start Learning{" "}
                                  <ArrowRight
                                    size={14}
                                    className="group-hover:translate-x-1 transition-transform"
                                  />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </motion.div>
                    )}

                  {/* Empty State if no recommendations yet */}
                  {!recommendations &&
                    !loadingRecommendations &&
                    !recommendationsError && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50"
                      >
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <TrendingUp size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          No recommendations yet
                        </h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                          Click the "Generate Recommendations" button above to
                          let our AI analyze your profile and find the perfect
                          opportunities.
                        </p>
                      </motion.div>
                    )}

                  </div>{/* end scrollable recommendations */}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Available Assessments Section ──────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mt-10"
          id="available-assessments"
        >
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Section header */}
            <div className="px-6 pt-7 pb-5 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange/10 flex items-center justify-center">
                    <Target size={20} className="text-orange" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Available Assessments</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {Object.values(AVAILABLE_ASSESSMENTS).flat().length}+ skills across {Object.keys(AVAILABLE_ASSESSMENTS).length} categories
                    </p>
                  </div>
                </div>
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search skills or categories…"
                    className="w-full pl-9 pr-9 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Track filter tabs */}
              <div className="flex gap-1.5 mt-5 flex-wrap">
                {Object.keys(ASSESSMENT_TRACKS).map((track) => (
                  <button
                    key={track}
                    onClick={() => { setActiveTrack(track); setSearchQuery(""); }}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                      activeTrack === track
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {track}
                  </button>
                ))}
              </div>

              {searchQuery && (
                <p className="text-xs text-gray-500 mt-3">
                  {Object.keys(filteredAssessments).length === 0
                    ? "No results found"
                    : `${Object.values(filteredAssessments).flat().length} skill(s) found`}
                </p>
              )}
            </div>

            {/* Skills grid */}
            <div className="p-6">
              {Object.keys(filteredAssessments).length === 0 ? (
                <div className="text-center py-12">
                  <Search size={36} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No assessments match your search.</p>
                  <button
                    onClick={() => { setSearchQuery(""); setActiveTrack("All"); }}
                    className="mt-2 text-xs text-orange hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Object.entries(filteredAssessments).map(([category, skills]) => (
                    <div key={category} className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                        {category}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => {
                          const attempts = getSkillAttemptCount(candidate.id, skill);
                          const maxed = attempts >= 3;
                          const attempted = attempts > 0;
                          return (
                            <motion.button
                              key={skill}
                              whileHover={!maxed ? { scale: 1.04 } : {}}
                              whileTap={!maxed ? { scale: 0.97 } : {}}
                              onClick={() => onStartAssessment(skill)}
                              disabled={maxed}
                              title={maxed ? "Maximum 3 attempts reached" : `${3 - attempts} attempt(s) remaining`}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                                maxed
                                  ? "opacity-35 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400"
                                  : attempted
                                  ? "bg-orange/8 border-orange/25 text-orange hover:bg-orange hover:text-white hover:border-orange"
                                  : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                              }`}
                            >
                              {skill}{attempted ? ` (${attempts}/3)` : ""}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

      {/* Skill Passport — full-screen page */}
      <AnimatePresence>
        {showPassportModal && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto"
          >
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <Loader className="w-12 h-12 text-teal animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading Skill Passport…</p>
                  </div>
                </div>
              }
            >
              <SkillPassport
                candidate={candidate}
                onBack={() => setShowPassportModal(false)}
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
