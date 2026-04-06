import React, { useState } from 'react';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../lib/toast';
import { GoogleLogin } from '@react-oauth/google';
import { ViewState } from '../../types';
import { AuthLayout } from '../AuthLayout';

export const LoginPage: React.FC<{
    onNavigate: (view: ViewState) => void;
}> = ({ onNavigate }) => {
    const { login, googleLogin, isLoading } = useAuth();
    const toast = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!email) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
        if (!password) newErrors.password = 'Password is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const result = await login(email, password);
        if (result.success) {
            toast.success('👋 Welcome back!');
            // App.tsx uses useEffect on `user` state to handle the redirect
        } else {
            toast.error(result.error || 'Something went wrong');
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (!credentialResponse.credential) return;
        // For returning users, the backend will use their existing role from the database
        const result = await googleLogin(credentialResponse.credential);
        if (result.success) toast.success('🎉 Successfully authenticated with Google!');
        else toast.error(result.error || 'Google Authentication failed.');
    };
</text>


    return (
        <AuthLayout
            onNavigate={onNavigate}
            title="Welcome Back"
            subtitle="Sign in to continue your journey"
        >
            <div className="flex justify-center w-full">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error('Google Sign-In failed.')}
                    useOneTap
                    shape="pill"
                    theme="outline"
                    width="420"
                    size="large"
                />
            </div>

            <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">Or continue with</span>
                <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your Email"
                            autoComplete="email"
                            className={`w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-teal-400/10 focus:border-teal-400 outline-none transition-all ${errors.email ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}
                        />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email}</p>}
                </div>

                <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
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

                <div className="flex justify-end pt-1">
                    <button
                        type="button"
                        onClick={() => onNavigate(ViewState.FORGOT_PASSWORD)}
                        className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        Forgot password?
                    </button>
                </div>

                <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: isLoading ? 1 : 1.01 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 shadow-sm shadow-slate-900/20"
                >
                    {isLoading ? <><Loader2 className="animate-spin" size={18} />Signing in...</> : 'Sign In'}
                </motion.button>

                <div className="text-center text-[13px] text-slate-500 mt-6 pt-6 border-t border-slate-100 font-medium">
                    Don't have an account?{' '}
                    <button
                        type="button"
                        onClick={() => onNavigate(ViewState.SIGNUP)}
                        className="text-slate-900 font-bold hover:underline"
                    >
                        Create one
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};
