import React, { useState } from 'react';
import { Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../lib/toast';
import { ViewState } from '../../types';
import { AuthLayout } from '../AuthLayout';

export const ForgotPasswordPage: React.FC<{
    onNavigate: (view: ViewState) => void;
}> = ({ onNavigate }) => {
    const { requestPasswordReset, isLoading } = useAuth();
    const toast = useToast();

    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [sent, setSent] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!email) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const result = await requestPasswordReset(email);
        if (result.success) {
            setSent(true);
        } else {
            toast.error(result.error || 'Something went wrong. Please try again.');
        }
    };

    return (
        <AuthLayout
            onNavigate={onNavigate}
            title={sent ? 'Check Your Email' : 'Reset Password'}
            subtitle={sent ? `We sent a reset link to ${email}` : 'Enter your email to receive a reset link'}
        >
            <AnimatePresence mode="wait">
                {sent ? (
                    <motion.div
                        key="sent"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-5"
                    >
                        <div className="flex flex-col items-center gap-3 py-4">
                            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                                <CheckCircle className="text-emerald-500" size={28} />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-sm font-semibold text-slate-800">Reset link sent!</p>
                                <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                                    If an account exists for <span className="font-semibold text-slate-700">{email}</span>, you'll receive a link to reset your password within a few minutes.
                                </p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
                            <span className="font-semibold">Don't see the email?</span> Check your spam or junk folder. The link expires in <span className="font-semibold">1 hour</span>.
                        </div>

                        <button
                            type="button"
                            onClick={() => { setSent(false); setEmail(''); }}
                            className="w-full py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                        >
                            Try a different email
                        </button>

                        <div className="text-center pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => onNavigate(ViewState.LOGIN)}
                                className="text-[13px] font-bold text-slate-900 hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                                <ArrowLeft size={13} /> Back to login
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.form
                        key="form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className={`w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-teal-400/10 focus:border-teal-400 outline-none transition-all ${errors.email ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email}</p>}
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: isLoading ? 1 : 1.01 }}
                            whileTap={{ scale: isLoading ? 1 : 0.98 }}
                            className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 shadow-sm shadow-slate-900/20"
                        >
                            {isLoading ? <><Loader2 className="animate-spin" size={18} />Sending link...</> : 'Send Reset Link'}
                        </motion.button>

                        <div className="text-center text-[13px] text-slate-500 mt-6 pt-6 border-t border-slate-100 font-medium">
                            <button
                                type="button"
                                onClick={() => onNavigate(ViewState.LOGIN)}
                                className="text-slate-900 font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                                <ArrowLeft size={13} /> Back to login
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </AuthLayout>
    );
};
