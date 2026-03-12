import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const VerifyEmail: React.FC = () => {
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
                setMessage('Your email has been successfully verified! Redirecting to the dashboard...');
                setTimeout(() => {
                    // Redirect will ideally be picked up by App.tsx since auth state changes
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
        <div className="min-h-screen flex items-center justify-center bg-cream">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full text-center"
            >
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-teal animate-spin mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email...</h2>
                        <p className="text-gray-500">Please wait while we confirm your email address.</p>
                    </div>
                )}
                
                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                        <p className="text-gray-500 mb-6">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                        <p className="text-gray-500 mb-6">{message}</p>
                        <button 
                            onClick={() => window.location.href = '/'}
                            className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition"
                        >
                            Return Home
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
