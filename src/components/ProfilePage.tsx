import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Trash2,
  Camera,
  Save,
  Edit2,
  AlertTriangle,
  X,
  RefreshCw,
  CheckCircle,
  Eye,
  EyeOff,
  Globe,
  MapPin,
  Briefcase,
  Building2,
  TrendingUp,
  Shield,
  Calendar,
  Link,
  Navigation,
  Monitor,
  Smartphone,
  LogOut,
  FileText,
  Sparkles,
  Upload,
  Star,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';
import { Skeleton } from './Skeleton';
import { getActiveSessions, terminateSession, UserSession } from '../services/profileService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfilePageProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'candidate' | 'employer' | 'admin';
  };
  onBack: () => void;
  onLogout: () => void;
  /** Called after any profile save so the dashboard can sync its candidateProfile state */
  onProfileUpdated?: (updates: {
    image?: string;
    title?: string;
    bio?: string;
    location?: string;
    yearsOfExperience?: number;
    preferredWorkMode?: string;
  }) => void;
  /** Called when user clicks "Start Assessment" on a CV recommendation */
  onStartAssessment?: (skill: string) => void;
}

type Tab = 'account' | 'profile' | 'security' | 'danger' | 'cv';

interface CandidateProfileData {
  bio?: string;
  title?: string;
  location?: string;
  years_of_experience?: number;
  preferred_work_mode?: 'Remote' | 'Hybrid' | 'On-site';
  avatar?: string;
}

interface EmployerProfileData {
  company_name?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  avatar?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WORK_MODES = ['Remote', 'Hybrid', 'On-site'] as const;
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'] as const;

const completionFields = {
  // avatar included so uploading a photo contributes to the score
  candidate: ['bio', 'title', 'location', 'years_of_experience', 'preferred_work_mode', 'avatar'],
  employer: ['company_name', 'website', 'industry', 'company_size', 'location'],
};

export function calcCompletion(data: Record<string, unknown>, role: 'candidate' | 'employer'): number {
  const fields = completionFields[role] ?? [];
  if (!fields.length) return 0;
  let filled = 0;
  for (const f of fields) {
    const v = data[f];
    if (f === 'skills') {
      // skills is an object — count as filled if at least one entry
      if (v && typeof v === 'object' && Object.keys(v as object).length > 0) filled++;
    } else {
      // Treat the default placeholder title 'Candidate' as unfilled
      const effective = (f === 'title' && v === 'Candidate') ? '' : v;
      if (effective !== undefined && effective !== null && effective !== '') filled++;
    }
  }
  return Math.round((filled / fields.length) * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const FormField: React.FC<{
  label: string;
  children: React.ReactNode;
  hint?: string;
}> = ({ label, children, hint }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${props.className ?? ''}`}
  />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-colors resize-none disabled:bg-gray-50 ${props.className ?? ''}`}
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-colors bg-white ${props.className ?? ''}`}
  />
);

const RoleBadge: React.FC<{ role: ProfilePageProps['user']['role'] }> = ({ role }) => {
  const styles: Record<ProfilePageProps['user']['role'], string> = {
    candidate: 'bg-teal/10 text-teal',
    employer: 'bg-orange/10 text-orange',
    admin: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${styles[role]}`}>
      {role}
    </span>
  );
};

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

const DeleteAccountModal: React.FC<{
  email: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ email, onConfirm, onCancel, loading }) => {
  const [confirmText, setConfirmText] = useState('');
  const canDelete = confirmText === email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Delete Account</h3>
            <p className="text-sm text-red-500">This is permanent and irreversible</p>
          </div>
          <button
            onClick={onCancel}
            className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          All your data — assessments, certificates, profile information — will be permanently
          deleted. To confirm, type your email address below:
        </p>

        <p className="text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 mb-3 select-all">
          {email}
        </p>

        <Input
          type="email"
          placeholder="Type your email to confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="mb-5"
        />

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canDelete || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <RefreshCw size={14} className="animate-spin" />}
            Delete My Account
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack, onLogout, onProfileUpdated, onStartAssessment }) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<Tab>('account');

  // Profile data
  const [profileData, setProfileData] = useState<CandidateProfileData & EmployerProfileData>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<CandidateProfileData & EmployerProfileData>({});

  // Account section
  const [accountDraft, setAccountDraft] = useState({ name: user.name });
  const [savingAccount, setSavingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState(false);

  // Security section
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Active sessions
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);

  // Danger zone
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // CV upload & AI recommendations
  const [cvText, setCvText] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [cvFileUrl, setCvFileUrl] = useState('');
  const [uploadingCv, setUploadingCv] = useState(false);
  const [analyzingCv, setAnalyzingCv] = useState(false);
  const [cvRecommendations, setCvRecommendations] = useState<{ skill: string; reason: string }[]>([]);
  const [cvSource, setCvSource] = useState<'uploaded' | 'manual'>('uploaded');
  const [manualCvText, setManualCvText] = useState('');
  const cvInputRef = useRef<HTMLInputElement>(null);

  // Location detection
  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            '';
          const country = data.address?.country || '';
          const locationStr = [city, country].filter(Boolean).join(', ');
          if (locationStr) {
            setProfileDraft((p) => ({ ...p, location: locationStr }));
            toast.success(`Location detected: ${locationStr}`);
          } else {
            toast.warning('Could not determine city name from your location');
          }
        } catch {
          toast.error('Failed to reverse-geocode location');
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        toast.error('Location access denied. Enable permissions in your browser settings.');
        setDetectingLocation(false);
      }
    );
  };

  // ── Derived ──

  const isCandidate = user.role === 'candidate';
  const profileEndpoint = isCandidate ? '/profiles/candidate/' : '/profiles/employer/';
  const completion = user.role !== 'admin' ? calcCompletion(profileData as Record<string, unknown>, user.role as 'candidate' | 'employer') : 0;

  // ── Fetch profile ──

  const fetchProfile = useCallback(async () => {
    if (user.role === 'admin') {
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    try {
      const data = await api.get(profileEndpoint);
      // Map backend field 'image_url' to 'avatar' for consistent UI usage
      const normalized = { ...(data ?? {}), avatar: (data as any)?.image_url ?? (data as any)?.avatar ?? '' };
      setProfileData(normalized);
      setProfileDraft(normalized);
      // Restore saved CV data
      if ((data as any)?.cv_text) setCvText((data as any).cv_text);
      if ((data as any)?.cv_file_url) {
        setCvFileUrl((data as any).cv_file_url);
        setCvSource('uploaded');
      } else {
        setCvSource('manual');
      }
      if (Array.isArray((data as any)?.cv_recommendations) && (data as any).cv_recommendations.length > 0) {
        setCvRecommendations((data as any).cv_recommendations);
      }
    } catch {
      toast.error('Failed to load profile details');
    } finally {
      setLoadingProfile(false);
    }
  }, [user.role, profileEndpoint]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (activeTab === 'security') {
      setLoadingSessions(true);
      getActiveSessions().then(data => {
        setSessions(data);
        setLoadingSessions(false);
      });
    }
  }, [activeTab]);

  const handleTerminateSession = async (sessionId: string) => {
    setTerminatingSession(sessionId);
    const ok = await terminateSession(sessionId);
    if (ok) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session terminated.');
    } else {
      toast.error('Failed to terminate session.');
    }
    setTerminatingSession(null);
  };

  // ── Account save ──

  const handleSaveAccount = async () => {
    setSavingAccount(true);
    try {
      // Split full name into first/last and update user record via /users/me/
      const nameParts = accountDraft.name.trim().split(/\s+/);
      const first_name = nameParts[0] ?? '';
      const last_name = nameParts.slice(1).join(' ') || first_name;
      await api.put('/users/me/', { first_name, last_name });
      toast.success('Account updated successfully');
      setEditingAccount(false);
    } catch {
      toast.error('Failed to update account');
    } finally {
      setSavingAccount(false);
    }
  };

  // ── Profile save ──

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      // Map frontend 'avatar' field back to backend 'image_url' field
      const { avatar, ...rest } = profileDraft as any;
      const payload = { ...rest, ...(avatar ? { image_url: avatar } : {}) };
      const updated = await api.put(profileEndpoint, payload);
      // Normalize the response to include 'avatar'
      const normalized = { ...(updated ?? profileDraft), avatar: (updated as any)?.image_url ?? avatar ?? '' };
      setProfileData(normalized);
      setProfileDraft(normalized);
      toast.success('Profile saved successfully');
      setEditingProfile(false);
      // Propagate all saved fields back so the dashboard stays in sync
      if (user.role === 'candidate') {
        onProfileUpdated?.({
          image: (normalized as any).avatar || undefined,
          title: (normalized as any).title,
          bio: (normalized as any).bio,
          location: (normalized as any).location,
          yearsOfExperience: (normalized as any).years_of_experience,
          preferredWorkMode: (normalized as any).preferred_work_mode,
        });
      }
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Password reset ──

  const handlePasswordReset = async () => {
    setSendingReset(true);
    try {
      await api.post('/auth/password-reset/', { email: user.email });
      setResetSent(true);
      toast.success('Password reset email sent');
    } catch {
      toast.error('Failed to send password reset email');
    } finally {
      setSendingReset(false);
    }
  };

  // ── Delete account ──

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await api.delete(`/auth/users/${user.id}/`);
      toast.success('Account deleted');
      setShowDeleteModal(false);
      onLogout();
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  // ── Avatar upload ──

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const data = await api.postForm('/profiles/upload-image/', form) as any;
      const imageUrl: string = data.url ?? data.avatar_url ?? '';
      if (!imageUrl) throw new Error('No URL returned');
      // Belt-and-suspenders: also PUT the image_url to the profile endpoint to guarantee persistence
      await api.put(profileEndpoint, { image_url: imageUrl }).catch(() => {/* non-fatal */});
      setProfileData((prev) => ({ ...prev, avatar: imageUrl }));
      setProfileDraft((prev) => ({ ...prev, avatar: imageUrl }));
      onProfileUpdated?.({ image: imageUrl });
      toast.success('Profile photo updated');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  // ── CV upload & AI skill recommendation ──

  const handleCvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCvFileName(file.name);
    setCvRecommendations([]);
    setUploadingCv(true);
    try {
      const formData = new FormData();
      formData.append('cv', file);
      const res = await api.postForm('/profiles/upload-cv/', formData) as any;
      if (res?.cv_file_url) setCvFileUrl(res.cv_file_url);
      if (res?.cv_text) setCvText(res.cv_text);
      setCvSource('uploaded');
      setCvRecommendations([]);
      toast.success('CV uploaded successfully.');
    } catch {
      toast.error('CV upload failed. Please try again.');
    } finally {
      setUploadingCv(false);
    }
  };

  const handleAnalyzeCv = async () => {
    if (cvSource === 'uploaded') {
      if (!cvFileUrl) {
        toast.warning('Please upload a CV file first.');
        return;
      }
      if (!cvText.trim()) {
        toast.warning('No text could be extracted from your CV. Try uploading a PDF or TXT file instead of a Word document.');
        return;
      }
    }
    const textToAnalyze = cvSource === 'uploaded' ? cvText : manualCvText;
    if (!textToAnalyze.trim()) {
      toast.warning('Please paste your CV text first.');
      return;
    }
    setAnalyzingCv(true);
    setCvRecommendations([]);
    try {
      const res = await api.post('/ai/recommend-skills/', { cv_text: textToAnalyze }) as any;
      const recs = Array.isArray(res?.recommendations) ? res.recommendations : [];
      setCvRecommendations(recs);
      if (recs.length === 0) toast.warning('No recommendations generated. Try adding more detail to your CV.');
    } catch {
      toast.error('Failed to analyze CV. Please try again.');
    } finally {
      setAnalyzingCv(false);
    }
  };

  // ── Tab definitions ──

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'account', label: 'Account', icon: <User size={15} /> },
    ...(user.role !== 'admin'
      ? [{ id: 'profile' as Tab, label: 'Profile Details', icon: <Edit2 size={15} /> }]
      : []),
    ...(user.role === 'candidate'
      ? [{ id: 'cv' as Tab, label: 'CV & Skills', icon: <FileText size={15} /> }]
      : []),
    { id: 'security', label: 'Security', icon: <Lock size={15} /> },
    { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle size={15} /> },
  ];

  // ── Render ──

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-teal transition-colors"
            >
              <ArrowLeft size={18} />
              Back
            </button>

            <h1 className="font-bold text-gray-900 text-base">Your Profile</h1>

            {/* Lune Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal flex items-center justify-center">
                <span className="text-white font-bold text-xs">L</span>
              </div>
              <span className="font-bold text-gray-900 hidden sm:block">Lune</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile Hero */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Cover gradient */}
          <div className="h-28 bg-gradient-to-r from-teal via-teal/80 to-teal/50 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange/20 via-transparent to-transparent" />
          </div>

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex items-end gap-4 -mt-12 mb-4">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-gradient-to-br from-teal/80 to-teal/40">
                  {profileData.avatar ? (
                    <img
                      src={profileData.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Upload button */}
                {user.role !== 'admin' && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-teal text-white rounded-lg flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                      title="Change photo"
                    >
                      {uploadingAvatar ? (
                        <RefreshCw size={12} className="animate-spin" />
                      ) : (
                        <Camera size={12} />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </>
                )}
              </div>

              <div className="mb-1 min-w-0">
                <h2 className="font-bold text-gray-900 text-xl leading-tight truncate">
                  {user.name}
                </h2>
                {isCandidate && profileData.title && (
                  <p className="text-sm text-gray-500 truncate">{(profileData as CandidateProfileData).title}</p>
                )}
                {!isCandidate && (profileData as EmployerProfileData).company_name && (
                  <p className="text-sm text-gray-500 truncate">
                    {(profileData as EmployerProfileData).company_name}
                  </p>
                )}
              </div>

              <div className="ml-auto mb-1 flex-shrink-0">
                <RoleBadge role={user.role} />
              </div>
            </div>

            {/* Completion bar — only for candidate/employer */}
            {user.role !== 'admin' && (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-600">Profile completion</span>
                  <span className="font-bold text-teal">{completion}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completion}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-teal rounded-full"
                  />
                </div>
                {completion < 100 && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Complete your profile to improve visibility
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 border border-gray-100 shadow-sm overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-teal text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Account Tab ── */}
          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-teal" />
                  <h2 className="font-bold text-gray-900">Account Information</h2>
                </div>
                {!editingAccount ? (
                  <button
                    onClick={() => setEditingAccount(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal bg-teal/10 rounded-xl hover:bg-teal/20 transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingAccount(false);
                        setAccountDraft({ name: user.name });
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAccount}
                      disabled={savingAccount}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-teal rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {savingAccount ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField label="Full Name">
                  <Input
                    type="text"
                    value={editingAccount ? accountDraft.name : user.name}
                    onChange={(e) =>
                      setAccountDraft((prev) => ({ ...prev, name: e.target.value }))
                    }
                    disabled={!editingAccount}
                  />
                </FormField>

                <FormField label="Email Address" hint="Email cannot be changed here">
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <Input
                      type="email"
                      value={user.email}
                      disabled
                      className="pl-9"
                    />
                  </div>
                </FormField>

                <FormField label="Role">
                  <div className="flex items-center h-10">
                    <RoleBadge role={user.role} />
                  </div>
                </FormField>

                <FormField label="Member Since">
                  <div className="flex items-center gap-2 h-10 text-sm text-gray-600">
                    <Calendar size={15} className="text-gray-400" />
                    <span>
                      {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </FormField>
              </div>
            </motion.div>
          )}

          {/* ── Profile Details Tab ── */}
          {activeTab === 'profile' && user.role !== 'admin' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit2 size={18} className="text-teal" />
                  <h2 className="font-bold text-gray-900">
                    {isCandidate ? 'Candidate Profile' : 'Company Profile'}
                  </h2>
                </div>
                {!editingProfile ? (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal bg-teal/10 rounded-xl hover:bg-teal/20 transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileDraft(profileData);
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-teal rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {savingProfile ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              {loadingProfile ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} height={42} className="rounded-xl" />
                  ))}
                </div>
              ) : isCandidate ? (
                /* Candidate fields */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Professional Title">
                    <div className="relative">
                      <Briefcase
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <Input
                        type="text"
                        placeholder="e.g. Frontend Developer"
                        value={(profileDraft as CandidateProfileData).title ?? ''}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, title: e.target.value }))
                        }
                        disabled={!editingProfile}
                        className="pl-9"
                      />
                    </div>
                  </FormField>

                  <FormField label="Location">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <Input
                          type="text"
                          placeholder="e.g. Lagos, Nigeria"
                          value={(profileDraft as CandidateProfileData).location ?? ''}
                          onChange={(e) =>
                            setProfileDraft((p) => ({ ...p, location: e.target.value }))
                          }
                          disabled={!editingProfile}
                          className="pl-9"
                        />
                      </div>
                      {editingProfile && (
                        <button
                          type="button"
                          onClick={handleDetectLocation}
                          disabled={detectingLocation}
                          title="Detect my current location"
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-teal border border-teal/30 rounded-xl hover:bg-teal/5 transition disabled:opacity-60 whitespace-nowrap"
                        >
                          {detectingLocation ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <Navigation size={13} />
                          )}
                          {detectingLocation ? 'Detecting…' : 'Detect'}
                        </button>
                      )}
                    </div>
                  </FormField>

                  <FormField label="Years of Experience">
                    <div className="relative">
                      <TrendingUp
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={50}
                        placeholder="0"
                        value={(profileDraft as CandidateProfileData).years_of_experience ?? ''}
                        onChange={(e) =>
                          setProfileDraft((p) => ({
                            ...p,
                            years_of_experience: parseInt(e.target.value) || 0,
                          }))
                        }
                        disabled={!editingProfile}
                        className="pl-9"
                      />
                    </div>
                  </FormField>

                  <FormField label="Preferred Work Mode">
                    <Select
                      value={(profileDraft as CandidateProfileData).preferred_work_mode ?? ''}
                      onChange={(e) =>
                        setProfileDraft((p) => ({
                          ...p,
                          preferred_work_mode: e.target.value as 'Remote' | 'Hybrid' | 'On-site',
                        }))
                      }
                      disabled={!editingProfile}
                    >
                      <option value="">Select...</option>
                      {WORK_MODES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <div className="sm:col-span-2">
                    <FormField label="Bio">
                      <Textarea
                        rows={4}
                        placeholder="Tell employers about yourself..."
                        value={(profileDraft as CandidateProfileData).bio ?? ''}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, bio: e.target.value }))
                        }
                        disabled={!editingProfile}
                      />
                    </FormField>
                  </div>
                </div>
              ) : (
                /* Employer fields */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Company Name">
                    <div className="relative">
                      <Building2
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <Input
                        type="text"
                        placeholder="e.g. Acme Corp"
                        value={(profileDraft as EmployerProfileData).company_name ?? ''}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, company_name: e.target.value }))
                        }
                        disabled={!editingProfile}
                        className="pl-9"
                      />
                    </div>
                  </FormField>

                  <FormField label="Website">
                    <div className="relative">
                      <Globe
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <Input
                        type="url"
                        placeholder="https://yourcompany.com"
                        value={(profileDraft as EmployerProfileData).website ?? ''}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, website: e.target.value }))
                        }
                        disabled={!editingProfile}
                        className="pl-9"
                      />
                    </div>
                  </FormField>

                  <FormField label="Industry">
                    <Input
                      type="text"
                      placeholder="e.g. Technology"
                      value={(profileDraft as EmployerProfileData).industry ?? ''}
                      onChange={(e) =>
                        setProfileDraft((p) => ({ ...p, industry: e.target.value }))
                      }
                      disabled={!editingProfile}
                    />
                  </FormField>

                  <FormField label="Company Size">
                    <Select
                      value={(profileDraft as EmployerProfileData).company_size ?? ''}
                      onChange={(e) =>
                        setProfileDraft((p) => ({ ...p, company_size: e.target.value }))
                      }
                      disabled={!editingProfile}
                    >
                      <option value="">Select size...</option>
                      {COMPANY_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s} employees
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Location">
                    <div className="relative">
                      <MapPin
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <Input
                        type="text"
                        placeholder="e.g. San Francisco, CA"
                        value={(profileDraft as EmployerProfileData).location ?? ''}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, location: e.target.value }))
                        }
                        disabled={!editingProfile}
                        className="pl-9"
                      />
                    </div>
                  </FormField>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Security Tab ── */}
          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Change password */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Lock size={18} className="text-teal" />
                  <h2 className="font-bold text-gray-900">Password</h2>
                </div>

                <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                  <p className="text-sm text-gray-600 mb-4">
                    For your security, password changes are done via email. We'll send a secure
                    reset link to your registered email address.
                  </p>

                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-white rounded-lg border border-gray-200 px-3 py-2 mb-4">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  {resetSent ? (
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                      <CheckCircle size={16} />
                      Reset email sent! Check your inbox.
                    </div>
                  ) : (
                    <button
                      onClick={handlePasswordReset}
                      disabled={sendingReset}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {sendingReset ? (
                        <RefreshCw size={15} className="animate-spin" />
                      ) : (
                        <Mail size={15} />
                      )}
                      Send Password Reset Email
                    </button>
                  )}
                </div>
              </div>

              {/* Active sessions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Shield size={18} className="text-teal" />
                    <h2 className="font-bold text-gray-900">Active Sessions</h2>
                  </div>
                  <button
                    onClick={() => {
                      setLoadingSessions(true);
                      getActiveSessions().then(data => { setSessions(data); setLoadingSessions(false); });
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={14} className={loadingSessions ? 'animate-spin' : ''} />
                  </button>
                </div>

                {loadingSessions ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No active sessions found.</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => {
                      const isMobile = session.device_name.toLowerCase().includes('mobile') || session.device_name.toLowerCase().includes('tablet');
                      const sessionDate = new Date(session.last_active_at);
                      const isRecent = Date.now() - sessionDate.getTime() < 5 * 60 * 1000; // within 5 min
                      return (
                        <div key={session.id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4">
                          <div className="flex-shrink-0 w-9 h-9 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-gray-500">
                            {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {session.device_name || 'Unknown device'}
                              </p>
                              {isRecent && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {session.ip_address ?? 'Unknown IP'} · Last active {sessionDate.toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleTerminateSession(session.id)}
                            disabled={terminatingSession === session.id}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {terminatingSession === session.id ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <LogOut size={12} />
                            )}
                            End
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-4">
                  Ending a session will immediately invalidate that device's login token.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Danger Zone Tab ── */}
          {activeTab === 'cv' && user.role === 'candidate' && (
            <motion.div
              key="cv"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Elite plan badge */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-0.5">Elite Plan Feature</div>
                  <h2 className="font-bold text-lg leading-tight">CV Analysis &amp; Skill Recommendations</h2>
                  <p className="text-white/80 text-sm mt-0.5">Upload your CV and let AI tell you which skills to verify on Lune to maximize your profile.</p>
                </div>
              </div>

              {/* CV Management */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Upload size={16} className="text-teal" /> Your CV
                </h3>

                {/* ── Option 1: Uploaded CV card ── */}
                <div
                  onClick={() => setCvSource('uploaded')}
                  className={`rounded-xl border-2 p-4 transition cursor-pointer ${cvSource === 'uploaded' ? 'border-teal bg-teal/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Radio indicator */}
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition ${cvSource === 'uploaded' ? 'border-teal' : 'border-gray-300'}`}>
                      {cvSource === 'uploaded' && <div className="w-2.5 h-2.5 rounded-full bg-teal" />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {cvFileUrl ? 'Uploaded CV' : 'Upload a CV'}
                        </p>
                        {cvSource === 'uploaded' && (
                          <span className="text-xs font-semibold text-teal bg-teal/10 px-2 py-0.5 rounded-full flex-shrink-0">Selected for analysis</span>
                        )}
                      </div>

                      {cvFileUrl && (
                        <>
                          <p className="text-xs text-gray-400">
                            {cvText ? `~${Math.round(cvText.length / 5)} words extracted` : 'No text extracted (upload a PDF or TXT for analysis)'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <a
                              href={`/app/user/view-cv/${user.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal hover:underline"
                            >
                              <ExternalLink size={12} /> View CV
                            </a>
                            <a
                              href={`/api/profiles/${user.id}/cv/download/`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-teal transition"
                            >
                              <FileText size={12} /> Download
                            </a>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/app/user/view-cv/${user.id}`); toast.success('CV link copied!'); }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-teal transition"
                            >
                              <Copy size={12} /> Copy link
                            </button>
                          </div>
                        </>
                      )}

                      {/* Upload / Replace button */}
                      <div
                        onClick={(e) => { e.stopPropagation(); if (!uploadingCv) cvInputRef.current?.click(); }}
                        className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center transition ${uploadingCv ? 'opacity-60 cursor-not-allowed border-gray-200' : 'cursor-pointer hover:border-teal hover:bg-teal/5 border-gray-200'}`}
                      >
                        {uploadingCv ? (
                          <div className="flex items-center justify-center gap-2 text-teal text-sm font-semibold">
                            <RefreshCw className="w-4 h-4 animate-spin" /> Uploading…
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">
                            {cvFileUrl ? '↑ Click to replace with a new file' : '↑ Click to upload a PDF, TXT, or Word file'}
                            {cvFileName && <span className="block text-teal font-semibold mt-0.5">{cvFileName}</span>}
                          </p>
                        )}
                      </div>
                      <input ref={cvInputRef} type="file" accept=".pdf,.txt,.md,.doc,.docx" className="hidden" onChange={handleCvFileUpload} />
                    </div>
                  </div>
                </div>

                {/* ── Option 2: Paste manually ── */}
                <div
                  onClick={() => setCvSource('manual')}
                  className={`rounded-xl border-2 p-4 transition cursor-pointer ${cvSource === 'manual' ? 'border-teal bg-teal/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Radio indicator */}
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition ${cvSource === 'manual' ? 'border-teal' : 'border-gray-300'}`}>
                      {cvSource === 'manual' && <div className="w-2.5 h-2.5 rounded-full bg-teal" />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">Paste CV text manually</p>
                        {cvSource === 'manual' && (
                          <span className="text-xs font-semibold text-teal bg-teal/10 px-2 py-0.5 rounded-full flex-shrink-0">Selected for analysis</span>
                        )}
                      </div>
                      {cvSource === 'manual' && (
                        <textarea
                          rows={8}
                          value={manualCvText}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => { setManualCvText(e.target.value); setCvRecommendations([]); }}
                          placeholder="Paste your CV / resume text here…"
                          className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-teal/30"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAnalyzeCv}
                  disabled={analyzingCv}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {analyzingCv ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing CV…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Analyze &amp; Get Recommendations</>
                  )}
                </button>
              </div>

              {/* Recommendations */}
              {cvRecommendations.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-orange" /> Recommended Skills to Verify
                  </h3>
                  <div className="space-y-3">
                    {cvRecommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-teal/5 border border-teal/20 rounded-xl">
                        <div className="w-7 h-7 bg-teal text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{rec.skill}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{rec.reason}</p>
                        </div>
                        <button
                          onClick={() => onStartAssessment ? onStartAssessment(rec.skill) : onBack()}
                          className="flex-shrink-0 text-xs font-semibold text-teal border border-teal/30 rounded-lg px-3 py-1.5 hover:bg-teal hover:text-white transition whitespace-nowrap"
                        >
                          Start Assessment →
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-4">Click "Start Assessment" on any skill to begin verifying it on your Skill Passport.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'danger' && (
            <motion.div
              key="danger"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-red-100 p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-red-500" />
                <h2 className="font-bold text-red-700">Danger Zone</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Actions here are permanent and cannot be undone. Please proceed with caution.
              </p>

              <div className="border border-red-200 rounded-2xl p-5 bg-red-50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-red-800 text-sm">Delete Account</p>
                    <p className="text-xs text-red-600 mt-1">
                      Permanently remove your account and all associated data. This cannot be
                      reversed.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={15} />
                    Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteAccountModal
            email={user.email}
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteModal(false)}
            loading={deletingAccount}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
