import React from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { ViewState } from '../../types';

interface CheckEmailProps {
    onNavigate: (view: ViewState) => void;
}

export const CheckEmail: React.FC<CheckEmailProps> = ({ onNavigate }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-cream px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full text-center"
            >
                <div className="w-20 h-20 bg-teal/10 text-teal rounded-full flex items-center justify-center mx-auto mb-8">
                    <Mail size={40} />
                </div>
                
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Check your email</h2>
                <p className="text-slate-500 mb-8 font-medium">
                    We've sent a verification link to your email address. 
                    Please follow the instructions in the email to activate your account.
                </p>

                <div className="space-y-4">
                    <button 
                        onClick={() => window.location.href = 'mailto:'}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
                    >
                        Open Email App
                    </button>
                    
                    <button 
                        onClick={() => onNavigate(ViewState.LOGIN)}
                        className="w-full py-4 bg-white text-slate-900 font-bold rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        Back to Login
                    </button>
                </div>

                <p className="mt-8 text-sm text-slate-400 font-medium">
                    Didn't receive an email? Check your spam folder or contact support.
                </p>
            </motion.div>
        </div>
    );
};
