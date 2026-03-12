import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download, Share2, ExternalLink, Copy, Check,
    Twitter, Linkedin, Award, Shield, QrCode
} from 'lucide-react';
import {
    CertificateData,
    generateCertificateBadge,
    downloadCertificate,
    generateShareText,
    generateShareableLink,
    generateNFTMetadata
} from '../services/certificateBadgeService';

interface CertificateBadgeProps {
    certificate: CertificateData;
    onClose?: () => void;
}

export const CertificateBadge: React.FC<CertificateBadgeProps> = ({
    certificate,
    onClose
}) => {
    const [svgContent, setSvgContent] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const svg = generateCertificateBadge(certificate);
        setSvgContent(svg);
    }, [certificate]);

    const handleDownload = async (format: 'svg' | 'png') => {
        setDownloading(true);
        try {
            await downloadCertificate(certificate, format);
        } finally {
            setDownloading(false);
        }
    };

    const handleCopyLink = () => {
        const link = generateShareableLink(certificate.blockchainHash);
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = (platform: 'twitter' | 'linkedin') => {
        const shareText = generateShareText(certificate);
        const link = generateShareableLink(certificate.blockchainHash);

        if (platform === 'twitter') {
            window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.twitter)}`,
                '_blank'
            );
        } else {
            window.open(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
                '_blank'
            );
        }
    };

    const shortHash = certificate.blockchainHash.slice(0, 8) + '...' + certificate.blockchainHash.slice(-6);

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-lg mx-auto">
            {/* Badge Display */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-64"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                />
            </div>

            {/* Details */}
            <div className="p-6 space-y-6">
                {/* Certificate Info */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
                        <Shield className="w-4 h-4" />
                        Blockchain Verified
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{certificate.skill} Certificate</h2>
                    <p className="text-gray-500 mt-1">{certificate.difficulty} Level</p>
                </div>

                {/* Score Display */}
                <div className="flex justify-center">
                    <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="8"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                fill="none"
                                stroke={certificate.score >= 80 ? '#10b981' : certificate.score >= 60 ? '#f59e0b' : '#ef4444'}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${certificate.score * 2.51} 251`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-900">{certificate.score}</span>
                        </div>
                    </div>
                </div>

                {/* Blockchain Hash */}
                <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">PWRCHAIN Hash</p>
                            <p className="font-mono text-sm text-gray-900 mt-1">{shortHash}</p>
                        </div>
                        <button
                            onClick={() => window.open(`https://explorer.pwrlabs.io/tx/${certificate.blockchainHash}`, '_blank')}
                            className="p-2 hover:bg-gray-200 rounded-lg transition"
                        >
                            <ExternalLink className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Recipient & Date */}
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Awarded To</p>
                        <p className="font-medium text-gray-900 mt-1">{certificate.recipientName}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Issue Date</p>
                        <p className="font-medium text-gray-900 mt-1">
                            {certificate.issuedAt.toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    {/* Download Buttons */}
                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDownload('png')}
                            disabled={downloading}
                            className="flex-1 py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            Download PNG
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDownload('svg')}
                            disabled={downloading}
                            className="py-3 px-4 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition"
                        >
                            SVG
                        </motion.button>
                    </div>

                    {/* Share Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleCopyLink}
                            className="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-green-500" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copy Link
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => handleShare('twitter')}
                            className="p-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 transition"
                        >
                            <Twitter className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => handleShare('linkedin')}
                            className="p-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition"
                        >
                            <Linkedin className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* NFT Info */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Award className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">NFT-Ready Certificate</p>
                            <p className="text-sm text-gray-600 mt-1">
                                This certificate is stored on PWRCHAIN and can be verified by anyone.
                                Metadata is compatible with OpenSea and other NFT marketplaces.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Close Button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-gray-500 hover:text-gray-700 transition font-medium"
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * Mini Certificate Badge for list displays
 */
interface MiniBadgeProps {
    skill: string;
    score: number;
    difficulty: 'Beginner' | 'Mid-Level' | 'Advanced';
    onClick?: () => void;
}

export const MiniCertificateBadge: React.FC<MiniBadgeProps> = ({
    skill,
    score,
    difficulty,
    onClick
}) => {
    const getDifficultyColor = () => {
        switch (difficulty) {
            case 'Beginner': return 'from-green-500 to-emerald-500';
            case 'Mid-Level': return 'from-blue-500 to-indigo-500';
            case 'Advanced': return 'from-amber-500 to-orange-500';
        }
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 cursor-pointer group"
        >
            <div className="flex items-center gap-4">
                {/* Score Circle */}
                <div className="relative w-14 h-14">
                    <svg className="w-14 h-14 transform -rotate-90">
                        <circle
                            cx="28"
                            cy="28"
                            r="24"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="4"
                        />
                        <circle
                            cx="28"
                            cy="28"
                            r="24"
                            fill="none"
                            stroke="url(#miniGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${score * 1.5} 150`}
                        />
                        <defs>
                            <linearGradient id="miniGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{ stopColor: '#10b981' }} />
                                <stop offset="100%" style={{ stopColor: '#34d399' }} />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold">{score}</span>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                    <p className="text-white font-bold">{skill}</p>
                    <div className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r ${getDifficultyColor()} text-white`}>
                        {difficulty}
                    </div>
                </div>

                {/* Verified Badge */}
                <div className="opacity-0 group-hover:opacity-100 transition">
                    <Shield className="w-5 h-5 text-green-400" />
                </div>
            </div>
        </motion.div>
    );
};

export default CertificateBadge;
