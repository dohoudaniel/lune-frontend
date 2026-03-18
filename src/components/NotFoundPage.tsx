import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';

const REDIRECT_DELAY = 15;

const FLOATING_TAGS = [
  'React', 'Python', 'TypeScript', 'Node.js', 'AWS',
  'Docker', 'Go', 'PostgreSQL', 'Kubernetes', 'CI/CD',
  'System Design', 'SEO', 'Figma', 'Java', 'Rust',
];

// SVG circle countdown ring
const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface NotFoundPageProps {
  onGoHome: () => void;
  onGoBack?: () => void;
}

export function NotFoundPage({ onGoHome, onGoBack }: NotFoundPageProps) {
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_DELAY);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onGoHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = secondsLeft / REDIRECT_DELAY;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="relative min-h-screen bg-cream overflow-hidden flex flex-col items-center justify-center px-4">

      {/* Floating skill tags — decorative background */}
      {FLOATING_TAGS.map((tag, i) => (
        <motion.div
          key={tag}
          className="absolute text-xs font-medium px-2.5 py-1 rounded-full border border-teal/10 text-teal/30 bg-teal/5 select-none pointer-events-none"
          style={{
            top: `${8 + ((i * 37) % 80)}%`,
            left: `${5 + ((i * 53) % 90)}%`,
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        >
          {tag}
        </motion.div>
      ))}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center max-w-lg w-full"
      >

        {/* 404 display */}
        <div className="relative mb-6">
          {/* Background ghost number */}
          <span
            className="absolute inset-0 flex items-center justify-center text-[10rem] font-black leading-none text-teal/5 select-none"
            aria-hidden="true"
          >
            404
          </span>
          {/* Foreground styled number */}
          <div className="relative flex items-end gap-1 leading-none">
            <span className="text-7xl md:text-8xl font-black text-teal tracking-tight">4</span>
            <span className="text-7xl md:text-8xl font-black text-orange tracking-tight">0</span>
            <span className="text-7xl md:text-8xl font-black text-teal tracking-tight">4</span>
          </div>
        </div>

        {/* Heading + subtext */}
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
          This page went off the grid
        </h1>
        <p className="text-slate-500 text-base mb-10 leading-relaxed max-w-sm">
          The URL you're looking for doesn't exist or was moved. Your skills are still verified — just not here.
        </p>

        {/* Countdown ring + label */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
              {/* Track */}
              <circle
                cx="44"
                cy="44"
                r={RADIUS}
                fill="none"
                stroke="#1F4D4815"
                strokeWidth="5"
              />
              {/* Progress */}
              <motion.circle
                cx="44"
                cy="44"
                r={RADIUS}
                fill="none"
                stroke="#1F4D48"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                transition={{ duration: 0.8, ease: 'linear' }}
              />
            </svg>
            {/* Seconds label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-teal leading-none">{secondsLeft}</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">sec</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Redirecting you home automatically…
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button
            onClick={onGoHome}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-teal text-white font-semibold text-sm hover:bg-teal/90 active:scale-95 transition-all shadow-sm"
          >
            <Home size={16} />
            Go Home
          </button>
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl border border-teal/20 text-teal font-semibold text-sm hover:bg-teal/5 active:scale-95 transition-all"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
