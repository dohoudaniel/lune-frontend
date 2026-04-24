import React, { useEffect, useState } from "react";
import {
  Award,
  User,
  MapPin,
  Briefcase,
  CheckCircle,
  Lock,
  ExternalLink,
  RefreshCw,
  Star,
  Share2,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";

interface PassportSkill {
  skill: string;
  category: string;
  score: number;
  difficulty: string;
  passed: boolean;
  completed_at: string;
}

interface PassportData {
  passport_id: string;
  name: string;
  title?: string;
  location?: string;
  avatar?: string;
  skills: PassportSkill[];
  total_assessments: number;
  teaser_only: boolean;
}

interface Props {
  passportId: string;
  isAuthenticated: boolean;
  onLogin?: () => void;
}

const ScorePill: React.FC<{ score: number }> = ({ score }) => {
  const color =
    score >= 90
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : score >= 70
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${color}`}
    >
      {score >= 90 && <Star size={10} className="fill-amber-500 text-amber-500" />}
      {score}/100
    </span>
  );
};

export const PublicPassportPage: React.FC<Props> = ({
  passportId,
  isAuthenticated,
  onLogin,
}) => {
  const toast = useToast();
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/profiles/passport/${passportId}/`)
      .then((data: any) => {
        if (!data || data.detail) {
          setError("Passport not found.");
        } else {
          setPassport(data);
        }
      })
      .catch(() => setError("Passport not found."))
      .finally(() => setLoading(false));
  }, [passportId]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied!"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw size={24} className="text-teal animate-spin" />
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Award size={48} className="text-gray-300 mx-auto" />
          <p className="font-semibold text-gray-600">{error ?? "Passport not found"}</p>
        </div>
      </div>
    );
  }

  const passedSkills = passport.skills.filter((s) => s.passed);
  const visibleSkills = passport.teaser_only ? passedSkills.slice(0, 3) : passedSkills;
  const hiddenCount = passport.teaser_only
    ? Math.max(0, passport.total_assessments - visibleSkills.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center flex-shrink-0">
              <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5">
                <div className="bg-white rounded-full" />
                <div className="bg-white rounded-full" />
                <div className="bg-white rounded-full" />
                <div className="bg-white rounded-full" />
              </div>
            </div>
            <span className="font-bold text-gray-900">lune</span>
          </a>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <Share2 size={15} />
              Share
            </button>
            {!isAuthenticated && onLogin && (
              <button
                onClick={onLogin}
                className="text-sm font-semibold text-white bg-black px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-teal to-emerald-500 h-20" />
          <div className="px-8 pb-8 -mt-10">
            <div className="flex items-end gap-4 mb-4">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md bg-gradient-to-br from-teal to-darkblue flex items-center justify-center text-white text-3xl font-bold overflow-hidden flex-shrink-0">
                {passport.avatar ? (
                  <img
                    src={passport.avatar}
                    alt={passport.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  passport.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="pb-1 flex-1 min-w-0">
                <h1 className="text-2xl font-extrabold text-slate-900 truncate">
                  {passport.name}
                </h1>
                <div className="flex flex-wrap gap-3 mt-1">
                  {passport.title && (
                    <span className="flex items-center gap-1 text-sm text-slate-500">
                      <Briefcase size={13} />
                      {passport.title}
                    </span>
                  )}
                  {passport.location && (
                    <span className="flex items-center gap-1 text-sm text-slate-500">
                      <MapPin size={13} />
                      {passport.location}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleShare}
                className="flex-shrink-0 p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-teal hover:border-teal/30 hover:bg-teal/5 transition"
                title="Share passport"
              >
                <Share2 size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-teal/5 border border-teal/20 rounded-xl px-4 py-2.5">
              <Award size={16} className="text-teal flex-shrink-0" />
              <p className="text-sm font-semibold text-teal">
                Lune Skill Passport
              </p>
              <span className="ml-auto text-xs text-slate-400">
                {passport.total_assessments} skill{passport.total_assessments !== 1 ? "s" : ""} verified
              </span>
            </div>
          </div>
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8"
        >
          <h2 className="font-bold text-slate-900 text-lg mb-4">
            Verified Skills
          </h2>

          {visibleSkills.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No passed assessments yet.
            </p>
          ) : (
            <div className="space-y-3">
              {visibleSkills.map((skill, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-center gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-xl"
                >
                  <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {skill.skill}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {skill.category} · {skill.difficulty}
                    </p>
                  </div>
                  <ScorePill score={skill.score} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Teaser gate */}
          {passport.teaser_only && hiddenCount > 0 && (
            <div className="mt-4 rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center space-y-3">
              <Lock size={28} className="text-gray-300 mx-auto" />
              <p className="text-sm font-semibold text-gray-600">
                +{hiddenCount} more verified skill{hiddenCount !== 1 ? "s" : ""} hidden
              </p>
              <p className="text-xs text-gray-400">
                Sign in to see the full Skill Passport
              </p>
              {onLogin && (
                <button
                  onClick={onLogin}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-teal text-white text-sm font-semibold rounded-xl hover:opacity-90 transition"
                >
                  <ExternalLink size={14} />
                  Sign In to View Full Passport
                </button>
              )}
            </div>
          )}
        </motion.div>

        <p className="text-center text-xs text-gray-400">
          Verified by{" "}
          <span className="font-semibold text-teal">Lune</span> — skills
          verified through proctored assessments.
        </p>
      </div>
      </div>
    </div>
  );
};

export default PublicPassportPage;
