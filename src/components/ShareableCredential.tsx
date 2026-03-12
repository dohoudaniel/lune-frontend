import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Award, Download, Share2, ExternalLink, Copy, CheckCircle,
    Linkedin, Twitter, Github, Globe, QrCode, X, Sparkles,
    Shield, Calendar, Hash, Link2, Code2, Eye
} from 'lucide-react';

interface SkillBadgeProps {
    skill: string;
    score: number;
    difficulty: string;
    recipientName: string;
    issuedAt: Date;
    certificateId: string;
    blockchainHash?: string;
}

interface ShareableCredentialProps {
    credential: SkillBadgeProps;
    onClose?: () => void;
}

// Generate SVG badge
const generateBadgeSVG = (skill: string, score: number, difficulty: string, name: string): string => {
    const colors = {
        'Beginner': { primary: '#10B981', secondary: '#D1FAE5' },
        'Mid-Level': { primary: '#3B82F6', secondary: '#DBEAFE' },
        'Advanced': { primary: '#8B5CF6', secondary: '#EDE9FE' }
    };
    const color = colors[difficulty as keyof typeof colors] || colors['Mid-Level'];

    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#1E1B4B"/>
                    <stop offset="100%" style="stop-color:#312E81"/>
                </linearGradient>
                <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${color.primary}"/>
                    <stop offset="100%" style="stop-color:${color.primary}88"/>
                </linearGradient>
            </defs>
            
            <!-- Background -->
            <rect width="400" height="500" rx="24" fill="url(#bg)"/>
            
            <!-- Border -->
            <rect x="2" y="2" width="396" height="496" rx="22" fill="none" stroke="${color.primary}" stroke-width="2" opacity="0.3"/>
            
            <!-- Decorative pattern -->
            <circle cx="350" cy="50" r="80" fill="${color.primary}" opacity="0.1"/>
            <circle cx="50" cy="450" r="60" fill="${color.primary}" opacity="0.1"/>
            
            <!-- Lune Logo -->
            <text x="200" y="50" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="bold" opacity="0.7">LUNE</text>
            
            <!-- Badge Icon -->
            <circle cx="200" cy="150" r="60" fill="url(#accent)"/>
            <text x="200" y="165" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="36" font-weight="bold">${score}</text>
            
            <!-- Skill Name -->
            <text x="200" y="250" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="bold">${skill}</text>
            
            <!-- Difficulty -->
            <rect x="140" y="270" width="120" height="30" rx="15" fill="${color.secondary}" opacity="0.2"/>
            <text x="200" y="292" text-anchor="middle" fill="${color.primary}" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${difficulty}</text>
            
            <!-- Recipient -->
            <text x="200" y="350" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="20">${name}</text>
            
            <!-- Verified Badge -->
            <circle cx="200" cy="400" r="20" fill="${color.primary}"/>
            <path d="M191 400 L197 406 L209 394" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            
            <!-- Footer -->
            <text x="200" y="460" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" opacity="0.5">Verified on Blockchain</text>
            <text x="200" y="480" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" opacity="0.3">lune.platform/verify</text>
        </svg>
    `;
};

// Generate QR Code (simplified - in production use a library)
const generateQRPlaceholder = (url: string): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
};

export const ShareableCredential: React.FC<ShareableCredentialProps> = ({
    credential,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<'preview' | 'share' | 'embed'>('preview');
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const badgeRef = useRef<HTMLDivElement>(null);

    const verifyUrl = `https://lune.platform/verify/${credential.certificateId}`;
    const badgeSVG = generateBadgeSVG(
        credential.skill,
        credential.score,
        credential.difficulty,
        credential.recipientName
    );

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = (format: 'svg' | 'png') => {
        if (format === 'svg') {
            const blob = new Blob([badgeSVG], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lune-${credential.skill.toLowerCase()}-badge.svg`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            // For PNG, we'd need canvas conversion
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 400;
                canvas.height = 500;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const pngUrl = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = pngUrl;
                    a.download = `lune-${credential.skill.toLowerCase()}-badge.png`;
                    a.click();
                }
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(badgeSVG);
        }
    };

    const shareToLinkedIn = () => {
        const text = `I just earned a verified ${credential.skill} certification on Lune with a score of ${credential.score}%! 🎉 #LuneVerified #${credential.skill.replace(/\s/g, '')}`;
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;
        window.open(url, '_blank');
    };

    const shareToTwitter = () => {
        const text = `I just earned a verified ${credential.skill} certification on @LunePlatform with a score of ${credential.score}%! 🚀 #LuneVerified`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(verifyUrl)}`;
        window.open(url, '_blank');
    };

    const embedCode = `<a href="${verifyUrl}" target="_blank"><img src="https://lune.platform/badges/${credential.certificateId}.svg" alt="Lune ${credential.skill} Certification" width="200" /></a>`;

    const markdownBadge = `[![Lune ${credential.skill} Certification](https://lune.platform/badges/${credential.certificateId}-small.svg)](${verifyUrl})`;

    return (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Skill Verification Badge</h2>
                            <p className="text-indigo-200 text-sm">Share your verified credential</p>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex">
                    {[
                        { id: 'preview', label: 'Preview', icon: Eye },
                        { id: 'share', label: 'Share', icon: Share2 },
                        { id: 'embed', label: 'Embed', icon: Code2 }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 px-4 py-3 font-medium text-sm flex items-center justify-center gap-2 transition ${activeTab === tab.id
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {/* Preview Tab */}
                    {activeTab === 'preview' && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-center"
                        >
                            <div
                                ref={badgeRef}
                                className="inline-block rounded-2xl overflow-hidden shadow-lg mb-6"
                                dangerouslySetInnerHTML={{ __html: badgeSVG }}
                            />

                            <div className="flex justify-center gap-3 mb-6">
                                <button
                                    onClick={() => handleDownload('svg')}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    SVG
                                </button>
                                <button
                                    onClick={() => handleDownload('png')}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    PNG
                                </button>
                            </div>

                            {/* Verification Details */}
                            <div className="bg-gray-50 rounded-xl p-4 text-left">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Certificate ID</p>
                                        <p className="font-mono text-gray-900">{credential.certificateId}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Issued</p>
                                        <p className="text-gray-900">{credential.issuedAt.toLocaleDateString()}</p>
                                    </div>
                                    {credential.blockchainHash && (
                                        <div className="col-span-2">
                                            <p className="text-gray-500">Blockchain Hash</p>
                                            <p className="font-mono text-gray-900 text-xs truncate">{credential.blockchainHash}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Share Tab */}
                    {activeTab === 'share' && (
                        <motion.div
                            key="share"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {/* Share Buttons */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    onClick={shareToLinkedIn}
                                    className="px-4 py-4 bg-[#0077B5] text-white rounded-xl font-medium hover:opacity-90 flex items-center justify-center gap-2"
                                >
                                    <Linkedin className="w-5 h-5" />
                                    Share on LinkedIn
                                </button>
                                <button
                                    onClick={shareToTwitter}
                                    className="px-4 py-4 bg-[#1DA1F2] text-white rounded-xl font-medium hover:opacity-90 flex items-center justify-center gap-2"
                                >
                                    <Twitter className="w-5 h-5" />
                                    Share on Twitter
                                </button>
                            </div>

                            {/* Verification Link */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Link</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={verifyUrl}
                                        readOnly
                                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
                                    />
                                    <button
                                        onClick={() => handleCopy(verifyUrl)}
                                        className={`px-4 py-2 rounded-lg font-medium transition ${copied ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="text-center">
                                <button
                                    onClick={() => setShowQR(!showQR)}
                                    className="px-4 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg flex items-center gap-2 mx-auto"
                                >
                                    <QrCode className="w-5 h-5" />
                                    {showQR ? 'Hide' : 'Show'} QR Code
                                </button>

                                <AnimatePresence>
                                    {showQR && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4"
                                        >
                                            <img
                                                src={generateQRPlaceholder(verifyUrl)}
                                                alt="QR Code"
                                                className="mx-auto rounded-xl shadow-lg"
                                            />
                                            <p className="text-sm text-gray-500 mt-2">Scan to verify credential</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}

                    {/* Embed Tab */}
                    {activeTab === 'embed' && (
                        <motion.div
                            key="embed"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* HTML Embed */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    HTML Embed Code
                                </label>
                                <div className="relative">
                                    <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-sm overflow-x-auto">
                                        {embedCode}
                                    </pre>
                                    <button
                                        onClick={() => handleCopy(embedCode)}
                                        className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>

                            {/* Markdown Badge */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Github className="w-4 h-4" />
                                    GitHub README Badge
                                </label>
                                <div className="relative">
                                    <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-sm overflow-x-auto">
                                        {markdownBadge}
                                    </pre>
                                    <button
                                        onClick={() => handleCopy(markdownBadge)}
                                        className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>

                            {/* Preview */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                                <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4">
                                    <div className="w-20 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                        {credential.score}%
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-medium text-gray-900">{credential.skill} • {credential.difficulty}</p>
                                        <p className="text-gray-500">Verified by Lune</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ShareableCredential;
