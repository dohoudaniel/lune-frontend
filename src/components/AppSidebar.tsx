import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Mic,
  History,
  MessageSquare,
  User,
  Briefcase,
  Search,
  X,
  LogOut,
  Trophy,
  Zap,
} from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  tab: string;
}

const CANDIDATE_NAV: NavItem[] = [
  { icon: Home, label: "Dashboard", tab: "overview" },
  { icon: Mic, label: "Mock Interview", tab: "interview" },
  { icon: History, label: "Progress", tab: "history" },
  { icon: Trophy, label: "Leaderboard", tab: "leaderboard" },
  { icon: MessageSquare, label: "Community", tab: "community" },
  { icon: Zap, label: "Upgrade", tab: "subscription" },
];

const EMPLOYER_NAV: NavItem[] = [
  { icon: Search, label: "Find Talent", tab: "candidates" },
  { icon: Briefcase, label: "My Jobs", tab: "jobs" },
  { icon: Trophy, label: "Leaderboard", tab: "leaderboard" },
  { icon: Zap, label: "Upgrade", tab: "subscription" },
];

const PROFILE_NAV: NavItem = { icon: User, label: "My Profile", tab: "profile" };

interface AppSidebarProps {
  role: "candidate" | "employer";
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName: string;
  userImage?: string;
  userSubtitle?: string;
  onLogout: () => void;
  onNavigateProfile?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  role,
  activeTab,
  onTabChange,
  userName,
  userImage,
  userSubtitle,
  onLogout,
  onNavigateProfile,
  isOpen,
  onClose,
}) => {
  const primaryNav = role === "candidate" ? CANDIDATE_NAV : EMPLOYER_NAV;

  const handleNav = (tab: string) => {
    onTabChange(tab);
    onClose();
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const isActive = activeTab === item.tab;
    const Icon = item.icon;
    return (
      <button
        key={item.tab}
        onClick={() => handleNav(item.tab)}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
          isActive
            ? "bg-[#F26430]/10 text-[#F26430] border border-[#F26430]/15"
            : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
        }`}
      >
        <Icon
          size={17}
          className={
            isActive
              ? "text-[#F26430]"
              : "text-slate-500 group-hover:text-slate-300 transition"
          }
        />
        <span className="flex-1 text-left">{item.label}</span>
        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#F26430]" />}
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0d1117] text-white select-none">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#F26430] rounded-lg flex items-center justify-center shadow-lg shadow-[#F26430]/30 flex-shrink-0">
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              <div className="bg-white rounded-full" />
              <div className="bg-white rounded-full" />
              <div className="bg-white rounded-full" />
              <div className="bg-white rounded-full" />
            </div>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">lune</p>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
              {role === "candidate" ? "Candidate" : "Employer"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden text-slate-500 hover:text-white transition p-1.5 rounded-lg hover:bg-white/5"
        >
          <X size={18} />
        </button>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col overflow-y-auto">
        <div className="space-y-0.5">
          {primaryNav.map((item) => (
            <NavButton key={item.tab} item={item} />
          ))}
        </div>

        {/* Profile — separated by a divider */}
        <div className="pt-3 mt-3 border-t border-white/[0.06]">
          <NavButton item={PROFILE_NAV} />
        </div>
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-white/[0.06] flex-shrink-0">
        <button
          onClick={onNavigateProfile}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition mb-1"
        >
          <div className="w-8 h-8 rounded-full bg-[#F26430] flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md overflow-hidden">
            {userImage ? (
              <img
                src={userImage}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              userName.substring(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-slate-200 truncate leading-tight">
              {userName}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {userSubtitle || (role === "candidate" ? "Candidate" : "Employer")}
            </p>
          </div>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition"
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop — always visible */}
      <div className="hidden md:flex w-64 flex-shrink-0 h-full">
        <SidebarContent />
      </div>

      {/* Mobile — slide-in overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              key="drawer"
              initial={{ x: -264 }}
              animate={{ x: 0 }}
              exit={{ x: -264 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 w-64 md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
