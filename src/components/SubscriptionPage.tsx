import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Zap,
  Crown,
  Gift,
  RefreshCw,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";

interface PlanInfo {
  plan: "free" | "pro" | "elite";
  plan_display: string;
  credits: number;
  credits_unlimited: boolean;
}

interface Props {
  onBack: () => void;
}

const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: "$0",
    period: "/month",
    icon: <Gift size={22} className="text-gray-500" />,
    color: "border-gray-200",
    highlight: false,
    features: [
      "3 assessment credits",
      "Basic skill passport",
      "Community access",
      "Standard support",
    ],
    missing: [
      "AI career coaching",
      "Unlimited assessments",
      "Priority employer visibility",
      "Advanced analytics",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$12",
    period: "/month",
    icon: <Zap size={22} className="text-orange" />,
    color: "border-orange",
    highlight: true,
    features: [
      "10 assessment credits/month",
      "Full skill passport",
      "AI career coaching",
      "Priority employer visibility",
      "Advanced analytics",
      "Priority support",
    ],
    missing: ["Unlimited assessments"],
  },
  {
    id: "elite" as const,
    name: "Elite",
    price: "$29",
    period: "/month",
    icon: <Crown size={22} className="text-amber-500" />,
    color: "border-amber-400",
    highlight: false,
    features: [
      "Unlimited assessments",
      "Full skill passport",
      "AI career coaching",
      "Top employer visibility",
      "Real-time analytics",
      "Dedicated support",
      "White-glove onboarding",
    ],
    missing: [],
  },
] as const;

export const SubscriptionPage: React.FC<Props> = ({ onBack }) => {
  const toast = useToast();
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/users/me/subscription/")
      .then((d: any) => setPlanInfo(d))
      .catch(() => toast.error("Failed to load plan info"))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planId: "free" | "pro" | "elite") => {
    if (planId === planInfo?.plan) return;
    setUpgrading(planId);
    try {
      const res = (await api.post("/users/me/subscription/", {
        plan: planId,
      })) as any;
      setPlanInfo((prev) =>
        prev
          ? {
              ...prev,
              plan: res.plan,
              plan_display: res.plan_display,
              credits: res.credits,
              credits_unlimited: res.credits === -1,
            }
          : prev,
      );
      toast.success(`Switched to ${res.plan_display} plan`);
    } catch {
      toast.error("Failed to change plan. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Choose Your Plan
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Upgrade to unlock more assessments, AI coaching, and employer
            visibility.
          </p>
        </div>
      </div>

      {/* Current plan banner */}
      {!loading && planInfo && (
        <div className="bg-teal/5 border border-teal/20 rounded-2xl px-5 py-4 flex items-center gap-3">
          <CheckCircle size={18} className="text-teal flex-shrink-0" />
          <p className="text-sm text-teal font-semibold">
            Current plan:{" "}
            <span className="capitalize">{planInfo.plan_display}</span>
            {" — "}
            {planInfo.credits_unlimited
              ? "Unlimited credits"
              : `${planInfo.credits} credit${planInfo.credits !== 1 ? "s" : ""} remaining`}
          </p>
        </div>
      )}

      {/* Plan cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 bg-gray-100 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, idx) => {
            const isCurrent = planInfo?.plan === plan.id;
            const isUpgrade =
              planInfo &&
              ["free", "pro", "elite"].indexOf(plan.id) >
                ["free", "pro", "elite"].indexOf(planInfo.plan);
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`relative bg-white rounded-3xl border-2 p-6 flex flex-col ${plan.color} ${plan.highlight ? "shadow-xl shadow-orange/10" : "shadow-sm"}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                    {plan.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      {plan.name}
                    </h3>
                    <p className="text-slate-500 text-xs">
                      {plan.id === "elite" ? "Everything included" : `${plan.features.length} features`}
                    </p>
                  </div>
                </div>

                <div className="mb-5">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {plan.price}
                  </span>
                  <span className="text-slate-400 text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <CheckCircle
                        size={14}
                        className="text-emerald-500 flex-shrink-0"
                      />
                      {f}
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-gray-400"
                    >
                      <Lock size={13} className="flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || !!upgrading}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : isUpgrade
                        ? "bg-orange text-white hover:opacity-90"
                        : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                  } disabled:opacity-60`}
                >
                  {upgrading === plan.id ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : null}
                  {isCurrent
                    ? "Current Plan"
                    : isUpgrade
                      ? `Upgrade to ${plan.name}`
                      : `Switch to ${plan.name}`}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        Plan changes take effect immediately. Payments are processed securely.
        Contact support for enterprise pricing.
      </p>
    </div>
  );
};

export default SubscriptionPage;
