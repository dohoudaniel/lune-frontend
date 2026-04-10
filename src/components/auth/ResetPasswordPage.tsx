import React, { useState, useMemo } from 'react';
import { Lock, Loader2, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../lib/toast';
import { ViewState } from '../../types';
import { AuthLayout } from '../AuthLayout';

export const ResetPasswordPage: React.FC<{
    onNavigate: (view: ViewState) => void;
}> = ({ onNavigate }) => {
    const { resetPassword, isLoading } = useAuth();
    const toast = useToast();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [done, setDone] = useState(false);

    // Read token once from URL — never changes during the lifetime of this page.
    const token = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('token') ?? '';
    }, []);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const result = await resetPassword(token, password);
        if (result.success) {
            setDone(true);
        } else {
            const msg = result.error ?? 'Something went wrong';
            // For expired/invalid token errors, show inline rather than toast
            if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
                setErrors({ token: msg });
            } else {
                toast.error(msg);
            }
        }
    };

    // No token in URL — show a clear error state, not just a toast
    if (!token) {
        return (
            <AuthLayout
                onNavigate={onNavigate}
                title="Invalid Reset Link"
                subtitle="This link doesn't look right"
            >
                <div className="space-y-5">
                    <div className="flex flex-col items-center gap-3 py-4">
                        <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                            <AlertTriangle className="text-red-500" size={26} />
                        </div>
                        <p className="text-sm text-slate-500 text-center leading-relaxed max-w-xs">
                            The password reset link is missing or malformed. Please request a new one from the login page.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onNavigate(ViewState.FORGOT_PASSWORD)}
                        className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition shadow-sm shadow-slate-900/20"
                    >
                        Request new reset link
                    </button>
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => onNavigate(ViewState.LOGIN)}
                            className="text-[13px] font-bold text-slate-900 hover:underline"
                        >
                            Back to login
                        </button>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    // Success state
    if (done) {
        return (
            <AuthLayout
                onNavigate={onNavigate}
                title="Password Reset!"
                subtitle="Your new password is ready"
            >
                <div className="space-y-5">
                    <div className="flex flex-col items-center gap-3 py-4">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                            <CheckCircle className="text-emerald-500" size={28} />
                        </div>
                        <p className="text-sm text-slate-500 text-center">
                            Your password has been updated. You can now sign in with your new password.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onNavigate(ViewState.LOGIN)}
                        className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition shadow-sm shadow-slate-900/20"
                    >
                        Sign in
                    </button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            onNavigate={onNavigate}
            title="Set New Password"
            subtitle="Enter your new secure password below"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Token-level error (expired / invalid) */}
                <AnimatePresence>
                    {errors.token && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
                        >
                            <p className="font-semibold mb-1">Reset link problem</p>
                            <p className="text-xs">{errors.token}</p>
                            <button
                                type="button"
                                onClick={() => onNavigate(ViewState.FORGOT_PASSWORD)}
                                className="text-xs font-bold underline mt-2 block"
                            >
                                Request a new reset link →
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">New Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            className={`w-full pl-10 pr-12 py-3 bg-slate-50/50 hover:bg-slate-50 border rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-teal-400/10 focus:border-teal-400 outline-none transition-all ${errors.password ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password}</p>}
                </div>

                <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5 mt-1">Confirm Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your new password"
                            className={`w-full pl-10 pr-12 py-3 bg-slate-50/50 hover:bg-slate-50 border rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-teal-400/10 focus:border-teal-400 outline-none transition-all ${errors.confirmPassword ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}
                        />
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.confirmPassword}</p>}
                </div>

                <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: isLoading ? 1 : 1.01 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 shadow-sm shadow-slate-900/20"
                >
                    {isLoading ? <><Loader2 className="animate-spin" size={18} />Resetting password...</> : 'Reset Password'}
                </motion.button>

                <div className="text-center text-[13px] text-slate-500 mt-6 pt-6 border-t border-slate-100 font-medium">
                    <button
                        type="button"
                        onClick={() => onNavigate(ViewState.LOGIN)}
                        className="text-slate-900 font-bold hover:underline"
                    >
                        Back to login
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};
