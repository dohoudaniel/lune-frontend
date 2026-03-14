import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../lib/api';

import { AuthUser, AuthSession } from '../types';

interface AuthContextType {
    user: AuthUser | null;
    session: AuthSession | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signUp: (email: string, password: string, first_name: string, last_name: string, role: 'candidate' | 'employer') => Promise<{ success: boolean; error?: string }>;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
    googleLogin: (credential: string, role?: 'candidate' | 'employer') => Promise<{ success: boolean; error?: string }>;
    requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
    resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
    USER_PROFILE: 'lune_user_profile',
    ACCESS_TOKEN: 'lune_access_token',
    REFRESH_TOKEN: 'lune_refresh_token',
};

const extractErrorMessage = (error: any): string => {
    if (error.response?.data) {
        const data = error.response.data;
        if (data.detail) return data.detail;
        if (typeof data === 'object') {
            // Flatten first field error
            const firstKey = Object.keys(data)[0];
            const firstError = data[firstKey];
            if (Array.isArray(firstError)) return `${firstKey}: ${firstError[0]}`;
            if (typeof firstError === 'string') return firstError;
        }
    }
    return error.message || 'An unexpected error occurred. Please try again.';
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load auth state on mount
    useEffect(() => {
        const loadAuthState = async () => {
            try {
                const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
                const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
                
                if (accessToken) {
                    // Try to restore user profile from cache first
                    const cachedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
                    if (cachedProfile) {
                        setUser(JSON.parse(cachedProfile));
                        setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || '',
                            expires_at: 0
                        });
                    }
                    
                    // Verify authorization by fetching current user data
                    try {
                        const meRes = await api.get('/users/me/');
                        const authUser: AuthUser = {
                            id: (meRes as any).id,
                            email: (meRes as any).email,
                            name: (meRes as any).name,
                            role: (meRes as any).role,
                        };
                        setUser(authUser);
                        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(authUser));
                    } catch (err) {
                        console.error('Failed to verify session:', err);
                        // If token is invalid and can't be refreshed, clear state handled by API interceptor
                    }
                }
            } catch (error) {
                console.error('Error loading auth state:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAuthState();
    }, []);

    const signUp = useCallback(async (
        email: string,
        password: string,
        first_name: string,
        last_name: string,
        role: 'candidate' | 'employer'
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);
            await api.post('/auth/register/', { email, password, first_name, last_name, role });
            // Don't set user since they need to verify email
            return { success: true };
        } catch (error: any) {
            console.error('Signup error:', error);
            return { success: false, error: extractErrorMessage(error) };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (
        email: string,
        password: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);
            const response = await api.post('/auth/login/', { email, password });
            
            // Tokens from simpleJWT
            const { access, refresh, expires_at } = response as any;
            
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
            
            const meRes = await api.get('/users/me/');
            
            const authUser: AuthUser = {
                id: (meRes as any).id,
                email: (meRes as any).email,
                name: (meRes as any).name,
                role: (meRes as any).role,
            };

            setUser(authUser);
            setSession({ access_token: access, refresh_token: refresh, expires_at: expires_at || 0 });
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(authUser));

            return { success: true };
        } catch (error: any) {
            console.error('Login error:', error);
            return { success: false, error: extractErrorMessage(error) };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const verifyEmail = useCallback(async (token: string) => {
        try {
            const res = await api.post('/auth/verify-email/', { token });
            const data = res as any;
            
            setUser(data.user);
            setSession({ 
                access_token: data.tokens.access, 
                refresh_token: data.tokens.refresh, 
                expires_at: data.tokens.expires_at || 0 
            });
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(data.user));
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.tokens.access);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.tokens.refresh);

            return { success: true };
        } catch (error: any) {
            return { success: false, error: extractErrorMessage(error) };
        }
    }, []);

    const googleLogin = useCallback(async (credential: string, role?: 'candidate' | 'employer') => {
        try {
            setIsLoading(true);
            const res = await api.post('/auth/google/', { credential, role });
            const data = res as any;

            setUser(data.user);
            setSession({ 
                access_token: data.tokens.access, 
                refresh_token: data.tokens.refresh, 
                expires_at: data.tokens.expires_at || 0 
            });
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(data.user));
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.tokens.access);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.tokens.refresh);

            return { success: true };
        } catch (error: any) {
            return { success: false, error: extractErrorMessage(error) };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const requestPasswordReset = useCallback(async (email: string) => {
        try {
            setIsLoading(true);
            await api.post('/auth/password-reset/', { email });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'Failed to request password reset.' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resetPassword = useCallback(async (token: string, new_password: string) => {
        try {
            setIsLoading(true);
            await api.post('/auth/password-reset-confirm/', { token, new_password });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'Failed to reset password.' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            setIsLoading(true);
            const refresh = session?.refresh_token;
            if (refresh) {
                await api.post('/auth/logout/', { refresh });
            }
            setUser(null);
            setSession(null);
            localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local state even if backend call fails
            setUser(null);
            setSession(null);
            localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    const value: AuthContextType = {
        user,
        session,
        isLoading,
        isAuthenticated: !!user && !!session,
        signUp,
        login,
        verifyEmail,
        googleLogin,
        requestPasswordReset,
        resetPassword,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

