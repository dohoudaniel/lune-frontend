import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home, ShieldOff, Lock } from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────

const REDIRECT_DELAY = 15;
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const FLOATING_TAGS = [
  { label: 'React',        color: 'teal'   },
  { label: 'Python',       color: 'orange' },
  { label: 'TypeScript',   color: 'teal'   },
  { label: 'Node.js',      color: 'orange' },
  { label: 'AWS',          color: 'teal'   },
  { label: 'Docker',       color: 'orange' },
  { label: 'Go',           color: 'teal'   },
  { label: 'PostgreSQL',   color: 'orange' },
  { label: 'Kubernetes',   color: 'teal'   },
  { label: 'CI/CD',        color: 'orange' },
  { label: 'System Design',color: 'teal'   },
  { label: 'Figma',        color: 'orange' },
  { label: 'Rust',         color: 'teal'   },
  { label: 'Flutter',      color: 'orange' },
  { label: 'ML/AI',        color: 'teal'   },
];

// Deterministic positions so tags never overlap badly
const TAG_POSITIONS = [
  { top:  6, left:  4 },  { top:  8, left: 72 },
  { top: 14, left: 42 },  { top: 18, left: 88 },
  { top: 28, left: 14 },  { top: 34, left: 60 },
  { top: 42, left:  3 },  { top: 48, left: 80 },
  { top: 56, left: 26 },  { top: 62, left: 91 },
  { top: 68, left:  8 },  { top: 72, left: 54 },
  { top: 78, left: 35 },  { top: 85, left: 76 },
  { top: 90, left: 18 },
];

// ─── Props ───────────────────────────────────────────────────────────────────

export interface NotFoundPageProps {
  type?: '404' | '403';
  onGoHome: () => void;
  onGoBack?: () => void;
}

// ─── Countdown ring ───────────────────────────────────────────────────────────

function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const progress = seconds / total;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="relative w-[5.5rem] h-[5.5rem]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="#1F4D4818" strokeWidth="5" />
          <motion.circle
            cx="48" cy="48" r={RADIUS}
            fill="none"
            stroke="#1F4D48"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.9, ease: 'linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[1.6rem] font-black text-[#1F4D48] leading-none tabular-nums">{seconds}</span>
          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-[0.15em] mt-0.5">sec</span>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 font-medium tracking-wide">
        Redirecting you home…
      </p>
    </div>
  );
}

// ─── Shield animation (403) ──────────────────────────────────────────────────

function ForbiddenShield() {
  return (
    <div className="flex flex-col items-center gap-2 mb-2">
      <div className="relative">
        {/* Outer pulse rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-orange/30"
            style={{ margin: `-${(i + 1) * 10}px` }}
            animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.3 + i * 0.15, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
          />
        ))}
        <motion.div
          className="relative z-10 w-16 h-16 rounded-2xl bg-orange/10 border border-orange/25 flex items-center justify-center"
          animate={{ boxShadow: ['0 0 0px #F2643000', '0 0 24px #F2643033', '0 0 0px #F2643000'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ShieldOff size={28} className="text-orange" strokeWidth={1.5} />
        </motion.div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function NotFoundPage({ type = '404', onGoHome, onGoBack }: NotFoundPageProps) {
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_DELAY);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const is404 = type === '404';

  // Auto-redirect countdown (404 only)
  useEffect(() => {
    if (!is404) return;
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is404]);

  const digits = is404 ? ['4', '0', '4'] : ['4', '0', '3'];
  const digitColors = ['#1F4D48', '#F26430', '#1F4D48'];

  return (
    <div
      className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #F5F3EE 0%, #EEF0EA 50%, #F0EDE8 100%)' }}
    >
      {/* ── Dot grid background ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #1F4D4812 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── Radial vignette ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, #E8E5DF55 100%)',
        }}
      />

      {/* ── Floating skill tags ── */}
      {FLOATING_TAGS.map((tag, i) => (
        <motion.div
          key={tag.label}
          className="absolute select-none pointer-events-none"
          style={{ top: `${TAG_POSITIONS[i].top}%`, left: `${TAG_POSITIONS[i].left}%` }}
          animate={{ y: [0, -8, 0], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 5 + (i % 4), repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
        >
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
            style={
              tag.color === 'teal'
                ? { color: '#1F4D48', borderColor: '#1F4D4828', background: '#1F4D4808' }
                : { color: '#c0511e', borderColor: '#F2643028', background: '#F2643008' }
            }
          >
            {tag.label}
          </span>
        </motion.div>
      ))}

      {/* ── Content card ── */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center text-center w-full max-w-md"
      >
        {/* Error type label */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-5 flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: is404 ? '#1F4D48' : '#F26430' }} />
          <span
            className="font-mono text-[10px] font-bold tracking-[0.22em] uppercase"
            style={{ color: is404 ? '#1F4D48' : '#c0511e' }}
          >
            Error {type}
          </span>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: is404 ? '#1F4D48' : '#F26430' }} />
        </motion.div>

        {/* 403 shield */}
        {!is404 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <ForbiddenShield />
          </motion.div>
        )}

        {/* Giant number display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-7 select-none"
        >
          {/* Ghost number */}
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center font-black leading-none"
            style={{
              fontSize: 'clamp(7rem, 22vw, 11rem)',
              color: '#1F4D48',
              opacity: 0.04,
              letterSpacing: '-0.04em',
            }}
          >
            {type}
          </span>

          {/* Foreground split-color digits */}
          <div
            className="relative flex items-end leading-none"
            style={{ gap: '0.05em' }}
          >
            {digits.map((digit, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="font-black leading-none"
                style={{
                  fontSize: 'clamp(5.5rem, 18vw, 9rem)',
                  color: digitColors[i],
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {digit}
              </motion.span>
            ))}
          </div>

          {/* Thin underline accent */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-1 h-0.5 w-full origin-left"
            style={{
              background: 'linear-gradient(to right, #1F4D48, #F26430, #1F4D4800)',
            }}
          />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.4 }}
          className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-tight"
        >
          {is404 ? 'This page went off the grid' : 'Access restricted'}
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="text-slate-500 text-sm sm:text-base mb-10 leading-relaxed max-w-xs"
        >
          {is404
            ? "The URL you're looking for doesn't exist or was moved. Your skills are still verified — just not here."
            : "You don't have permission to view this page. Check that you're signed in with the correct account."}
        </motion.p>

        {/* Countdown (404 only) */}
        <AnimatePresence>
          {is404 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.52, duration: 0.4 }}
              className="mb-10"
            >
              <CountdownRing seconds={secondsLeft} total={REDIRECT_DELAY} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
        >
          <button
            onClick={onGoHome}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 hover:opacity-90 shadow-md"
            style={{ background: 'linear-gradient(135deg, #1F4D48, #2a6b64)' }}
          >
            <Home size={15} />
            Go Home
          </button>

          {onGoBack && (
            <button
              onClick={onGoBack}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-95"
              style={{
                borderColor: '#1F4D4830',
                color: '#1F4D48',
                background: '#1F4D4806',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1F4D4812'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1F4D4806'; }}
            >
              <ArrowLeft size={15} />
              Go Back
            </button>
          )}
        </motion.div>

        {/* Lune brand footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          className="mt-12 flex items-center gap-2"
        >
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-black"
            style={{ background: '#1F4D48' }}
          >
            L
          </div>
          <span className="text-[11px] text-slate-400 font-medium tracking-wide">Lune · Skill Verification Platform</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
