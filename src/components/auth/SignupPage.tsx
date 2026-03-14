import React, { useState } from 'react';
import { Mail, Lock, User, Briefcase, Code, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../lib/toast';
import { GoogleLogin } from '@react-oauth/google';
import { ViewState } from '../../types';
import { AuthLayout } from '../AuthLayout';

export const SignupPage: React.FC<{
    onNavigate: (view: ViewState) => void;
    onSuccess: (role: 'candidate' | 'employer') => void;
}> = ({ onNavigate, onSuccess }) => {
    const { signUp, googleLogin, isLoading } = useAuth();
    const toast = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState<'candidate' | 'employer'>('candidate');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!email) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (!firstName) newErrors.firstName = 'First name is required';
        if (!lastName) newErrors.lastName = 'Last name is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        const result = await signUp(email, password, firstName, lastName, role);
        if (result.success) {
            toast.success('🎉 Registration successful!');
            onNavigate(ViewState.CHECK_EMAIL);
        } else {
            toast.error(result.error || 'Something went wrong');
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (!credentialResponse.credential) return;
        const result = await googleLogin(credentialResponse.credential, role);
        if (result.success) {
            toast.success('🎉 Successfully authenticated with Google!');
            onSuccess(role);
        } else {
            toast.error(result.error || 'Google Authentication failed.');
        }
    };

    return (
        <AuthLayout
            onNavigate={onNavigate}
            title="Create Account"
            subtitle="Join thousands of verified professionals"
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
                    text="signup_with"
                />
            </div>
            
            <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">Or continue with</span>
                <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">First Name</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="John"
                                className={`w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-teal-400/10 focus:border-teal-400 outline-none transition-all ${errors.firstName ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}
                            />
                        </div>
                        {errors.firstName && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.firstName}</p>}
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Last Name</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Doe"
                                className={`w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-teal-400/10 focus:border-teal-400 outline-none transition-all ${errors.lastName ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}
                            />
                        </div>
                        {errors.lastName && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.lastName}</p>}
                    </div>
                </div>

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

                <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Password</label>
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

                <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-2">I am an...</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setRole('candidate')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                role === 'candidate' ? 'border-orange bg-orange/5 text-orange ring-1 ring-orange shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                            }`}
                        >
                            <Code size={22} className={role === 'candidate' ? 'text-orange' : 'text-slate-500'} />
                            <span className={`font-semibold text-sm ${role === 'candidate' ? 'text-orange' : 'text-slate-700'}`}>Candidate</span>
                            <span className="text-xs text-slate-500 font-medium">Get verified</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('employer')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                role === 'employer' ? 'border-teal bg-teal/5 text-teal ring-1 ring-teal shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                            }`}
                        >
                            <Briefcase size={22} className={role === 'employer' ? 'text-teal' : 'text-slate-500'} />
                            <span className={`font-semibold text-sm ${role === 'employer' ? 'text-teal' : 'text-slate-700'}`}>Employer</span>
                            <span className="text-xs text-slate-500 font-medium">Hire talent</span>
                        </button>
                    </div>
                </div>

                <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: isLoading ? 1 : 1.01 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 shadow-sm shadow-slate-900/20"
                >
                    {isLoading ? <><Loader2 className="animate-spin" size={18} />Creating account...</> : 'Create Account'}
                </motion.button>

                <div className="text-center text-[13px] text-slate-500 mt-6 pt-6 border-t border-slate-100 font-medium">
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={() => onNavigate(ViewState.LOGIN)}
                        className="text-slate-900 font-bold hover:underline"
                    >
                        Sign in
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};
