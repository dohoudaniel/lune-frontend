import React, { useEffect, useState, useCallback } from "react";
import { Trophy, Medal, Search, Loader2, ChevronDown, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  title: string;
  avatar_url: string | null;
  skill: string;
  score: number;
  is_current_user: boolean;
}

interface LeaderboardResponse {
  results: LeaderboardEntry[];
  skills?: string[];
}

const RANK_COLORS: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-slate-400",
  3: "text-amber-600",
};

const RANK_BG: Record<number, string> = {
  1: "bg-yellow-50 border-yellow-200",
  2: "bg-slate-50 border-slate-200",
  3: "bg-amber-50 border-amber-200",
};

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${RANK_COLORS[rank]}`}>
        <Medal size={18} className={RANK_COLORS[rank]} />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center">
      <span className="text-sm font-semibold text-slate-500">#{rank}</span>
    </div>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-[#F26430] flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm">
      {initials}
    </div>
  );
}

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchLeaderboard = useCallback(async (skill: string) => {
    setLoading(true);
    try {
      const params = skill ? `?skill=${encodeURIComponent(skill)}` : "";
      const data: LeaderboardResponse = await api.get(`/leaderboard/${params}`);
      setEntries(data.results || []);
      if (data.skills && data.skills.length > 0 && skills.length === 0) {
        setSkills(data.skills);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [skills.length]);

  useEffect(() => {
    fetchLeaderboard(selectedSkill);
  }, [selectedSkill, fetchLeaderboard]);

  const filteredSkills = skills.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const currentUserEntry = entries.find((e) => e.is_current_user);
  const currentUserRank = currentUserEntry?.rank ?? null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={22} className="text-[#F26430]" />
            <h1 className="text-xl font-bold text-slate-900">Skill Leaderboard</h1>
          </div>
          <p className="text-sm text-slate-500">
            Top 100 verified performers per skill, ranked by highest passing score.
          </p>
        </div>

        {currentUserRank && (
          <div className="flex-shrink-0 bg-[#F26430]/8 border border-[#F26430]/20 rounded-2xl px-4 py-2.5 text-center">
            <p className="text-xs text-slate-500 font-medium">Your rank</p>
            <p className="text-2xl font-black text-[#F26430] leading-tight">
              #{currentUserRank}
            </p>
            {selectedSkill && (
              <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[80px]">
                {selectedSkill}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Skill filter */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 transition shadow-sm"
        >
          <span>{selectedSkill || "All skills (top scores)"}</span>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute z-30 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-2 border-b border-slate-100">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search skills..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#F26430]/50"
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto">
                <button
                  onClick={() => { setSelectedSkill(""); setDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition ${!selectedSkill ? "font-semibold text-[#F26430]" : "text-slate-700"}`}
                >
                  All skills
                </button>
                {filteredSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => { setSelectedSkill(skill); setDropdownOpen(false); setSearch(""); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition ${selectedSkill === skill ? "font-semibold text-[#F26430]" : "text-slate-700"}`}
                  >
                    {skill}
                  </button>
                ))}
                {filteredSkills.length === 0 && (
                  <p className="px-4 py-3 text-xs text-slate-400">No skills found</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#F26430]" size={28} />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center">
            <Trophy size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No results yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Pass an assessment to appear on the leaderboard.
            </p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-5 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              <span className="w-8">Rank</span>
              <span>Candidate</span>
              <span className="text-right">Skill</span>
              <span className="text-right w-14">Score</span>
            </div>

            <div className="divide-y divide-slate-50">
              {entries.map((entry) => {
                const isTop3 = entry.rank <= 3;
                const isSelf = entry.is_current_user;
                return (
                  <motion.div
                    key={`${entry.user_id}-${entry.skill}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(entry.rank * 0.02, 0.4) }}
                    className={`grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-5 py-3.5 transition ${
                      isSelf
                        ? "bg-[#F26430]/5 border-l-2 border-l-[#F26430]"
                        : isTop3
                        ? `${RANK_BG[entry.rank]} border-l-2`
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    <RankBadge rank={entry.rank} />

                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={entry.name} url={entry.avatar_url} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm font-semibold truncate ${isSelf ? "text-[#F26430]" : "text-slate-800"}`}>
                            {entry.name}
                            {isSelf && <span className="ml-1 text-xs font-normal text-[#F26430]/70">(you)</span>}
                          </p>
                        </div>
                        {entry.title && (
                          <p className="text-xs text-slate-400 truncate">{entry.title}</p>
                        )}
                      </div>
                    </div>

                    <span className="text-xs text-slate-500 font-medium text-right truncate max-w-[100px]">
                      {entry.skill}
                    </span>

                    <div className="flex items-center justify-end gap-1 w-14">
                      {entry.score >= 90 && <Star size={12} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                      <span className={`text-sm font-bold tabular-nums ${entry.score >= 90 ? "text-yellow-600" : entry.score >= 70 ? "text-emerald-600" : "text-slate-700"}`}>
                        {entry.score}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {entries.length > 0 && (
        <p className="text-center text-xs text-slate-400">
          Showing top {entries.length} verified candidates
          {selectedSkill ? ` in ${selectedSkill}` : " across all skills"}.
          Scores update in real time.
        </p>
      )}
    </div>
  );
};
