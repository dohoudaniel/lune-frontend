import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock } from 'lucide-react';
import { ViewState } from '../types';

interface AuthLayoutProps {
    children: React.ReactNode;
    onNavigate: (view: ViewState) => void;
    title: string;
    subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, onNavigate, title, subtitle }) => {
    return (
        <div className="min-h-screen grid lg:grid-cols-2 font-sans bg-white selection:bg-teal selection:text-white">
            {/* Left Side - Brand Features */}
            <div className="hidden lg:flex relative bg-slate-900 overflow-hidden flex-col justify-between p-8 text-white border-r border-slate-800">
                {/* Abstract Background Spheres */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 w-full flex items-center justify-between">
                    <button
                        onClick={() => onNavigate(ViewState.LANDING)}
                        className="flex items-center gap-2 hover:opacity-80 transition"
                    >
                        <div className="bg-white text-black p-1.5 rounded-full">
                            <div className="w-4 h-4 grid grid-cols-2 gap-[1.5px]">
                                <div className="bg-black rounded-full"></div>
                                <div className="bg-black rounded-full"></div>
                                <div className="bg-black rounded-full"></div>
                                <div className="bg-black rounded-full"></div>
                            </div>
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-white">lune</span>
                    </button>
                    <a href="#help" className="text-sm font-medium text-slate-400 hover:text-white transition">Need help?</a>
                </div>

                <div className="relative z-10 max-w-md mt-6 mb-auto pt-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center mb-6"
                    >
                        <ShieldCheck className="text-teal-400" size={28} />
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl font-bold leading-[1.15] mb-4 tracking-tight"
                    >
                        Scale Your Team with <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">Verified Talent.</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-slate-400 text-base mb-12 max-w-[90%] leading-relaxed"
                    >
                        Join thousands of companies and professionals on the world's most trusted skill verification platform.
                    </motion.p>

                    <div className="space-y-6">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex items-start gap-4">
                            <div className="mt-1 w-9 h-9 rounded-xl bg-teal-400/10 flex items-center justify-center border border-teal-400/20 shrink-0">
                                <ShieldCheck className="text-teal-400" size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-base mb-0.5">AI-Verified Skills</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">Military-grade proctoring ensures all assessment results are 100% authentic.</p>
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="flex items-start gap-4">
                            <div className="mt-1 w-9 h-9 rounded-xl bg-orange/10 flex items-center justify-center border border-orange/20 shrink-0">
                                <Lock className="text-orange" size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-base mb-0.5">Secure Identity</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">Verified credentials permanently available on your profile.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Footer on left panel */}
                <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <p>© 2026 Lune Inc.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition">Privacy</a>
                        <a href="#" className="hover:text-white transition">Terms</a>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col relative bg-white">
                {/* Mobile Header */}
                <div className="lg:hidden p-6 absolute top-0 left-0 w-full flex justify-between items-center z-10 backdrop-blur-md bg-white/80 border-b border-gray-100">
                    <button
                        onClick={() => onNavigate(ViewState.LANDING)}
                        className="flex items-center gap-2"
                    >
                        <div className="bg-black text-white p-1.5 rounded-full">
                            <div className="w-3.5 h-3.5 grid grid-cols-2 gap-[1.5px]">
                                <div className="bg-white rounded-full"></div>
                                <div className="bg-white rounded-full"></div>
                                <div className="bg-white rounded-full"></div>
                                <div className="bg-white rounded-full"></div>
                            </div>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-black">lune</span>
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-full max-w-[420px] mt-12 lg:mt-0"
                    >
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{title}</h2>
                            <p className="text-slate-500 text-[15px]">{subtitle}</p>
                        </div>
                        
                        {children}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
