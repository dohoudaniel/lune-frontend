import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { api } from "../lib/api";
import { AuthUser } from "../types";
import {
  initializeNotifications,
  disconnectSSE,
} from "../services/notificationService";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  signUp: (
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    role: "candidate" | "employer",
  ) => Promise<{ success: boolean; error?: string }>;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  googleLogin: (
    credential: string,
    role?: "candidate" | "employer",
  ) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (
    token: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    old_password: string,
    new_password: string,
    new_password_confirm: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  markOnboardingComplete: () => Promise<{ success: boolean; error?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

// Only the non-sensitive user profile is cached in localStorage.
// JWT tokens are stored exclusively in HttpOnly cookies managed by the backend.
const USER_PROFILE_KEY = "lune_user_profile";

const extractErrorMessage = (error: unknown): string => {
  const err = error as any;
  if (err?.response?.data) {
    const data = err.response.data;
    if (data.detail) return data.detail;
    if (typeof data === "object") {
      const firstKey = Object.keys(data)[0];
      const firstError = data[firstKey];
      if (Array.isArray(firstError)) return `${firstKey}: ${firstError[0]}`;
      if (typeof firstError === "string") return firstError;
    }
  }
  return err?.message || "An unexpected error occurred. Please try again.";
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // On mount: restore cached profile, then verify with the backend
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        // Only attempt backend verification if there's a cached profile —
        // no cache means no active session, so skip the round-trip entirely.
        const cached = localStorage.getItem(USER_PROFILE_KEY);
        if (!cached) {
          setIsLoading(false);
          return;
        }

        // Optimistically restore from cache so the UI renders instantly
        setUser(JSON.parse(cached));

        // Verify the session cookie is still valid
        const meRes = (await api.get("/users/me/")) as any;
        const authUser: AuthUser = {
          id: meRes.id,
          email: meRes.email,
          name: meRes.name,
          role: meRes.role,
          onboarding_completed: meRes.onboarding_completed || false,
        };
        if (!authUser.onboarding_completed) {
          setShowOnboarding(true);
        }
        setUser(authUser);
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(authUser));
      } catch {
        // No valid session — clear stale cache
        setUser(null);
        localStorage.removeItem(USER_PROFILE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();

    const handleSessionExpired = () => {
      setUser(null);
      localStorage.removeItem(USER_PROFILE_KEY);
    };
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      first_name: string,
      last_name: string,
      role: "candidate" | "employer",
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await api.post("/auth/register/", {
          email,
          password,
          first_name,
          last_name,
          role,
        });
        return { success: true };
      } catch (error: unknown) {
        return { success: false, error: extractErrorMessage(error) };
      }
    },
    [],
  );

  const login = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);
        // Backend sets HttpOnly cookies; response body contains user data
        await api.post("/auth/login/", { email, password });

        const meRes = (await api.get("/users/me/")) as any;
        const authUser: AuthUser = {
          id: meRes.id,
          email: meRes.email,
          name: meRes.name,
          role: meRes.role,
          onboarding_completed: meRes.onboarding_completed || false,
        };
        if (!authUser.onboarding_completed) {
          setShowOnboarding(true);
        }
        setUser(authUser);
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(authUser));
        await initializeNotifications(authUser.id);
        return { success: true };
      } catch (error: unknown) {
        return { success: false, error: extractErrorMessage(error) };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const verifyEmail = useCallback(async (token: string) => {
    try {
      const res = (await api.post("/auth/verify-email/", { token })) as any;
      const authUser: AuthUser = {
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        role: res.user.role,
        onboarding_completed: res.user.onboarding_completed || false,
      };
      if (!authUser.onboarding_completed) {
        setShowOnboarding(true);
      }
      setUser(authUser);
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(authUser));
      await initializeNotifications(authUser.id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: extractErrorMessage(error) };
    }
  }, []);

  const googleLogin = useCallback(
    async (credential: string, role?: "candidate" | "employer") => {
      try {
        setIsLoading(true);
        const res = (await api.post("/auth/google/", {
          credential,
          role,
        })) as any;
        const authUser: AuthUser = {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          role: res.user.role,
          onboarding_completed: res.user.onboarding_completed || false,
        };
        if (!authUser.onboarding_completed) {
          setShowOnboarding(true);
        }
        setUser(authUser);
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(authUser));
        await initializeNotifications(authUser.id);
        return { success: true };
      } catch (error: unknown) {
        return { success: false, error: extractErrorMessage(error) };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      await api.post("/auth/password-reset/", { email });
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: extractErrorMessage(error) };
    }
  }, []);

  const resetPassword = useCallback(
    async (token: string, new_password: string) => {
      try {
        await api.post("/auth/password-reset-confirm/", {
          token,
          new_password,
        });
        return { success: true };
      } catch (error: unknown) {
        return { success: false, error: extractErrorMessage(error) };
      }
    },
    [],
  );

  const changePassword = useCallback(
    async (
      old_password: string,
      new_password: string,
      new_password_confirm: string,
    ) => {
      try {
        await api.post("/users/me/change-password/", {
          old_password,
          new_password,
          new_password_confirm,
        });
        return { success: true };
      } catch (error: unknown) {
        return { success: false, error: extractErrorMessage(error) };
      }
    },
    [],
  );

  const markOnboardingComplete = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      await api.post("/users/me/onboarding-complete/", {});
      if (user) {
        const updatedUser: AuthUser = { ...user, onboarding_completed: true };
        setUser(updatedUser);
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedUser));
      }
      setShowOnboarding(false);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: extractErrorMessage(error) };
    }
  }, [user]);

  const logout = useCallback(async () => {
    // Disconnect SSE and clear local state immediately so the UI responds instantly
    disconnectSSE();
    setUser(null);
    localStorage.removeItem(USER_PROFILE_KEY);
    setShowOnboarding(false);
    // Fire-and-forget the backend blacklist call
    api.post("/auth/logout/", {}).catch(() => {});
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    showOnboarding,
    setShowOnboarding,
    signUp,
    login,
    verifyEmail,
    googleLogin,
    requestPasswordReset,
    resetPassword,
    changePassword,
    logout,
    markOnboardingComplete,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
