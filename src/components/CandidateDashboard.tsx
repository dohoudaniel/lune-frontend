import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Code, Award, TrendingUp, Briefcase, MapPin, User, Play, Plus, Sparkles, CheckCircle, Loader, ArrowRight, Video, X, Upload, Edit2, Save, Bookmark, Star, Mic, Globe, Clock, Share2, Shield, ExternalLink, Eye, History, Search, Zap, Target } from 'lucide-react';
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


interface CandidateDashboardProps {
   candidate: CandidateProfile;
   onStartAssessment: (skill?: string) => void;
   onLogout: () => void;
   onUpdateProfile: (profile: Partial<CandidateProfile>) => void;
   onOpenVideoAnalyzer?: () => void;
   onStartTour?: () => void;
}

const AVAILABLE_ASSESSMENTS = {
   // Technical Categories
   'Frontend': ['React', 'Vue', 'CSS', 'Angular'],
   'Backend': ['Node.js', 'Python', 'Java', 'Go'],
   'Cloud & DevOps': ['AWS', 'Docker', 'Kubernetes', 'Terraform'],

   // Non-Tech Categories
   'Customer Service': ['Customer Support Representative', 'Call Center Agent', 'Help Desk Support', 'Client Success Manager'],
   'Sales': ['Sales Representative', 'Business Development', 'Account Executive', 'Lead Generation'],
   'Marketing': ['Digital Marketing', 'Social Media Manager', 'Content Creator', 'SEO Specialist'],
   'Administrative': ['Virtual Assistant', 'Executive Assistant', 'Data Entry Specialist', 'Office Administrator'],
   'Generalist': ['Project Manager', 'HR Coordinator', 'Recruiter', 'Quality Assurance'],
   'Communication': ['Public Speaking', 'Presentation Skills', 'Negotiation', 'Active Listening'],
   'Office Tools': ['Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Google Workspace']
};

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ candidate, onStartAssessment, onLogout, onUpdateProfile, onOpenVideoAnalyzer, onStartTour }) => {
   const toast = useToast();
   const [activeTab, setActiveTab] = useState<'overview' | 'interview' | 'history'>('overview');
   const [searchQuery, setSearchQuery] = useState(''); // Search state
   const [recommendations, setRecommendations] = useState<{
      certifications: RecommendedCertification[];
      jobs: Job[];
   } | null>(null);
   const [loadingRecommendations, setLoadingRecommendations] = useState(false);

   // Filter assessments based on search query
   const filteredAssessments = React.useMemo(() => {
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

   // Edit Mode State
   const [isEditing, setIsEditing] = useState(false);
   const [formData, setFormData] = useState({
      name: candidate.name || '',
      bio: candidate.bio || '',
      experience: candidate.experience || '',
      location: candidate.location || '',
      yearsOfExperience: candidate.yearsOfExperience || 0,
      preferredWorkMode: candidate.preferredWorkMode || 'Remote',
      title: candidate.title || ''
   });

   // Skill Passport State
   const [isGeneratingPassport, setIsGeneratingPassport] = useState(false);
   const [passportData, setPassportData] = useState<{ txHash: string; passportId: string } | null>(null);
   const [showPassportModal, setShowPassportModal] = useState(false);

   const fileInputRef = useRef<HTMLInputElement>(null);
   const profilePicInputRef = useRef<HTMLInputElement>(null);

   const [userStats, setUserStats] = useState<{
      total_assessments: number;
      passed_assessments: number;
      average_score: number;
      total_points: number;
      current_streak: number;
      longest_streak: number;
   } | null>(null);

   // Update local form data when prop changes
   useEffect(() => {
      setFormData({
         name: candidate.name || '',
         bio: candidate.bio || '',
         experience: candidate.experience || '',
         location: candidate.location || '',
         yearsOfExperience: candidate.yearsOfExperience || 0,
         preferredWorkMode: candidate.preferredWorkMode || 'Remote',
         title: candidate.title || ''
      });

      // Fetch stats from backend
      api.get('/users/me/statistics/')
         .then(setUserStats)
         .catch(err => console.error('Failed to fetch user stats:', err));
   }, [candidate]);

   const fetchRecommendations = async () => {
      setLoadingRecommendations(true);
      const result = await getCareerRecommendations(candidate.skills);
      setRecommendations(result);
      setLoadingRecommendations(false);
   };

   // Generate Skill Passport
   const handleGeneratePassport = async () => {
      if (Object.keys(candidate.skills).length === 0) {
         toast.warning("Complete at least one skill assessment before generating your passport.");
         return;
      }

      setIsGeneratingPassport(true);
      try {
         const passportId = `passport_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
         const txHash = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
         const result = { passportId, txHash };
         setPassportData(result);
         toast.success("🎉 Skill Passport generated successfully!");

         // Update candidate profile with passport info
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

   const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
         // Validate file type
         if (!file.type.startsWith('video/')) {
            toast.error("Please upload a video file.");
            return;
         }
         // Validate file size (max 50MB)
         if (file.size > 50 * 1024 * 1024) {
            toast.error("Video must be less than 50MB.");
            return;
         }

         try {
            const base64Url = await fileToBase64(file);
            onUpdateProfile({ videoIntroUrl: base64Url });
            toast.success("Video uploaded successfully!");
         } catch (error) {
            toast.error("Failed to upload video.");
            console.error(error);
         }
      }
   };

   const handleProfilePicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
         // Validate file type
         if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file.");
            return;
         }
         // Validate file size (max 2MB for better localStorage efficiency)
         if (file.size > 2 * 1024 * 1024) {
            toast.error("Image must be less than 2MB.");
            return;
         }

         try {
            const base64Url = await fileToBase64(file);
            onUpdateProfile({ image: base64Url });
            toast.success("Profile picture updated!");
         } catch (error) {
            toast.error("Failed to upload image.");
            console.error(error);
         }
      }
   };

   const handleSaveProfile = () => {
      onUpdateProfile(formData);
      setIsEditing(false);
      toast.success("✨ Profile saved successfully!");
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

   // Calculate profile completion percentage
   const calculateProfileCompletion = () => {
      let completed = 0;
      let total = 5; // bio, experience, location, yearsOfExperience, video

      if (candidate.bio && candidate.bio.trim()) completed++;
      if (candidate.experience && candidate.experience.trim()) completed++;
      if (candidate.location && candidate.location.trim()) completed++;
      if (candidate.yearsOfExperience && candidate.yearsOfExperience > 0) completed++;
      if (candidate.videoIntroUrl) completed++;

      return Math.round((completed / total) * 100);
   };

   const profileCompletion = calculateProfileCompletion();

   return (
      <div className="min-h-screen bg-cream font-sans">
         {/* Header */}
         <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 sticky top-0 z-10 shadow-sm"
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
                  <div className="w-8 h-8 bg-orange rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md shadow-orange/20">
                     {candidate.name.substring(0, 2).toUpperCase()}
                  </div>
               </div>
            </div>
         </motion.header>

         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Banner */}
            <WelcomeBanner userName={candidate.name} userRole="candidate" onStartTour={onStartTour} className="mb-8" />

            {/* Stats Overview */}
            {userStats && (
               <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
               >
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                     <div className="bg-orange/10 p-3 rounded-xl text-orange">
                        <Target size={24} />
                     </div>
                     <div>
                        <div className="text-2xl font-bold text-slate-900">{userStats.total_assessments}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Attempts</div>
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                     <div className="bg-teal/10 p-3 rounded-xl text-teal">
                        <Award size={24} />
                     </div>
                     <div>
                        <div className="text-2xl font-bold text-slate-900">{userStats.passed_assessments}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Certifications</div>
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                     <div className="bg-purple/10 p-3 rounded-xl text-purple">
                        <TrendingUp size={24} />
                     </div>
                     <div>
                        <div className="text-2xl font-bold text-slate-900">{userStats.total_points.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Points</div>
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                     <div className="bg-red/10 p-3 rounded-xl text-red-500">
                        <Zap size={24} />
                     </div>
                     <div>
                        <div className="text-2xl font-bold text-slate-900">{userStats.current_streak} Day{userStats.current_streak !== 1 ? 's' : ''}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Streak (Best: {userStats.longest_streak})</div>
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
               {/* Left Sidebar: Profile Info */}
               <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
                  {/* Profile Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center relative overflow-hidden group hover:shadow-lg transition-all">
                     <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-orange to-red-500"></div>

                     {/* Edit Toggle Button */}
                     <button
                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition z-20 shadow-sm"
                        title={isEditing ? "Save Profile" : "Edit Profile"}
                     >
                        {isEditing ? <Save size={16} /> : <Edit2 size={16} />}
                     </button>

                     <div className="relative z-10 mt-12">
                        <motion.div
                           whileHover={{ scale: 1.05 }}
                           className="w-24 h-24 bg-white rounded-full p-1 mx-auto shadow-lg mb-4 relative group cursor-pointer"
                           onClick={() => profilePicInputRef.current?.click()}
                        >
                           <img
                              src={candidate.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&size=300&background=f97316&color=ffffff&bold=true`}
                              alt="Profile"
                              className="w-full h-full rounded-full object-cover"
                           />
                           {/* Upload overlay */}
                           <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Upload className="w-6 h-6 text-white" />
                           </div>
                           {/* Remove button if custom image exists */}
                           {candidate.image && (
                              <button
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateProfile({ image: undefined });
                                    toast.success("Profile picture removed.");
                                 }}
                                 className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                                 title="Remove profile picture"
                              >
                                 <X size={12} />
                              </button>
                           )}
                        </motion.div>
                        <input
                           type="file"
                           ref={profilePicInputRef}
                           className="hidden"
                           accept="image/*"
                           onChange={handleProfilePicUpload}
                        />
                        {isEditing ? (
                           <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Your full name"
                              className="w-full text-center bg-white border border-gray-200 rounded-lg px-3 py-2 text-xl font-bold text-slate-900 mb-2 focus:ring-2 focus:ring-orange focus:border-transparent outline-none"
                           />
                        ) : (
                           <h2 className="text-xl font-bold text-slate-900">{candidate.name}</h2>
                        )}
                        {isEditing ? (
                           <input
                              type="text"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              placeholder="Your job title (e.g., Virtual Assistant)"
                              className="w-full text-center bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-600 mb-4 focus:ring-2 focus:ring-orange focus:border-transparent outline-none"
                           />
                        ) : (
                           <p className="text-slate-500 text-sm mb-4">{candidate.title || <span className="text-gray-400 italic">Add your job title</span>}</p>
                        )}

                        {/* Video Intro Upload */}
                        <div className="mb-6">
                           {candidate.videoIntroUrl ? (
                              <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-sm group mx-auto max-w-[280px]">
                                 <video src={candidate.videoIntroUrl} className="w-full h-full object-cover" controls />
                                 <button
                                    onClick={() => onUpdateProfile({ videoIntroUrl: undefined })}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-500 backdrop-blur-sm"
                                    title="Remove Video"
                                 >
                                    <X size={14} />
                                 </button>
                              </div>
                           ) : (
                              <motion.button
                                 whileHover={{ scale: 1.02 }}
                                 whileTap={{ scale: 0.98 }}
                                 onClick={() => fileInputRef.current?.click()}
                                 className="text-orange text-xs font-bold flex items-center justify-center gap-2 mx-auto hover:bg-orange/10 px-4 py-2 rounded-full transition border border-orange/20 bg-orange/5"
                              >
                                 <Video size={14} /> Add Video Intro
                              </motion.button>
                           )}
                           <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="video/*"
                              onChange={handleVideoUpload}
                           />
                           {/* AI Video Analyzer Button */}
                           {onOpenVideoAnalyzer && (
                              <motion.button
                                 whileHover={{ scale: 1.02 }}
                                 whileTap={{ scale: 0.98 }}
                                 onClick={onOpenVideoAnalyzer}
                                 className="mt-3 text-purple-600 text-xs font-bold flex items-center justify-center gap-2 mx-auto hover:bg-purple-50 px-4 py-2 rounded-full transition border border-purple-100 bg-purple-50/50"
                              >
                                 <Sparkles size={14} /> Analyze with AI
                              </motion.button>
                           )}
                        </div>

                        {/* Profile Metadata Grid */}
                        <div className="grid grid-cols-2 gap-3 text-left mb-6">
                           <div className="bg-gray-50 p-2 rounded-lg">
                              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1"><MapPin size={10} /> Location</div>
                              {isEditing ? (
                                 <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs"
                                 />
                              ) : (
                                 <div className="font-semibold text-sm text-slate-700 truncate">{candidate.location}</div>
                              )}
                           </div>
                           <div className="bg-gray-50 p-2 rounded-lg">
                              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Clock size={10} /> Experience</div>
                              {isEditing ? (
                                 <div className="flex items-center gap-1">
                                    <input
                                       type="number"
                                       value={formData.yearsOfExperience}
                                       onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) })}
                                       className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs"
                                    />
                                    <span className="text-xs text-gray-500">Yrs</span>
                                 </div>
                              ) : (
                                 <div className="font-semibold text-sm text-slate-700">{candidate.yearsOfExperience || 0} Years</div>
                              )}
                           </div>
                           <div className="bg-gray-50 p-2 rounded-lg col-span-2">
                              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Globe size={10} /> Preference</div>
                              {isEditing ? (
                                 <select
                                    value={formData.preferredWorkMode}
                                    onChange={(e) => setFormData({ ...formData, preferredWorkMode: e.target.value as any })}
                                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs"
                                 >
                                    <option value="Remote">Remote</option>
                                    <option value="Hybrid">Hybrid</option>
                                    <option value="On-site">On-site</option>
                                 </select>
                              ) : (
                                 <div className="font-semibold text-sm text-slate-700">{candidate.preferredWorkMode || 'Remote'}</div>
                              )}
                           </div>
                        </div>

                        {/* Bio & Experience Section */}
                        <div className="text-left pt-4 border-t border-gray-100 space-y-4">
                           <div>
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">About Me</label>
                              {isEditing ? (
                                 <textarea
                                    className="w-full text-sm p-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange focus:border-transparent outline-none resize-none"
                                    rows={3}
                                    placeholder="Tell us about yourself..."
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                 />
                              ) : (
                                 <p className="text-sm text-slate-600 leading-relaxed">
                                    {candidate.bio || <span className="text-gray-400 italic text-xs">No bio added yet.</span>}
                                 </p>
                              )}
                           </div>
                           <div>
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Work Summary</label>
                              {isEditing ? (
                                 <textarea
                                    className="w-full text-sm p-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange focus:border-transparent outline-none resize-none"
                                    rows={3}
                                    placeholder="Briefly describe your past roles..."
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                 />
                              ) : (
                                 <p className="text-sm text-slate-600 leading-relaxed">
                                    {candidate.experience || <span className="text-gray-400 italic text-xs">No details added.</span>}
                                 </p>
                              )}
                           </div>
                        </div>

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

                        {/* Complete Profile Button */}
                        {profileCompletion < 100 && !isEditing && (
                           <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 pt-4 border-t border-gray-100"
                           >
                              <div className="flex items-center justify-between mb-2">
                                 <span className="text-xs font-medium text-slate-500">Profile Completion</span>
                                 <span className="text-xs font-bold text-orange">{profileCompletion}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                                 <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${profileCompletion}%` }}
                                    transition={{ duration: 0.8 }}
                                    className="h-full bg-gradient-to-r from-orange to-red-500 rounded-full"
                                 />
                              </div>
                              <motion.button
                                 whileHover={{ scale: 1.02 }}
                                 whileTap={{ scale: 0.98 }}
                                 onClick={() => setIsEditing(true)}
                                 className="w-full py-2.5 bg-gradient-to-r from-teal to-blue-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                              >
                                 <Edit2 size={16} />
                                 Complete Profile
                              </motion.button>
                           </motion.div>
                        )}
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
                                  disabled={isGeneratingPassport || Object.keys(candidate.skills).length === 0}
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
                              {Object.keys(candidate.skills).length === 0 && (
                                 <p className="text-orange-200 text-xs text-center">
                                    Complete at least one assessment first
                                 </p>
                              )}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Get Verified / Skills Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><Award className="text-teal-600" size={18} /> Verified Skills</h3>
                     </div>
                     <div className="space-y-4 mb-6">
                        {Object.entries(candidate.skills).map(([skill, score]) => (
                           <div key={skill}>
                              <div className="flex justify-between text-xs mb-1.5">
                                 <span className="font-medium text-slate-700">{skill}</span>
                                 <span className={`font-bold ${(score as number) >= 80 ? 'text-green-600' : 'text-slate-600'}`}>{score as number}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                                 <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full rounded-full ${(score as number) >= 80 ? 'bg-gradient-to-r from-teal-500 to-emerald-400' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
                                 ></motion.div>
                              </div>
                           </div>
                        ))}
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
                                       {skills.map(skill => (
                                          <motion.button
                                             key={skill}
                                             whileHover={{ scale: 1.05, backgroundColor: "#000", color: "#fff", borderColor: "#000" }}
                                             whileTap={{ scale: 0.95 }}
                                             onClick={() => onStartAssessment(skill)}
                                             className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600 transition"
                                          >
                                             {skill}
                                          </motion.button>
                                       ))}
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
                  </div>

               </motion.div>

               {/* Right Content */}
               <motion.div variants={itemVariants} className="lg:col-span-8">

                  {/* Tab Navigation */}
                  <div className="flex gap-6 mb-6 border-b border-gray-200 pb-1">
                     <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 px-2 font-bold text-sm transition relative ${activeTab === 'overview' ? 'text-orange' : 'text-gray-500 hover:text-gray-800'}`}
                     >
                        <span className="flex items-center gap-2"><Briefcase size={16} /> Career Path</span>
                        {activeTab === 'overview' && (
                           <motion.div
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 w-full h-0.5 bg-orange rounded-t-full"
                           />
                        )}
                     </button>
                     <button
                        onClick={() => setActiveTab('interview')}
                        className={`pb-3 px-2 font-bold text-sm transition relative ${activeTab === 'interview' ? 'text-orange' : 'text-gray-500 hover:text-gray-800'}`}
                     >
                        <span className="flex items-center gap-2"><Mic size={16} /> Mock Interview</span>
                        {activeTab === 'interview' && (
                           <motion.div
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 w-full h-0.5 bg-orange rounded-t-full"
                           />
                        )}
                     </button>
                     <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-3 px-2 font-bold text-sm transition relative ${activeTab === 'history' ? 'text-orange' : 'text-gray-500 hover:text-gray-800'}`}
                     >
                        <span className="flex items-center gap-2"><History size={16} /> Progress</span>
                        {activeTab === 'history' && (
                           <motion.div
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 w-full h-0.5 bg-orange rounded-t-full"
                           />
                        )}
                     </button>
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
                           <div className="bg-gradient-to-br from-orange to-slate-900 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
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
                                             className="bg-white text-orange-900 px-6 py-3 rounded-lg font-bold hover:bg-orange-50 transition flex items-center gap-2 shadow-md disabled:opacity-80"
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

                           {/* Recommendations Content */}
                           {recommendations && (
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
                                                   >
                                                      Apply Now
                                                   </motion.button>
                                                   <motion.button
                                                      whileHover={{ scale: 1.1 }}
                                                      whileTap={{ scale: 0.9 }}
                                                      className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
                                                   >
                                                      <Bookmark size={20} />
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

                                             <button className="mt-auto w-full py-2.5 rounded-lg border border-orange-100 text-orange-700 text-sm font-bold hover:bg-orange-50 transition flex items-center justify-center gap-2 group-hover:border-orange-200">
                                                Start Learning <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                             </button>
                                          </motion.div>
                                       ))}
                                    </div>
                                 </motion.div>

                              </motion.div>
                           )}

                           {/* Empty State if no recommendations yet */}
                           {!recommendations && (
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

         {/* Skill Passport Modal */}
         <AnimatePresence>
            {showPassportModal && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto p-4"
                  onClick={() => setShowPassportModal(false)}
               >
                  <motion.div
                     initial={{ scale: 0.95, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.95, opacity: 0 }}
                     onClick={e => e.stopPropagation()}
                     className="max-w-4xl mx-auto my-8"
                  >
                     {/* Close Button */}
                     <div className="flex justify-end mb-4">
                        <button
                           onClick={() => setShowPassportModal(false)}
                           className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition backdrop-blur-sm"
                        >
                           <X size={24} />
                        </button>
                     </div>

                     {/* SkillPassport Component */}
                     <Suspense fallback={
                        <div className="bg-white rounded-2xl p-12 text-center">
                           <Loader className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                           <p className="text-gray-500">Loading Skill Passport...</p>
                        </div>
                     }>
                        <SkillPassport candidate={candidate} />
                     </Suspense>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};