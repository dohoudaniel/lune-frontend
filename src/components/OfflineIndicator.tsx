import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

interface OfflineIndicatorProps {
    className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
    const [isOnline, setIsOnline] = useState(true);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        // Set initial state
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            setShowReconnected(true);
            // Hide reconnected message after 3 seconds
            setTimeout(() => setShowReconnected(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowReconnected(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {/* Offline Banner */}
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className={`fixed top-0 left-0 right-0 z-[100] ${className}`}
                >
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 shadow-lg">
                        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                            <WifiOff size={20} className="animate-pulse" />
                            <span className="font-medium">You're offline</span>
                            <span className="text-white/80 text-sm hidden sm:inline">
                                • Some features may be limited
                            </span>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => window.location.reload()}
                                className="ml-4 p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition"
                            >
                                <RefreshCw size={16} />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Reconnected Banner */}
            {isOnline && showReconnected && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className={`fixed top-0 left-0 right-0 z-[100] ${className}`}
                >
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 shadow-lg">
                        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                            <Wifi size={20} />
                            <span className="font-medium">You're back online!</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Hook to check online status
export const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(
        typeof window !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
};

// Compact offline badge for headers
export const OfflineBadge: React.FC = () => {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium"
        >
            <WifiOff size={12} />
            <span>Offline</span>
        </motion.div>
    );
};

export default OfflineIndicator;
