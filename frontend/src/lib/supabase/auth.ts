import type { Tables } from '@/../../supabase/types';
import { supabase } from './client';

export type User = Tables<'users'>;

export const authService = {
  // Sign up with email/password
  async signUp(email: string, password: string, userData: Partial<User>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) throw error;
    return data;
  },

  // Sign in with email/password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (process.env.NODE_ENV === 'development') {
      console.debug(
        '[authService.signIn] signInWithPassword response',
        JSON.stringify(
          {
            hasSession: Boolean(data?.session),
            hasUser: Boolean(data?.user),
            error: error ? { message: error.message, status: (error as any)?.status } : null,
          },
          null,
          2
        )
      );
    }

    if (error) throw error;
    return data;
  },

  // Google OAuth
  async signInWithGoogle(redirectTo?: string) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`,
      },
    });

    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get session
  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },
};
