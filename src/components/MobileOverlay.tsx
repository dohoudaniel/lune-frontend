import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, ArrowRight } from 'lucide-react';

export const MobileOverlay: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('lune_mobile_warning_dismissed') === 'true';
  });

  useEffect(() => {
    const checkDevice = () => {
      // Show overlay on devices smaller than 768px (standard tablet/mobile breakpoint)
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('lune_mobile_warning_dismissed', 'true');
    setDismissed(true);
  };

  if (!isMobile || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl p-6 text-center"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-inner">
              <Smartphone size={24} />
            </div>
            <ArrowRight className="text-gray-300" />
            <div className="w-12 h-12 bg-teal/10 rounded-full flex items-center justify-center text-teal shadow-inner">
              <Monitor size={24} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Switch to Desktop
          </h2>

          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Lune's proctored assessments, AI interviews, and live coding environments are highly optimized for larger screens. For the best experience, please switch to a computer.
          </p>

          <button
            onClick={handleDismiss}
            className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            I understand, continue anyway
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
