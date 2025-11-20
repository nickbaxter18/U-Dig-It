/**
 * Spin Wheel Hook
 *
 * Manages spin wheel state and API interactions.
 */
import { useCallback, useState } from 'react';

interface SpinSession {
  id: string;
  current_spin: number;
  spin_1_result?: string;
  spin_2_result?: string;
  spin_3_result?: string;
  final_prize_percentage?: number;
  promo_code?: string;
  expires_at: string;
}

interface UseSpinWheelReturn {
  session: SpinSession | null;
  isOpen: boolean;
  openSpinWheel: () => void;
  closeSpinWheel: () => void;
  createSession: () => Promise<SpinSession | null>;
  updateSpin: (
    sessionId: string,
    spinNumber: number,
    result: string,
    prize?: { percentage: number; promoCode: string }
  ) => Promise<SpinSession | null>;
  getSession: (sessionId: string) => Promise<SpinSession | null>;
}

export function useSpinWheel(): UseSpinWheelReturn {
  const [session, setSession] = useState<SpinSession | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openSpinWheel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSpinWheel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const createSession = useCallback(async (): Promise<SpinSession | null> => {
    try {
      const response = await fetch('/api/spin/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const { session: newSession } = await response.json();
      setSession(newSession);
      return newSession;
    } catch (error) {
      // Use logger instead of console.error
      if (typeof window !== 'undefined') {
        // Client-side: use logger if available, otherwise silent fail
        const logger = require('@/lib/logger').logger;
        logger?.error(
          'Failed to create spin session',
          {
            component: 'useSpinWheel',
            action: 'create_session_failed',
          },
          error as Error
        );
      }
      return null;
    }
  }, []);

  const updateSpin = useCallback(
    async (
      _sessionId: string, // Reserved for future session tracking
      spinNumber: number,
      _result: string, // Reserved for future result processing
      _prize?: { percentage: number; promoCode: string } // Reserved for future prize processing
    ): Promise<SpinSession | null> => {
      try {
        // Use the secure /api/spin/roll route instead
        const response = await fetch('/api/spin/roll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            spinNumber,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update spin');
        }

        const _outcome = await response.json(); // Reserved for future outcome processing
        // The secure route returns outcome, not session
        // Fetch updated session separately if needed
        return null; // Hook may need refactoring to match new API
      } catch (error) {
        // Use logger instead of console.error
        if (typeof window !== 'undefined') {
          const logger = require('@/lib/logger').logger;
          logger?.error(
            'Failed to update spin',
            {
              component: 'useSpinWheel',
              action: 'update_spin_failed',
            },
            error as Error
          );
        }
        return null;
      }
    },
    []
  );

  const getSession = useCallback(async (_sessionId: string): Promise<SpinSession | null> => {
    // Reserved for future session retrieval
    try {
      // Use Supabase directly with RLS protection, or create a secure API route
      // For now, return null - session should be fetched via /api/spin/start
      // This hook may need refactoring to match the new secure API structure
      return null;
    } catch (error) {
      // Use logger instead of console.error
      if (typeof window !== 'undefined') {
        const logger = require('@/lib/logger').logger;
        logger?.error(
          'Failed to get session',
          {
            component: 'useSpinWheel',
            action: 'get_session_failed',
          },
          error as Error
        );
      }
      return null;
    }
  }, []);

  return {
    session,
    isOpen,
    openSpinWheel,
    closeSpinWheel,
    createSession,
    updateSpin,
    getSession,
  };
}
