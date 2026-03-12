import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Users, Menu, X, Globe, Lock, Zap, Briefcase } from 'lucide-react';
import { ViewState, UserRole } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

import { SEO } from './SEO';

interface LandingProps {
    onNavigate: (view: ViewState, role?: UserRole) => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Structured Data for the Organization
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Lune",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "description": "Blockchain-powered skill verification and AI-driven talent assessment platform.",
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "1250"
        }
    };

    // Animation variants
    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    };

    const staggerContainer = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const floatAnimation = {
        animate: {
            y: [0, -15, 0],
            transition: {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut" as const
            }
        }
    };

    return (
        <div className="min-h-screen bg-cream font-sans selection:bg-teal selection:text-white flex flex-col overflow-x-hidden">
            <SEO
                title="Lune | AI-Verified Talent Platform"
                description="Hire pre-vetted Virtual Assistants and Operations talent. Lune uses AI scenarios and blockchain verification to ensure 100% authentic skills."
                keywords="hiring platform, virtual assistant, skill verification, blockchain credentials, AI assessment"
                structuredData={structuredData}
            />
            {/* Header */}
            <nav className="px-6 md:px-8 py-6 flex justify-between items-center max-w-7xl mx-auto w-full relative z-50">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                >
                    <div className="bg-black text-white p-1.5 rounded-full">
                        <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                            <div className="bg-white rounded-full"></div>
                            <div className="bg-white rounded-full"></div>
                            <div className="bg-white rounded-full"></div>
                            <div className="bg-white rounded-full"></div>
                        </div>
                    </div>
                    <span className="font-bold text-2xl tracking-tight">lune</span>
                </motion.div>

                {/* Desktop Nav */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="hidden md:flex gap-8 text-sm font-medium text-slate-600"
                >
                    <a href="#features" className="hover:text-black transition">Features</a>
                    <a href="#how-it-works" className="hover:text-black transition">How it Works</a>
                    <a href="#solution" className="hover:text-black transition">For Business</a>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden md:flex gap-4"
                >
                    <button onClick={() => onNavigate(ViewState.LOGIN)} className="text-sm font-semibold px-4 py-2 hover:bg-gray-200 rounded-lg transition">Log in</button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNavigate(ViewState.SIGNUP)}
                        className="bg-black text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-gray-800 transition"
                    >
                        Sign up
                    </motion.button>
                </motion.div>

                {/* Mobile Menu Toggle */}
                <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden absolute top-20 left-0 w-full bg-white shadow-lg py-4 px-6 flex flex-col gap-4 z-40 border-b border-gray-100 overflow-hidden"
                    >
                        <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 font-medium">Features</a>
                        <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 font-medium">How it Works</a>
                        <hr className="border-gray-100" />
                        <button onClick={() => onNavigate(ViewState.LOGIN)} className="text-left font-semibold py-2">Log in</button>
                        <button onClick={() => onNavigate(ViewState.SIGNUP)} className="bg-black text-white font-semibold py-3 rounded-lg text-center">Sign up</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                    {/* Left Geometric Grid - Animated */}
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="hidden lg:grid lg:col-span-5 grid-cols-2 gap-4"
                    >
                        {/* Card 1: Verification Badge */}
                        <motion.div variants={floatAnimation} className="bg-[#8AA8A1] rounded-t-full rounded-b-2xl p-6 flex flex-col items-center justify-center text-center aspect-square shadow-lg">
                            <ShieldCheck className="text-teal-900 w-16 h-16" />
                        </motion.div>

                        {/* Card 2: Orange Circle */}
                        <motion.div
                            variants={floatAnimation}
                            animate={{ y: [0, 15, 0] }} // Reverse float
                            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" as const }}
                            className="bg-orange rounded-full aspect-square shadow-lg"
                        ></motion.div>

                        {/* Card 3: Pattern */}
                        <motion.div
                            variants={floatAnimation}
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" as const, delay: 1 }}
                            className="bg-white rounded-2xl aspect-square flex items-center justify-center p-4 relative overflow-hidden shadow-sm"
                        >
                            <div className="absolute inset-0 grid grid-cols-4 gap-2 p-4 opacity-20">
                                {Array.from({ length: 16 }).map((_, i) => (
                                    <div key={i} className="bg-orange h-full w-full rounded-full"></div>
                                ))}
                            </div>
                            <ArrowRight className="text-orange w-12 h-12 -rotate-45 relative z-10" />
                        </motion.div>

                        {/* Card 4: Teal Squiggle */}
                        <motion.div
                            variants={floatAnimation}
                            animate={{ y: [0, 20, 0] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" as const, delay: 0.5 }}
                            className="bg-darkblue rounded-2xl aspect-square flex items-center justify-center rounded-tr-[100px] shadow-lg"
                        >
                            <svg className="w-24 h-24 text-white/50" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4">
                                <path d="M10 50 C 30 20, 70 20, 90 50 C 70 80, 30 80, 10 50" />
                                <path d="M10 30 C 30 0, 70 0, 90 30" className="opacity-50" />
                                <path d="M10 70 C 30 100, 70 100, 90 70" className="opacity-50" />
                            </svg>
                        </motion.div>
                    </motion.div>

                    {/* Right Content */}
                    <div className="lg:col-span-7 flex flex-col justify-center lg:pl-12">
                        <motion.h1
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            className="text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.1] tracking-tight text-slate-900 mb-6 text-center lg:text-left"
                        >
                            Scale Your Team with <br />
                            <span className="text-slate-700">Verified VAs & Ops</span>
                        </motion.h1>

                        <motion.p
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: 0.2 }}
                            className="text-slate-600 text-lg mb-8 text-center lg:text-left max-w-2xl mx-auto lg:mx-0"
                        >
                            Stop guessing soft skills. Hire Virtual Assistants, Customer Support, and Operations talent with AI-verified communication and scenario assessments.
                        </motion.p>

                        <motion.div
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: 0.4 }}
                            className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start mb-12"
                        >
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onNavigate(ViewState.SIGNUP)}
                                className="bg-black text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition w-full sm:w-auto shadow-xl shadow-orange/10 hover:shadow-2xl hover:shadow-orange/20"
                            >
                                Get Started
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 rounded-xl font-semibold text-lg border border-slate-300 hover:bg-white hover:border-slate-400 transition w-full sm:w-auto"
                            >
                                Book Demo
                            </motion.button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="flex items-center gap-4 mb-12 justify-center lg:justify-start"
                        >
                            <div className="flex -space-x-4">
                                <img src="https://picsum.photos/60/60?1" className="w-12 h-12 rounded-full border-2 border-cream object-cover" alt="User" />
                                <img src="https://picsum.photos/60/60?2" className="w-12 h-12 rounded-full border-2 border-cream object-cover" alt="User" />
                                <img src="https://picsum.photos/60/60?3" className="w-12 h-12 rounded-full border-2 border-cream object-cover" alt="User" />
                                <div className="w-12 h-12 rounded-full border-2 border-cream bg-teal text-white flex items-center justify-center text-xs font-bold">+5k</div>
                            </div>
                            <div>
                                <p className="text-slate-900 font-bold text-sm">Verified Professionals</p>
                                <p className="text-slate-500 text-xs">Ready to work immediately</p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Trusted Companies Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="mt-16 border-t border-gray-200 pt-10"
                >
                    <p className="text-center text-slate-500 text-sm font-semibold uppercase tracking-widest mb-8">Trusted by leading innovators</p>
                    <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {['Google', 'Airbnb', 'Stripe', 'Vercel', 'Shopify'].map((company, index) => (
                            <motion.span
                                key={company}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="text-2xl font-bold text-slate-800"
                            >
                                {company}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>

                {/* How It Works Section */}
                <div id="how-it-works" className="mt-32 scroll-mt-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-3xl mx-auto mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How Lune Works</h2>
                        <p className="text-slate-600 text-lg">We verify the skills that matter most for remote roles: communication, organization, and reliability.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                        {/* For Candidates */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="bg-orange/10 p-2 rounded-lg">
                                    <Users className="text-orange w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">For Candidates</h3>
                            </div>

                            <div className="space-y-8 relative">
                                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100"></div>

                                {[
                                    { title: 'Select a Role', desc: 'Choose from distinct tracks: Virtual Assistant, Customer Support, Sales, or Project Management.' },
                                    { title: 'Scenario Assessment', desc: 'Face real-world inbox simulations, calendar management tasks, and detailed role-play scenarios.' },
                                    { title: 'Get Verified', desc: 'Pass the assessment to mint your detailed Skill Passport on-chain, proving your soft skills instantly.' }
                                ].map((step, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 + (i * 0.2) }}
                                        className="flex gap-6 relative"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-orange text-white flex items-center justify-center font-bold text-sm flex-shrink-0 z-10">{i + 1}</div>
                                        <div>
                                            <h4 className="font-bold text-lg mb-1">{step.title}</h4>
                                            <p className="text-gray-500 text-sm">{step.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* For Employers */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="bg-teal/10 p-2 rounded-lg">
                                    <Briefcase className="text-teal w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">For Employers</h3>
                            </div>

                            <div className="space-y-8 relative">
                                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100"></div>

                                {[
                                    { title: 'Post a Requirement', desc: 'Specify needs like "English C1", "Zendesk Expert", or "Executive Calendar Management".' },
                                    { title: 'Match by Temperament', desc: 'Our AI matches candidates not just on skills, but on communication style and situational judgment.' },
                                    { title: 'Hire with Certainty', desc: 'View video intros and verified work samples before you even interview.' }
                                ].map((step, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 + (i * 0.2) }}
                                        className="flex gap-6 relative"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm flex-shrink-0 z-10">{i + 1}</div>
                                        <div>
                                            <h4 className="font-bold text-lg mb-1">{step.title}</h4>
                                            <p className="text-gray-500 text-sm">{step.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Why Lune? / Simulations Section */}
                <div className="mt-24 md:mt-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-3xl mx-auto mb-16"
                    >
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Beyond the Resume: Real-World Simulations</h2>
                        <p className="text-slate-600">We don't ask hypothetical questions. We put candidates in the driver's seat of their future role.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-4 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-cream rounded-3xl p-6 border border-indigo-100 relative overflow-hidden group hover:border-indigo-300 transition-colors"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <div className="w-20 h-20 bg-indigo-500 rounded-full blur-2xl"></div>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm text-indigo-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /><path d="M12 17v-3" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Typing Speed Test</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Real-time WPM and accuracy tracking. Target: 40+ WPM with 95% accuracy.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-cream rounded-3xl p-6 border border-green-100 relative overflow-hidden group hover:border-green-300 transition-colors"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <div className="w-20 h-20 bg-green-500 rounded-full blur-2xl"></div>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm text-green-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h8" /><path d="M8 17h8" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Google Workspace</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Docs, Sheets, Slides, Calendar & Gmail proficiency assessment.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-cream rounded-3xl p-6 border border-blue-100 relative overflow-hidden group hover:border-blue-300 transition-colors"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <div className="w-20 h-20 bg-blue-500 rounded-full blur-2xl"></div>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Email Communication</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Respond to real scenarios. AI scores tone, clarity, and professionalism.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="bg-cream rounded-3xl p-6 border border-purple-100 relative overflow-hidden group hover:border-purple-300 transition-colors"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <div className="w-20 h-20 bg-purple-500 rounded-full blur-2xl"></div>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm text-purple-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Document Drafting</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Write memos, summaries, and SOPs. Scored for clarity and format.
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* Features Section */}
                <div id="features" className="mt-24 md:mt-32 scroll-mt-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-3xl mx-auto mb-16"
                    >
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">The Future of Hiring is Verified</h2>
                        <p className="text-slate-600">We combine AI's advanced reasoning with PWR Chain's immutability to create a hiring platform you can trust.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Zap, color: 'purple', title: 'Situational Judgment', desc: 'We test how candidates handle angry customers, scheduling conflicts, and ethical dilemmas in real-time.' },
                            { icon: Lock, color: 'blue', title: 'Verified Identity', desc: 'Multi-factor identity verification ensures the person you interview is the person you hire.' },
                            { icon: Globe, color: 'green', title: 'Communication Analysis', desc: 'Our AI evaluates spoken and written English proficiency, tone, and empathy scores.' }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group cursor-pointer"
                            >
                                <div className={`w-12 h-12 bg-${feature.color}-100 rounded-2xl flex items-center justify-center mb-6 text-${feature.color}-600 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300`}>
                                    <feature.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Stats Section */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mt-24 bg-darkblue rounded-[3rem] p-12 md:p-24 text-white text-center overflow-hidden relative"
                >
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="grid grid-cols-6 gap-4 h-full">
                            {Array.from({ length: 24 }).map((_, i) => <div key={i} className="bg-white rounded-full aspect-square"></div>)}
                        </div>
                    </div>

                    <div className="relative z-10 max-w-4xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold mb-12">Join the movement</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { val: '14k+', label: 'VAs Verified', color: 'text-orange' },
                                { val: '48h', label: 'Time to Hire', color: 'text-teal-300' },
                                { val: '92%', label: 'Retention Rate', color: 'text-orange' },
                                { val: '24/7', label: 'Global Coverage', color: 'text-teal-300' }
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, type: "spring" }}
                                >
                                    <div className={`text-4xl font-bold mb-2 ${stat.color}`}>{stat.val}</div>
                                    <div className="text-sm text-gray-300 uppercase tracking-wider">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
                {/* Available Roles Section */}
                <div className="mt-24 md:mt-32">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Roles We Verify</h2>
                        <p className="text-slate-600">Comprehensive assessment tracks for both technical and operations talent.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { name: 'Frontend Engineer', icon: Globe, color: 'blue' },
                            { name: 'Backend Engineer', icon: Briefcase, color: 'purple' }, // Assuming Briefcase for backend
                            { name: 'Data Scientist', icon: Zap, color: 'green' }, // Assuming Zap/Lightning for complex/data
                            { name: 'UI/UX Designer', icon: Users, color: 'pink' }, // Users/Design team
                            { name: 'Virtual Assistant', icon: Users, color: 'orange' },
                            { name: 'Customer Support', icon: Users, color: 'teal' },
                            { name: 'Project Manager', icon: Briefcase, color: 'yellow' },
                            { name: 'QA Engineer', icon: ShieldCheck, color: 'red' }
                        ].map((role, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-black/10 hover:shadow-md transition cursor-pointer flex flex-col items-center text-center group"
                            >
                                <div className={`w-12 h-12 bg-${role.color}-50 rounded-xl flex items-center justify-center mb-4 text-${role.color}-600 group-hover:scale-110 transition`}>
                                    <role.icon size={20} />
                                </div>
                                <h3 className="font-bold text-slate-900">{role.name}</h3>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Technology Deep Dive: Anti-Cheating & Blockchain */}
                <div className="mt-32">
                    <div className="bg-slate-900 rounded-[3rem] p-8 md:p-20 text-white overflow-hidden relative">
                        {/* Abstract background shapes */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">Ironclad Integrity via <span className="text-teal-400">AI</span> & <span className="text-orange">Blockchain</span>.</h2>
                                <p className="text-slate-300 text-lg mb-12 leading-relaxed">
                                    We combine military-grade proctoring with immutable blockchain records to create the world's most trusted skill verification system.
                                </p>

                                <div className="space-y-8">
                                    <div className="flex gap-6">
                                        <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 border border-teal/20">
                                            <ShieldCheck className="text-teal-400" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2">Advanced Anti-Cheating</h4>
                                            <p className="text-slate-400 text-sm">
                                                Our AI monitors 50+ signals including gaze tracking, tab switching, copy-paste patterns, and unauthorized device presence to ensure 100% authentic results.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-6">
                                        <div className="w-12 h-12 rounded-full bg-orange/10 flex items-center justify-center flex-shrink-0 border border-orange/20">
                                            <Lock className="text-orange" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2">PWR Chain Verification</h4>
                                            <p className="text-slate-400 text-sm">
                                                Passing scores are instantly minted as Soulbound Tokens (SBTs) on the PWR Chain. These credentials are tamper-proof and universally verifiable by any employer.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
                            >
                                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    </div>
                                    <div className="text-xs font-mono text-slate-400">Proctoring_Log.json</div>
                                </div>
                                <div className="space-y-4 font-mono text-xs">
                                    <div className="flex justify-between text-green-400">
                                        <span>[14:20:01]</span>
                                        <span>Assessment Started</span>
                                    </div>
                                    <div className="flex justify-between text-slate-300">
                                        <span>[14:22:15]</span>
                                        <span>Gaze Tracking Active</span>
                                    </div>
                                    <div className="flex justify-between text-red-400">
                                        <span>[14:25:30]</span>
                                        <span>⚠ Alt-Tab Detected (Warning 1/3)</span>
                                    </div>
                                    <div className="flex justify-between text-slate-300">
                                        <span>[14:28:45]</span>
                                        <span>Typing Pattern Analysis: Normal</span>
                                    </div>
                                    <div className="flex justify-between text-teal-400">
                                        <span>[14:45:00]</span>
                                        <span>Assessment Submitted</span>
                                    </div>
                                    <div className="border-t border-white/10 pt-4 mt-4">
                                        <div className="flex items-center gap-2 text-orange mb-2">
                                            <Lock size={12} />
                                            <span>Minting to Block #892910...</span>
                                        </div>
                                        <div className="bg-black/30 p-3 rounded text-slate-500 break-all">
                                            0x7f9a...3b2d
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="bg-white pt-16 pb-8 px-8 border-t border-gray-100">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-black text-white p-1.5 rounded-full">
                                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                                    <div className="bg-white rounded-full"></div>
                                    <div className="bg-white rounded-full"></div>
                                    <div className="bg-white rounded-full"></div>
                                    <div className="bg-white rounded-full"></div>
                                </div>
                            </div>
                            <span className="font-bold text-xl">lune</span>
                        </div>
                        <p className="text-gray-500 text-sm">Empowering the world's workforce through transparent skill verification.</p>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4">Platform</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href="#" className="hover:text-black">For Candidates</a></li>
                            <li><a href="#" className="hover:text-black">For Employers</a></li>
                            <li><a href="#" className="hover:text-black">Pricing</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href="#" className="hover:text-black">About Us</a></li>
                            <li><a href="#" className="hover:text-black">Careers</a></li>
                            <li><a href="#" className="hover:text-black">Blog</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href="#" className="hover:text-black">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-black">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between text-xs text-gray-400">
                    <p>© 2026 Lune Inc. All rights reserved.</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <span>Twitter</span>
                        <span>LinkedIn</span>
                        <span>GitHub</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};