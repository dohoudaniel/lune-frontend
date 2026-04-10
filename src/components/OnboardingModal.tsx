import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Briefcase,
  Target,
  Loader2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../lib/toast";
import { api } from "../lib/api";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userRole: "candidate" | "employer";
}

type Step = "welcome" | "profile" | "role-setup" | "complete";

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  userRole,
}) => {
  const toast = useToast();
  const { markOnboardingComplete: authMarkOnboardingComplete } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candidateData, setCandidateData] = useState({
    title: "",
    location: "",
    bio: "",
  });
  const [employerData, setEmployerData] = useState({
    companyName: "",
    industry: "",
  });

  const handleNext = () => {
    if (currentStep === "welcome") {
      setCurrentStep("profile");
    } else if (currentStep === "profile") {
      setCurrentStep("role-setup");
    } else if (currentStep === "role-setup") {
      setCurrentStep("complete");
    }
  };

  const handlePrev = () => {
    if (currentStep === "profile") {
      setCurrentStep("welcome");
    } else if (currentStep === "role-setup") {
      setCurrentStep("profile");
    }
  };

  const handleSkip = () => {
    setCurrentStep("complete");
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Save profile data first
      try {
        if (userRole === "candidate") {
          await api.patch("/profiles/candidate/", {
            title: candidateData.title,
            location: candidateData.location,
            bio: candidateData.bio,
          });
        } else {
          await api.patch("/profiles/employer/", {
            company_name: employerData.companyName,
            industry: employerData.industry,
          });
        }
      } catch (err) {
        console.warn("Failed to save profile data, continuing anyway:", err);
      }

      // Call backend to mark onboarding as complete
      const result = await authMarkOnboardingComplete();

      if (result.success) {
        toast.success("🎉 Setup complete! Welcome to Lune.");
        // Close the modal after success
        onClose();
        // Notify parent component
        onComplete();
      } else {
        toast.error(
          result.error || "Failed to complete onboarding. Please try again.",
        );
      }
    } catch (error: any) {
      console.error("Onboarding completion error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Sparkles className="mx-auto text-orange mb-4" size={48} />
        <h2 className="text-3xl font-bold text-slate-900">
          Welcome to Lune! 🚀
        </h2>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4 text-left"
      >
        <p className="text-slate-600 text-lg leading-relaxed">
          {userRole === "candidate"
            ? "You're now part of Lune's community of verified professionals. In just a few minutes, we'll help you set up your profile and get ready to showcase your skills."
            : "Welcome to Lune's talent marketplace! Let's set up your employer account so you can start discovering and connecting with verified professionals."}
        </p>

        <div className="bg-gradient-to-r from-orange/10 to-teal/10 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle
              className="text-orange flex-shrink-0 mt-0.5"
              size={20}
            />
            <span className="text-slate-700">
              {userRole === "candidate"
                ? "Complete your profile to showcase your expertise"
                : "Set up your company details"}
            </span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="text-teal flex-shrink-0 mt-0.5" size={20} />
            <span className="text-slate-700">
              {userRole === "candidate"
                ? "Choose your first skill to get assessed"
                : "Browse and connect with top talent"}
            </span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle
              className="text-purple-500 flex-shrink-0 mt-0.5"
              size={20}
            />
            <span className="text-slate-700">
              {userRole === "candidate"
                ? "Get certified and stand out to employers"
                : "Build your team with verified professionals"}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderProfileStep = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {userRole === "candidate"
            ? "Tell us about yourself"
            : "Tell us about your company"}
        </h2>
        <p className="text-slate-600">This helps employers find you</p>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {userRole === "candidate" ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Professional Title
              </label>
              <input
                type="text"
                placeholder="e.g., Senior Frontend Developer"
                value={candidateData.title}
                onChange={(e) =>
                  setCandidateData({ ...candidateData, title: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange/20 focus:border-orange outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g., San Francisco, CA"
                value={candidateData.location}
                onChange={(e) =>
                  setCandidateData({
                    ...candidateData,
                    location: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange/20 focus:border-orange outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Professional Bio
              </label>
              <textarea
                placeholder="Tell us about your experience and goals..."
                value={candidateData.bio}
                onChange={(e) =>
                  setCandidateData({ ...candidateData, bio: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange/20 focus:border-orange outline-none transition-all resize-none"
                rows={3}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                placeholder="e.g., Acme Corporation"
                value={employerData.companyName}
                onChange={(e) =>
                  setEmployerData({
                    ...employerData,
                    companyName: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange/20 focus:border-orange outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Industry
              </label>
              <select
                value={employerData.industry}
                onChange={(e) =>
                  setEmployerData({ ...employerData, industry: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange/20 focus:border-orange outline-none transition-all"
              >
                <option value="">Select an industry...</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );

  const renderRoleSetupStep = () => (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {userRole === "candidate"
            ? "Choose your first skill"
            : "Ready to explore talent?"}
        </h2>
        <p className="text-slate-600 mb-6">
          {userRole === "candidate"
            ? "Select a skill to take your first assessment and get verified"
            : "Start by exploring our candidate pool and posting your first job"}
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        {userRole === "candidate" ? (
          <div className="grid grid-cols-2 gap-3">
            {["React", "Python", "AWS", "Node.js"].map((skill) => (
              <button
                key={skill}
                className="p-3 bg-gradient-to-br from-orange/10 to-teal/10 border border-orange/20 rounded-lg hover:border-orange/50 transition-all text-slate-700 font-medium"
              >
                {skill}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2 text-left">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <Briefcase
                className="text-orange flex-shrink-0 mt-0.5"
                size={20}
              />
              <div>
                <p className="font-semibold text-slate-900">Post a Job</p>
                <p className="text-xs text-slate-600">
                  Create your first job listing to attract top talent
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <Target className="text-teal flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-slate-900">
                  Browse Candidates
                </p>
                <p className="text-xs text-slate-600">
                  Find verified professionals matching your needs
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
      >
        <CheckCircle className="mx-auto text-teal mb-4" size={64} />
        <h2 className="text-3xl font-bold text-slate-900">
          You're all set! 🎉
        </h2>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <p className="text-slate-600 text-lg">
          {userRole === "candidate"
            ? "Your profile is ready. Start by taking your first assessment to get verified!"
            : "Your employer account is ready. Let's find the perfect talent for your team!"}
        </p>

        <div className="bg-gradient-to-r from-orange/5 to-teal/5 border border-orange/10 rounded-lg p-4 text-left">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Pro tip:</span>{" "}
            {userRole === "candidate"
              ? "Complete your profile picture and add your skills to increase your visibility to employers."
              : "Explore our talent pool and set up your first job posting to start receiving applications from verified professionals."}
          </p>
        </div>
      </motion.div>
    </div>
  );

  const stepContent = {
    welcome: renderWelcomeStep(),
    profile: renderProfileStep(),
    "role-setup": renderRoleSetupStep(),
    complete: renderCompleteStep(),
  };

  const stepTitles = {
    welcome: "Welcome",
    profile: "Profile",
    "role-setup": "Get Started",
    complete: "Complete",
  };

  const currentStepIndex = [
    "welcome",
    "profile",
    "role-setup",
    "complete",
  ].indexOf(currentStep);
  const totalSteps = 4;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-lg pointer-events-auto"
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between">
                  <h3 className="text-white font-semibold">
                    {stepTitles[currentStep]}
                  </h3>
                  <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="text-white/60 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Progress */}
                <div className="px-6 pt-6 pb-4">
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          index <= currentStepIndex
                            ? "bg-gradient-to-r from-orange to-teal"
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Step {currentStepIndex + 1} of {totalSteps}
                  </p>
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-96 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {stepContent[currentStep]}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex items-center justify-between gap-3 border-t border-slate-100">
                  <button
                    onClick={currentStep === "welcome" ? onClose : handlePrev}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentStep === "welcome" ? "Skip" : "Back"}
                  </button>

                  <div className="flex gap-2">
                    {currentStep === "welcome" && (
                      <button
                        onClick={handleSkip}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-slate-600 text-sm hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Skip for now
                      </button>
                    )}
                    <motion.button
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      onClick={
                        currentStep === "complete" ? handleComplete : handleNext
                      }
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-gradient-to-r from-orange to-teal text-white font-semibold rounded-lg flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting && currentStep === "complete" ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Saving...
                        </>
                      ) : (
                        <>
                          {currentStep === "complete" ? "Get Started" : "Next"}
                          {currentStep !== "complete" && (
                            <ArrowRight size={16} />
                          )}
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
