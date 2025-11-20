/**
 * Spin Wheel Component
 *
 * A 3-spin wheel system with dynamic prize allocation.
 * Transparent and compliant with clear terms disclosure.
 *
 * SECURITY: All business logic handled server-side via API routes.
 * - POST /api/spin/start - Creates session with fraud detection
 * - POST /api/spin/roll - Performs spin with server-side RNG
 * - Outcomes determined by cryptographically secure RNG
 * - No client-side manipulation possible
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import {
  trackCouponIssued,
  trackSpinCompleted,
  trackSpinEmailCaptured,
  trackSpinModalClose,
  trackSpinModalView,
  trackSpinSessionCreated,
  trackSpinStarted,
} from '@/lib/analytics/spin-events';
import { getDeviceFingerprint } from '@/lib/device-fingerprint';
import { logger } from '@/lib/logger';

interface SpinWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onWin: (prize: { percentage: number; promoCode: string }) => void;
}

interface SpinSession {
  id: string;
  session_token: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  spins_allowed: number;
  spins_used: number;
  outcomes: Array<{
    spin: number;
    outcome: string;
    timestamp: string;
  }>;
  prize_pct: number | null;
  coupon_code: string | null;
  completed: boolean;
  expires_at: string;
  created_at: string;
}

// Create weighted slices for proper visual distribution
// DOLLAR AMOUNTS: $50, $75, $100
// ALL slices EQUAL size (weight: 1) - mixed distribution
// 3x $50, 2x $75, 1x $100, 6x Try Again = 12 total slices
const WHEEL_SLICES = [
  { id: '50', label: '$50', color: '#10B981', gradient: 'from-green-400 to-green-600', weight: 1 },
  {
    id: 'try_again',
    label: 'Try Again',
    color: '#6B7280',
    gradient: 'from-gray-400 to-gray-600',
    weight: 1,
  },
  {
    id: '75',
    label: '$75',
    color: '#F59E0B',
    gradient: 'from-yellow-400 to-orange-500',
    weight: 1,
  },
  {
    id: 'try_again',
    label: 'Try Again',
    color: '#6B7280',
    gradient: 'from-gray-400 to-gray-600',
    weight: 1,
  },
  { id: '50', label: '$50', color: '#10B981', gradient: 'from-green-400 to-green-600', weight: 1 },
  {
    id: 'try_again',
    label: 'Try Again',
    color: '#6B7280',
    gradient: 'from-gray-400 to-gray-600',
    weight: 1,
  },
  { id: '100', label: '$100', color: '#EF4444', gradient: 'from-red-400 to-red-600', weight: 1 },
  {
    id: 'try_again',
    label: 'Try Again',
    color: '#6B7280',
    gradient: 'from-gray-400 to-gray-600',
    weight: 1,
  },
  {
    id: '75',
    label: '$75',
    color: '#F59E0B',
    gradient: 'from-yellow-400 to-orange-500',
    weight: 1,
  },
  {
    id: 'try_again',
    label: 'Try Again',
    color: '#6B7280',
    gradient: 'from-gray-400 to-gray-600',
    weight: 1,
  },
  { id: '50', label: '$50', color: '#10B981', gradient: 'from-green-400 to-green-600', weight: 1 },
  {
    id: 'try_again',
    label: 'Try Again',
    color: '#6B7280',
    gradient: 'from-gray-400 to-gray-600',
    weight: 1,
  },
];

export default function SpinWheel({ isOpen, onClose, onWin }: SpinWheelProps) {
  const { user } = useAuth();
  const [session, setSession] = useState<SpinSession | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0); // Track cumulative rotation

  // Email/phone capture for guests
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const wheelRef = useRef<HTMLDivElement>(null);

  // Sound effect functions using Web Audio API
  // ✅ FIX: Create ONE shared AudioContext and reuse it for all sounds
  // This prevents hitting browser limits on concurrent AudioContexts
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        logger.debug('Created shared AudioContext', {
          component: 'SpinWheel',
          action: 'audio_context_created',
        });
      } catch (error) {
        logger.error(
          'Failed to create AudioContext',
          {
            component: 'SpinWheel',
            action: 'audio_context_failed',
          },
          error as Error
        );
        return null;
      }
    }

    // Resume if suspended (browser auto-play policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
      logger.debug('Resumed suspended AudioContext', {
        component: 'SpinWheel',
        action: 'audio_context_resumed',
      });
    }

    return audioContextRef.current;
  };

  const playWinSound = () => {
    try {
      const audioContext = getAudioContext();
      if (!audioContext) return;

      // 🎉 Pleasant ascending arpeggio with sparkle effects

      const now = audioContext.currentTime;

      // Ascending melody notes (C major arpeggio - happy and celebratory)
      const melody = [
        { freq: 523.25, time: 0.0 }, // C5
        { freq: 659.25, time: 0.08 }, // E5
        { freq: 783.99, time: 0.16 }, // G5
        { freq: 1046.5, time: 0.24 }, // C6 (octave up - triumphant!)
      ];

      // Play each note in the ascending arpeggio
      melody.forEach(({ freq, time }) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.frequency.value = freq;
        osc.type = 'sine'; // Pure, pleasant tone

        // Quick attack, smooth decay
        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.25, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.3);

        osc.start(now + time);
        osc.stop(now + time + 0.3);
      });

      // ✨ Sparkle/shimmer layer (high frequencies for magic feel)
      for (let i = 0; i < 6; i++) {
        const sparkle = audioContext.createOscillator();
        const sparkleGain = audioContext.createGain();

        sparkle.connect(sparkleGain);
        sparkleGain.connect(audioContext.destination);

        // Random high frequencies for sparkle effect
        sparkle.frequency.value = 2000 + Math.random() * 1000;
        sparkle.type = 'sine';

        const startTime = now + i * 0.05;
        sparkleGain.gain.setValueAtTime(0.08, startTime);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

        sparkle.start(startTime);
        sparkle.stop(startTime + 0.15);
      }

      // 🔊 Bass "boom" for impact at the end
      const bass = audioContext.createOscillator();
      const bassGain = audioContext.createGain();

      bass.connect(bassGain);
      bassGain.connect(audioContext.destination);

      bass.frequency.value = 130.81; // C3 (deep bass)
      bass.type = 'sine';

      bassGain.gain.setValueAtTime(0.2, now + 0.24);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      bass.start(now + 0.24);
      bass.stop(now + 0.6);

      logger.debug('Win celebration sound played', {
        component: 'SpinWheel',
        action: 'win_sound_played',
      });
    } catch (error) {
      logger.error(
        'Win sound failed',
        {
          component: 'SpinWheel',
          action: 'win_sound_failed',
        },
        error as Error
      );
    }
  };

  const playLoseSound = () => {
    try {
      const audioContext = getAudioContext();
      if (!audioContext) return;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 200; // Low frequency
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      logger.debug('Lose sound played', {
        component: 'SpinWheel',
        action: 'lose_sound_played',
      });
    } catch (error) {
      logger.error(
        'Lose sound failed',
        {
          component: 'SpinWheel',
          action: 'lose_sound_failed',
        },
        error as Error
      );
    }
  };

  const playTickSound = () => {
    try {
      const audioContext = getAudioContext();
      if (!audioContext) return;

      // Professional casino wheel click - layered tones for rich, satisfying sound
      // This mimics the sound of a real Vegas-style prize wheel

      // Low frequency layer (wooden wheel body resonance)
      const bass = audioContext.createOscillator();
      const bassGain = audioContext.createGain();

      bass.connect(bassGain);
      bassGain.connect(audioContext.destination);

      bass.frequency.value = 120; // Deep woody resonance
      bass.type = 'sine';

      bassGain.gain.setValueAtTime(0.12, audioContext.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);

      bass.start(audioContext.currentTime);
      bass.stop(audioContext.currentTime + 0.08);

      // Mid frequency layer (mechanical click)
      const mid = audioContext.createOscillator();
      const midGain = audioContext.createGain();

      mid.connect(midGain);
      midGain.connect(audioContext.destination);

      mid.frequency.value = 600; // Crisp mechanical click
      mid.type = 'triangle';

      midGain.gain.setValueAtTime(0.1, audioContext.currentTime);
      midGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.04);

      mid.start(audioContext.currentTime);
      mid.stop(audioContext.currentTime + 0.04);

      // High frequency layer (metallic ping for definition)
      const high = audioContext.createOscillator();
      const highGain = audioContext.createGain();

      high.connect(highGain);
      highGain.connect(audioContext.destination);

      high.frequency.value = 2400; // Bright metallic accent
      high.type = 'sine';

      highGain.gain.setValueAtTime(0.06, audioContext.currentTime);
      highGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.02);

      high.start(audioContext.currentTime);
      high.stop(audioContext.currentTime + 0.02);

      logger.debug('Casino click sound played', {
        component: 'SpinWheel',
        action: 'tick_sound_played',
      });
    } catch (error) {
      logger.error(
        'Tick sound failed',
        {
          component: 'SpinWheel',
          action: 'tick_sound_failed',
        },
        error as Error
      );
    }
  };

  // Separate function to schedule ticks - GUARANTEED to run
  const scheduleTicksForSpin = (startRotation: number, endRotation: number, spinNumber: number) => {
    logger.debug('Starting tick scheduling', {
      component: 'SpinWheel',
      action: 'tick_scheduling_start',
      metadata: { spinNumber, startRotation, endRotation },
    });

    const degreesPerSlice = 30;
    const totalRotation = endRotation - startRotation;
    const boundariesToCross = Math.floor(totalRotation / degreesPerSlice);
    const spinDuration = 6000; // 6 seconds to match animation

    logger.debug('Tick scheduling parameters', {
      component: 'SpinWheel',
      action: 'tick_scheduling_params',
      metadata: { totalRotation, boundariesToCross },
    });

    // EXACT cubic bezier matching CSS: cubic-bezier(0.23, 1, 0.32, 1)
    // This ensures ticks are perfectly synced with visual wheel movement
    const cubicBezier = (t: number): number => {
      // Control points for cubic-bezier(0.23, 1, 0.32, 1)
      const p1y = 1;
      const p2y = 1;

      // Cubic bezier formula: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
      // For y-axis (progress): P0=0, P3=1
      const cy = 3 * p1y;
      const by = 3 * (p2y - p1y) - cy;
      const ay = 1 - cy - by;

      // Calculate eased progress for given time t
      return ay * t * t * t + by * t * t + cy * t;
    };

    // Find time for a given rotation progress (inverse bezier)
    const findTimeForRotation = (rotationProgress: number): number => {
      // Binary search to find t where cubicBezier(t) = rotationProgress
      let low = 0,
        high = 1,
        mid = 0;
      const epsilon = 0.0001; // Precision

      for (let i = 0; i < 30; i++) {
        // Increased iterations for better accuracy
        mid = (low + high) / 2;
        const easedProgress = cubicBezier(mid);

        if (Math.abs(easedProgress - rotationProgress) < epsilon) {
          break; // Close enough
        }

        if (easedProgress < rotationProgress) {
          low = mid;
        } else {
          high = mid;
        }
      }

      return mid * spinDuration;
    };

    // Schedule ticks with precise timing + audio latency compensation
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const audioLatencyCompensation = 40; // Play 40ms early to compensate for audio processing delay

    for (let i = 1; i <= boundariesToCross; i++) {
      const rotationProgress = (i * degreesPerSlice) / totalRotation;

      if (rotationProgress >= 0 && rotationProgress <= 1) {
        const tickTime = findTimeForRotation(rotationProgress);

        // Compensate for audio latency by playing slightly early
        const compensatedTime = Math.max(0, tickTime - audioLatencyCompensation);

        const timeout = setTimeout(() => {
          playTickSound();
        }, compensatedTime);

        timeouts.push(timeout);
      }
    }

    logger.debug('Tick scheduling completed', {
      component: 'SpinWheel',
      action: 'tick_scheduling_complete',
      metadata: { spinNumber, ticksScheduled: timeouts.length, audioLatencyCompensation },
    });

    // Auto cleanup (6s animation + 500ms buffer)
    setTimeout(() => {
      timeouts.forEach((t) => clearTimeout(t));
      logger.debug('Ticks cleaned up', {
        component: 'SpinWheel',
        action: 'tick_cleanup',
        metadata: { spinNumber },
      });
    }, spinDuration + 500); // 6500ms total

    return timeouts;
  };

  // Track modal view on open
  useEffect(() => {
    if (isOpen) {
      trackSpinModalView();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSession(null);
      setIsLoading(false);
      setError(null);
      setIsSpinning(false);
      setSpinResult(null);
      setShowGuestForm(false);
      setGuestEmail('');
      setGuestPhone('');
      setShowConfetti(false);
      setCodeCopied(false);
      setMarketingConsent(false);
      setCurrentRotation(0); // Reset rotation for next session

      if (wheelRef.current) {
        wheelRef.current.style.transform = 'rotate(0deg)';
        wheelRef.current.style.transition = 'none';
      }
    }
  }, [isOpen]);

  // Timer countdown
  useEffect(() => {
    if (!session?.expires_at) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(session.expires_at).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session?.expires_at]);

  // Close handler with analytics
  const handleClose = useCallback(() => {
    if (isSpinning) return; // Don't allow closing during spin

    // Track modal close (for abandonment analysis)
    trackSpinModalClose(session?.id, session?.spins_used);

    onClose();
  }, [isSpinning, session?.id, session?.spins_used, onClose]);

  // Create or load session via API
  useEffect(() => {
    if (!isOpen) return;

    const createSession = async () => {
      try {
        // For guests, show email capture form first (instant)
        if (!user) {
          setShowGuestForm(true);
          return;
        }

        // Show loading state for authenticated users
        setIsLoading(true);
        setError(null);

        // Get device fingerprint (optimized - only essential data)
        const deviceFingerprint = await getDeviceFingerprint();

        const response = await fetch('/api/spin/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: guestEmail || undefined,
            phone: guestPhone || undefined,
            deviceFingerprint,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create session');
        }

        const data = await response.json();
        setSession(data.session);
        setShowGuestForm(false);

        // Track session creation
        trackSpinSessionCreated(data.session.id, user?.id);

        logger.info('[SpinWheel] Session created/loaded', {
          component: 'SpinWheel',
          action: 'session_created',
          metadata: {
            sessionId: data.session.id,
            isExisting: data.isExisting,
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to start spin session';
        setError(errorMessage);
        logger.error(
          '[SpinWheel] Failed to create session',
          {
            component: 'SpinWheel',
            action: 'session_create_error',
          },
          error as Error
        );
      } finally {
        setIsLoading(false);
      }
    };

    createSession();
  }, [isOpen, user, guestEmail, guestPhone]);

  // Keyboard handler for ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSpinning) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, isSpinning, handleClose]);

  // Guest form submission handler
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestEmail) {
      setError('Email is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get device fingerprint for fraud detection
      const deviceFingerprint = await getDeviceFingerprint();

      const response = await fetch('/api/spin/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: guestEmail,
          phone: guestPhone || undefined,
          deviceFingerprint,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const data = await response.json();
      setSession(data.session);
      setShowGuestForm(false);

      // Track email capture
      trackSpinEmailCaptured(guestEmail, guestPhone);
      trackSpinSessionCreated(data.session.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start session';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Handle spin - SERVER-SIDE DETERMINATION
   *
   * SECURITY: Outcome is determined by server-side cryptographically secure RNG.
   * Frontend receives the outcome and animates the wheel to that result.
   * No client-side manipulation possible.
   */
  const handleSpin = async () => {
    if (!session || isSpinning || !session.id) return;

    try {
      setIsSpinning(true);
      setSpinResult(null);
      setError(null);

      const spinNumber = session.spins_used + 1;

      // Track spin started
      trackSpinStarted(session.id, spinNumber, false);

      // Call API to perform spin (server determines outcome)
      const response = await fetch('/api/spin/roll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform spin');
      }

      const data = await response.json();
      const { outcome, couponCode, spin } = data;

      // Track spin completion
      const won = outcome !== 'try_again';
      trackSpinCompleted(session.id, spin, outcome, won);

      // Track coupon issuance if won
      if (won && couponCode) {
        const percentage = parseInt(outcome);
        trackCouponIssued(session.id, couponCode, percentage);
      }

      logger.info('[SpinWheel] Spin completed', {
        component: 'SpinWheel',
        action: 'spin_completed',
        metadata: { outcome, spin, sessionId: session.id, won },
      });

      // Animate wheel to server-determined outcome
      if (wheelRef.current) {
        // Calculate target slice position based on outcome
        // Outcome is now a dollar amount ('50', '75', '100') or 'try_again'
        const resultSliceId = outcome === 'try_again' ? 'try_again' : outcome;

        // All slices are equal size (30 degrees each for 12 slices)
        const sliceAngle = 360 / WHEEL_SLICES.length;

        // Find the target slice index (use forced slice if provided by API)
        let targetSliceIndex = -1;
        if (data.sliceIndex !== undefined) {
          targetSliceIndex = data.sliceIndex;
        } else {
          // Find matching slices
          const matchingSlices = WHEEL_SLICES.map((slice: unknown, index: unknown) => ({
            slice,
            index,
          })).filter(({ slice }) => slice.id === resultSliceId);

          if (matchingSlices.length > 0) {
            // Randomly select one of the matching slices
            const randomMatch = matchingSlices[Math.floor(Math.random() * matchingSlices.length)];
            targetSliceIndex = randomMatch.index;
          }
        }

        if (targetSliceIndex !== -1) {
          // Calculate target angle to center the pointer on the slice
          const sliceCenterAngle = targetSliceIndex * sliceAngle + sliceAngle / 2;
          const absoluteTargetAngle = (360 - sliceCenterAngle) % 360;

          // Calculate relative rotation from current position to target
          const currentNormalized = currentRotation % 360;
          let relativeRotation = absoluteTargetAngle - currentNormalized;

          // Ensure we always rotate forward (positive direction)
          if (relativeRotation < 0) {
            relativeRotation += 360;
          }

          // Add 8-10 full rotations for dramatic spinning effect
          const fullRotations = 8 + Math.floor(Math.random() * 3); // 8-10 rotations
          const newRotation = currentRotation + 360 * fullRotations + relativeRotation;

          // DEBUG: Extensive logging
          logger.debug('Spin calculation debug', {
            component: 'SpinWheel',
            action: 'spin_calculation_debug',
            metadata: {
              targetSliceIndex,
              targetSliceLabel: WHEEL_SLICES[targetSliceIndex].label,
              sliceAngle,
              sliceCenterAngle,
              absoluteTargetAngle,
              currentNormalized,
              relativeRotation,
              fullRotations,
              currentTotalRotation: currentRotation,
              newTotalRotation: newRotation,
              normalizedFinal: newRotation % 360,
            },
          });

          logger.info('[SpinWheel] Spin animation', {
            component: 'SpinWheel',
            action: 'spin_animation',
            metadata: {
              targetSliceIndex,
              absoluteTargetAngle,
              relativeRotation,
              fullRotations,
              currentRotation,
              newRotation,
              outcome,
              forcedSlice: data.sliceIndex,
            },
          });

          // Update rotation state for next spin
          setCurrentRotation(newRotation);

          // Apply transform (6 seconds for more dramatic, suspenseful spin)
          wheelRef.current.style.transform = `rotate(${newRotation}deg)`;
          wheelRef.current.style.transition = 'transform 6s cubic-bezier(0.23, 1, 0.32, 1)';

          // GUARANTEED TICK SCHEDULING - Always runs for every spin
          scheduleTicksForSpin(currentRotation, newRotation, currentSpin);
        }
      }

      // Wait for animation to complete (6 seconds to match animation duration)
      setTimeout(async () => {
        setSpinResult(outcome === 'try_again' ? 'try_again' : outcome);

        // Update local session state
        setSession((prev) => {
          if (!prev) return null;

          const newOutcome = {
            spin,
            outcome,
            timestamp: new Date().toISOString(),
          };

          return {
            ...prev,
            spins_used: spin,
            outcomes: [...prev.outcomes, newOutcome],
            completed: spin === 3 && outcome !== 'try_again',
            prize_pct: spin === 3 && outcome !== 'try_again' ? parseInt(outcome) : prev.prize_pct,
            coupon_code: couponCode || prev.coupon_code,
          };
        });

        // If won, trigger confetti and show win message
        if (outcome !== 'try_again' && couponCode) {
          const percentage = parseInt(outcome);

          // Trigger celebration effects
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000); // Show for 5 seconds

          // Play win sound
          playWinSound();

          // Don't auto-call onWin - let user click "Book Now" button instead
          // This prevents auto-redirect and keeps the win screen visible

          logger.info('[SpinWheel] Prize won!', {
            component: 'SpinWheel',
            action: 'prize_won',
            metadata: { percentage, couponCode },
          });
        } else {
          // Play lose sound for Try Again
          playLoseSound();
        }

        setIsSpinning(false);
      }, 6000); // Match 6s animation duration
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform spin';
      setError(errorMessage);
      setIsSpinning(false);

      logger.error(
        '[SpinWheel] Spin failed',
        {
          component: 'SpinWheel',
          action: 'spin_error',
        },
        error as Error
      );
    }
  };

  // ✅ FIX: Move ALL hooks BEFORE early return (Rules of Hooks)
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Early return AFTER all hooks
  if (!isOpen) return null;

  const isLastSpin = session ? session.spins_used === 2 : false;
  const hasWon = session?.prize_pct !== null && session?.prize_pct !== undefined;
  const currentSpin = session ? session.spins_used + 1 : 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-2 backdrop-blur-sm overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spin-wheel-title"
      aria-describedby="spin-wheel-description"
      onClick={(e: unknown) => {
        // Close on backdrop click (but not if spinning)
        if (e.target === e.currentTarget && !isSpinning) {
          handleClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-[min(95vw,28rem)] max-h-[96vh] rounded-2xl bg-white flex flex-col overflow-hidden animate-[modal-fade-in_0.3s_ease-out]"
        style={{
          boxShadow: '0 0 50px rgba(59, 130, 246, 0.2), 0 20px 40px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(229, 231, 235, 1)',
        }}
      >
        {/* Enhanced Header with subtle depth - Compact */}
        <div
          className="relative flex-shrink-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-3 text-white"
          style={{
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2
                id="spin-wheel-title"
                className="text-xl font-bold"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
              >
                {hasWon ? '🎉 Congratulations!' : isLastSpin ? '🎯 Final Spin!' : '🎰 Spin to Win!'}
              </h2>
              <p
                id="spin-wheel-description"
                className="text-blue-100 mt-0.5 text-sm"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
              >
                {hasWon
                  ? `You won $${session?.prize_pct} off your rental!`
                  : isLastSpin
                    ? 'Your final spin awaits!'
                    : `Spin ${currentSpin} of 3`}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSpinning}
              aria-label="Close spin wheel modal"
              className="text-white hover:text-gray-200 transition-colors p-1.5 rounded-full hover:bg-white hover:bg-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Container - Scrollable if needed */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
          {/* Loading State - Compact and fast */}
          {isLoading && !session && !showGuestForm && (
            <div className="text-center py-4">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Preparing your wheel...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3" role="alert">
              <div className="flex items-center">
                <svg
                  className="h-6 w-6 text-red-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  handleClose();
                }}
                className="mt-4 w-full rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                Close
              </button>
            </div>
          )}

          {/* Guest Email/Phone Capture Form */}
          {showGuestForm && !session && !isLoading && (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 mb-2">Get Your Discount Code</p>
                <p className="text-sm text-gray-600">
                  We'll email your coupon code and booking link (no spam, promise!)
                </p>
              </div>

              <form onSubmit={handleGuestSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="guest-email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="guest-email"
                    required
                    value={guestEmail}
                    onChange={(e: unknown) => setGuestEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="guest-phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    id="guest-phone"
                    value={guestPhone}
                    onChange={(e: unknown) => setGuestPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(506) 555-0100"
                    autoComplete="tel"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    We'll send you SMS reminders before your coupon expires
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="marketing-consent"
                    required
                    checked={marketingConsent}
                    onChange={(e: unknown) => setMarketingConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="marketing-consent" className="text-xs text-gray-600">
                    I'd like to receive occasional deals and equipment tips (you can unsubscribe
                    anytime) <span className="text-red-500">*</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !guestEmail || !marketingConsent}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? 'Starting...' : 'Start Spinning! 🎰'}
                </button>
              </form>

              <p className="text-xs text-center text-gray-500">
                By continuing, you agree to our{' '}
                <a
                  href="/terms"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          )}

          {/* Main Wheel UI (only show when session loaded) */}
          {session && !isLoading && !error && (
            <>
              <div
                className="relative mx-auto w-full max-w-[256px]"
                style={{ aspectRatio: '1/1', maxHeight: '256px' }}
              >
                {/* Enhanced Outer Ring with subtle glow */}
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 border-4 border-white"
                  style={{
                    animation: 'refined-glow 3s ease-in-out infinite',
                    boxShadow: '0 0 30px rgba(59, 130, 246, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {/* Inner metallic ring for depth */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-inner"></div>
                </div>

                {/* Wheel with enhanced shadows */}
                <div
                  ref={wheelRef}
                  className="relative w-full h-full rounded-full overflow-hidden border-4 border-white"
                  style={{
                    transform: 'rotate(0deg)',
                    boxShadow: 'inset 0 4px 8px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 400 400"
                    style={{ transform: 'rotate(-90deg)' }}
                  >
                    {/* Subtle center glow for depth */}
                    <circle cx="200" cy="200" r="190" fill="url(#inner-glow)" opacity="0.4" />

                    {/* Center cross for reference */}
                    <line x1="195" y1="200" x2="205" y2="200" stroke="cyan" strokeWidth="3" />
                    <line x1="200" y1="195" x2="200" y2="205" stroke="cyan" strokeWidth="3" />

                    {(() => {
                      // Calculate total weight for proper distribution
                      const totalWeight = WHEEL_SLICES.reduce(
                        (sum: unknown, slice: unknown) => sum + slice.weight,
                        0
                      );
                      const radius = 180;
                      const centerX = 200;
                      const centerY = 200;
                      let currentAngle = 0;

                      return WHEEL_SLICES.map((slice: unknown, index: unknown) => {
                        const sliceAngle = (slice.weight / totalWeight) * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + sliceAngle;

                        // Update current angle for next slice
                        currentAngle += sliceAngle;

                        const startAngleRad = (startAngle * Math.PI) / 180;
                        const endAngleRad = (endAngle * Math.PI) / 180;

                        const x1 = centerX + radius * Math.cos(startAngleRad);
                        const y1 = centerY + radius * Math.sin(startAngleRad);
                        const x2 = centerX + radius * Math.cos(endAngleRad);
                        const y2 = centerY + radius * Math.sin(endAngleRad);

                        const largeArcFlag = sliceAngle > 180 ? 1 : 0;

                        const pathData = [
                          `M ${centerX} ${centerY}`,
                          `L ${x1} ${y1}`,
                          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          'Z',
                        ].join(' ');

                        const textAngle = (startAngle + endAngle) / 2;
                        const textRadius = radius * 0.7;
                        const textX = centerX + textRadius * Math.cos((textAngle * Math.PI) / 180);
                        const textY = centerY + textRadius * Math.sin((textAngle * Math.PI) / 180);

                        // DEBUG: Mark each slice center with a dot
                        const markerRadius = radius + 10;
                        const markerX =
                          centerX + markerRadius * Math.cos((textAngle * Math.PI) / 180);
                        const markerY =
                          centerY + markerRadius * Math.sin((textAngle * Math.PI) / 180);

                        return (
                          <g key={index}>
                            <path
                              d={pathData}
                              fill={`url(#gradient-${index})`}
                              stroke="white"
                              strokeWidth="2"
                              className="transition-all duration-300 hover:brightness-110"
                            />
                            {slice.label === 'Try Again' ? (
                              <text
                                x={textX}
                                y={textY}
                                textAnchor="middle"
                                className="fill-white"
                                fontSize="16"
                                fontWeight="bold"
                                style={{
                                  transform: `rotate(${textAngle + 90}deg)`,
                                  transformOrigin: `${textX}px ${textY}px`,
                                  filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
                                  paintOrder: 'stroke fill',
                                }}
                                stroke="rgba(0,0,0,0.15)"
                                strokeWidth="0.5"
                              >
                                <tspan x={textX} dy="-8">
                                  Try
                                </tspan>
                                <tspan x={textX} dy="18">
                                  Again
                                </tspan>
                              </text>
                            ) : (
                              <text
                                x={textX}
                                y={textY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-white"
                                fontSize="20"
                                fontWeight="bold"
                                style={{
                                  transform: `rotate(${textAngle + 90}deg)`,
                                  transformOrigin: `${textX}px ${textY}px`,
                                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                                  paintOrder: 'stroke fill',
                                }}
                                stroke="rgba(0,0,0,0.2)"
                                strokeWidth="0.5"
                              >
                                {slice.label}
                              </text>
                            )}

                            {/* DEBUG: Slice center marker */}
                            <circle
                              cx={markerX}
                              cy={markerY}
                              r="5"
                              fill="cyan"
                              stroke="blue"
                              strokeWidth="2"
                            />
                          </g>
                        );
                      });
                    })()}

                    {/* Enhanced gradients for depth */}
                    <defs>
                      {WHEEL_SLICES.map((slice: unknown, index: unknown) => (
                        <linearGradient
                          key={index}
                          id={`gradient-${index}`}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor={slice.color} stopOpacity="1" />
                          <stop offset="50%" stopColor={slice.color} stopOpacity="0.95" />
                          <stop offset="100%" stopColor={slice.color} stopOpacity="0.85" />
                        </linearGradient>
                      ))}

                      {/* Subtle inner glow */}
                      <radialGradient id="inner-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>

                {/* Enhanced Center Hub with subtle depth */}
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-white flex items-center justify-center z-20"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 70%, #ea580c 100%)',
                    boxShadow:
                      '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full shadow-sm"></div>
                  </div>
                </div>

                {/* 🎯 PREMIUM RED POINTER - Bold, polished arrow pointing DOWN */}
                <div
                  className="absolute top-0 z-30"
                  style={{
                    left: '50%',
                    marginLeft: '-7px', // 14px wide / 2
                    animation: 'pointer-pulse 2s ease-in-out infinite',
                    transform: 'translateY(-10px)',
                    filter:
                      'drop-shadow(0 6px 16px rgba(220, 38, 38, 0.6)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
                  }}
                >
                  <svg width="14" height="38" viewBox="0 0 14 38" style={{ display: 'block' }}>
                    <defs>
                      {/* Premium red gradient - light to dark (top to bottom) */}
                      <linearGradient id="pointer-red-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fca5a5" stopOpacity="1" />{' '}
                        {/* Light red top */}
                        <stop offset="20%" stopColor="#f87171" stopOpacity="1" /> {/* Bright red */}
                        <stop offset="60%" stopColor="#dc2626" stopOpacity="1" /> {/* Bold red */}
                        <stop offset="100%" stopColor="#991b1b" stopOpacity="1" />{' '}
                        {/* Deep red tip */}
                      </linearGradient>

                      {/* Glossy shine overlay */}
                      <linearGradient id="pointer-shine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                        <stop offset="35%" stopColor="#ffffff" stopOpacity="0.8" />
                        <stop offset="65%" stopColor="#ffffff" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                      </linearGradient>

                      {/* Gold accent gradient */}
                      <linearGradient id="pointer-gold" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                        <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
                      </linearGradient>
                    </defs>

                    {/* Outer gold border (premium frame) - WIDE at top, POINTED at bottom */}
                    <path
                      d="M 1 0 L 13 0 L 13 12 L 7 38 L 1 12 Z"
                      fill="url(#pointer-gold)"
                      opacity="1"
                    />

                    {/* Main red body with gradient - WIDE at top, POINTED at bottom */}
                    <path
                      d="M 2.5 1.5 L 11.5 1.5 L 11.5 11 L 7 35 L 2.5 11 Z"
                      fill="url(#pointer-red-gradient)"
                      stroke="rgba(0, 0, 0, 0.1)"
                      strokeWidth="0.5"
                    />

                    {/* Glossy shine highlight (left side) */}
                    <path
                      d="M 4 2 L 6.5 2 L 6.5 10 L 6 24 Z"
                      fill="url(#pointer-shine)"
                      opacity="0.7"
                    />

                    {/* Sharp white tip accent at the BOTTOM */}
                    <path d="M 6 32 L 8 32 L 7 35 Z" fill="#ffffff" opacity="0.9" />
                  </svg>
                </div>
              </div>

              {/* Timer - ONLY show AFTER prize won */}
              {session.coupon_code && timeLeft > 0 && (
                <div className="mt-1 text-center">
                  <p className="text-xs text-gray-600">
                    Expires in:{' '}
                    <span className="font-mono font-bold text-red-600">{formatTime(timeLeft)}</span>
                  </p>
                </div>
              )}

              {/* Spin Result */}
              {spinResult && session && (
                <div className="mt-2 text-center" role="status" aria-live="polite">
                  {spinResult === 'try_again' ? (
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-2">
                      <div className="text-2xl mb-1" aria-hidden="true">
                        😔
                      </div>
                      <p className="text-base font-bold text-orange-600 mb-0.5">So close!</p>
                      {session.spins_used === 1 ? (
                        <p className="text-orange-700">You've got 2 more spins. Keep going!</p>
                      ) : session.spins_used === 2 ? (
                        <div className="text-orange-700">
                          <p className="text-lg font-semibold mb-1">Last Spin Magic ✨</p>
                          <p className="text-sm mb-1">You've got one last shot — make it count!</p>
                          <p className="text-sm">
                            Big prizes are waiting... will it be your lucky one?
                          </p>
                        </div>
                      ) : (
                        <p className="text-orange-700">Keep spinning!</p>
                      )}
                    </div>
                  ) : (
                    <div
                      className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 border-2 border-green-300 rounded-lg p-2"
                      style={{ boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}
                    >
                      <div className="text-2xl mb-1" aria-hidden="true">
                        🎉
                      </div>
                      <p
                        className="text-base font-bold text-green-600 mb-0.5"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
                      >
                        Congratulations!
                      </p>
                      <p className="text-sm font-bold text-green-700 mb-1">
                        You won ${spinResult} off!
                      </p>
                      <div
                        className="bg-white border-2 border-green-400 rounded-lg p-1.5 mb-1 relative"
                        style={{
                          boxShadow:
                            '0 2px 8px rgba(16, 185, 129, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
                        }}
                      >
                        <p className="text-[10px] text-gray-600 mb-0.5 text-center">Your Code:</p>
                        <div className="flex items-center justify-center">
                          <p
                            className="text-lg font-mono font-bold text-green-600 tracking-wider text-center"
                            style={{ textShadow: '0 0 8px rgba(16, 185, 129, 0.2)' }}
                          >
                            {session.coupon_code}
                          </p>
                        </div>
                        {/* Copy button positioned absolutely on the right */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(session.coupon_code || '');
                            setCodeCopied(true);
                            setTimeout(() => setCodeCopied(false), 2000);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded transition-colors"
                          title="Copy code to clipboard"
                        >
                          {codeCopied ? '✓ Copied!' : '📋 Copy'}
                        </button>
                      </div>
                      <p className="text-green-700 font-semibold text-xs">
                        💾 Don't forget to save your code!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              <div className="mt-2 text-center">
                {hasWon ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        // First trigger onWin to pass the prize data
                        const percentage = parseFloat(spinResult?.replace('$', '') || '0');
                        onWin({ percentage, promoCode: session.coupon_code || '' });
                        // Then close modal and navigate to booking
                        onClose();
                      }}
                      aria-label="Proceed to booking with discount code"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-300"
                      style={{
                        boxShadow:
                          '0 4px 12px rgba(16, 185, 129, 0.3), 0 0 20px rgba(16, 185, 129, 0.1)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      }}
                    >
                      🎯 Claim Your ${spinResult} Off
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSpin}
                    disabled={isSpinning || session.spins_used >= 3}
                    aria-label={`Spin number ${currentSpin} of 3`}
                    aria-busy={isSpinning}
                    className={`w-full font-bold py-2.5 px-4 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:ring-4 ${
                      isSpinning
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isLastSpin
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg focus:ring-green-300'
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg focus:ring-blue-300'
                    }`}
                    style={
                      !isSpinning
                        ? {
                            boxShadow: isLastSpin
                              ? '0 4px 12px rgba(16, 185, 129, 0.3), 0 0 20px rgba(16, 185, 129, 0.1)'
                              : '0 4px 12px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.1)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                          }
                        : undefined
                    }
                  >
                    {isSpinning ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Spinning...
                      </span>
                    ) : isLastSpin ? (
                      '🎯 Final Spin!'
                    ) : (
                      `🎰 Spin #${currentSpin}`
                    )}
                  </button>
                )}
              </div>

              {/* Fine Print - Compact */}
              <div className="mt-2 bg-gray-50 rounded-lg p-1.5 border border-gray-200">
                <div className="text-[10px] text-gray-600 text-center leading-tight">
                  <p className="font-semibold mb-0.5">🎯 How it works:</p>
                  <p className="mb-0.5">3 spins to win $50/$75/$100 off. One prize per customer.</p>
                  <p>
                    First-time bookings only. Expires in 48h.{' '}
                    <a
                      href="/spin-to-win-terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Terms
                    </a>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 🎉 Confetti Celebration - Evenly distributed! */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {[...Array(150)].map((_, i) => {
              // Varied sizes (4-12px for visibility)
              const sizeOptions = [4, 5, 6, 7, 8, 10, 12];
              const size = sizeOptions[i % sizeOptions.length];

              // Vibrant, celebratory colors (8 colors for variety)
              const colors = [
                '#10B981', // Emerald green
                '#F59E0B', // Amber/gold
                '#EF4444', // Bright red
                '#3B82F6', // Sky blue
                '#8B5CF6', // Purple
                '#EC4899', // Pink
                '#14B8A6', // Teal
                '#F97316', // Orange
              ];

              // Varied shapes for more interest
              const shapes = ['circle', 'square', 'rectangle'];
              const shape = shapes[i % shapes.length];

              // Evenly distribute across the full width - no center clustering
              const startX = `${Math.random() * 100}%`;
              const startY = `${-20 + Math.random() * 10}%`; // Varied starting heights (-20% to -10%)

              const color = colors[Math.floor(Math.random() * colors.length)];

              return (
                <div
                  key={`confetti-${i}`}
                  className={`absolute opacity-0 ${
                    shape === 'circle' ? 'rounded-full' : shape === 'rectangle' ? 'rounded-sm' : ''
                  }`}
                  style={{
                    width: shape === 'rectangle' ? `${size * 1.5}px` : `${size}px`,
                    height: shape === 'rectangle' ? `${size * 0.6}px` : `${size}px`,
                    left: startX,
                    top: startY,
                    backgroundColor: color,
                    boxShadow: `0 0 ${size * 3}px ${color}60, 0 0 ${size}px ${color}80`,
                    animation: `confetti ${2.5 + Math.random() * 2.5}s ease-out forwards`,
                    animationDelay: `${Math.random() * 0.8}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    filter: 'brightness(1.2)',
                  }}
                  aria-hidden="true"
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
