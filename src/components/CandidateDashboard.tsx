import React, { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import { Code, Award, TrendingUp, Briefcase, MapPin, User, Play, Plus, Sparkles, CheckCircle, Loader, ArrowRight, Video, X, Bookmark, Star, Mic, Share2, Shield, ExternalLink, Eye, History, Search, Zap, Target, Home } from 'lucide-react';
import { CandidateProfile, RecommendedCertification, Job } from '../types';
import { getCareerRecommendations } from '../services/geminiService';
import { notificationService } from '../services/notificationService';
import { NotificationBell } from './NotificationBell';
import { MockInterview } from './MockInterview';
import { WelcomeBanner } from './WelcomeBanner';
import { AssessmentHistory } from './AssessmentHistory';
import { useToast } from '../lib/toast';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load SkillPassport for performance
const SkillPassport = lazy(() => import('./SkillPassport').then(m => ({ default: m.SkillPassport })));
import { api } from '../lib/api';
import { generatePassport, getCandidateProfile } from '../services/profileService';
import { calcCompletion } from './ProfilePage';
import { hasPassedAnyAssessment, getSkillAttemptCount, canGeneratePassport, getTotalAssessmentCount, MIN_PASSPORT_SESSIONS } from '../services/assessmentHistoryService';


interface CandidateDashboardProps {
   candidate: CandidateProfile;
   onStartAssessment: (skill?: string) => void;
   onLogout: () => void;
   onUpdateProfile: (profile: Partial<CandidateProfile>) => void;
   onOpenVideoAnalyzer?: () => void;
   onStartTour?: () => void;
   onNavigateProfile?: () => void;
}

const AVAILABLE_ASSESSMENTS = {
   // Tech — Core Engineering
   'Frontend Development': ['React', 'Vue', 'Angular', 'CSS / Tailwind', 'TypeScript', 'Next.js'],
   'Backend Development': ['Node.js', 'Python', 'Java', 'Go', 'Django / FastAPI', 'REST API Design'],
   'Mobile Development': ['React Native', 'Flutter', 'iOS (Swift)', 'Android (Kotlin)', 'Expo'],
   'Cloud & DevOps': ['AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD Pipelines'],
   'Software Engineering': ['System Design', 'Data Structures & Algorithms', 'Microservices', 'Security Best Practices'],
   'Developer Relations': ['Technical Writing', 'API Documentation', 'Community Management', 'Developer Advocacy'],

   // Operations & Support
   'Virtual Assistant': ['Executive Virtual Assistant', 'Administrative VA', 'Research & Data VA', 'Calendar & Email Management', 'Client Onboarding VA'],
   'Customer Service': ['Customer Support Representative', 'Call Center Agent', 'Help Desk / IT Support', 'Client Success Manager', 'Live Chat Support'],
   'E-Commerce': ['Shopify Management', 'Amazon Seller Central', 'Product Listing Optimization', 'Order Fulfilment & Logistics', 'Customer Returns Handling'],

   // Sales & Growth
   'Sales': ['Sales Development Representative (SDR)', 'Account Executive', 'Business Development', 'Lead Generation', 'Cold Outreach / Email Sales'],
   'Digital Marketing': ['Social Media Management', 'SEO & SEM', 'Content Creation & Strategy', 'Email Marketing', 'Paid Advertising (Meta/Google)', 'Influencer Marketing'],

   // Management & Soft Skills
   'Project Management': ['Project Manager', 'Scrum Master / Agile', 'Operations Manager', 'Program Coordinator'],
   'HR & Recruiting': ['HR Coordinator', 'Talent Sourcing', 'Technical Recruiter', 'Onboarding Specialist'],
   'Communication': ['Public Speaking', 'Presentation Skills', 'Business Writing', 'Negotiation', 'Active Listening'],
   'Office Productivity': ['Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Google Workspace', 'Notion / Airtable'],
};

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ candidate, onStartAssessment, onLogout, onUpdateProfile, onOpenVideoAnalyzer, onStartTour, onNavigateProfile }) => {
   const toast = useToast();

   // Profile completion % — shared with ProfilePage so both views agree
   const profileCompletion = calcCompletion(
      {
         bio: candidate.bio,
         title: candidate.title,
         location: candidate.location,
         years_of_experience: candidate.yearsOfExperience,
         preferred_work_mode: candidate.preferredWorkMode,
         avatar: candidate.image,
      } as Record<string, unknown>,
      'candidate'
   );

   // A profile is "ready" once at least title, bio and one skill are filled
   const isProfileComplete = (): boolean => {
      const hasTitle = !!candidate.title && candidate.title !== 'Candidate';
      const hasBio = !!(candidate.bio && candidate.bio.trim());
      const hasSkills = !!(candidate.skills && Object.keys(candidate.skills).length > 0);
      return hasTitle && hasBio && hasSkills;
   };

   const handleApplyNow = (jobTitle: string, company: string) => {
      if (!isProfileComplete()) {
         toast.warning('Please complete your profile before applying — add your title, bio, and at least one skill.');
         onNavigateProfile?.();
         return;
      }
      window.open(`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(jobTitle + ' ' + company)}`, '_blank');
   };

   const [activeTab, setActiveTab] = useState<'overview' | 'interview' | 'history'>('overview');
   const [searchQuery, setSearchQuery] = useState(''); // Search state
   const [recommendations, setRecommendations] = useState<{
      certifications: RecommendedCertification[];
      jobs: Job[];
   } | null>(null);
   const [loadingRecommendations, setLoadingRecommendations] = useState(false);
   const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

   // Filter assessments based on search query
   const filteredAssessments = useMemo(() => {
      if (!searchQuery.trim()) return AVAILABLE_ASSESSMENTS;

      const query = searchQuery.toLowerCase();
      const filtered: Record<string, string[]> = {};

      Object.entries(AVAILABLE_ASSESSMENTS).forEach(([category, skills]) => {
         const matchingSkills = skills.filter(skill =>
            skill.toLowerCase().includes(query)
         );

         // Also include category if category name matches
         const categoryMatches = category.toLowerCase().includes(query);

         if (matchingSkills.length > 0 || categoryMatches) {
            filtered[category] = categoryMatches ? skills : matchingSkills;
         }
      });

      return filtered;
   }, [searchQuery]);

   // Skill Passport State
   const [isGeneratingPassport, setIsGeneratingPassport] = useState(false);
   const [passportData, setPassportData] = useState<{ txHash: string; passportId: string } | null>(null);
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
      api.get('/users/me/statistics/')
         .then(setUserStats)
         .catch(err => console.error('Failed to fetch user stats:', err));
   }, [candidate.id]);

   // Sync fresh profile data from backend on every dashboard mount so the
   // completion bar and profile card always reflect the actual saved state.
   useEffect(() => {
      getCandidateProfile().then((fresh) => {
         if (fresh) {
            onUpdateProfile(fresh as Partial<CandidateProfile>);
         }
      }).catch(() => {/* silently ignore — stale local data is acceptable fallback */});
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const fetchRecommendations = async () => {
      setLoadingRecommendations(true);
      setRecommendationsError(null);
      try {
         const result = await getCareerRecommendations(candidate.skills);
         setRecommendations(result);
      } catch (err) {
         console.error('Failed to fetch career recommendations:', err);
         setRecommendationsError('Failed to load recommendations. Please try again.');
      } finally {
         setLoadingRecommendations(false);
      }
   };

   // Generate Skill Passport
   const handleGeneratePassport = async () => {
      if (!canGeneratePassport(candidate.id)) {
         const count = getTotalAssessmentCount(candidate.id);
         const remaining = MIN_PASSPORT_SESSIONS - count;
         toast.warning(`Complete ${remaining} more assessment session${remaining !== 1 ? 's' : ''} to unlock your Skill Passport (${count}/${MIN_PASSPORT_SESSIONS} done).`);
         return;
      }

      if (!hasPassedAnyAssessment(candidate.id)) {
         toast.warning("You need to pass at least one assessment before minting your Skill Passport.");
         return;
      }

      setIsGeneratingPassport(true);
      try {
         const result = await generatePassport();
         if (!result) throw new Error('No result from server');
         setPassportData(result);
         toast.success("🎉 Skill Passport generated successfully!");
         onUpdateProfile({
            certifications: [...(candidate.certifications || []), result.txHash],
            passportId: result.passportId,
         });
      } catch (error) {
         toast.error("Failed to generate passport. Please try again.");
         console.error(error);
      } finally {
         setIsGeneratingPassport(false);
      }
   };

   // Share Passport
   const handleSharePassport = () => {
      const passportId = passportData?.passportId || (candidate as any).passportId;
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
      if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
      if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
      return 'text-orange-600 bg-orange-50 border-orange-200';
   };

   const getMatchLabel = (score: number) => {
      if (score >= 90) return "Excellent Match";
      if (score >= 75) return "Strong Match";
      return "Potential Match";
   };

   // Animation Variants
   const containerVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
   };

   const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
   };

   return (
      <div className="min-h-screen bg-cream font-sans pb-16 sm:pb-0">
         {/* Mobile Bottom Navigation */}
         <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex sm:hidden">
            {[
               { icon: <Home size={20} />, label: 'Home', tab: 'overview' as const },
               { icon: <Mic size={20} />, label: 'Interview', tab: 'interview' as const },
               { icon: <History size={20} />, label: 'Progress', tab: 'history' as const },
            ].map(item => (
               <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition ${activeTab === item.tab ? 'text-orange' : 'text-gray-400'}`}
               >
                  {item.icon}
                  {item.label}
               </button>
            ))}
         </nav>
         {/* Header */}
         <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-4 sticky top-0 z-30 shadow-md"
         >
            <div className="max-w-7xl mx-auto flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <div className="bg-black text-white p-1.5 rounded-full">
                     <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                        <div className="bg-white rounded-full"></div>
                        <div className="bg-white rounded-full"></div>
                        <div className="bg-white rounded-full"></div>
                        <div className="bg-white rounded-full"></div>
                     </div>
                  </div>
                  <span className="font-bold text-xl hidden md:inline">lune <span className="text-gray-400 font-normal">| Candidate</span></span>
                  <span className="font-bold text-xl md:hidden">lune</span>
               </div>
               <div className="flex items-center gap-4">
                  {/* Notification Bell */}
                  <NotificationBell userId={candidate.id} />

                  <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                     Open for Work
                  </div>
                  <button onClick={onLogout} className="text-sm font-medium text-gray-600 hover:text-red-600 transition">Log out</button>
                  <button
                    onClick={onNavigateProfile}
                    title="View Profile"
                    className="w-8 h-8 bg-orange rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md shadow-orange/20 hover:ring-2 hover:ring-orange/50 transition"
                  >
                     {candidate.image
                       ? <img src={candidate.image} alt={candidate.name} className="w-full h-full rounded-full object-cover" />
                       : candidate.name.substring(0, 2).toUpperCase()
                     }
                  </button>
               </div>
            </div>
         </motion.header>

         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Welcome Banner */}
            <WelcomeBanner
               userName={candidate.name}
               userRole="candidate"
               onStartTour={onStartTour}
               onCompleteProfile={onNavigateProfile}
               className="mb-0"
            />

            {/* Stats Overview */}
            {userStats && (
               <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
               >
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-orange/30 transition-shadow group">
                     <div className="bg-orange/10 p-3.5 rounded-xl text-orange">
                        <Target size={24} />
                     </div>
                     <div>
                        <div className="text-3xl font-bold text-slate-900">{userStats.total_assessments}</div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Attempts</div>
                     </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-orange/30 transition-shadow group">
                     <div className="bg-teal/10 p-3.5 rounded-xl text-teal">
                        <Award size={24} />
                     </div>
                     <div>
                        <div className="text-3xl font-bold text-slate-900">{userStats.passed_assessments}</div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Certifications</div>
                     </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-orange/30 transition-shadow group">
                     <div className="bg-purple-100 p-3.5 rounded-xl text-purple-600">
                        <TrendingUp size={24} />
                     </div>
                     <div>
                        <div className="text-3xl font-bold text-slate-900">{userStats.total_points.toLocaleString()}</div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Points</div>
                     </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-orange/30 transition-shadow group">
                     <div className="bg-red-100 p-3.5 rounded-xl text-red-500">
                        <Zap size={24} />
                     </div>
                     <div>
                        <div className="text-3xl font-bold text-slate-900">{userStats.current_streak} Day{userStats.current_streak !== 1 ? 's' : ''}</div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Streak (Best: {userStats.longest_streak})</div>
                     </div>
                  </div>
               </motion.div>
            )}

            <motion.div
               variants={containerVariants}
               initial="hidden"
               animate="visible"
               className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
               {/* Left Sidebar: Verified Skills + Skill Passport */}
               <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">

                  {/* Profile Summary Card */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                     <div className="flex items-center gap-4 mb-4">
                        {/* Avatar */}
                        <button
                           onClick={onNavigateProfile}
                           className="w-14 h-14 rounded-2xl bg-orange flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange/20 hover:ring-2 hover:ring-orange/40 transition"
                           title="Edit profile"
                        >
                           {candidate.image
                              ? <img src={candidate.image} alt={candidate.name} className="w-full h-full object-cover" />
                              : candidate.name.substring(0, 2).toUpperCase()
                           }
                        </button>
                        <div className="min-w-0">
                           <p className="font-bold text-slate-900 truncate">{candidate.name}</p>
                           <p className="text-xs text-slate-500 truncate">
                              {candidate.title && candidate.title !== 'Candidate' ? candidate.title : 'Add your title'}
                           </p>
                           {candidate.location && (
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                 <MapPin size={10} />{candidate.location}
                              </p>
                           )}
                        </div>
                     </div>

                     {/* Profile Completion Bar */}
                     <div>
                        <div className="flex justify-between text-xs mb-1.5">
                           <span className="font-semibold text-gray-600">Profile completion</span>
                           <span className={`font-bold ${profileCompletion >= 80 ? 'text-teal' : profileCompletion >= 50 ? 'text-orange' : 'text-red-500'}`}>
                              {profileCompletion}%
                           </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                           <motion.div
                              initial={{ width: "0%" }}
                              animate={{ width: `${profileCompletion}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                              className={`h-full rounded-full ${
                                 profileCompletion >= 80 ? 'bg-teal' :
                                 profileCompletion >= 50 ? 'bg-orange' : 'bg-red-400'
                              }`}
                           />
                        </div>
                        {profileCompletion < 100 && (
                           <button
                              onClick={onNavigateProfile}
                              className="mt-2 text-xs text-teal font-semibold hover:underline"
                           >
                              {profileCompletion === 0 ? 'Set up your profile →' : 'Complete your profile →'}
                           </button>
                        )}
                     </div>
                  </div>

                  {/* Verified Skills Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><Award className="text-teal-600" size={20} /> Verified Skills</h3>
                     </div>
                     <div className="space-y-4 mb-6">
                        {Object.entries(candidate.skills).map(([skill, score]) => {
                           const pct = Math.min(100, Math.max(0, Math.round(score as number)));
                           return (
                           <div key={`${skill}-${pct}`} className={pct >= 80 ? 'ring-1 ring-teal-100 rounded-xl p-2 -mx-2' : ''}>
                              <div className="flex justify-between text-xs mb-1.5">
                                 <span className="font-medium text-slate-700">{skill}</span>
                                 <span className={`font-bold ${pct >= 80 ? 'text-green-600' : 'text-slate-600'}`}>{pct}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                                 <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full rounded-full ${pct >= 80 ? 'bg-gradient-to-r from-teal-500 to-emerald-400' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
                                 />
                              </div>
                           </div>
                           );
                        })}
                        {Object.keys(candidate.skills).length === 0 && (
                           <p className="text-xs text-gray-400 italic">No skills verified yet.</p>
                        )}
                     </div>

                     <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                           <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available Assessments</h4>
                        </div>

                        {/* Search Box */}
                        <div className="mb-4">
                           <div className="relative">
                              <input
                                 type="text"
                                 value={searchQuery}
                                 onChange={(e) => setSearchQuery(e.target.value)}
                                 placeholder="Search for skills or categories..."
                                 className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition"
                              />
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                              {searchQuery && (
                                 <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                    aria-label="Clear search"
                                 >
                                    <X size={16} />
                                 </button>
                              )}
                           </div>
                           {searchQuery && (
                              <p className="text-xs text-gray-500 mt-2">
                                 {Object.keys(filteredAssessments).length === 0
                                    ? 'No results found'
                                    : `Found ${Object.values(filteredAssessments).flat().length} skill(s)`
                                 }
                              </p>
                           )}
                        </div>

                        {/* Results */}
                        {Object.keys(filteredAssessments).length > 0 ? (
                           <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                              {Object.entries(filteredAssessments).map(([category, skills]: [string, string[]]) => (
                                 <div key={category}>
                                    <h5 className="text-xs font-bold text-slate-800 mb-2">{category}</h5>
                                    <div className="flex flex-wrap gap-2">
                                       {skills.map(skill => {
                                          const attempts = getSkillAttemptCount(candidate.id, skill);
                                          const maxed = attempts >= 3;
                                          return (
                                          <motion.button
                                             key={skill}
                                             whileHover={!maxed ? { scale: 1.05, backgroundColor: "#000", color: "#fff", borderColor: "#000" } : {}}
                                             whileTap={!maxed ? { scale: 0.95 } : {}}
                                             onClick={() => onStartAssessment(skill)}
                                             disabled={maxed}
                                             title={maxed ? 'Maximum 3 attempts reached' : `${3 - attempts} attempt(s) remaining`}
                                             className={`px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium transition ${maxed ? 'opacity-40 cursor-not-allowed text-gray-400' : 'text-gray-600'}`}
                                          >
                                             {skill}{attempts > 0 ? ` (${attempts}/3)` : ''}
                                          </motion.button>
                                          );
                                       })}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="text-center py-8">
                              <p className="text-sm text-gray-500">No assessments match your search.</p>
                              <button
                                 onClick={() => setSearchQuery('')}
                                 className="mt-2 text-xs text-orange hover:underline"
                              >
                                 Clear search
                              </button>
                           </div>
                        )}
                     </div>

                     {/* Avg Score / Passed quick stats */}
                     <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-4">
                        <div>
                           <div className="text-2xl font-bold text-slate-900">{Math.round(userStats?.average_score || 0)}%</div>
                           <div className="text-xs text-slate-500">Avg. Score</div>
                        </div>
                        <div>
                           <div className="text-2xl font-bold text-slate-900">{userStats?.passed_assessments || candidate.certifications.length}</div>
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
                              <p className="text-orange-100 text-xs">Verified credentials</p>
                           </div>
                        </div>

                        {passportData || (candidate as any).passportId ? (
                           <div className="space-y-3">
                              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                                 <div className="text-xs text-orange-200 mb-1">Passport ID</div>
                                 <div className="font-mono text-sm font-bold truncate">
                                    {passportData?.passportId || (candidate as any).passportId}
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
                                  Generate your verified skill passport and share with employers.
                               </p>
                              <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={handleGeneratePassport}
                                  disabled={isGeneratingPassport || !canGeneratePassport(candidate.id) || !hasPassedAnyAssessment(candidate.id)}
                                  className="w-full bg-white text-orange px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-50"
                               >
                                  {isGeneratingPassport ? (
                                     <span className="flex items-center gap-2">
                                        <Loader className="animate-spin" size={16} /> Generating Passport...
                                     </span>
                                  ) : (
                                     <span className="flex items-center gap-2">
                                        <Shield size={16} /> Generate Skill Passport
                                     </span>
                                  )}
                               </motion.button>
                              {!canGeneratePassport(candidate.id) && (
                                 <p className="text-orange-200 text-xs text-center">
                                    {getTotalAssessmentCount(candidate.id)}/{MIN_PASSPORT_SESSIONS} sessions completed
                                 </p>
                              )}
                           </div>
                        )}
                     </div>
                  </div>

               </motion.div>

               {/* Right Content */}
               <motion.div variants={itemVariants} className="lg:col-span-8">

                  {/* Tab Navigation */}
                  <div role="tablist" className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-6 gap-1">
                     {[
                        { id: 'overview', label: 'Career Path', icon: <Briefcase size={15} /> },
                        { id: 'interview', label: 'Mock Interview', icon: <Mic size={15} /> },
                        { id: 'history', label: 'Progress', icon: <History size={15} /> },
                     ].map(tab => (
                        <button
                           key={tab.id}
                           role="tab"
                           aria-selected={activeTab === tab.id}
                           onClick={() => setActiveTab(tab.id as any)}
                           className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                              activeTab === tab.id
                                 ? 'bg-orange text-white shadow-sm shadow-orange/30'
                                 : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                           }`}
                        >
                           {tab.icon} {tab.label}
                        </button>
                     ))}
                  </div>

                  <AnimatePresence mode="wait">
                     {activeTab === 'overview' && (
                        <motion.div
                           key="overview"
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: 20 }}
                           transition={{ duration: 0.3 }}
                        >
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
                                       <h2 className="text-2xl font-bold mb-2">Unlock your Career Path</h2>
                                       <p className="text-orange-100 mb-6 max-w-lg">Let our AI analyze your verified skills to suggest the best certifications and job opportunities for you.</p>

                                       {!recommendations ? (
                                          <motion.button
                                             whileHover={{ scale: 1.05 }}
                                             whileTap={{ scale: 0.95 }}
                                             onClick={fetchRecommendations}
                                             disabled={loadingRecommendations}
                                             className="bg-white text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-gray-50 transition flex items-center gap-2 shadow-xl disabled:opacity-80"
                                          >
                                             {loadingRecommendations ? <Loader className="animate-spin" size={18} /> : <Sparkles size={18} className="animate-wiggle" />}
                                             {loadingRecommendations ? 'Analyzing Profile...' : 'Generate Recommendations'}
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

                           {/* Recommendations Error State */}
                           {recommendationsError && !loadingRecommendations && (
                              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
                                 <div className="text-red-500 mt-0.5">
                                    <X size={20} />
                                 </div>
                                 <div className="flex-1">
                                    <p className="text-red-700 font-semibold mb-1">Something went wrong</p>
                                    <p className="text-red-600 text-sm mb-3">{recommendationsError}</p>
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
                                 {[1,2,3].map(i => (
                                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                                 ))}
                              </div>
                           )}

                           {/* Recommendations Content */}
                           {recommendations && !loadingRecommendations && recommendations.jobs.length === 0 && recommendations.certifications.length === 0 && (
                              <div className="text-center py-8 text-gray-400">
                                 <Briefcase className="mx-auto mb-3" size={40} />
                                 <p>No recommendations yet — complete more assessments to unlock personalized matches.</p>
                              </div>
                           )}
                           {recommendations && !loadingRecommendations && (recommendations.jobs.length > 0 || recommendations.certifications.length > 0) && (
                              <motion.div
                                 initial="hidden"
                                 animate="visible"
                                 variants={{
                                    hidden: {},
                                    visible: { transition: { staggerChildren: 0.1 } }
                                 }}
                                 className="space-y-10"
                              >

                                 {/* Recommended Jobs */}
                                 <motion.div variants={itemVariants}>
                                    <h3 className="font-bold text-xl text-slate-900 mb-6 flex items-center gap-2">
                                       <Briefcase className="text-orange" />
                                       Job Matches
                                       <span className="bg-orange-50 text-orange text-xs px-2 py-1 rounded-full font-bold">{recommendations.jobs.length}</span>
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6">
                                       {recommendations.jobs.map((job, i) => (
                                          <motion.div
                                             key={i}
                                             variants={itemVariants}
                                             whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                             className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden"
                                          >
                                             <div className="p-6">
                                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                                   <div className="flex-1">
                                                      <h4 className="font-bold text-xl text-slate-900 group-hover:text-orange transition-colors mb-1">{job.title}</h4>
                                                      <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                                         <Briefcase size={14} />
                                                         <span>{job.company}</span>
                                                      </div>
                                                   </div>

                                                   {/* Match Score Badge */}
                                                   {job.matchScore && (
                                                      <div className={`flex flex-col items-end`}>
                                                         <div className={`px-3 py-1 rounded-full border font-bold text-sm flex items-center gap-1.5 ${getMatchColor(job.matchScore)}`}>
                                                            <Star size={14} fill="currentColor" />
                                                            {job.matchScore}% Match
                                                         </div>
                                                         <span className="text-xs text-slate-400 mt-1 font-medium">{getMatchLabel(job.matchScore)}</span>
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
                                                      <span className="font-sans">$</span> {job.salary}
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
                                                            <h5 className="text-orange-900 font-bold text-sm mb-1">Why this is a great fit</h5>
                                                            <p className="text-sm text-orange-900/80 leading-relaxed">{job.matchReason}</p>
                                                         </div>
                                                      </div>
                                                   </div>
                                                )}

                                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                                   <motion.button
                                                      whileHover={{ scale: 1.02 }}
                                                      whileTap={{ scale: 0.98 }}
                                                      className="flex-1 bg-black text-white py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition"
                                                      onClick={() => handleApplyNow(job.title, job.company)}
                                                   >
                                                      Apply Now
                                                   </motion.button>
                                                   <motion.button
                                                      whileHover={{ scale: 1.1 }}
                                                      whileTap={{ scale: 0.9 }}
                                                      className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
                                                      aria-label="Bookmark job"
                                                      onClick={() => { const key = getJobKey(job); setSavedJobs(prev => { const next = new Set(prev); if (next.has(key)) { next.delete(key); toast.info('Job removed from saved list'); } else { next.add(key); toast.success('Job saved!'); } return next; }); }}
                                                   >
                                                      <Bookmark size={20} fill={savedJobs.has(getJobKey(job)) ? 'currentColor' : 'none'} className={savedJobs.has(getJobKey(job)) ? 'text-orange' : ''} />
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
                                             whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                             className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 flex flex-col h-full group"
                                          >
                                             <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center text-orange mb-4 group-hover:scale-110 transition-transform">
                                                <Award size={24} />
                                             </div>

                                             <h4 className="font-bold text-lg text-slate-900 mb-1 leading-tight">{cert.name}</h4>
                                             <p className="text-xs font-bold text-orange uppercase tracking-wider mb-4">{cert.provider}</p>

                                             <div className="flex-1">
                                                <p className="text-sm text-gray-500 leading-relaxed mb-4">{cert.reason}</p>
                                             </div>

                                             <button className="mt-auto w-full py-2.5 rounded-lg border border-orange-100 text-orange-700 text-sm font-bold hover:bg-orange-50 transition flex items-center justify-center gap-2 group-hover:border-orange-200" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(cert.name + ' ' + cert.provider + ' course')}`, '_blank')}>
                                                Start Learning <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                             </button>
                                          </motion.div>
                                       ))}
                                    </div>
                                 </motion.div>

                              </motion.div>
                           )}

                           {/* Empty State if no recommendations yet */}
                           {!recommendations && !loadingRecommendations && !recommendationsError && (
                              <motion.div
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 transition={{ delay: 0.2 }}
                                 className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50"
                              >
                                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <TrendingUp size={32} className="text-gray-300" />
                                 </div>
                                 <h3 className="text-lg font-bold text-gray-900 mb-2">No recommendations yet</h3>
                                 <p className="text-gray-500 max-w-md mx-auto">Click the "Generate Recommendations" button above to let our AI analyze your profile and find the perfect opportunities.</p>
                              </motion.div>
                           )}
                        </motion.div>
                     )}

                     {activeTab === 'interview' && (
                        <motion.div
                           key="interview"
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.3 }}
                        >
                           <MockInterview candidate={candidate} />
                        </motion.div>
                     )}

                     {activeTab === 'history' && (
                        <motion.div
                           key="history"
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.3 }}
                        >
                           <AssessmentHistory
                              candidateId={candidate.id}
                              onRetakeAssessment={(skill) => onStartAssessment(skill)}
                           />
                        </motion.div>
                     )}
                  </AnimatePresence>
               </motion.div>
            </motion.div>
         </main>

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
                  <Suspense fallback={
                     <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                           <Loader className="w-12 h-12 text-teal animate-spin mx-auto mb-4" />
                           <p className="text-gray-500">Loading Skill Passport…</p>
                        </div>
                     </div>
                  }>
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