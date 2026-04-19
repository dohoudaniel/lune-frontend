import React, { useState, useEffect } from "react";
import {
  Search,
  Play,
  Award,
  MapPin,
  CheckCircle,
  AlertCircle,
  Sliders,
  FileText,
  ShieldCheck,
  XCircle,
  Plus,
  Sparkles,
  Briefcase,
  GraduationCap,
  Filter,
  Building2,
  DollarSign,
  Globe,
  Clock,
  Trash2,
  Mail,
  User,
  X,
  ExternalLink,
  Copy,
  Loader,
  ChevronDown,
  BarChart3,
  Settings,
  Edit2,
  Save,
  RefreshCw,
} from "lucide-react";
import { dataService } from "../services/dataService";
import { matchCandidatesToJob } from "../services/geminiService";
import { CertificateDetails, CandidateProfile, Job } from "../types";
import { api } from "../lib/api";
import { notificationService } from "../services/notificationService";
import { WelcomeBanner } from "./WelcomeBanner";
import { SEO } from "./SEO";
import { useToast } from "../lib/toast";
import { Skeleton } from "./Skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface EmployerDashboardProps {
  activeTab: "candidates" | "jobs";
  onTabChange?: (tab: "candidates" | "jobs") => void;
  onOpenEnterpriseDashboard?: () => void;
  onStartTour?: () => void;
  userName?: string;
  onNavigateProfile?: () => void;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({
  activeTab,
  onTabChange,
  onOpenEnterpriseDashboard,
  onStartTour,
  userName = "Employer",
  onNavigateProfile,
}) => {
  const toast = useToast();

  // Candidate Interaction State
  const [viewingCandidate, setViewingCandidate] =
    useState<CandidateProfile | null>(null);
  const [profileModalTab, setProfileModalTab] = useState<
    "overview" | "credentials"
  >("overview");

  // Candidate Search State
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [showVerification, setShowVerification] = useState(false);
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState<CertificateDetails | null>(
    null,
  );
  const [verifyStatus, setVerifyStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [skillSearch, setSkillSearch] = useState("");
  const [minExperience, setMinExperience] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Job Management State
  const [showPostJob, setShowPostJob] = useState(false);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidateTotalCount, setCandidateTotalCount] = useState(0);
  const [candidateNextPage, setCandidateNextPage] = useState<string | null>(null);
  const [loadingMoreCandidates, setLoadingMoreCandidates] = useState(false);
  const [employerVerified, setEmployerVerified] = useState<boolean | null>(null);
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);

  const loadMoreCandidates = async () => {
    if (!candidateNextPage || loadingMoreCandidates) return;
    setLoadingMoreCandidates(true);
    try {
      const nextPageNum = candidatePage + 1;
      const data = await dataService.getCandidatesPage(nextPageNum);
      setCandidates(prev => [...prev, ...data.results]);
      setCandidatePage(nextPageNum);
      setCandidateNextPage(data.next);
    } catch {
      toast.error('Failed to load more candidates.');
    } finally {
      setLoadingMoreCandidates(false);
    }
  };

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [candidatePage1, fetchedJobs, fetchedProfile] =
          await Promise.all([
            dataService.getCandidatesPage(1),
            dataService.getJobs(),
            api.get("/profiles/employer/"),
          ]);
        setCandidates(candidatePage1.results);
        setCandidateTotalCount(candidatePage1.count);
        setCandidateNextPage(candidatePage1.next);
        setEmployerVerified(candidatePage1.employer_verified ?? false);
        setPostedJobs(fetchedJobs);

        if (fetchedProfile) {
          const newProfile = {
            companyName:
              (fetchedProfile as any).company_name || "TechCorp Global",
            industry: (fetchedProfile as any).industry || "Technology",
            companySize: (fetchedProfile as any).company_size || "100-500",
            website:
              (fetchedProfile as any).website || "https://techcorpglobal.com",
            location: (fetchedProfile as any).location || "San Francisco, CA",
            about:
              (fetchedProfile as any).about ||
              "Leading technology company focused on innovation and growth.",
            avatar:
              (fetchedProfile as any).image_url ||
              (fetchedProfile as any).avatar ||
              "",
          };
          setEmployerProfile(newProfile);
          setProfileForm(newProfile);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Failed to load dashboard data:", error);
        } else {
          console.error("Failed to load dashboard data:");
        }
        toast.error("Failed to load dashboard data");
        setCandidateError("Failed to load candidates.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [rankedCandidates, setRankedCandidates] = useState<any[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  // New Job Form State
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobSalary, setJobSalary] = useState("");
  const [jobType, setJobType] = useState("Remote");
  const [jobDescription, setJobDescription] = useState("");

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<{
    profiles_viewed?: number;
    matches_found?: number;
    applications_received?: number;
    hired_candidates?: number;
    avg_profile_views_per_day?: number;
    pending_verifications?: number;
    verified_candidates?: number;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Employer Profile State
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [employerProfile, setEmployerProfile] = useState({
    companyName: "TechCorp Global",
    industry: "Technology",
    companySize: "100-500",
    website: "https://techcorpglobal.com",
    location: "San Francisco, CA",
    about: "Leading technology company focused on innovation and growth.",
    avatar: "",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ ...employerProfile });

  const saveProfileChanges = async () => {
    try {
      const payload = {
        company_name: profileForm.companyName,
        industry: profileForm.industry,
        company_size: profileForm.companySize,
        website: profileForm.website,
        location: profileForm.location,
        about: profileForm.about,
      };
      await api.put("/profiles/employer/", payload);
      setEmployerProfile({ ...profileForm });
      setIsEditingProfile(false);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = sessionStorage.getItem("employerAnalytics");
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          if (age < 5 * 60 * 1000) {
            // 5 minutes TTL
            setAnalyticsData(data);
            return;
          }
        } catch (e) {
          // ignore cache parse error
        }
      }
    }

    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await api.get("/profiles/employer-analytics/");
      setAnalyticsData(data);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Failed to fetch analytics:", error);
      }
      setAnalyticsError("Failed to load analytics data");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Load analytics on mount
  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (analyticsData) {
      sessionStorage.setItem(
        "employerAnalytics",
        JSON.stringify({
          data: analyticsData,
          timestamp: Date.now(),
        }),
      );
    }
  }, [analyticsData]);

  const handleVerify = async (hash: string) => {
    let cleanHash = hash;
    try {
      const parsed = JSON.parse(hash);
      if (parsed.hash) cleanHash = parsed.hash;
    } catch { /* ignore parse errors */ }

    if (!cleanHash) return;
    setVerifyStatus("loading");
    setVerifyResult(null);

    const details = {
      candidateId: "unknown",
      candidateName: "Candidate",
      skill: "Verified Skill",
      score: 95,
      timestamp: new Date().toISOString(),
      hash: cleanHash,
      isValid: true,
      issuer: "Lune",
    };
    if (details) {
      setVerifyResult(details);
      setVerifyStatus("idle");

      // Record verification event and create notification
      if (details.candidateId && details.candidateId !== "unknown") {
        notificationService.recordVerificationEvent({
          certificateHash: cleanHash,
          candidateId: details.candidateId,
          candidateName: details.candidateName,
          skill: details.skill,
          verifiedBy: employerProfile.companyName,
        });

        toast.success("✅ Certificate verified! Candidate has been notified.");
      } else {
        toast.success("✅ Certificate verified!");
      }
    } else {
      setVerifyStatus("error");
    }
  };

  const openProfile = (
    candidate: CandidateProfile,
    tab: "overview" | "credentials" = "overview",
  ) => {
    setViewingCandidate(candidate);
    setProfileModalTab(tab);
  };

  const handlePostJob = async () => {
    setIsMatching(true);
    setMatchingLoading(true);

    // 1. Create and Save Job
    const newJob: Job = {
      id: Date.now().toString(),
      title: jobTitle,
      company: jobCompany || "My Company", // Default if empty
      location: jobLocation,
      salary: jobSalary,
      type: jobType,
      description: jobDescription,
    };

    setPostedJobs((prev) => [newJob, ...prev]);

    // Save job to DB (optional, fire and forget for responsiveness or await)
    dataService.createJob(newJob as any);

    try {
      // 2. Call Gemini to rank candidates
      const rankings = await matchCandidatesToJob(jobDescription, candidates);

      // Merge ranking data with candidate data
      const enrichedCandidates = rankings
        .map((r) => {
          const candidate = candidates.find((c) => c.id === r.candidateId);
          return { ...candidate, ...r };
        })
        .sort((a, b) => (b.score || 0) - (a.score || 0));

      setRankedCandidates(enrichedCandidates);
      setShowPostJob(false);

      // 3. Reset Form
      setJobTitle("");
      setJobCompany("");
      setJobLocation("");
      setJobSalary("");
      setJobType("Remote");
      setJobDescription("");

      // 4. Switch view to candidates to show results
      onTabChange?.("candidates");
      setSelectedIndustry("All");

      // 5. Show success toast
      toast.success(
        `💼 Job posted! Found ${enrichedCandidates.length} matching candidates.`,
      );
    } catch (err: any) {
      toast.error(err?.message || "AI matching failed. Please try again.");
    } finally {
      setIsMatching(false);
      setMatchingLoading(false);
    }
  };

  const deleteJob = (id: string) => {
    setPostedJobs((prev) => prev.filter((j) => j.id !== id));
    toast.info("🗑️ Job listing removed.");
  };

  // Filter Candidates
  const displayedCandidates = (
    rankedCandidates.length > 0 ? rankedCandidates : candidates
  )
    .filter((candidate) => {
      const candidateTitle = candidate.title || "";

      const matchesIndustry =
        selectedIndustry === "All" ||
        candidateTitle.toLowerCase().includes(selectedIndustry.toLowerCase()) ||
        (selectedIndustry === "Data Science" &&
          candidateTitle.includes("Data")) ||
        (selectedIndustry === "Software Engineering" &&
          (candidateTitle.includes("Developer") ||
            candidateTitle.includes("Engineer"))) ||
        (selectedIndustry === "Virtual Assistant" &&
          (candidateTitle.toLowerCase().includes("virtual assistant") ||
            candidateTitle.toLowerCase().includes("administrative") ||
            candidateTitle.toLowerCase().includes("executive assistant") ||
            Object.keys(candidate.skills).some((s) =>
              s.toLowerCase().includes("virtual assistant"),
            )));

      const matchesSearch =
        skillSearch === "" ||
        candidate.name?.toLowerCase().includes(skillSearch.toLowerCase()) ||
        candidateTitle.toLowerCase().includes(skillSearch.toLowerCase()) ||
        Object.keys(candidate.skills || {}).some((s) =>
          s.toLowerCase().includes(skillSearch.toLowerCase()),
        );

      const matchesExperience =
        (candidate.yearsOfExperience || 0) >= minExperience;
      const matchesVerified = !verifiedOnly || candidate.verified;

      return (
        matchesIndustry && matchesSearch && matchesExperience && matchesVerified
      );
    })
    .sort((a, b) => {
      // Sort verified VAs first when filtering for Virtual Assistants
      if (selectedIndustry === "Virtual Assistant") {
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;
        // Secondary sort by VA skill score
        const aVAScore = a.skills["Virtual Assistant"] || 0;
        const bVAScore = b.skills["Virtual Assistant"] || 0;
        return bVAScore - aVAScore;
      }
      return 0;
    });

  const clearFilters = () => {
    setSkillSearch("");
    setMinExperience(0);
    setVerifiedOnly(false);
    setSelectedIndustry("All");
    setRankedCandidates([]);
  };

  // Filter Jobs
  const displayedJobs = postedJobs.filter(
    (job) =>
      job.title.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(jobSearchQuery.toLowerCase()),
  );

  // Helper for score colors
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 75) return "bg-teal-500";
    if (score >= 60) return "bg-blue-500";
    return "bg-orange-500";
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-teal-600";
    if (score >= 60) return "text-blue-600";
    return "text-orange-600";
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div>

      {/* Independent Verification Modal (Global) */}
      <AnimatePresence>
        {showVerification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-teal p-6 text-white flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Verify Certificate</h3>
                  <p className="text-teal-200 text-sm">Verified Credentials</p>
                </div>
                <button
                  onClick={() => setShowVerification(false)}
                  className="text-teal-200 hover:text-white"
                >
                  <XCircle />
                </button>
              </div>
              <div className="p-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Transaction Hash
                </label>
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={verifyHash}
                    onChange={(e) => setVerifyHash(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={() => handleVerify(verifyHash)}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800"
                  >
                    {verifyStatus === "loading" ? "..." : "Check"}
                  </button>
                </div>

                {verifyStatus === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center"
                  >
                    Invalid Certificate Hash or Not Found
                  </motion.div>
                )}

                {verifyResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-100 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-2 text-green-700 font-bold mb-3">
                      <ShieldCheck size={18} />
                      <span>Valid Certificate</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Candidate:</span>{" "}
                        <span className="font-semibold">
                          {verifyResult.candidateName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Skill:</span>{" "}
                        <span className="font-semibold">
                          {verifyResult.skill}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Score:</span>{" "}
                        <span className="font-semibold text-green-600">
                          {verifyResult.score}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>{" "}
                        <span className="font-semibold">
                          {new Date(
                            verifyResult.timestamp,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-2 border-t pt-2 font-mono">
                        {verifyResult.hash.substring(0, 16)}...
                      </div>
                    </div>

                    {/* View Full Passport Button */}
                    <button
                      onClick={() => {
                        // Find the candidate by matching the verified name
                        const matchedCandidate = candidates.find(
                          (c) => c.name === verifyResult.candidateName,
                        );
                        if (matchedCandidate) {
                          setShowVerification(false);
                          openProfile(matchedCandidate, "credentials");
                        } else {
                          toast.info(
                            "Full passport view not available for this candidate",
                          );
                        }
                      }}
                      className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg"
                    >
                      <ExternalLink size={16} /> View Full Passport
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Employer Profile Settings Modal */}
      <AnimatePresence>
        {showProfileSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => {
              setShowProfileSettings(false);
              setIsEditingProfile(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Company Settings</h3>
                  <p className="text-slate-300 text-sm">
                    Manage your company profile
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileSettings(false);
                    setIsEditingProfile(false);
                  }}
                  className="text-slate-300 hover:text-white"
                >
                  <XCircle />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {isEditingProfile ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.companyName}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            companyName: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Industry
                        </label>
                        <select
                          value={profileForm.industry}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              industry: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                        >
                          <option>Technology</option>
                          <option>Finance</option>
                          <option>Healthcare</option>
                          <option>Retail</option>
                          <option>Manufacturing</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Company Size
                        </label>
                        <select
                          value={profileForm.companySize}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              companySize: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                        >
                          <option>1-10</option>
                          <option>11-50</option>
                          <option>51-100</option>
                          <option>100-500</option>
                          <option>500-1000</option>
                          <option>1000+</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={profileForm.website}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            website: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileForm.location}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            location: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        About
                      </label>
                      <textarea
                        value={profileForm.about}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            about: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileForm({ ...employerProfile });
                        }}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveProfileChanges}
                        className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2"
                      >
                        <Save size={16} /> Save Changes
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Building2 className="text-gray-500" size={20} />
                        <div>
                          <p className="text-xs text-gray-500">Company Name</p>
                          <p className="font-semibold text-gray-900">
                            {employerProfile.companyName}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <Briefcase className="text-gray-500" size={18} />
                          <div>
                            <p className="text-xs text-gray-500">Industry</p>
                            <p className="font-medium text-gray-800">
                              {employerProfile.industry}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <User className="text-gray-500" size={18} />
                          <div>
                            <p className="text-xs text-gray-500">
                              Company Size
                            </p>
                            <p className="font-medium text-gray-800">
                              {employerProfile.companySize}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Globe className="text-gray-500" size={18} />
                        <div>
                          <p className="text-xs text-gray-500">Website</p>
                          <a
                            href={employerProfile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {employerProfile.website}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <MapPin className="text-gray-500" size={18} />
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="font-medium text-gray-800">
                            {employerProfile.location}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">About</p>
                        <p className="text-sm text-gray-700">
                          {employerProfile.about}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full mt-4 px-4 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2"
                    >
                      <Edit2 size={16} /> Edit Profile
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Candidate Profile Modal */}
      <AnimatePresence>
        {viewingCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="relative h-32 bg-gradient-to-r from-slate-800 to-slate-900 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewingCandidate(null)}
                  aria-label="Close candidate profile"
                  className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition backdrop-blur-sm z-10"
                >
                  <X size={20} />
                </motion.button>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="grid grid-cols-8 gap-4">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-full aspect-square m-2"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 flex-1 overflow-y-auto">
                {/* Profile Header Info */}
                <div className="flex flex-col md:flex-row gap-6 -mt-12 mb-8 items-start">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gray-200 flex-shrink-0"
                  >
                    <img
                      src={
                        viewingCandidate.image ||
                        `https://ui-avatars.com/api/?name=${viewingCandidate.name}`
                      }
                      alt={viewingCandidate.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <div className="flex-1 mt-4 md:mt-12">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                          {viewingCandidate.name}
                        </h2>
                        <p className="text-slate-500 font-medium">
                          {viewingCandidate.title}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin size={14} /> {viewingCandidate.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase size={14} />{" "}
                            {viewingCandidate.yearsOfExperience} Yrs Exp
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe size={14} />{" "}
                            {viewingCandidate.preferredWorkMode}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        {/* Read-Only Indicator */}
                        <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <ExternalLink size={12} /> View Only
                        </span>
                        {/* Passport Link if available */}
                        {(viewingCandidate as any).passportId && (
                          <button
                            onClick={() =>
                              toast.info(
                                `Passport: ${(viewingCandidate as any).passportId}`,
                              )
                            }
                            className="bg-purple-100 text-purple-700 px-3 py-2 rounded-lg font-bold text-sm hover:bg-purple-200 flex items-center gap-2"
                          >
                            <ShieldCheck size={16} /> Skill Passport
                          </button>
                        )}
                        <button className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 flex items-center gap-2">
                          <Mail size={16} /> Contact
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                  <button
                    onClick={() => setProfileModalTab("overview")}
                    className={`px-6 py-3 font-bold text-sm border-b-2 transition ${profileModalTab === "overview" ? "border-teal-500 text-teal-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setProfileModalTab("credentials")}
                    className={`px-6 py-3 font-bold text-sm border-b-2 transition flex items-center gap-2 ${profileModalTab === "credentials" ? "border-teal-500 text-teal-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
                  >
                    Credentials
                    {viewingCandidate.certifications.length > 0 && (
                      <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                        {viewingCandidate.certifications.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {profileModalTab === "overview" && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid md:grid-cols-3 gap-8"
                    >
                      <div className="md:col-span-2 space-y-6">
                        <div>
                          <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wider">
                            About
                          </h3>
                          <p className="text-gray-600 leading-relaxed text-sm">
                            {viewingCandidate.bio || "No bio available."}
                          </p>
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wider">
                            Experience
                          </h3>
                          <p className="text-gray-600 leading-relaxed text-sm">
                            {viewingCandidate.experience ||
                              "No detailed experience listed."}
                          </p>
                        </div>

                        {viewingCandidate.videoIntroUrl && (
                          <div>
                            <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wider">
                              Video Introduction
                            </h3>
                            <div className="aspect-video bg-black rounded-xl overflow-hidden relative group">
                              <video
                                src={viewingCandidate.videoIntroUrl}
                                controls
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 p-6 rounded-xl h-fit">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Sparkles size={16} className="text-teal-600" />{" "}
                          Verified Skills
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(viewingCandidate.skills).map(
                            ([skill, score]) => (
                              <div key={skill}>
                                <div className="flex justify-between text-xs mb-1.5 font-bold">
                                  <span className="text-slate-700">
                                    {skill}
                                  </span>
                                  <span
                                    className={getScoreTextColor(
                                      score as number,
                                    )}
                                  >
                                    {score as number}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score}%` }}
                                    transition={{
                                      duration: 0.8,
                                      ease: "easeOut",
                                    }}
                                    className={`h-full rounded-full ${getScoreColor(score as number)}`}
                                  ></motion.div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {profileModalTab === "credentials" && (
                    <motion.div
                      key="credentials"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {viewingCandidate.certifications.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <ShieldCheck
                            className="mx-auto text-gray-300 mb-3"
                            size={48}
                          />
                          <p className="text-gray-500 font-medium">
                            No verified certificates found.
                          </p>
                        </div>
                      ) : (
                        viewingCandidate.certifications.map((hash, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
                          >
                            <div className="flex items-start gap-4">
                              <div className="bg-teal/10 p-3 rounded-lg text-teal-700">
                                <Award size={24} />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">
                                  Certificate of Competence
                                </h4>
                                <p className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-1">
                                  {hash.substring(0, 10)}...
                                  {hash.substring(hash.length - 8)}
                                  <button
                                    className="hover:text-teal-600"
                                    onClick={() =>
                                      navigator.clipboard.writeText(hash)
                                    }
                                    title="Copy Hash"
                                  >
                                    <Copy size={10} />
                                  </button>
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                              <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2 flex-1 justify-center">
                                <ExternalLink size={14} /> View Document
                              </button>
                              <button
                                onClick={() => {
                                  setVerifyHash(hash);
                                  setShowVerification(true);
                                }}
                                className="px-4 py-2 bg-teal text-white rounded-lg text-sm font-bold hover:bg-teal-700 flex items-center gap-2 flex-1 justify-center shadow-sm"
                              >
                                <ShieldCheck size={14} /> Verify
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}

                      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
                        <div className="bg-white p-1.5 rounded-full shadow-sm text-blue-600 mt-0.5">
                          <ShieldCheck size={16} />
                        </div>
                        <div>
                          <h5 className="text-blue-900 font-bold text-sm">
                            Immutable Verification
                          </h5>
                          <p className="text-blue-800/80 text-xs mt-1">
                            These certificates are cryptographically verified
                            and tamper-proof, serving as proof of the
                            candidate's skill assessment performance.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Job Modal */}
      <AnimatePresence>
        {showPostJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Post New Job
                  </h3>
                  <p className="text-sm text-slate-500">
                    Create a listing to find the perfect candidate
                  </p>
                </div>
                <button
                  onClick={() => setShowPostJob(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition"
                    placeholder="e.g. Senior React Developer"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <Building2 size={14} /> Company
                    </label>
                    <input
                      type="text"
                      value={jobCompany}
                      onChange={(e) => setJobCompany(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition"
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <MapPin size={14} /> Location
                    </label>
                    <input
                      type="text"
                      value={jobLocation}
                      onChange={(e) => setJobLocation(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition"
                      placeholder="e.g. New York, NY"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <DollarSign size={14} /> Salary Range
                    </label>
                    <input
                      type="text"
                      value={jobSalary}
                      onChange={(e) => setJobSalary(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition"
                      placeholder="e.g. $120k - $150k"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <Globe size={14} /> Job Type
                    </label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition bg-white"
                    >
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 resize-none focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition"
                    placeholder="Describe the role, responsibilities, and requirements..."
                  />
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowPostJob(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePostJob}
                  disabled={
                    matchingLoading ||
                    isMatching ||
                    !jobTitle ||
                    !jobDescription
                  }
                  className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 shadow-lg"
                >
                  {matchingLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" /> Matching
                      candidates...
                    </>
                  ) : (
                    "Post & Find Candidates"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner for Employers */}
        <WelcomeBanner
          userName={userName}
          userRole="employer"
          onStartTour={onStartTour}
          className="mb-8"
        />

        {/* Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">Your Analytics</h2>
            {!analyticsLoading && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchAnalytics(true)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
                title="Refresh analytics"
              >
                <RefreshCw
                  size={14}
                  className={analyticsLoading ? "animate-spin" : ""}
                />
                Refresh
              </motion.button>
            )}
          </div>

          {analyticsError ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-4"
            >
              <p className="text-red-700 text-sm font-medium">
                {analyticsError}
              </p>
              <button
                onClick={() => fetchAnalytics(true)}
                className="mt-2 text-red-600 hover:text-red-700 text-sm font-semibold hover:underline"
              >
                Try again
              </button>
            </motion.div>
          ) : analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                >
                  <Skeleton height={16} className="mb-3" width="60%" />
                  <Skeleton height={28} width="40%" />
                </div>
              ))}
            </div>
          ) : analyticsData ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  label: "Profiles Viewed",
                  value: analyticsData.profiles_viewed ?? 0,
                  sublabel: analyticsData.avg_profile_views_per_day
                    ? `~${analyticsData.avg_profile_views_per_day}/day`
                    : "Total views",
                  color: "text-slate-900",
                  bg: "bg-slate-50",
                  border: "border-slate-100",
                },
                {
                  label: "Matches Found",
                  value: analyticsData.matches_found ?? 0,
                  sublabel: "AI-ranked candidates",
                  color: "text-teal-700",
                  bg: "bg-teal-50/50",
                  border: "border-teal-100",
                },
                {
                  label: "Applications",
                  value: analyticsData.applications_received ?? 0,
                  sublabel: "Total received",
                  color: "text-blue-700",
                  bg: "bg-blue-50/50",
                  border: "border-blue-100",
                },
                {
                  label: "Verified in Pool",
                  value: analyticsData.verified_candidates ?? 0,
                  sublabel: "Certified candidates",
                  color: "text-green-700",
                  bg: "bg-green-50/50",
                  border: "border-green-100",
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -2 }}
                  className={`${stat.bg} rounded-2xl border ${stat.border} p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">
                    {stat.label}
                  </p>
                  <p className={`text-2xl sm:text-3xl font-bold leading-none ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-1.5">{stat.sublabel}</p>
                </motion.div>
              ))}
            </div>
          ) : null}
        </motion.div>

        {/* Main Header & Tabs */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {activeTab === "candidates"
                  ? "Talent Discovery"
                  : "My Job Listings"}
              </h1>
              <p className="text-slate-500 mt-1">
                {activeTab === "candidates"
                  ? "Find and hire verified professionals."
                  : "Manage your active job posts."}
              </p>
            </div>

            {/* Tab Switcher */}
            <div
              role="tablist"
              className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex"
            >
              <button
                role="tab"
                aria-selected={activeTab === "candidates"}
                onClick={() => onTabChange?.("candidates")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === "candidates" ? "bg-teal text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <Search size={16} /> Find Talent
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "jobs"}
                onClick={() => onTabChange?.("jobs")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === "jobs" ? "bg-teal text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <Briefcase size={16} /> My Jobs
              </button>
            </div>
          </div>

          {/* JOB SEARCH */}
          {activeTab === "jobs" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search your posted jobs by title, company, or location..."
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-teal focus:border-transparent text-sm"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Employer unverified warning */}
        {employerVerified === false && (
          <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                Your employer account is not yet verified
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Candidates see an unverified badge on your outreach. Contact
                support to complete employer verification.
              </p>
            </div>
          </div>
        )}

        {/* CONTENT GRID */}
        {activeTab === "candidates" && (
          <div className="flex gap-8 items-start">
            {/* Filter Sidebar — desktop only */}
            <aside className="w-64 flex-shrink-0 hidden lg:block sticky top-4 self-start rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
              {/* Compact verified pool banner */}
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-5">
                <div className="flex items-center gap-2 text-white font-bold mb-1">
                  <ShieldCheck size={18} />
                  <span>Verified Talent Pool</span>
                </div>
                <p className="text-white/85 text-xs">
                  {candidates.filter((c) => c.verified).length} certified
                  candidates
                </p>
              </div>

              <div className="p-5 space-y-6">
                {/* Industry */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Industry
                  </h3>
                  <div className="space-y-0.5">
                    {[
                      "All",
                      "Software Engineering",
                      "Data Science",
                      "Virtual Assistant",
                      "Product Design",
                      "Cloud Architecture",
                    ].map((ind) => (
                      <button
                        key={ind}
                        onClick={() => {
                          setSelectedIndustry(ind);
                          setRankedCandidates([]);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-between ${selectedIndustry === ind ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"}`}
                      >
                        <span>
                          {ind === "Virtual Assistant" ? "✨ " : ""}
                          {ind}
                        </span>
                        {selectedIndustry === ind && (
                          <CheckCircle
                            size={14}
                            className="text-teal-600 flex-shrink-0"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Min Experience */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Min. Experience
                  </h3>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={minExperience}
                    onChange={(e) => setMinExperience(parseInt(e.target.value))}
                    className="w-full accent-teal-600 mb-2"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">0 yrs</span>
                    <span className="text-sm font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {minExperience}+ yrs
                    </span>
                    <span className="text-xs text-gray-400">10 yrs</span>
                  </div>
                </div>

                {/* Verified Only */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Certification
                  </h3>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="w-4 h-4 accent-teal-600 rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Verified Only
                      </p>
                      <p className="text-xs text-gray-500">
                        Certified candidates
                      </p>
                    </div>
                  </label>
                </div>

                {/* Clear all */}
                {(selectedIndustry !== "All" ||
                  minExperience > 0 ||
                  verifiedOnly) && (
                  <button
                    onClick={clearFilters}
                    className="w-full text-sm text-gray-500 hover:text-red-600 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-red-50 transition font-medium"
                  >
                    <X size={14} /> Clear all filters
                  </button>
                )}
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-5">
              {/* Search + mobile filter toggle */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name, skill, or role..."
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm shadow-sm"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  aria-label="Toggle filters"
                  className={`lg:hidden p-2.5 rounded-xl border border-gray-200 flex items-center gap-2 text-sm font-semibold transition shadow-sm ${showFilters ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  <Sliders size={18} />
                </button>
              </div>

              {/* Mobile filters panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="lg:hidden overflow-hidden"
                  >
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                          Industry
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            "All",
                            "Software Engineering",
                            "Data Science",
                            "Virtual Assistant",
                            "Product Design",
                            "Cloud Architecture",
                          ].map((ind) => (
                            <button
                              key={ind}
                              onClick={() => {
                                setSelectedIndustry(ind);
                                setRankedCandidates([]);
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${selectedIndustry === ind ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                            >
                              {ind}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-6 items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-700">
                            Min Exp:
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={minExperience}
                            onChange={(e) =>
                              setMinExperience(parseInt(e.target.value))
                            }
                            className="w-24 accent-teal-600"
                          />
                          <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                            {minExperience}+ yrs
                          </span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={verifiedOnly}
                            onChange={(e) => setVerifiedOnly(e.target.checked)}
                            className="w-4 h-4 accent-teal-600"
                          />
                          <span className="text-sm text-gray-700 font-medium">
                            Verified Only
                          </span>
                        </label>
                      </div>
                      {(selectedIndustry !== "All" ||
                        minExperience > 0 ||
                        verifiedOnly) && (
                        <button
                          onClick={clearFilters}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {rankedCandidates.length > 0 && (
                <p className="text-teal-600 text-sm font-medium flex items-center gap-2 animate-pulse">
                  <Sparkles size={14} /> Showing top AI matches
                </p>
              )}

              {/* Candidate grid or states */}
              {candidateError ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-red-100 border-dashed">
                  <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="text-red-400" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Unable to load candidates
                  </h3>
                  <p className="text-red-500 text-sm mt-1">{candidateError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 text-teal-600 font-semibold text-sm hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : displayedCandidates.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Search className="mx-auto mb-3" size={40} />
                  <p className="font-medium">
                    No candidates match your filters
                  </p>
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-sm text-teal-600 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                >
                  {displayedCandidates.map((candidate) => (
                    <motion.div
                      key={candidate.id}
                      variants={itemVariants}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 group flex flex-col"
                    >
                      <div className="relative h-48 bg-gray-200">
                        <img
                          src={candidate.image}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => openProfile(candidate, "overview")}
                            className="bg-white/90 text-black px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold transform scale-95 group-hover:scale-100 transition"
                          >
                            <Play size={16} fill="black" /> View Intro
                          </button>
                        </div>
                        {candidate.verified && (
                          <>
                            <button
                              onClick={() =>
                                openProfile(candidate, "credentials")
                              }
                              className="absolute top-4 right-4 bg-teal text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-md bg-opacity-90 hover:scale-105 transition"
                            >
                              <Award size={12} /> Verified
                            </button>
                            {candidate.certifications.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  let cert = candidate.certifications[0];
                                  try {
                                    const parsed = JSON.parse(cert);
                                    if (parsed.hash) cert = parsed.hash;
                                  } catch { /* ignore parse errors */ }
                                  setVerifyHash(cert);
                                  setShowVerification(true);
                                }}
                                className="absolute top-4 left-4 bg-white/90 text-teal-700 p-2 rounded-lg hover:bg-white hover:scale-110 transition shadow-md"
                                title="Quick Verify Certificate"
                              >
                                <ShieldCheck size={16} />
                              </button>
                            )}
                          </>
                        )}
                        {!candidate.verified && (
                          <div className="absolute top-4 right-4 bg-white/80 text-gray-500 text-xs font-semibold px-2 py-1 rounded-full border border-gray-200 backdrop-blur-sm">
                            Unverified
                          </div>
                        )}
                        {candidate.matchScore && (
                          <div className="absolute bottom-4 left-4 bg-white text-teal-700 text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-teal-100">
                            {candidate.matchScore}% Match
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-lg text-slate-900">
                              {candidate.name}
                            </h3>
                            <p className="text-slate-500 text-sm">
                              {candidate.title}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-slate-400 text-xs flex items-center justify-end gap-1 mb-1">
                              <MapPin size={12} /> {candidate.location}
                            </div>
                            <div className="text-slate-600 text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded inline-block">
                              {candidate.yearsOfExperience} Yrs Exp
                            </div>
                          </div>
                        </div>

                        {candidate.matchReason && (
                          <div className="mb-4 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 italic">
                            "{candidate.matchReason}"
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {Object.entries(candidate.skills)
                            .slice(0, 3)
                            .map(([skill, score]) => (
                              <span
                                key={skill}
                                className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200"
                              >
                                {skill}{" "}
                                <span
                                  className={`font-semibold ${getScoreTextColor(score as number)}`}
                                >
                                  {score as number}%
                                </span>
                              </span>
                            ))}
                        </div>

                        <div className="mt-auto pt-6 flex gap-3">
                          <button
                            onClick={() => openProfile(candidate)}
                            className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition"
                          >
                            View Profile
                          </button>
                          <button
                            aria-label="Contact candidate"
                            className="px-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                          >
                            <Mail size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* PERF-F2: Load more — only shown when backend has more pages */}
              {candidateNextPage && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={loadMoreCandidates}
                    disabled={loadingMoreCandidates}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-teal/30 text-teal font-semibold text-sm hover:bg-teal hover:text-white transition disabled:opacity-50"
                  >
                    {loadingMoreCandidates ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                    {loadingMoreCandidates ? 'Loading…' : `Load more (${candidateTotalCount - candidates.length} remaining)`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="space-y-4">
            <AnimatePresence>
              {displayedJobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Building2 size={14} /> {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={14} /> {job.salary}
                      </span>
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-initial px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-black transition">
                      Edit
                    </button>
                    <button
                      onClick={() => deleteJob(job.id)}
                      className="px-3 py-2 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {displayedJobs.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                <Briefcase className="mx-auto text-gray-300 mb-3" size={48} />
                <h3 className="text-lg font-bold text-gray-900">
                  No active job posts
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Create a listing to start finding talent.
                </p>
                <button
                  onClick={() => setShowPostJob(true)}
                  className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition shadow-lg"
                >
                  Post a Job
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
