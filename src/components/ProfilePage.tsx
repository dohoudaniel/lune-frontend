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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';
import { Skeleton } from './Skeleton';

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
}

type Tab = 'account' | 'profile' | 'security' | 'danger';

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
  candidate: ['bio', 'title', 'location', 'years_of_experience', 'preferred_work_mode'],
  employer: ['company_name', 'website', 'industry', 'company_size', 'location'],
};

function calcCompletion(data: Record<string, unknown>, role: 'candidate' | 'employer'): number {
  const fields = completionFields[role] ?? [];
  if (!fields.length) return 0;
  const filled = fields.filter((f) => {
    const v = data[f];
    return v !== undefined && v !== null && v !== '' && v !== 0;
  }).length;
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

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack, onLogout }) => {
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

  // Danger zone
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
    } catch {
      toast.error('Failed to load profile details');
    } finally {
      setLoadingProfile(false);
    }
  }, [user.role, profileEndpoint]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
      const data = await api.postForm('/profiles/upload-image/', form);
      setProfileData((prev) => ({ ...prev, avatar: data.url ?? data.avatar_url }));
      toast.success('Profile photo updated');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  // ── Tab definitions ──

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'account', label: 'Account', icon: <User size={15} /> },
    ...(user.role !== 'admin'
      ? [{ id: 'profile' as Tab, label: 'Profile Details', icon: <Edit2 size={15} /> }]
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
                    <div className="relative">
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

              {/* Active sessions note */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={18} className="text-teal" />
                  <h2 className="font-bold text-gray-900">Active Sessions</h2>
                </div>
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <Shield size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Current session active</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      You are currently logged in. To end all active sessions, log out from all
                      devices by changing your password.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Danger Zone Tab ── */}
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
