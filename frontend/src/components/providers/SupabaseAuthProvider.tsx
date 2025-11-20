'use client';

import { Session, User } from '@supabase/supabase-js';

import { createContext, useContext, useEffect, useState } from 'react';

import { logger } from '@/lib/logger';
import { authService } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    userData: unknown
  ) => Promise<{ user: User | null; session: Session | null }>;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchAndSetUserRole = async (userId: string, fallbackRole: string | null) => {
    try {
      const { data, error } = await supabase.from('users').select('role').eq('id', userId).single();

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          logger.debug(
            '[SupabaseAuthProvider] Failed to fetch role from users table, falling back to metadata',
            {
              component: 'SupabaseAuthProvider',
              action: 'debug',
              metadata: { error: error.message },
            }
          );
        }
        setRole(fallbackRole);
      } else {
        setRole((data as { role?: string } | null)?.role ?? fallbackRole);
      }
    } catch (roleError) {
      logger.error(
        '[SupabaseAuthProvider] Unexpected error fetching user role',
        {
          component: 'SupabaseAuthProvider',
          action: 'error',
        },
        roleError instanceof Error ? roleError : new Error(String(roleError))
      );
      setRole(fallbackRole);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session SYNCHRONOUSLY from storage first
    const initializeAuth = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('[SupabaseAuthProvider] Initializing auth...', {
            component: 'SupabaseAuthProvider',
            action: 'debug',
          });
        }

        // FIRST: Try to get session from Supabase (checks both localStorage and cookies)
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          logger.error(
            '[SupabaseAuthProvider] Error getting session:',
            {
              component: 'SupabaseAuthProvider',
              action: 'error',
            },
            error instanceof Error ? error : new Error(String(error))
          );
          setUser(null);
          setRole(null);
        } else if (session?.user) {
          if (process.env.NODE_ENV === 'development') {
            logger.debug('[SupabaseAuthProvider] Session found, user logged in:', {
              component: 'SupabaseAuthProvider',
              action: 'debug',
              metadata: { email: session.user.email },
            });
            logger.debug('[SupabaseAuthProvider] User role:', {
              component: 'SupabaseAuthProvider',
              action: 'debug',
              metadata: { role: session.user.user_metadata?.role },
            });
          }
          setUser(session.user);
          setRole(session.user.user_metadata?.role ?? null);
          void fetchAndSetUserRole(session.user.id, session.user.user_metadata?.role ?? null);
        } else {
          // FALLBACK: Check for session in cookie (OAuth callback case)
          try {
            const cookieSession = document.cookie
              .split('; ')
              .find((row) => row.startsWith('supabase.auth.token='))
              ?.split('=')[1];

            if (cookieSession) {
              const sessionData = JSON.parse(decodeURIComponent(cookieSession));
              if (process.env.NODE_ENV === 'development') {
                logger.debug('[SupabaseAuthProvider] Found session in cookie, setting session...', {
                  component: 'SupabaseAuthProvider',
                  action: 'debug',
                });
              }

              // Set the session from cookie
              const {
                data: { session: newSession },
                error: setError,
              } = await supabase.auth.setSession({
                access_token: sessionData.access_token,
                refresh_token: sessionData.refresh_token,
              });

              if (setError) {
                logger.error(
                  '[SupabaseAuthProvider] Error setting session from cookie:',
                  { component: 'SupabaseAuthProvider', action: 'error' },
                  setError instanceof Error ? setError : new Error(String(setError))
                );
                setUser(null);
                setRole(null);
              } else if (newSession?.user) {
                if (process.env.NODE_ENV === 'development') {
                  logger.debug('[SupabaseAuthProvider] Session restored from cookie:', {
                    component: 'SupabaseAuthProvider',
                    action: 'debug',
                    metadata: { email: newSession.user.email },
                  });
                }
                setUser(newSession.user);
                setRole(newSession.user.user_metadata?.role ?? null);
                void fetchAndSetUserRole(
                  newSession.user.id,
                  newSession.user.user_metadata?.role ?? null
                );
              } else {
                if (process.env.NODE_ENV === 'development') {
                  logger.debug('[SupabaseAuthProvider] No active session', {
                    component: 'SupabaseAuthProvider',
                    action: 'debug',
                  });
                }
                setUser(null);
                setRole(null);
              }
            } else {
              if (process.env.NODE_ENV === 'development') {
                logger.debug('[SupabaseAuthProvider] No active session', {
                  component: 'SupabaseAuthProvider',
                  action: 'debug',
                });
              }
              setUser(null);
              setRole(null);
            }
          } catch (cookieError) {
            logger.error(
              '[SupabaseAuthProvider] Error reading session from cookie:',
              {
                component: 'SupabaseAuthProvider',
                action: 'error',
              },
              cookieError instanceof Error ? cookieError : new Error(String(cookieError))
            );
            setUser(null);
            setRole(null);
          }
        }
      } catch (error) {
        logger.error(
          '[SupabaseAuthProvider] Failed to initialize auth:',
          {
            component: 'SupabaseAuthProvider',
            action: 'error',
          },
          error instanceof Error ? error : new Error(String(error))
        );
        if (mounted) {
          setUser(null);
          setRole(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: unknown, session: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[SupabaseAuthProvider] Auth state changed:', {
          component: 'SupabaseAuthProvider',
          action: 'debug',
          metadata: { event, email: session?.user?.email },
        });
      }

      if (mounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          setRole(session.user.user_metadata?.role ?? null);
          void fetchAndSetUserRole(session.user.id, session.user.user_metadata?.role ?? null);
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      const userRole = user.user_metadata?.role ?? null;
      void fetchAndSetUserRole(user.id, userRole);
    }
  }, [user?.id, user?.user_metadata?.role]);

  const value = {
    user,
    role,
    loading,
    initialized,
    signIn: async (email: string, password: string) => {
      await authService.signIn(email, password);
    },
    signUp: async (email: string, password: string, userData: unknown) => {
      return await authService.signUp(email, password, userData);
    },
    signInWithGoogle: async (redirectTo?: string) => {
      await authService.signInWithGoogle(redirectTo);
    },
    signOut: async () => {
      await authService.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
