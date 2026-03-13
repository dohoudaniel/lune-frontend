import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../lib/api';

// Types
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: 'candidate' | 'employer';
}

export interface AuthSession {
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
    USER_PROFILE: 'lune_user_profile',
    TOKEN: 'token'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load auth state on mount
    useEffect(() => {
        const loadAuthState = async () => {
            try {
                const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
                if (token) {
                    // Ideally we should call a /me endpoint here to verify token and get user
                    // For now, we will just load user from localStorage
                    const cachedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
                    if (cachedProfile) {
                        setUser(JSON.parse(cachedProfile));
                        setSession({
                            access_token: token,
                            refresh_token: '',
                            expires_at: 0
                        });
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
            return { success: false, error: error.message || 'An unexpected error occurred. Please try again.' };
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
            
            // Wait to intercept tokens from simpleJWT
            const { access, refresh } = response as any;
            
            // we should technically decode the JWT or fetch `/users/me/`
            localStorage.setItem(STORAGE_KEYS.TOKEN, access);
            const meRes = await api.get('/users/me/');
            
            const authUser: AuthUser = {
                id: (meRes as any).id,
                email: (meRes as any).email,
                name: (meRes as any).name,
                role: (meRes as any).role,
            };

            setUser(authUser);
            setSession({ access_token: access, refresh_token: refresh, expires_at: 0 });
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(authUser));
            localStorage.setItem(STORAGE_KEYS.TOKEN, access);

            return { success: true };
        } catch (error: any) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Invalid credentials or unverified email.' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const verifyEmail = useCallback(async (token: string) => {
        try {
            const res = await api.post('/auth/verify-email/', { token });
            const data = res as any;
            
            setUser(data.user);
            setSession({ access_token: data.tokens.access, refresh_token: data.tokens.refresh, expires_at: 0 });
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(data.user));
            localStorage.setItem(STORAGE_KEYS.TOKEN, data.tokens.access);

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'Failed to verify email.' };
        }
    }, []);

    const googleLogin = useCallback(async (credential: string, role?: 'candidate' | 'employer') => {
        try {
            setIsLoading(true);
            const res = await api.post('/auth/google/', { credential, role });
            const data = res as any;

            setUser(data.user);
            setSession({ access_token: data.tokens.access, refresh_token: data.tokens.refresh, expires_at: 0 });
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(data.user));
            localStorage.setItem(STORAGE_KEYS.TOKEN, data.tokens.access);

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'Google signup failed.' };
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
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local state even if backend call fails
            setUser(null);
            setSession(null);
            localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
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

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
