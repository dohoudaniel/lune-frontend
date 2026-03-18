import React from 'react';
import { Mail, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { ViewState } from '../../types';
import { AuthLayout } from '../AuthLayout';
import { useToast } from '../../lib/toast';

interface CheckEmailProps {
    onNavigate: (view: ViewState) => void;
}

export const CheckEmail: React.FC<CheckEmailProps> = ({ onNavigate }) => {
    const toast = useToast();

    const handleResendEmail = () => {
        toast.info("Resending verification email...");
        // This would typically call an API endpoint to resend
        setTimeout(() => {
            toast.success("Verification email resent! Please check your inbox.");
        }, 1500);
    };

    return (
        <AuthLayout
            onNavigate={onNavigate}
            title="Check your email"
            subtitle="We've sent a verification link to your inbox"
        >
            <div className="space-y-8">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center"
                >
                    <div className="w-16 h-16 bg-white border border-slate-100 shadow-sm text-teal rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Mail size={32} />
                    </div>
                    <p className="text-slate-600 text-[15px] leading-relaxed mb-6">
                        Follow the instructions in the email to activate your account. If you don't see it, please check your <span className="font-bold text-slate-800">Spam</span> or <span className="font-bold text-slate-800">Promotions</span> folder.
                    </p>

                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.open('https://mail.google.com', '_blank')}
                        className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-sm shadow-slate-900/10"
                    >
                        Check Inbox <ExternalLink size={16} />
                    </motion.button>
                </motion.div>

                <div className="space-y-4">
                    <button 
                        onClick={handleResendEmail}
                        className="w-full py-3 bg-white text-slate-600 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={16} />
                        Resend verification email
                    </button>
                    
                    <button 
                        onClick={() => onNavigate(ViewState.LOGIN)}
                        className="w-full py-3 text-slate-500 text-sm font-semibold hover:text-slate-900 transition flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back to sign in
                    </button>
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <p className="text-xs text-center text-slate-400 font-medium">
                        Still having issues? <a href="mailto:support@lune.com" className="text-teal-600 hover:underline font-bold">Contact Support</a>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};
