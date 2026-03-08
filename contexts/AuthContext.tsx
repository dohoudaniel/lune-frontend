import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
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
    signUp: (email: string, password: string, name: string, role: 'candidate' | 'employer') => Promise<{ success: boolean; error?: string }>;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
    USER_PROFILE: 'lune_user_profile',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load auth state on mount
    useEffect(() => {
        const loadAuthState = async () => {
            try {
                // Check if this is an email verification callback
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const type = hashParams.get('type');

                if (accessToken && type === 'signup') {
                    // Clean up the URL hash
                    window.history.replaceState(null, '', window.location.pathname);
                }

                // Get current session from Supabase
                const { data: { session: currentSession } } = await supabase.auth.getSession();

                if (currentSession) {
                    await handleSession(currentSession);
                }
            } catch (error) {
                console.error('Error loading auth state:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAuthState();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            // Handle email verification specifically
            if (event === 'SIGNED_IN' && newSession) {
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                if (hashParams.get('type') === 'signup') {
                    // Email was just verified - the user will be automatically logged in
                    window.history.replaceState(null, '', window.location.pathname);
                }
            }

            if (newSession) {
                await handleSession(newSession);
            } else {
                setUser(null);
                setSession(null);
                localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSession = async (supabaseSession: Session) => {
        // Set session data immediately
        setSession({
            access_token: supabaseSession.access_token,
            refresh_token: supabaseSession.refresh_token || '',
            expires_at: supabaseSession.expires_at || 0,
        });

        // Helper function to create fallback user from auth metadata
        const createFallbackUser = (): AuthUser => {
            const cachedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
            if (cachedProfile) {
                try {
                    const parsedFn = JSON.parse(cachedProfile);
                    // Only use cache if it matches the current session user
                    if (parsedFn.id === supabaseSession.user.id) {
                        return parsedFn;
                    }
                } catch {
                    // Invalid cached profile, use metadata
                }
            }
            return {
                id: supabaseSession.user.id,
                email: supabaseSession.user.email || '',
                name: supabaseSession.user.user_metadata?.name || 'User',
                role: supabaseSession.user.user_metadata?.role || 'candidate',
            };
        };

        // Try to get user profile with a timeout to prevent hanging
        try {
            const profilePromise = supabase
                .from('users')
                .select('id, email, name, role')
                .eq('id', supabaseSession.user.id)
                .maybeSingle();

            // Add 5-second timeout
            const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            );

            const { data: profile, error } = await Promise.race([
                profilePromise,
                timeoutPromise
            ]) as { data: { id: string; email: string; name: string; role: 'candidate' | 'employer' } | null; error: Error | null };

            if (profile && !error) {
                const authUser: AuthUser = {
                    id: profile.id,
                    email: profile.email,
                    name: profile.name,
                    role: profile.role,
                };
                setUser(authUser);
                localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(authUser));
            } else {
                // Use fallback user

                const fallbackUser = createFallbackUser();
                setUser(fallbackUser);
                localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(fallbackUser));
            }
        } catch (error) {
            // Timeout or network error - use fallback

            const fallbackUser = createFallbackUser();
            setUser(fallbackUser);
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(fallbackUser));
        }
    };

    const signUp = useCallback(async (
        email: string,
        password: string,
        name: string,
        role: 'candidate' | 'employer'
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);

            // Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        role,
                    },
                    emailRedirectTo: `${window.location.origin}/`,
                },
            });

            if (authError) {
                console.error('Signup auth error:', authError);
                return { success: false, error: authError.message };
            }

            if (!authData.user) {
                return { success: false, error: 'Failed to create account' };
            }

            // Create user profile in our users table
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email,
                    name,
                    role,
                });

            if (profileError) {
                console.error('Profile creation error:', profileError);
                // Don't fail signup if profile creation fails - it might be due to RLS
                // The user can still log in and we'll create the profile later
            }

            // Create role-specific profile
            if (role === 'candidate') {
                await supabase
                    .from('candidate_profiles')
                    .insert({
                        user_id: authData.user.id,
                        title: 'Software Developer',
                        location: 'Remote',
                    });
            } else {
                await supabase
                    .from('employer_profiles')
                    .insert({
                        user_id: authData.user.id,
                        company_name: 'My Company',
                    });
            }

            // Check if email confirmation is required
            if (authData.session) {
                // Auto-confirmed, set user immediately
                const authUser: AuthUser = {
                    id: authData.user.id,
                    email,
                    name,
                    role,
                };
                setUser(authUser);
                localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(authUser));
                return { success: true };
            } else {
                // Email confirmation required
                return { success: true, error: 'Please check your email to confirm your account.' };
            }
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: 'An unexpected error occurred. Please try again.' };
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

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Login error:', error);
                return { success: false, error: error.message };
            }

            if (!data.user || !data.session) {
                return { success: false, error: 'Login failed' };
            }

            // Session will be handled by onAuthStateChange
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'An unexpected error occurred. Please try again.' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            setIsLoading(true);
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const value: AuthContextType = {
        user,
        session,
        isLoading,
        isAuthenticated: !!user && !!session,
        signUp,
        login,
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

// Export supabase client for other uses
export { supabase };
