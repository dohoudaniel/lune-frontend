import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
    onDismiss?: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onDismiss }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isAppInstalled =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        setIsStandalone(isAppInstalled);

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Check if user has previously dismissed
            const dismissed = localStorage.getItem('lune_install_dismissed');
            const dismissedAt = dismissed ? new Date(dismissed) : null;
            const daysSinceDismissed = dismissedAt
                ? (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24)
                : Infinity;

            // Show prompt if not dismissed in last 7 days
            if (daysSinceDismissed > 7) {
                setTimeout(() => setShowPrompt(true), 3000); // Delay for better UX
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Show iOS prompt after delay if on iOS and not installed
        if (isIOSDevice && !isAppInstalled) {
            const dismissed = localStorage.getItem('lune_install_dismissed_ios');
            const dismissedAt = dismissed ? new Date(dismissed) : null;
            const daysSinceDismissed = dismissedAt
                ? (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24)
                : Infinity;

            if (daysSinceDismissed > 7) {
                setTimeout(() => setShowPrompt(true), 5000);
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome !== 'accepted') {
            localStorage.setItem('lune_install_dismissed', new Date().toISOString());
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem(
            isIOS ? 'lune_install_dismissed_ios' : 'lune_install_dismissed',
            new Date().toISOString()
        );
        setShowPrompt(false);
        onDismiss?.();
    };

    // Don't show if already installed
    if (isStandalone) return null;

    // Don't show if no prompt available and not iOS
    if (!deferredPrompt && !isIOS) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                        onClick={handleDismiss}
                    />

                    {/* Prompt Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl z-[61] overflow-hidden"
                    >
                        {/* Header with gradient */}
                        <div className="bg-gradient-to-r from-teal to-darkblue p-4 text-white">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        {isIOS ? <Smartphone size={24} /> : <Download size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Install Lune</h3>
                                        <p className="text-white/80 text-sm">Get the full app experience</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDismiss}
                                    className="p-1 hover:bg-white/20 rounded-lg transition"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {isIOS && !showIOSInstructions ? (
                                <>
                                    <p className="text-gray-600 text-sm mb-4">
                                        Add Lune to your home screen for quick access and offline features.
                                    </p>
                                    <div className="flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setShowIOSInstructions(true)}
                                            className="flex-1 bg-black text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                        >
                                            <Share size={18} />
                                            Show Me How
                                        </motion.button>
                                        <button
                                            onClick={handleDismiss}
                                            className="px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-medium"
                                        >
                                            Later
                                        </button>
                                    </div>
                                </>
                            ) : isIOS && showIOSInstructions ? (
                                <>
                                    <div className="space-y-4 mb-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                1
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Tap the Share button</p>
                                                <p className="text-gray-500 text-sm">Find it at the bottom of Safari</p>
                                                <div className="mt-2 p-2 bg-gray-100 rounded-lg inline-flex">
                                                    <Share size={20} className="text-blue-500" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                2
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Tap "Add to Home Screen"</p>
                                                <p className="text-gray-500 text-sm">Scroll down in the share menu</p>
                                                <div className="mt-2 p-2 bg-gray-100 rounded-lg inline-flex items-center gap-2">
                                                    <Plus size={16} className="text-blue-500" />
                                                    <span className="text-sm">Add to Home Screen</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                3
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Tap "Add" to confirm</p>
                                                <p className="text-gray-500 text-sm">Lune will appear on your home screen!</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleDismiss}
                                        className="w-full py-3 bg-black text-white rounded-xl font-semibold"
                                    >
                                        Got it!
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Benefits */}
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 bg-teal/10 text-teal rounded-lg flex items-center justify-center">
                                                <Smartphone size={16} />
                                            </div>
                                            <span className="text-gray-700">Works offline</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 bg-orange/10 text-orange rounded-lg flex items-center justify-center">
                                                <Monitor size={16} />
                                            </div>
                                            <span className="text-gray-700">Faster performance</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                                <Download size={16} />
                                            </div>
                                            <span className="text-gray-700">Quick access from home screen</span>
                                        </div>
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleInstall}
                                            className="flex-1 bg-black text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                        >
                                            <Download size={18} />
                                            Install Now
                                        </motion.button>
                                        <button
                                            onClick={handleDismiss}
                                            className="px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-medium"
                                        >
                                            Later
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// Hook to check if app is installed as PWA
export const useIsPWA = () => {
    const [isPWA, setIsPWA] = useState(false);

    useEffect(() => {
        const checkPWA = () => {
            const isStandalone =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;
            setIsPWA(isStandalone);
        };

        checkPWA();

        // Listen for display mode changes
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        mediaQuery.addEventListener('change', checkPWA);

        return () => mediaQuery.removeEventListener('change', checkPWA);
    }, []);

    return isPWA;
};

// Service Worker Registration Helper
export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });



            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content is available

                        }
                    });
                }
            });

            return registration;
        } catch (error) {
            console.error('ServiceWorker registration failed:', error);
            return null;
        }
    }
    return null;
};

export default InstallPrompt;
