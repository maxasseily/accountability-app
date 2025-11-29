import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
}

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  session: Session | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    let mounted = true;
    let isInitialized = false;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) return;

        // If there's an error getting the session (e.g., invalid refresh token), clear it
        if (sessionError) {
          // Only log unexpected errors (not "Refresh Token Not Found" on first load)
          if (!sessionError.message?.includes('Refresh Token Not Found')) {
            console.error('Session error:', sessionError);
          }
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        } else if (initialSession) {
          setSession(initialSession);
          await loadUserProfile(initialSession.user);
        }

        isInitialized = true;
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear any corrupted session data
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('Error signing out:', signOutError);
        }
        setSession(null);
        setUser(null);
        isInitialized = true;
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        // Skip INITIAL_SESSION and SIGNED_IN events during initialization to avoid duplicate loads
        if (!isInitialized && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
          return;
        }

        setSession(newSession);

        if (newSession?.user) {
          await loadUserProfile(newSession.user);
        } else {
          setUser(null);
        }

        // Always ensure loading is false after auth state changes
        if (mounted) {
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Fallback to auth metadata if profile fetch fails
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user',
        });
        return;
      }

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        username: profile?.username || supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user',
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback to auth metadata
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user',
      });
    }
  };

  const login = async (username: string, password: string) => {
    // First, look up the email from the username (case-insensitive)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .ilike('username', username)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('Invalid username or password');
    }

    // Now sign in with the email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (error) {
      throw new Error('Invalid username or password');
    }

    if (data.user) {
      await loadUserProfile(data.user);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });

    if (error) {
      // Check if it's a duplicate username error
      if (error.message?.includes('duplicate key') || error.message?.includes('profiles_username_key')) {
        throw new Error('Username already taken! Try something else.');
      }
      throw new Error(error.message);
    }

    // Note: Supabase may require email confirmation
    // Check if email confirmation is required
    if (data.user && !data.session) {
      throw new Error('Please check your email to confirm your account before logging in.');
    }

    if (data.user) {
      try {
        await loadUserProfile(data.user);
      } catch (profileError: any) {
        // Check if it's a duplicate username error from the database trigger
        if (profileError?.message?.includes('duplicate key') ||
            profileError?.message?.includes('profiles_username_key') ||
            profileError?.message?.includes('unique constraint')) {
          // Clean up the auth user since profile creation failed
          await supabase.auth.signOut();
          throw new Error('Username already taken! Try something else.');
        }
        throw profileError;
      }
    }
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .ilike('username', username)
      .maybeSingle();

    // If no data is found (null), username is available
    // If data is found, username is taken
    return data === null;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'accountability-app://reset-password',
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        login,
        signup,
        logout,
        resetPassword,
        checkUsernameAvailability,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
