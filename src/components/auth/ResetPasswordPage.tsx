import React, { useState, useEffect } from 'react';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
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

    // Retrieve token from URL implicitly via AuthContext OR grab it locally.
    // AuthContext's App.tsx check or AuthPage.tsx check would see token in URL.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (!params.get('token')) {
            toast.error('Invalid or missing reset token.');
        }
    }, [toast]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (!token) {
            toast.error('Invalid or missing reset token.');
            return;
        }

        if (!validateForm()) return;
        
        const result = await resetPassword(token, password);
        if (result.success) {
            toast.success('✅ Password has been successfully reset. Please log in.');
            window.history.pushState({}, '', '/');
            onNavigate(ViewState.LOGIN);
        } else {
            toast.error(result.error || 'Something went wrong');
        }
    };

    return (
        <AuthLayout
            onNavigate={onNavigate}
            title="Set New Password"
            subtitle="Enter your new secure password below"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">New Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
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

                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5 mt-3">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`w-full pl-10 pr-12 py-3 bg-slate-50/50 hover:bg-slate-50 border rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-teal-400/10 focus:border-teal-400 outline-none transition-all ${errors.confirmPassword ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}
                            />
                        </div>
                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.confirmPassword}</p>}
                    </motion.div>
                </AnimatePresence>

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
                        className="text-slate-900 font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                    >
                        Back to login
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};
