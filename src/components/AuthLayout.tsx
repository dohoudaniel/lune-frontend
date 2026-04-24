import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock } from "lucide-react";
import { ViewState } from "../types";

interface AuthLayoutProps {
  children: React.ReactNode;
  onNavigate: (view: ViewState) => void;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  onNavigate,
  title,
  subtitle,
}) => {
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
            <span className="font-bold text-2xl tracking-tight text-white">
              lune
            </span>
          </button>
          <a
            href="#help"
            className="text-sm font-medium text-slate-400 hover:text-white transition"
          >
            Need help?
          </a>
        </div>

        <div className="relative z-10 max-w-xl mt-6 mb-auto pt-6">
          {/* container for the badge + heading - stacks on very small screens, inline on sm+ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4"
          >
            {/* Shield badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center flex-shrink-0"
            >
              <ShieldCheck className="text-teal-400" size={24} />
            </motion.div>
            {/* Heading - keep previous classes, but make the span inline on sm+ */}
            <motion.h1
              className="text-4xl sm:text-5xl font-extrabold leading-snug mb-0 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="block">Your Skills,</span>
              <span className="block sm:inline text-orange-400 font-extrabold drop-shadow-lg">
                Verified & Visible.
              </span>
            </motion.h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 text-base mb-8 max-w-[90%] leading-relaxed"
          >
            From Virtual Assistants and Customer Service to Frontend Engineers
            and DevOps — Lune certifies professionals across every major role.
          </motion.p>

          {/* Role tags */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-wrap gap-2 mb-10"
          >
            {[
              "Virtual Assistant",
              "Customer Service",
              "Sales",
              "Digital Marketing",
              "Frontend",
              "Backend",
              "DevOps",
              "Mobile Dev",
              "DevRel",
              "E-Commerce",
              "Software Engineer",
            ].map((role) => (
              <span
                key={role}
                className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-300 font-medium"
              >
                {role}
              </span>
            ))}
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-start gap-3"
            >
              <div className="mt-1 w-9 h-9 rounded-xl bg-teal-400/10 flex items-center justify-center border border-teal-400/20 shrink-0">
                <ShieldCheck className="text-teal-400" size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base mb-0.5">
                  AI-Verified Skills
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Proctored assessments ensure every result is 100% authentic —
                  no shortcuts.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-start gap-3"
            >
              <div className="mt-1 w-9 h-9 rounded-xl bg-orange/10 flex items-center justify-center border border-orange/20 shrink-0">
                <Lock className="text-orange" size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base mb-0.5">
                  Permanent Credentials
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Earn a Skill Passport employers can verify instantly — across
                  any role.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer on left panel */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-medium">
          <p>© 2026 Lune Inc.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition">
              Terms
            </a>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-col relative bg-white">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 sm:p-6 sticky top-0 left-0 w-full flex justify-between items-center z-10 backdrop-blur-md bg-white/95 border-b border-gray-100">
          <button
            onClick={() => onNavigate(ViewState.LANDING)}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-white rounded-full"></div>
                <div className="bg-white rounded-full"></div>
                <div className="bg-white rounded-full"></div>
                <div className="bg-white rounded-full"></div>
              </div>
            </div>
            <span className="font-bold text-xl tracking-tight text-black">
              lune
            </span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto pt-20 sm:pt-8 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-[420px] mt-12 lg:mt-0 sm:mt-6"
          >
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                {title}
              </h2>
              <p className="text-slate-500 text-[15px]">{subtitle}</p>
            </div>

            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
