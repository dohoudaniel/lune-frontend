import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader2, CheckCircle, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { ViewState } from '../types';
import { AuthLayout } from './AuthLayout';

interface VerifyEmailProps {
    onNavigate: (view: ViewState) => void;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({ onNavigate }) => {
    const { verifyEmail } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('No verification token found in the URL. Ensure you clicked the right link from your email.');
            return;
        }

        const verify = async () => {
            const res = await verifyEmail(token);
            if (res.success) {
                setStatus('success');
                setMessage('Your email has been successfully verified! You can now access your dashboard and start your journey.');
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            } else {
                setStatus('error');
                setMessage(res.error || 'Failed to verify email. The link might be expired or invalid.');
            }
        };

        verify();
    }, [verifyEmail]);

    return (
        <AuthLayout
            onNavigate={onNavigate}
            title={status === 'loading' ? "Verifying..." : status === 'success' ? "Welcome to Lune!" : "Verification Failed"}
            subtitle={status === 'loading' ? "Please wait while we confirm your identity" : status === 'success' ? "Your account is now fully active" : "Something went wrong during verification"}
        >
            <div className="space-y-8">
                {status === 'loading' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-10"
                    >
                        <div className="relative flex items-center justify-center">
                            <div className="w-16 h-16 border-4 border-slate-100 border-t-teal rounded-full animate-spin"></div>
                            <Loader2 className="w-6 h-6 text-teal animate-pulse absolute" />
                        </div>
                        <p className="mt-8 text-slate-500 font-medium text-center">
                            Securely confirming your credentials...
                        </p>
                    </motion.div>
                )}
                
                {status === 'success' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center"
                    >
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                            <CheckCircle size={40} />
                        </div>
                        <p className="text-slate-600 text-center text-[15px] leading-relaxed mb-8">
                            {message}
                        </p>
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.location.href = '/'}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                        >
                            Go to Dashboard <ArrowRight size={18} />
                        </motion.button>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center"
                    >
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-red-100">
                            <XCircle size={40} />
                        </div>
                        <p className="text-slate-600 text-center text-[15px] leading-relaxed mb-8">
                            {message}
                        </p>
                        <div className="w-full space-y-4">
                            <button 
                                onClick={() => window.location.href = '/'}
                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition"
                            >
                                Return to Homepage
                            </button>
                            <button 
                                onClick={() => onNavigate(ViewState.SIGNUP)}
                                className="w-full py-3 text-slate-500 text-sm font-semibold hover:text-slate-900 transition underline underline-offset-4"
                            >
                                Contact Support
                            </button>
                        </div>
                    </motion.div>
                )}

                <div className="pt-8 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
                    <ShieldCheck size={14} />
                    <span className="text-xs font-medium tracking-wide uppercase">Secure Verification System</span>
                </div>
            </div>
        </AuthLayout>
    );
};
