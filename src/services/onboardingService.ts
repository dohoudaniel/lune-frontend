// Onboarding Service - Manages first-time user experience and tour state

import { api } from "../lib/api";

const STORAGE_KEYS = {
  TOUR_COMPLETED: "lune_tour_completed",
  TOUR_SKIPPED: "lune_tour_skipped",
  FEATURE_HIGHLIGHTS_SEEN: "lune_feature_highlights_seen",
  ONBOARDING_PROGRESS: "lune_onboarding_progress",
  FIRST_LOGIN_DATE: "lune_first_login",
  TIPS_DISMISSED: "lune_tips_dismissed",
};

interface OnboardingProgress {
  profileCompleted: boolean;
  firstAssessmentTaken: boolean;
  firstCertificateEarned: boolean;
  videoUploaded: boolean;
  tourCompleted: boolean;
}

interface UserOnboardingState {
  isFirstTimeUser: boolean;
  showTour: boolean;
  progress: OnboardingProgress;
  seenFeatures: string[];
  dismissedTips: string[];
}

class OnboardingService {
  private userId: string | null = null;
  private initialized: boolean = false;

  private getUserRole(): "candidate" | "employer" | "admin" {
    try {
      const profileStr = localStorage.getItem("lune_user_profile");
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        return profile?.role || "candidate";
      }
    } catch { /* ignore */ }
    return "candidate";
  }

  /**
   * Initialize onboarding service for a user
   */
  async setUserId(userId: string): Promise<void> {
    this.userId = userId;
    if (!this.initialized) {
      await this.syncFromSupabase();
      this.initialized = true;
    }
  }

  private async syncFromSupabase() {
    if (!this.userId) return;
    try {
      const data = await api.get(`/users/${this.userId}/preferences/`);
      if (data) {
        const prefs = data as any;
        if (prefs.onboarding) {
          const o = prefs.onboarding;
          if (o.tourCompleted)
            localStorage.setItem(
              this.getKey(STORAGE_KEYS.TOUR_COMPLETED),
              "true",
            );
          if (o.tourSkipped)
            localStorage.setItem(
              this.getKey(STORAGE_KEYS.TOUR_SKIPPED),
              "true",
            );
          if (o.firstLogin)
            localStorage.setItem(
              this.getKey(STORAGE_KEYS.FIRST_LOGIN_DATE),
              o.firstLogin,
            );
          if (o.progress)
            localStorage.setItem(
              this.getKey(STORAGE_KEYS.ONBOARDING_PROGRESS),
              JSON.stringify(o.progress),
            );
          if (o.seenFeatures)
            localStorage.setItem(
              this.getKey(STORAGE_KEYS.FEATURE_HIGHLIGHTS_SEEN),
              JSON.stringify(o.seenFeatures),
            );
          if (o.dismissedTips)
            localStorage.setItem(
              this.getKey(STORAGE_KEYS.TIPS_DISMISSED),
              JSON.stringify(o.dismissedTips),
            );
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Initial sync failed", err);
      } else {
        console.error("Initial sync failed");
      }
    }
  }

  private async syncToSupabaseAsync() {
    if (!this.userId) return;
    try {
      const state = {
        tourCompleted: !!localStorage.getItem(
          this.getKey(STORAGE_KEYS.TOUR_COMPLETED),
        ),
        tourSkipped: !!localStorage.getItem(
          this.getKey(STORAGE_KEYS.TOUR_SKIPPED),
        ),
        firstLogin: localStorage.getItem(
          this.getKey(STORAGE_KEYS.FIRST_LOGIN_DATE),
        ),
        progress: this.getProgress(),
        seenFeatures: this.getSeenFeatures(),
        dismissedTips: this.getDismissedTips(),
      };

      const data = await api.get(`/users/${this.userId}/preferences/`);
      const prefs = data || {};
      prefs.onboarding = state;

      await api.put(`/users/${this.userId}/preferences/`, prefs);
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error("Failed to sync onboarding", e);
      } else {
        console.error("Failed to sync onboarding");
      }
    }
  }

  /**
   * Get storage key with user prefix
   */
  private getKey(key: string): string {
    return this.userId ? `${key}_${this.userId}` : key;
  }

  /**
   * Check if user is experiencing the platform for the first time
   */
  isFirstTimeUser(): boolean {
    const firstLogin = localStorage.getItem(
      this.getKey(STORAGE_KEYS.FIRST_LOGIN_DATE),
    );
    return !firstLogin;
  }

  /**
   * Mark user's first login
   */
  markFirstLogin(): void {
    if (!localStorage.getItem(this.getKey(STORAGE_KEYS.FIRST_LOGIN_DATE))) {
      localStorage.setItem(
        this.getKey(STORAGE_KEYS.FIRST_LOGIN_DATE),
        new Date().toISOString(),
      );
      this.syncToSupabaseAsync();
    }
  }

  /**
   * Check if onboarding tour should be shown
   */
  shouldShowTour(): boolean {
    const completed = localStorage.getItem(
      this.getKey(STORAGE_KEYS.TOUR_COMPLETED),
    );
    const skipped = localStorage.getItem(
      this.getKey(STORAGE_KEYS.TOUR_SKIPPED),
    );
    return this.isFirstTimeUser() && !completed && !skipped;
  }

  /**
   * Mark tour as completed
   */
  completeTour(): void {
    localStorage.setItem(this.getKey(STORAGE_KEYS.TOUR_COMPLETED), "true");
    this.updateProgress({ tourCompleted: true });
    this.syncToSupabaseAsync();
  }

  /**
   * Mark tour as skipped
   */
  skipTour(): void {
    localStorage.setItem(this.getKey(STORAGE_KEYS.TOUR_SKIPPED), "true");
    this.syncToSupabaseAsync();
  }

  /**
   * Reset tour (for testing or user preference)
   */
  resetTour(): void {
    localStorage.removeItem(this.getKey(STORAGE_KEYS.TOUR_COMPLETED));
    localStorage.removeItem(this.getKey(STORAGE_KEYS.TOUR_SKIPPED));
    this.syncToSupabaseAsync();
  }

  /**
   * Get user's onboarding progress
   */
  getProgress(): OnboardingProgress {
    const stored = localStorage.getItem(
      this.getKey(STORAGE_KEYS.ONBOARDING_PROGRESS),
    );
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      profileCompleted: false,
      firstAssessmentTaken: false,
      firstCertificateEarned: false,
      videoUploaded: false,
      tourCompleted: false,
    };
  }

  /**
   * Update onboarding progress
   */
  updateProgress(updates: Partial<OnboardingProgress>): void {
    const current = this.getProgress();
    const updated = { ...current, ...updates };
    localStorage.setItem(
      this.getKey(STORAGE_KEYS.ONBOARDING_PROGRESS),
      JSON.stringify(updated),
    );
    this.syncToSupabaseAsync();
  }

  /**
   * Calculate onboarding completion percentage
   */
  getCompletionPercentage(): number {
    const progress = this.getProgress();
    const role = this.getUserRole();

    let steps = [progress.tourCompleted, progress.profileCompleted];

    if (role === "candidate") {
      steps = [
        ...steps,
        progress.firstAssessmentTaken,
        progress.firstCertificateEarned,
        progress.videoUploaded,
      ];
    }

    const completed = steps.filter(Boolean).length;
    return Math.round((completed / steps.length) * 100);
  }

  /**
   * Check if a feature highlight has been seen
   */
  hasSeenFeature(featureId: string): boolean {
    const seen = this.getSeenFeatures();
    return seen.includes(featureId);
  }

  /**
   * Get all seen feature highlights
   */
  getSeenFeatures(): string[] {
    const stored = localStorage.getItem(
      this.getKey(STORAGE_KEYS.FEATURE_HIGHLIGHTS_SEEN),
    );
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Mark a feature as seen
   */
  markFeatureSeen(featureId: string): void {
    const seen = this.getSeenFeatures();
    if (!seen.includes(featureId)) {
      seen.push(featureId);
      localStorage.setItem(
        this.getKey(STORAGE_KEYS.FEATURE_HIGHLIGHTS_SEEN),
        JSON.stringify(seen),
      );
      this.syncToSupabaseAsync();
    }
  }

  /**
   * Check if a tip has been dismissed
   */
  isTipDismissed(tipId: string): boolean {
    const dismissed = this.getDismissedTips();
    return dismissed.includes(tipId);
  }

  /**
   * Get all dismissed tips
   */
  getDismissedTips(): string[] {
    const stored = localStorage.getItem(
      this.getKey(STORAGE_KEYS.TIPS_DISMISSED),
    );
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Dismiss a tip
   */
  dismissTip(tipId: string): void {
    const dismissed = this.getDismissedTips();
    if (!dismissed.includes(tipId)) {
      dismissed.push(tipId);
      localStorage.setItem(
        this.getKey(STORAGE_KEYS.TIPS_DISMISSED),
        JSON.stringify(dismissed),
      );
      this.syncToSupabaseAsync();
    }
  }

  /**
   * Get full onboarding state
   */
  getFullState(): UserOnboardingState {
    return {
      isFirstTimeUser: this.isFirstTimeUser(),
      showTour: this.shouldShowTour(),
      progress: this.getProgress(),
      seenFeatures: this.getSeenFeatures(),
      dismissedTips: this.getDismissedTips(),
    };
  }

  /**
   * Reset all onboarding data (for testing)
   */
  resetAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(this.getKey(key));
    });
    this.syncToSupabaseAsync();
  }

  /**
   * Get next recommended action based on progress
   */
  getNextRecommendedAction(): {
    action: string;
    title: string;
    description: string;
    priority: number;
  } | null {
    const progress = this.getProgress();
    const role = this.getUserRole();

    if (!progress.tourCompleted) {
      return {
        action: "complete_tour",
        title: "Complete Welcome Tour",
        description: "Learn how to use the platform effectively",
        priority: 1,
      };
    }

    if (!progress.profileCompleted) {
      return {
        action: "complete_profile",
        title: "Complete Your Profile",
        description:
          role === "employer"
            ? "Add your company details and logo to attract top talent"
            : "Add your skills, experience, and bio to attract employers",
        priority: 2,
      };
    }

    if (role === "candidate") {
      if (!progress.firstAssessmentTaken) {
        return {
          action: "take_assessment",
          title: "Take Your First Assessment",
          description: "Get verified in a skill to earn your first certificate",
          priority: 3,
        };
      }

      if (!progress.videoUploaded) {
        return {
          action: "upload_video",
          title: "Record Video Introduction",
          description: "Stand out with a video intro analyzed by AI",
          priority: 4,
        };
      }
    }

    return null;
  }
}

// Export singleton instance
export const onboardingService = new OnboardingService();

// Export types
export type { OnboardingProgress, UserOnboardingState };
