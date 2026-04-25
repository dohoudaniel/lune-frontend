import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Briefcase,
  User,
  BarChart3,
  Search,
  Shield,
  LogOut,
  Eye,
  Trash2,
  ChevronDown,
  AlertTriangle,
  X,
  RefreshCw,
  UserCheck,
  CheckCircle,
  XCircle,
  TrendingUp,
  Award,
  Filter,
  Edit2,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Skeleton } from './Skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'employer' | 'admin';
  is_active: boolean;
  date_joined: string;
}

interface AdminStats {
  total_users: number;
  total_candidates: number;
  total_employers: number;
  total_assessments: number;
  assessments_passed: number;
  assessments_failed: number;
  average_score: number;
  pass_rate: number;
}

export interface AdminDashboardProps {
  onLogout: () => void;
  onImpersonate: (
    token: string,
    targetUser: { id: string; name: string; email: string; role: 'candidate' | 'employer' }
  ) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  colorClass: string;
  loading?: boolean;
}> = ({ label, value, icon, colorClass, loading }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
      {loading ? (
        <Skeleton width={60} height={28} className="mt-1" />
      ) : (
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  </div>
);

const RoleBadge: React.FC<{ role: AdminUser['role'] }> = ({ role }) => {
  const styles: Record<AdminUser['role'], string> = {
    candidate: 'bg-teal/10 text-teal',
    employer: 'bg-orange/10 text-orange',
    admin: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[role]}`}>
      {role}
    </span>
  );
};

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
    }`}
  >
    {active ? <CheckCircle size={10} /> : <XCircle size={10} />}
    {active ? 'Active' : 'Inactive'}
  </span>
);

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

const DeleteConfirmModal: React.FC<{
  user: AdminUser;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ user, onConfirm, onCancel, loading }) => (
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
          <h3 className="font-bold text-gray-900">Delete User</h3>
          <p className="text-sm text-gray-500">This action cannot be undone</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Are you sure you want to permanently delete{' '}
        <span className="font-semibold text-gray-900">{user.name}</span> ({user.email})? All their
        data will be lost.
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          {loading && <RefreshCw size={14} className="animate-spin" />}
          Delete
        </button>
      </div>
    </motion.div>
  </div>
);

// ─── Edit Role Modal ───────────────────────────────────────────────────────────

const EditRoleModal: React.FC<{
  user: AdminUser;
  onConfirm: (role: AdminUser['role']) => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ user, onConfirm, onCancel, loading }) => {
  const [selectedRole, setSelectedRole] = useState<AdminUser['role']>(user.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Edit Role</h3>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Changing role for <span className="font-medium text-gray-900">{user.name}</span>
        </p>
        <div className="space-y-2 mb-6">
          {(['candidate', 'employer', 'admin'] as AdminUser['role'][]).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors text-sm font-medium capitalize ${
                selectedRole === r
                  ? 'border-teal bg-teal/5 text-teal'
                  : 'border-gray-100 text-gray-700 hover:border-gray-200'
              }`}
            >
              {r}
              {selectedRole === r && <CheckCircle size={16} />}
            </button>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedRole)}
            disabled={loading || selectedRole === user.role}
            className="px-4 py-2 text-sm font-medium text-white bg-teal rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <RefreshCw size={14} className="animate-spin" />}
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onImpersonate }) => {
  const toast = useToast();
  const { user: authUser } = useAuth() as any;

  // State
  const [activeTab, setActiveTab] = useState<'users' | 'stats' | 'verifications'>('users');
  const [roleFilter, setRoleFilter] = useState<'all' | 'candidate' | 'employer'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [impersonating, setImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<{ id: string; name: string; email: string; role: 'candidate' | 'employer' } | null>(null);
  const [impersonateToken, setImpersonateToken] = useState<string | null>(null);

  // Modal state
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editRoleTarget, setEditRoleTarget] = useState<AdminUser | null>(null);
  const [editRoleLoading, setEditRoleLoading] = useState(false);
  const [impersonateLoadingId, setImpersonateLoadingId] = useState<string | null>(null);

  // ── Data fetching ──

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await api.get('/admin/stats/');
      setStats({
        total_users: data.users?.total || 0,
        total_candidates: data.users?.candidates || 0,
        total_employers: data.users?.employers || 0,
        total_assessments: data.assessments?.total || 0,
        assessments_passed: data.assessments?.passed || 0,
        assessments_failed: data.assessments?.failed || 0,
        average_score: data.assessments?.avgScore || 0,
        pass_rate: data.assessments?.passRate || 0,
      });
    } catch {
      toast.error('Failed to load platform stats');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const endpoint =
        roleFilter === 'all' ? '/admin/users/' : `/admin/users/?role=${roleFilter}`;
      const data = await api.get(endpoint);
      // Map DRF ListAPIView paginated response if applicable, else data
      const usersData = Array.isArray(data) ? data : (data.results || []);
      setUsers(usersData.map((u: any) => ({
        id: u.id,
        name: u.name || u.email.split('@')[0],
        email: u.email,
        role: u.role,
        is_active: u.is_active,
        date_joined: u.created_at || u.date_joined || new Date().toISOString()
      })));
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Actions ──

  const handleImpersonate = async (user: AdminUser) => {
    if (user.role === 'admin') return;
    setImpersonateLoadingId(user.id);
    try {
      const data = await api.post(`/admin/impersonate/${user.id}/`);
      const token: string = data.access_token;
      const target = { id: user.id, name: user.name, email: user.email, role: user.role as 'candidate' | 'employer' };
      setImpersonateToken(token);
      setImpersonatedUser(target);
      setImpersonating(true);
      toast.success(`Now viewing as ${user.name}`);
      onImpersonate(token, target);
    } catch {
      toast.error('Failed to start impersonation');
    } finally {
      setImpersonateLoadingId(null);
    }
  };

  const handleExitImpersonation = () => {
    setImpersonating(false);
    setImpersonatedUser(null);
    setImpersonateToken(null);
    toast.info('Exited impersonation mode');
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}/`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success(`${deleteTarget.name} has been deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditRole = async (newRole: AdminUser['role']) => {
    if (!editRoleTarget) return;
    setEditRoleLoading(true);
    try {
      await api.patch(`/admin/users/${editRoleTarget.id}/`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === editRoleTarget.id ? { ...u, role: newRole } : u))
      );
      toast.success(`Role updated to ${newRole}`);
      setEditRoleTarget(null);
    } catch {
      toast.error('Failed to update role');
    } finally {
      setEditRoleLoading(false);
    }
  };

  // ── Employer Verifications ──

  interface PendingVerification {
    user_id: string;
    email: string;
    company_name: string;
    company_website: string | null;
    requested_at: string;
  }

  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchPendingVerifications = useCallback(async () => {
    setLoadingVerifications(true);
    try {
      const data = await api.get('/admin/employers/pending-verification/') as any;
      setPendingVerifications(data.pending ?? []);
    } catch {
      toast.error('Failed to load pending verifications');
    } finally {
      setLoadingVerifications(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'verifications') fetchPendingVerifications();
  }, [activeTab, fetchPendingVerifications]);

  const handleVerifyEmployer = async (userId: string, approve: boolean) => {
    if (approve) setApprovingId(userId); else setRejectingId(userId);
    try {
      await api.patch(`/admin/employers/${userId}/verify/`, { is_verified: approve });
      toast.success(approve ? 'Employer verified.' : 'Employer rejected.');
      setPendingVerifications((prev) => prev.filter((v) => v.user_id !== userId));
    } catch {
      toast.error('Action failed.');
    } finally {
      setApprovingId(null);
      setRejectingId(null);
    }
  };

  // ── Filtered users ──

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  // ── Render ──

  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Impersonation Banner */}
      <AnimatePresence>
        {impersonating && impersonatedUser && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-yellow-400 text-yellow-900 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Eye size={16} />
                <span>Viewing as {impersonatedUser.name} ({impersonatedUser.email})</span>
              </div>
              <button
                onClick={handleExitImpersonation}
                className="flex items-center gap-1.5 text-sm font-bold hover:underline transition-all"
              >
                <X size={14} />
                Exit Impersonation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Label */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 text-lg leading-none">Lune</span>
                <span className="ml-2 text-xs font-semibold text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                  Admin Panel
                </span>
              </div>
            </div>

            {/* User + Logout */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal to-teal/60 flex items-center justify-center text-white text-sm font-bold">
                  {authUser?.name?.charAt(0)?.toUpperCase() ?? 'A'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {authUser?.name ?? 'Admin'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut size={15} />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={stats?.total_users ?? 0}
            icon={<Users size={22} className="text-teal" />}
            colorClass="bg-teal/10"
            loading={loadingStats}
          />
          <StatCard
            label="Candidates"
            value={stats?.total_candidates ?? 0}
            icon={<User size={22} className="text-blue-600" />}
            colorClass="bg-blue-50"
            loading={loadingStats}
          />
          <StatCard
            label="Employers"
            value={stats?.total_employers ?? 0}
            icon={<Briefcase size={22} className="text-orange" />}
            colorClass="bg-orange/10"
            loading={loadingStats}
          />
          <StatCard
            label="Assessments"
            value={stats?.total_assessments ?? 0}
            icon={<Award size={22} className="text-purple-600" />}
            colorClass="bg-purple-50"
            loading={loadingStats}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 border border-gray-100 shadow-sm w-fit">
          {(['users', 'stats', 'verifications'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all capitalize ${
                activeTab === tab
                  ? 'bg-teal text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab === 'users' ? 'Users' : tab === 'stats' ? 'Platform Stats' : (
                <span className="flex items-center gap-1.5">
                  Verifications
                  {pendingVerifications.length > 0 && (
                    <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                      {pendingVerifications.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Users Tab ── */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Toolbar */}
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-colors"
                  />
                </div>

                {/* Role Filter */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Filter size={14} className="text-gray-400" />
                  {(['all', 'candidate', 'employer'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize ${
                        roleFilter === r
                          ? 'bg-teal text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {r === 'all' ? 'All' : r === 'candidate' ? 'Candidates' : 'Employers'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              {loadingUsers ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <Skeleton variant="circular" width={40} height={40} />
                      <Skeleton width="25%" height={16} />
                      <Skeleton width="30%" height={16} />
                      <Skeleton width="15%" height={24} className="rounded-full" />
                      <Skeleton width="12%" height={24} className="rounded-full" />
                      <Skeleton width="18%" height={36} className="rounded-lg ml-auto" />
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-16 text-center">
                  <Users size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No users found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          Email
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Status
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredUsers.map((user) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50/60 transition-colors group"
                        >
                          {/* Name + Avatar */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal/80 to-teal/40 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900 text-sm">{user.name}</span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-5 py-4 text-sm text-gray-500 hidden md:table-cell">
                            {user.email}
                          </td>

                          {/* Role */}
                          <td className="px-5 py-4">
                            <RoleBadge role={user.role} />
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4 hidden sm:table-cell">
                            <StatusBadge active={user.is_active} />
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 justify-end">
                              {/* Impersonate — only non-admin */}
                              {user.role !== 'admin' && (
                                <button
                                  onClick={() => handleImpersonate(user)}
                                  disabled={impersonateLoadingId === user.id}
                                  title={`View as ${user.role}`}
                                  className="p-1.5 text-gray-400 hover:text-teal hover:bg-teal/10 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {impersonateLoadingId === user.id ? (
                                    <RefreshCw size={15} className="animate-spin" />
                                  ) : (
                                    <UserCheck size={15} />
                                  )}
                                </button>
                              )}

                              {/* Edit role */}
                              <button
                                onClick={() => setEditRoleTarget(user)}
                                title="Edit role"
                                className="p-1.5 text-gray-400 hover:text-orange hover:bg-orange/10 rounded-lg transition-colors"
                              >
                                <Edit2 size={15} />
                              </button>

                              {/* View profile link */}
                              <button
                                title="View profile"
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                onClick={() =>
                                  toast.info(`Viewing profile for ${user.name}`)
                                }
                              >
                                <Eye size={15} />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setDeleteTarget(user)}
                                title="Delete user"
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer count */}
              {!loadingUsers && filteredUsers.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
              )}
            </motion.div>
          )}

          {/* ── Platform Stats Tab ── */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Assessment Overview */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 size={20} className="text-teal" />
                  <h2 className="font-bold text-gray-900 text-lg">Assessment Overview</h2>
                </div>

                {loadingStats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} height={100} className="rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Total Assessments */}
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Award size={18} className="text-purple-600" />
                        <span className="text-sm font-semibold text-gray-600">Total Taken</span>
                      </div>
                      <p className="text-4xl font-extrabold text-gray-900">
                        {stats?.total_assessments ?? 0}
                      </p>
                    </div>

                    {/* Pass Rate */}
                    <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={18} className="text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-700">Pass Rate</span>
                      </div>
                      <p className="text-4xl font-extrabold text-emerald-700">
                        {stats?.pass_rate != null ? `${stats.pass_rate.toFixed(1)}%` : '—'}
                      </p>
                      <div className="mt-3 h-2 bg-emerald-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${stats?.pass_rate ?? 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Avg Score */}
                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield size={18} className="text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">Avg. Score</span>
                      </div>
                      <p className="text-4xl font-extrabold text-blue-700">
                        {stats?.average_score != null
                          ? `${stats.average_score.toFixed(1)}`
                          : '—'}
                      </p>
                      <p className="text-xs text-blue-500 mt-1">out of 100</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Passed vs Failed */}
              {!loadingStats && stats && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-5">Passed vs Failed</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                      <CheckCircle size={28} className="text-emerald-500 flex-shrink-0" />
                      <div>
                        <p className="text-2xl font-extrabold text-emerald-700">
                          {stats.assessments_passed}
                        </p>
                        <p className="text-sm text-emerald-600 font-medium">Passed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 border border-red-100">
                      <XCircle size={28} className="text-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-2xl font-extrabold text-red-600">
                          {stats.assessments_failed}
                        </p>
                        <p className="text-sm text-red-500 font-medium">Failed</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User Breakdown */}
              {!loadingStats && stats && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-5">User Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: 'Candidates',
                        value: stats.total_candidates,
                        total: stats.total_users,
                        color: 'bg-blue-500',
                      },
                      {
                        label: 'Employers',
                        value: stats.total_employers,
                        total: stats.total_users,
                        color: 'bg-orange',
                      },
                    ].map((item) => {
                      const pct = stats.total_users > 0 ? (item.value / stats.total_users) * 100 : 0;
                      return (
                        <div key={item.label}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-medium text-gray-700">{item.label}</span>
                            <span className="text-gray-500">
                              {item.value} ({pct.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Verifications Tab ── */}
          {activeTab === 'verifications' && (
            <motion.div
              key="verifications"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Shield size={20} className="text-teal" />
                    <h2 className="font-bold text-gray-900 text-lg">Employer Verification Requests</h2>
                  </div>
                  <button
                    onClick={fetchPendingVerifications}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <RefreshCw size={14} className={loadingVerifications ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>

                {loadingVerifications ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} height={72} className="rounded-2xl" />)}
                  </div>
                ) : pendingVerifications.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={40} className="mx-auto text-teal mb-3" />
                    <p className="font-semibold text-gray-700">No pending requests</p>
                    <p className="text-sm text-gray-400 mt-1">All employer verifications are up to date.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingVerifications.map((v) => (
                      <div key={v.user_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/60">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{v.company_name}</p>
                          <p className="text-xs text-gray-500 truncate">{v.email}</p>
                          {v.company_website && (
                            <a
                              href={v.company_website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-teal hover:underline"
                            >
                              {v.company_website}
                            </a>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            Requested {new Date(v.requested_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleVerifyEmployer(v.user_id, false)}
                            disabled={!!approvingId || !!rejectingId}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {rejectingId === v.user_id ? <RefreshCw size={12} className="animate-spin" /> : <XCircle size={12} />}
                            Reject
                          </button>
                          <button
                            onClick={() => handleVerifyEmployer(v.user_id, true)}
                            disabled={!!approvingId || !!rejectingId}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {approvingId === v.user_id ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            user={deleteTarget}
            onConfirm={handleDeleteUser}
            onCancel={() => setDeleteTarget(null)}
            loading={deleteLoading}
          />
        )}
        {editRoleTarget && (
          <EditRoleModal
            user={editRoleTarget}
            onConfirm={handleEditRole}
            onCancel={() => setEditRoleTarget(null)}
            loading={editRoleLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
