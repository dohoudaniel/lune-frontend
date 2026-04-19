import React, { lazy, Suspense, useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { ViewState } from "../types";

const NotificationBell = lazy(() =>
  import("./NotificationBell").then((m) => ({ default: m.NotificationBell }))
);

interface AppShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "candidate" | "employer" | "admin";
  };
  /** Only needed for candidate — drives avatar, subtitle, notifications */
  userImage?: string;
  userSubtitle?: string;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  /** Employer tab (controlled from outside so sidebar highlights correctly) */
  employerActiveTab?: "candidates" | "jobs";
  onEmployerTabChange?: (tab: "candidates" | "jobs") => void;
  children: React.ReactNode;
}

const PAGE_TITLES: Partial<Record<ViewState, string>> = {
  [ViewState.CANDIDATE_DASHBOARD]: "Dashboard",
  [ViewState.CANDIDATE_INTERVIEW]: "Mock Interview",
  [ViewState.CANDIDATE_PROGRESS]: "Progress",
  [ViewState.CANDIDATE_COMMUNITY]: "Community",
  [ViewState.LEADERBOARD]: "Leaderboard",
  [ViewState.SUBSCRIPTION]: "Upgrade Plan",
  [ViewState.PROFILE]: "My Profile",
  [ViewState.EMPLOYER_DASHBOARD]: "Talent Discovery",
};

export const AppShell: React.FC<AppShellProps> = ({
  user,
  userImage,
  userSubtitle,
  currentView,
  onNavigate,
  onLogout,
  employerActiveTab = "candidates",
  onEmployerTabChange,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isCandidate = user.role === "candidate";

  /** Map the current view + employer tab → the sidebar's activeTab string */
  const getSidebarActiveTab = (): string => {
    if (currentView === ViewState.PROFILE) return "profile";
    if (isCandidate) {
      switch (currentView) {
        case ViewState.CANDIDATE_DASHBOARD:
          return "overview";
        case ViewState.CANDIDATE_INTERVIEW:
          return "interview";
        case ViewState.CANDIDATE_PROGRESS:
          return "history";
        case ViewState.CANDIDATE_COMMUNITY:
          return "community";
        case ViewState.LEADERBOARD:
          return "leaderboard";
        case ViewState.SUBSCRIPTION:
          return "subscription";
        default:
          return "overview";
      }
    } else {
      return employerActiveTab;
    }
  };

  /** Sidebar nav item click → either navigate to a view or switch an employer tab */
  const handleSidebarTabChange = (tab: string) => {
    if (tab === "profile") {
      onNavigate(ViewState.PROFILE);
      return;
    }
    if (isCandidate) {
      switch (tab) {
        case "overview":
          onNavigate(ViewState.CANDIDATE_DASHBOARD);
          break;
        case "interview":
          onNavigate(ViewState.CANDIDATE_INTERVIEW);
          break;
        case "history":
          onNavigate(ViewState.CANDIDATE_PROGRESS);
          break;
        case "community":
          onNavigate(ViewState.CANDIDATE_COMMUNITY);
          break;
        case "leaderboard":
          onNavigate(ViewState.LEADERBOARD);
          break;
        case "subscription":
          onNavigate(ViewState.SUBSCRIPTION);
          break;
      }
    } else {
      if (tab === "leaderboard") {
        onNavigate(ViewState.LEADERBOARD);
      } else if (tab === "subscription") {
        onNavigate(ViewState.SUBSCRIPTION);
      } else {
        onEmployerTabChange?.(tab as "candidates" | "jobs");
      }
    }
    setSidebarOpen(false);
  };

  const pageTitle =
    currentView === ViewState.EMPLOYER_DASHBOARD
      ? employerActiveTab === "jobs"
        ? "My Jobs"
        : "Talent Discovery"
      : PAGE_TITLES[currentView] ?? "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      {/* Sidebar */}
      <AppSidebar
        role={isCandidate ? "candidate" : "employer"}
        activeTab={getSidebarActiveTab()}
        onTabChange={handleSidebarTabChange}
        userName={user.name}
        userImage={userImage}
        userSubtitle={userSubtitle}
        onLogout={onLogout}
        onNavigateProfile={() => onNavigate(ViewState.PROFILE)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Right column */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Slim top bar */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 h-16 flex items-center gap-4 flex-shrink-0 shadow-sm z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 text-gray-600 transition"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-slate-700 truncate">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isCandidate && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Open for Work
              </div>
            )}
            {isCandidate && (
              <Suspense fallback={<div className="w-8 h-8" />}>
                <NotificationBell userId={user.id} />
              </Suspense>
            )}
            <button
              onClick={() => onNavigate(ViewState.PROFILE)}
              title="My Profile"
              className="w-8 h-8 bg-[#F26430] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md shadow-orange/20 hover:ring-2 hover:ring-orange/50 transition overflow-hidden"
            >
              {userImage ? (
                <img
                  src={userImage}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user.name.substring(0, 2).toUpperCase()
              )}
            </button>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
