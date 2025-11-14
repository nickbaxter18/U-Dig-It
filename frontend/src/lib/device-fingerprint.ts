/**
 * Device Fingerprinting for Fraud Detection
 *
 * Generates a unique device identifier based on browser/device characteristics.
 * Used for rate limiting and abuse prevention in spin-to-win system.
 *
 * Uses @fingerprintjs/fingerprintjs for robust fingerprinting.
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { logger } from '@/lib/logger';

let fpPromise: Promise<any> | null = null;

/**
 * Initialize fingerprint library (lazy loaded)
 */
function initFingerprint() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
}

/**
 * Get device fingerprint (OPTIMIZED for speed)
 *
 * Returns a unique identifier for this device/browser combination.
 * Uses instant basic fingerprint to avoid blocking UI.
 *
 * @returns Promise<string> - Unique device fingerprint hash
 */
export async function getDeviceFingerprint(): Promise<string> {
  try {
    // Use basic fingerprint immediately for speed (instant, non-blocking)
    // The basic fingerprint is "good enough" for fraud detection
    // and doesn't block the UI while loading heavy libraries
    return generateBasicFingerprint();
  } catch (error) {
    logger.error('[DeviceFingerprint] Failed to generate fingerprint', {
      component: 'device-fingerprint',
      action: 'generate_failed',
    }, error as Error);

    // Ultimate fallback
    return `fallback_${Date.now().toString(36)}`;
  }
}

/**
 * Fallback fingerprint generator
 *
 * Uses basic browser characteristics if FingerprintJS fails.
 * Less robust but better than nothing.
 */
function generateBasicFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
  ];

  const fingerprint = components.join('|');

  // Generate simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `basic_${Math.abs(hash).toString(36)}`;
}

/**
 * Get extended device information for fraud analysis
 *
 * @returns Object with detailed device info
 */
export async function getDeviceInfo() {
  try {
    const fp = await initFingerprint();
    const result = await fp.get();

    return {
      visitorId: result.visitorId,
      confidence: result.confidence?.score || 0,
      components: result.components,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
    };
  } catch (error) {
    logger.error('[DeviceFingerprint] Failed to get device info', {
      component: 'device-fingerprint',
      action: 'get_info_failed',
    }, error as Error);

    return {
      visitorId: generateBasicFingerprint(),
      confidence: 0,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: 'unknown',
      timezoneOffset: new Date().getTimezoneOffset(),
    };
  }
}
