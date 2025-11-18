'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { triggerCompletionCheck } from '@/lib/trigger-completion-check';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type CaptureContext = 'documentFront' | 'selfie';

type VerificationResult = {
  document_status?: string | null;
  face_liveness_score?: number | null;
  face_match_score?: number | null;
  failure_reasons?: string[] | null;
  processed_at?: string | null;
};

type LatestVerification = {
  id: string;
  status: string;
  attempt_number: number;
  created_at: string;
  result?: VerificationResult | null;
};

type CaptureAnalysis = {
  width: number;
  height: number;
  aspectRatio: number;
  brightness: number;
  sharpness: number;
  hash: string;
};

type CaptureState = {
  file: File | null;
  preview: string | null;
  storagePath: string | null;
  analysis: CaptureAnalysis | null;
};

type CaptureStatus = {
  label: string;
  tone: 'success' | 'warning' | 'error' | 'pending' | 'info';
  message: string;
  icon: string;
};

type FrameVariant = 'live' | 'thumbnail';

// Validation thresholds - TUNED FOR ACCURACY
const MAX_FILE_SIZE = 7 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCUMENT_ASPECT_RANGE = { min: 1.25, max: 2 };
const SELFIE_ASPECT_RANGE = { min: 0.6, max: 1.4 };
const BRIGHTNESS_RANGE = { min: 0.15, max: 0.9 };
// Updated thresholds to match backend calculation (gradient-based edge strength)
// Backend uses 18 for documents and 12 for selfies, but frontend samples every 2nd pixel
// so values will be slightly different - using proportional thresholds
const SHARPNESS_THRESHOLD_DOCUMENT = 15;
const SHARPNESS_THRESHOLD_SELFIE = 10;
const HASH_SIMILARITY_MAX = 0.92;

// Frame specifications for overlays - POLISHED DESIGN
const DOCUMENT_FRAME_SPECS: Record<
  FrameVariant,
  { width: number; height: number; radius: string }
> = {
  live: { width: 82, height: 72, radius: '1rem' },
  thumbnail: { width: 86, height: 74, radius: '0.75rem' },
};

const SELFIE_FRAME_SPECS: Record<FrameVariant, { rx: number; ry: number; borderRadius: string }> = {
  live: { rx: 28, ry: 44, borderRadius: '50%' },
  thumbnail: { rx: 30, ry: 40, borderRadius: '50%' },
};

const CAPTURE_LABELS: Record<
  CaptureContext,
  { title: string; description: string; helper: string; placeholderIcon: string; tips: string[] }
> = {
  documentFront: {
    title: "Driver's Licence Front",
    description: "Capture a clear photo of the front of your driver's licence",
    helper: 'Ensure all text is readable, avoid glare, and fill the guide frame',
    placeholderIcon: '🪪',
    tips: [
      'Hold the licence flat and steady',
      'Ensure good lighting without shadows',
      'Keep text sharp and in focus',
      'Avoid reflections or glare',
    ],
  },
  selfie: {
    title: 'Live Selfie',
    description: 'Take a selfie to verify your identity',
    helper: 'Position your face in the oval guide and look directly at the camera',
    placeholderIcon: '📷',
    tips: [
      'Remove glasses, hats, or masks',
      'Face even, natural lighting',
      'Look directly at the camera',
      'Keep your face centered in the oval',
    ],
  },
};

const STATUS_CONFIG: Record<
  CaptureStatus['tone'],
  { className: string; icon: string; bgColor: string; borderColor: string; textColor: string }
> = {
  success: {
    className: 'border-green-200 bg-green-50 text-green-900',
    icon: '✅',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-900',
  },
  warning: {
    className: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: '⚠️',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-900',
  },
  error: {
    className: 'border-red-200 bg-red-50 text-red-900',
    icon: '❌',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-900',
  },
  pending: {
    className: 'border-blue-200 bg-blue-50 text-blue-900',
    icon: '⏳',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900',
  },
  info: {
    className: 'border-gray-200 bg-gray-50 text-gray-800',
    icon: 'ℹ️',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-800',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const createCaptureState = (): CaptureState => ({
  file: null,
  preview: null,
  storagePath: null,
  analysis: null,
});

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to load image'));
    img.src = url;
  });

const getHashSignature = (pixels: Uint8ClampedArray): string => {
  let sum = 0;
  for (let i = 0; i < pixels.length; i += 1) sum += pixels[i];
  const avg = sum / pixels.length;
  return Array.from(pixels)
    .map((value) => (value > avg ? '1' : '0'))
    .join('');
};

const compareHashes = (a: string, b: string): number => {
  if (!a || !b || a.length !== b.length) return 1;
  let matches = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === b[i]) matches += 1;
  }
  return matches / a.length;
};

const computeCaptureAnalysis = async (file: File): Promise<CaptureAnalysis> => {
  const img = await loadImage(URL.createObjectURL(file));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to analyze capture');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const width = canvas.width;
  const height = canvas.height;
  const sampleStep = 2; // Sample every 2nd pixel for performance

  // Convert to grayscale and compute edge strength using gradient method
  const getGray = (x: number, y: number): number => {
    const idx = (y * width + x) * 4;
    const r = data.data[idx];
    const g = data.data[idx + 1];
    const b = data.data[idx + 2];
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  let brightnessSum = 0;
  let edgeTotal = 0;
  let edgeSamples = 0;
  let totalSamples = 0;

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const idx = (y * width + x) * 4;
      const r = data.data[idx];
      const g = data.data[idx + 1];
      const b = data.data[idx + 2];
      const brightness = (r + g + b) / (255 * 3);
      brightnessSum += brightness;
      totalSamples += 1;

      // Compute edge strength using gradient (similar to backend)
      if (x > 0 && y > 0 && x < width - 1 && y < height - 1) {
        const gx = getGray(x + 1, y) - getGray(x - 1, y);
        const gy = getGray(x, y + 1) - getGray(x, y - 1);
        edgeTotal += gx * gx + gy * gy;
        edgeSamples += 1;
      }
    }
  }

  const totalPixels = data.data.length / 4;
  const brightness = brightnessSum / Math.max(totalSamples, 1);
  // Normalize edge strength: divide by number of edge samples (not total pixels)
  // This gives a value similar to the backend's edgeStrength calculation
  const sharpness = edgeSamples > 0 ? edgeTotal / edgeSamples : 0;

  const hashCanvas = document.createElement('canvas');
  const hashCtx = hashCanvas.getContext('2d');
  if (!hashCtx) throw new Error('Unable to compute hash');
  hashCanvas.width = 32;
  hashCanvas.height = 32;
  hashCtx.drawImage(img, 0, 0, 32, 32);
  const hashData = hashCtx.getImageData(0, 0, 32, 32);
  const grayscale = new Uint8ClampedArray(32 * 32);
  for (let i = 0; i < hashData.data.length; i += 4) {
    grayscale[i / 4] = (hashData.data[i] + hashData.data[i + 1] + hashData.data[i + 2]) / 3;
  }

  return {
    width: img.width,
    height: img.height,
    aspectRatio: img.width / Math.max(img.height, 1),
    brightness,
    sharpness,
    hash: getHashSignature(grayscale),
  };
};

const validateFile = (file: File) => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Image is too large (max 7MB).');
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Use JPG, PNG, or WebP.');
  }
};

const computeCenterCrop = (frameWidth: number, frameHeight: number) => {
  const targetAspect = 4 / 3;
  const frameAspect = frameWidth / frameHeight;

  if (frameAspect > targetAspect) {
    const cropWidth = frameHeight * targetAspect;
    const offsetX = (frameWidth - cropWidth) / 2;
    return { x: offsetX, y: 0, width: cropWidth, height: frameHeight };
  }

  const cropHeight = frameWidth / targetAspect;
  const offsetY = (frameHeight - cropHeight) / 2;
  return { x: 0, y: offsetY, width: frameWidth, height: cropHeight };
};

const getDocumentClipPath = (variant: FrameVariant) => {
  const spec = DOCUMENT_FRAME_SPECS[variant];
  const verticalInset = (100 - spec.height) / 2;
  const horizontalInset = (100 - spec.width) / 2;
  return `inset(${verticalInset}% ${horizontalInset}% ${verticalInset}% ${horizontalInset}% round ${spec.radius})`;
};

const getSelfieClipPath = (variant: FrameVariant) => {
  const spec = SELFIE_FRAME_SPECS[variant];
  return `ellipse(${spec.rx}% ${spec.ry}% at 50% 50%)`;
};

// Reduced overlay dimensions (narrower than original specs)
const REDUCED_DOCUMENT_WIDTH = 75; // Reduced from 82%, widened slightly for better proportions
const REDUCED_DOCUMENT_HEIGHT = 72; // Keep same height
const REDUCED_SELFIE_RX = 22; // Reduced from 28 (width from 56% to 44%)
const REDUCED_SELFIE_RY = 44; // Keep same height

const getReducedDocumentClipPath = () => {
  const verticalInset = (100 - REDUCED_DOCUMENT_HEIGHT) / 2;
  const horizontalInset = (100 - REDUCED_DOCUMENT_WIDTH) / 2;
  return `inset(${verticalInset}% ${horizontalInset}% ${verticalInset}% ${horizontalInset}% round 1rem)`;
};

const getReducedSelfieClipPath = () => {
  return `ellipse(${REDUCED_SELFIE_RX}% ${REDUCED_SELFIE_RY}% at 50% 50%)`;
};

const getClipStyles = (context: CaptureContext, _variant: FrameVariant) => {
  // Use reduced dimensions for both live and thumbnail to match narrower overlays
  const clipPath = context === 'selfie' ? getReducedSelfieClipPath() : getReducedDocumentClipPath();
  return {
    clipPath,
    WebkitClipPath: clipPath,
  };
};

const FrameOverlay = ({ context, variant }: { context: CaptureContext; variant: FrameVariant }) => {
  const shadowOpacity = variant === 'live' ? 0.6 : 0.4;
  const showText = variant === 'live';

  // Use reduced width dimensions for narrower overlays
  if (context === 'selfie') {
    const liveSpec = SELFIE_FRAME_SPECS.live;
    // Reduced width: rx from 28 to 22 (width from 56% to 44%)
    const width = `${REDUCED_SELFIE_RX * 2}%`;
    const height = `${REDUCED_SELFIE_RY * 2}%`;

    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-30">
        <div
          className="border-4 border-white shadow-[0_0_0_2px_rgba(59,130,246,0.5)]"
          style={{
            width,
            height,
            borderRadius: liveSpec.borderRadius,
            boxShadow: `0 0 0 9999px rgba(0,0,0,${shadowOpacity})`,
          }}
        />
        {showText && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
            Position your face here
          </div>
        )}
      </div>
    );
  }

  const liveSpec = DOCUMENT_FRAME_SPECS.live;
  // Reduced width: from 82% to 70%
  const width = `${REDUCED_DOCUMENT_WIDTH}%`;
  const height = `${REDUCED_DOCUMENT_HEIGHT}%`;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-30">
      <div
        className="border-4 border-white shadow-[0_0_0_2px_rgba(59,130,246,0.5)]"
        style={{
          width,
          height,
          borderRadius: liveSpec.radius,
          boxShadow: `0 0 0 9999px rgba(0,0,0,${shadowOpacity})`,
        }}
      />
      {showText && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
          Align licence here
        </div>
      )}
    </div>
  );
};

const interpretFailureReason = (
  reason: string
): { target: CaptureContext | 'general'; message: string } => {
  const formatValue = (value: string | undefined) =>
    value ? ` (${parseFloat(value).toFixed(2)})` : '';

  if (reason.startsWith('document_')) {
    if (reason.includes('resolution_low')) {
      return {
        target: 'documentFront',
        message: 'Resolution is too low. Move closer to fill the guide frame completely.',
      };
    }
    if (reason.includes('aspect_invalid')) {
      return {
        target: 'documentFront',
        message: 'Keep the licence horizontal within the rectangle guide.',
      };
    }
    if (reason.includes('brightness_out_of_range')) {
      return {
        target: 'documentFront',
        message: 'Lighting is too dark or bright. Move to even lighting and avoid glare.',
      };
    }
    if (reason.includes('blurry')) {
      const sharpness = formatValue(reason.split('_').pop());
      return {
        target: 'documentFront',
        message: `Licence appears blurry${sharpness}. Hold steady and ensure the camera focuses properly.`,
      };
    }
    if (reason.includes('contains_face') || reason.includes('skin')) {
      // These are non-blocking warnings, don't display message
      return {
        target: 'documentFront',
        message: '',
      };
    }
    if (reason.includes('face_area_exceeds_ratio')) {
      return {
        target: 'documentFront',
        message:
          'The photo on the licence is too large. Move the camera back to fit the entire card.',
      };
    }
    if (reason.includes('face_area_too_small')) {
      return {
        target: 'documentFront',
        message: 'The photo on the licence is too small. Move closer so the card fills the frame.',
      };
    }
    if (reason.includes('face_not_detected')) {
      return {
        target: 'documentFront',
        message:
          'Could not detect a photo on the licence. Ensure the licence is clearly visible and well-lit.',
      };
    }
    // CRITICAL: Document structure validation to verify this is actually a license document
    if (reason.includes('document_structure_invalid')) {
      return {
        target: 'documentFront',
        message:
          "The image does not appear to be a valid driver's license. Please ensure you are uploading a clear photo of the front of your driver's license, not a regular photo or other document.",
      };
    }
    if (reason.includes('document_text_pattern_invalid')) {
      return {
        target: 'documentFront',
        message:
          "The image lacks the structured text patterns typical of a driver's license. Please ensure you are uploading a clear, well-lit photo of your actual driver's license.",
      };
    }
    if (reason.includes('document_no_text_detected')) {
      return {
        target: 'documentFront',
        message:
          "No text was detected in the image. Driver's licenses contain text fields (name, address, license number, etc.). Please ensure you are uploading a photo of your actual driver's license card, not a selfie or other photo.",
      };
    }
    return {
      target: 'documentFront',
      message: 'Licence photo needs improvement. Follow the guide instructions and retake.',
    };
  }

  if (reason.startsWith('selfie_')) {
    if (reason.includes('resolution_low')) {
      return {
        target: 'selfie',
        message: 'Selfie resolution is too low. Fill the oval guide with your face.',
      };
    }
    if (reason.includes('aspect_invalid')) {
      return {
        target: 'selfie',
        message: 'Hold the phone upright and keep your head centered inside the oval.',
      };
    }
    if (reason.includes('brightness_out_of_range')) {
      return {
        target: 'selfie',
        message: 'Lighting is too dark or bright. Face a window or use neutral, even lighting.',
      };
    }
    if (reason.includes('blurry')) {
      const sharpness = formatValue(reason.split('_').pop());
      return {
        target: 'selfie',
        message: `Selfie appears blurry${sharpness}. Hold steady and look directly at the camera.`,
      };
    }
    if (reason.includes('missing_face') || reason.includes('face_not_detected')) {
      return {
        target: 'selfie',
        message:
          'We could not detect your face. Center your head in the oval, remove hats/glasses, and ensure good lighting.',
      };
    }
    if (reason.includes('face_area_too_small')) {
      return {
        target: 'selfie',
        message: 'Move closer so your face fills most of the oval guide.',
      };
    }
    if (reason.includes('face_area_exceeds_ratio')) {
      return {
        target: 'selfie',
        message:
          'Move the camera back slightly so your entire face fits comfortably inside the oval.',
      };
    }
    return {
      target: 'selfie',
      message: 'Retake the selfie using the oval guide and following the tips above.',
    };
  }

  if (reason.includes('face_mismatch')) {
    return {
      target: 'general',
      message:
        'Selfie does not match the licence photo. Please retake both images ensuring they show the same person.',
    };
  }

  if (reason.includes('face_descriptor_unavailable')) {
    return {
      target: 'general',
      message: 'We could not compare the faces. Please retake both photos clearly.',
    };
  }

  if (reason.includes('service_client_unavailable')) {
    return {
      target: 'general',
      message: 'Verification service was temporarily unavailable. Please try again in a moment.',
    };
  }

  return {
    target: 'general',
    message: 'Additional review is required. Please retake the photos following all guidelines.',
  };
};

// ============================================================================
// COMPONENT
// ============================================================================

interface LicenseUploadSectionProps {
  userId: string;
  bookingId: string;
  latestRequest?: LatestVerification | null;
  onUploadComplete: () => void;
}

export default function LicenseUploadSection({
  userId,
  bookingId,
  latestRequest,
  onUploadComplete,
}: LicenseUploadSectionProps) {
  const [captures, setCaptures] = useState<Record<CaptureContext, CaptureState>>({
    documentFront: createCaptureState(),
    selfie: createCaptureState(),
  });
  const [cameraContext, setCameraContext] = useState<CaptureContext>('documentFront');
  const [activeCapture, setActiveCapture] = useState<CaptureContext | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const blurVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Refs removed - no longer needed for height synchronization

  // Height synchronization removed to prevent infinite growth
  // Grid's items-stretch handles equal heights naturally

  const updateCapture = useCallback((context: CaptureContext, updates: Partial<CaptureState>) => {
    setCaptures((prev) => ({
      ...prev,
      [context]: { ...prev[context], ...updates },
    }));
  }, []);

  const derivedStatus = useMemo<Record<CaptureContext, CaptureStatus>>(() => {
    const base: Record<CaptureContext, CaptureStatus> = {
      documentFront: {
        label: 'Pending',
        tone: 'pending',
        message: "Capture a clear photo of your driver's licence front.",
        icon: STATUS_CONFIG.pending.icon,
      },
      selfie: {
        label: 'Pending',
        tone: 'pending',
        message: 'Take a selfie using the oval guide.',
        icon: STATUS_CONFIG.pending.icon,
      },
    };

    if (!latestRequest) return base;

    const failures = new Set(latestRequest.result?.failure_reasons ?? []);
    const grouped: Record<CaptureContext | 'general', string[]> = {
      documentFront: [],
      selfie: [],
      general: [],
    };

    failures.forEach((reason) => {
      const result = interpretFailureReason(reason);
      // Filter out empty messages (e.g., barcode errors for front document)
      if (result.message) {
        grouped[result.target].push(result.message);
      }
    });

    (['documentFront', 'selfie'] as CaptureContext[]).forEach((context) => {
      if (grouped[context].length > 0) {
        base[context] = {
          label: 'Needs Review',
          tone: 'warning',
          message: grouped[context][0],
          icon: STATUS_CONFIG.warning.icon,
        };
      } else if (latestRequest.status === 'approved') {
        base[context] = {
          label: 'Approved',
          tone: 'success',
          message:
            context === 'documentFront'
              ? 'Licence verified successfully.'
              : 'Selfie verified successfully.',
          icon: STATUS_CONFIG.success.icon,
        };
      } else if (latestRequest.status === 'pending' || latestRequest.status === 'submitted') {
        base[context] = {
          label: 'Submitted',
          tone: 'info',
          message: 'Submitted for review. We will notify you shortly.',
          icon: STATUS_CONFIG.info.icon,
        };
      }
    });

    if (grouped.general.length > 0 && base.documentFront.tone === 'success') {
      base.documentFront = {
        label: 'Needs Review',
        tone: 'warning',
        message: grouped.general[0],
        icon: STATUS_CONFIG.warning.icon,
      };
    }

    return base;
  }, [latestRequest]);

  // Height synchronization disabled to prevent infinite growth
  // The grid's items-stretch will handle equal heights naturally
  // useLayoutEffect(() => {
  //   ... height sync code ...
  // }, [captures.documentFront.preview, captures.selfie.preview, derivedStatus]);

  const startCamera = useCallback(async (context: CaptureContext) => {
    setError(null);
    setActiveCapture(context);
    setCameraContext(context);

    logger.debug('Starting camera', {
      component: 'LicenseUploadSection',
      metadata: {
        context,
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
      },
    });

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg =
        'Camera access is not available in this browser. Please use the file upload option instead.';
      logger.error(
        'Camera API not available',
        { component: 'LicenseUploadSection' },
        new Error(errorMsg)
      );
      setError(errorMsg);
      setActiveCapture(null);
      return;
    }

    try {
      if ('permissions' in navigator) {
        const permissionStatus = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        });
        logger.debug('Permission status checked', {
          component: 'LicenseUploadSection',
          metadata: { permissionState: permissionStatus.state },
        });
        if (permissionStatus.state === 'denied') {
          const errorMsg =
            'Camera permission was previously denied. Please allow camera access in your browser settings (look for the camera icon in the address bar), or use the file upload option.';
          logger.warn('Camera permission denied', { component: 'LicenseUploadSection' });
          setError(errorMsg);
          setActiveCapture(null);
          return;
        }
      }
    } catch (permError) {
      logger.debug('Permission check failed, continuing with camera access', {
        component: 'LicenseUploadSection',
        metadata: { permissionError: String(permError) },
      });
    }

    console.log('[LicenseUploadSection] Requesting camera access...', {
      context,
      hasMediaDevices: !!navigator.mediaDevices,
      isSecureContext: window.isSecureContext,
    });

    try {
      console.log('[LicenseUploadSection] Calling getUserMedia...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: context === 'selfie' ? 'user' : 'environment' },
        audio: false,
      });
      console.log('[LicenseUploadSection] getUserMedia succeeded!', { hasStream: !!mediaStream });

      logger.debug('Camera access granted', {
        component: 'LicenseUploadSection',
        metadata: { context, hasStream: !!mediaStream },
      });
      setStream(mediaStream);
      setShowCamera(true);
      setCameraReady(false);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraReady(true);
          };
        }
        if (blurVideoRef.current) {
          blurVideoRef.current.srcObject = mediaStream;
          blurVideoRef.current.onloadedmetadata = () => blurVideoRef.current?.play();
        }
      }, 50);
    } catch (cameraError) {
      console.error('[LicenseUploadSection] Camera access failed:', cameraError);
      logger.error(
        'Camera access error',
        { component: 'LicenseUploadSection', metadata: { captureContext: context } },
        cameraError instanceof Error ? cameraError : new Error(String(cameraError))
      );

      let errorMessage = 'Unable to access camera. Please allow permissions or upload manually.';
      if (cameraError instanceof Error) {
        const errorName = cameraError.name || '';
        const errorMessageText = cameraError.message || '';

        console.log('[LicenseUploadSection] Error details:', { errorName, errorMessageText });

        if (
          errorName === 'NotAllowedError' ||
          errorMessageText.includes('permission') ||
          errorMessageText.includes('Permission denied')
        ) {
          errorMessage =
            'Camera permission was denied or not granted. Please:\n1. Check your browser address bar for a camera icon\n2. Click it and select "Allow"\n3. Or go to browser settings and allow camera access for localhost\n4. Alternatively, use the "Choose file" option to upload a photo';
        } else if (
          errorName === 'NotFoundError' ||
          errorMessageText.includes('not found') ||
          errorMessageText.includes('No camera')
        ) {
          errorMessage =
            'No camera device found. Please:\n1. Connect a camera to your computer\n2. Ensure the camera is not being used by another application\n3. Or use the "Choose file" option to upload a photo';
        } else if (
          errorName === 'NotReadableError' ||
          errorMessageText.includes('not readable') ||
          errorMessageText.includes('in use')
        ) {
          errorMessage =
            'Camera is already in use by another application. Please:\n1. Close other applications using the camera\n2. Try again\n3. Or use the "Choose file" option to upload a photo';
        } else if (
          errorMessageText.includes('secure context') ||
          errorMessageText.includes('HTTPS')
        ) {
          errorMessage =
            'Camera access requires a secure connection (HTTPS). Please use the file upload option.';
        } else {
          errorMessage = `Camera access failed: ${errorMessageText || errorName}. Please use the "Choose file" option to upload a photo instead.`;
        }
      }

      setError(errorMessage);
      setActiveCapture(null);
      setShowCamera(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setShowCamera(false);
    setCameraReady(false);
    setActiveCapture(null);
  }, [stream]);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !activeCapture) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      setError('Camera is still initializing. Please wait and try again.');
      return;
    }

    try {
      const crop = computeCenterCrop(video.videoWidth, video.videoHeight);
      const canvas = canvasRef.current ?? document.createElement('canvas');
      if (!canvasRef.current) canvasRef.current = canvas;
      canvas.width = Math.round(crop.width);
      canvas.height = Math.round(crop.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Unable to capture frame');
      ctx.drawImage(
        video,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95)
      );
      if (!blob) throw new Error('Failed to capture image');
      const file = new File([blob], `${activeCapture}_${Date.now()}.jpg`, { type: 'image/jpeg' });
      validateFile(file);
      const analysis = await computeCaptureAnalysis(file);
      updateCapture(activeCapture, {
        file,
        preview: canvas.toDataURL('image/jpeg', 0.95),
        analysis,
        storagePath: null,
      });
      setError(null);
      stopCamera();
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : String(captureError));
      logger.error(
        'Photo capture error',
        { component: 'LicenseUploadSection' },
        captureError instanceof Error ? captureError : new Error(String(captureError))
      );
    }
  }, [activeCapture, stopCamera, updateCapture]);

  const handleFileSelect = useCallback(
    (context: CaptureContext) => async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setError(null);
      try {
        validateFile(file);
      } catch (validationError) {
        setError(
          validationError instanceof Error ? validationError.message : String(validationError)
        );
        return;
      }
      try {
        const preview = URL.createObjectURL(file);
        const analysis = await computeCaptureAnalysis(file);
        updateCapture(context, {
          file,
          preview,
          analysis,
          storagePath: null,
        });
        setError(null);
      } catch (analysisError) {
        setError(
          analysisError instanceof Error
            ? analysisError.message
            : 'Failed to process image. Please try another file.'
        );
      }
    },
    [updateCapture]
  );

  const uploadCapture = useCallback(
    async (context: CaptureContext, file: File) => {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filePath = `${userId}/${bookingId}/${context}_${Date.now()}.${extension}`;

      const { data, error: uploadError } = await supabase.storage
        .from('idkit-intake')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError || !data) {
        throw new Error(uploadError?.message ?? 'Upload failed');
      }

      updateCapture(context, { storagePath: data.path });
      return data.path;
    },
    [bookingId, updateCapture, userId]
  );

  const validateCaptureSet = useCallback(() => {
    const errors: string[] = [];

    const documentFront = captures.documentFront.analysis;
    const selfie = captures.selfie.analysis;

    if (!captures.documentFront.file) {
      errors.push('Licence photo is required.');
    }
    if (!captures.selfie.file) {
      errors.push('Selfie is required.');
    }

    if (documentFront) {
      // Match backend requirements: minimum 600x400 (more lenient for camera captures)
      // Backend uses 600x400, so frontend should be at least as lenient
      const minWidth = 600;
      const minHeight = 400;
      if (
        documentFront.width < minWidth ||
        documentFront.height < minHeight ||
        documentFront.aspectRatio < DOCUMENT_ASPECT_RANGE.min ||
        documentFront.aspectRatio > DOCUMENT_ASPECT_RANGE.max
      ) {
        errors.push('Licence photo should be landscape and fill the guide.');
      }
      if (
        documentFront.brightness < BRIGHTNESS_RANGE.min ||
        documentFront.brightness > BRIGHTNESS_RANGE.max
      ) {
        errors.push('Licence lighting should be even and glare-free.');
      }
      if (documentFront.sharpness < SHARPNESS_THRESHOLD_DOCUMENT) {
        errors.push('Licence looks blurry. Retake with the card in focus.');
      }
    }

    if (selfie) {
      // Match backend requirements: minimum 400x400 (more lenient for camera captures)
      // Backend uses 400x400, so frontend should be at least as lenient
      const minSize = 400;
      if (
        selfie.width < minSize ||
        selfie.height < minSize ||
        selfie.aspectRatio < SELFIE_ASPECT_RANGE.min ||
        selfie.aspectRatio > SELFIE_ASPECT_RANGE.max
      ) {
        errors.push('Selfie should be portrait orientation with your face centred.');
      }
      if (selfie.brightness < BRIGHTNESS_RANGE.min || selfie.brightness > BRIGHTNESS_RANGE.max) {
        errors.push('Selfie lighting should be even. Face a window or neutral light.');
      }
      if (selfie.sharpness < SHARPNESS_THRESHOLD_SELFIE) {
        errors.push('Selfie looks blurry. Hold steady and look at the camera.');
      }
    }

    if (documentFront && selfie) {
      const similarity = compareHashes(documentFront.hash, selfie.hash);
      if (similarity > HASH_SIMILARITY_MAX) {
        errors.push('Selfie looks identical to the licence photo. Capture a live selfie.');
      }
    }

    if (errors.length) {
      throw new Error(errors[0]);
    }
  }, [
    captures.documentFront.analysis,
    captures.documentFront.file,
    captures.selfie.analysis,
    captures.selfie.file,
  ]);

  const submitVerification = useCallback(async () => {
    if (isSubmitting) return;
    try {
      validateCaptureSet();
    } catch (validationError) {
      setError(
        validationError instanceof Error ? validationError.message : String(validationError)
      );
      return;
    }

    if (!captures.documentFront.file || !captures.selfie.file) {
      setError('Both captures are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const [frontPath, selfiePath] = await Promise.all([
        uploadCapture('documentFront', captures.documentFront.file),
        uploadCapture('selfie', captures.selfie.file),
      ]);

      const response = await fetch('/api/id-verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          documentPath: frontPath,
          selfiePath,
          consentMethod: 'digital_consent',
          consentRecordedAt: new Date().toISOString(),
          analysis: {
            documentFront: captures.documentFront.analysis,
            selfie: captures.selfie.analysis,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Submission failed' }));
        throw new Error(data.error ?? 'Submission failed');
      }

      const data = await response.json();
      setPendingRequestId(data.requestId ?? null);
      await triggerCompletionCheck(bookingId, 'id_verification');
      onUploadComplete();
      setError(null);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : String(submissionError)
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    bookingId,
    captures.documentFront.analysis,
    captures.documentFront.file,
    captures.selfie.analysis,
    captures.selfie.file,
    isSubmitting,
    onUploadComplete,
    uploadCapture,
    validateCaptureSet,
  ]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [stream, pollingInterval]);

  // Poll for status updates after submission
  useEffect(() => {
    if (pendingRequestId && latestRequest?.id === pendingRequestId) {
      // Check if we're still processing
      if (
        latestRequest.status === 'submitted' ||
        latestRequest.status === 'processing' ||
        latestRequest.status === 'pending'
      ) {
        if (!isPolling) {
          setIsPolling(true);
          const interval = setInterval(async () => {
            try {
              // Trigger parent refresh to get latest status
              onUploadComplete();
            } catch (error) {
              logger.error(
                'Error polling verification status',
                {
                  component: 'LicenseUploadSection',
                  metadata: { requestId: pendingRequestId },
                },
                error instanceof Error ? error : new Error(String(error))
              );
            }
          }, 3000); // Poll every 3 seconds
          setPollingInterval(interval);
        }
      } else {
        // Status is final (approved, rejected, manual_review, failed)
        setIsPolling(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    } else if (pollingInterval) {
      // Clean up if requestId doesn't match
      clearInterval(pollingInterval);
      setPollingInterval(null);
      setIsPolling(false);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pendingRequestId, latestRequest, isPolling, pollingInterval, onUploadComplete]);

  const renderAnalysisSummary = (analysis: CaptureAnalysis | null, context: CaptureContext) => {
    if (!analysis) return null;
    const limits = context === 'selfie' ? SELFIE_ASPECT_RANGE : DOCUMENT_ASPECT_RANGE;
    const brightnessOk =
      analysis.brightness >= BRIGHTNESS_RANGE.min && analysis.brightness <= BRIGHTNESS_RANGE.max;
    const sharpnessOk =
      analysis.sharpness >=
      (context === 'selfie' ? SHARPNESS_THRESHOLD_SELFIE : SHARPNESS_THRESHOLD_DOCUMENT);
    const aspectOk = analysis.aspectRatio >= limits.min && analysis.aspectRatio <= limits.max;

    return (
      <div className="mt-4 rounded-lg bg-gray-50 p-3">
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="font-semibold text-gray-700">Resolution</dt>
            <dd className="text-gray-600">
              {analysis.width} × {analysis.height}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">Aspect Ratio</dt>
            <dd className={aspectOk ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>
              {analysis.aspectRatio.toFixed(2)} : 1{aspectOk ? ' ✓' : ' ⚠'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">Brightness</dt>
            <dd
              className={brightnessOk ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}
            >
              {(analysis.brightness * 100).toFixed(0)}%{brightnessOk ? ' ✓' : ' ⚠'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">Sharpness</dt>
            <dd
              className={sharpnessOk ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}
            >
              {analysis.sharpness.toFixed(2)}
              {sharpnessOk ? ' ✓' : ' ⚠'}
            </dd>
          </div>
        </dl>
      </div>
    );
  };

  const renderCaptureCard = (context: CaptureContext) => {
    const capture = captures[context];
    const status = derivedStatus[context];
    const label = CAPTURE_LABELS[context];
    const statusConfig = STATUS_CONFIG[status.tone];
    const isProcessing = capture.file && !capture.preview;

    return (
      <section
        key={context}
        className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
      >
        {/* Header - Fixed Height */}
        <div className="px-4 py-3 border-b border-gray-100 bg-white h-[90px] flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg" role="img" aria-label={label.title}>
                {label.placeholderIcon}
              </span>
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide leading-tight">
                  {label.title}
                </p>
                <h3 className="text-xs font-bold text-gray-900 leading-tight mt-0.5">
                  {label.description}
                </h3>
              </div>
            </div>
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize border flex-shrink-0 ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.textColor}`}
            >
              <span className="text-[10px]">{statusConfig.icon}</span>
              <span>{status.label}</span>
            </span>
          </div>

          {/* Warning/Error - Always Reserve Space */}
          <div className="h-[24px] flex items-start">
            {(status.tone === 'warning' || status.tone === 'error') && status.message ? (
              <div
                className={`rounded text-[10px] px-2 py-1 w-full ${
                  status.tone === 'warning'
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                <span>{status.tone === 'warning' ? '⚠️' : '❌'}</span>
                <span className="ml-1">{status.message}</span>
              </div>
            ) : (
              <div className="w-full" />
            )}
          </div>
        </div>

        {/* Preview Area - Fixed Height */}
        <div
          className="relative bg-gray-50 border-y border-dashed border-gray-300 overflow-hidden"
          style={{ height: '240px' }}
        >
          {isProcessing ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
                <p className="text-[10px] text-gray-600">Processing...</p>
              </div>
            </div>
          ) : capture.preview ? (
            <>
              <Image
                src={capture.preview}
                alt=""
                aria-hidden="true"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="absolute inset-0 z-10 object-contain blur-md opacity-50"
                style={getClipStyles(context, 'thumbnail')}
                unoptimized
              />
              <Image
                src={capture.preview}
                alt={`${label.title} preview`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="relative z-20 object-contain"
                style={getClipStyles(context, 'thumbnail')}
                unoptimized
              />
              <FrameOverlay context={context} variant="thumbnail" />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4">
              <span className="text-3xl" role="img" aria-label="camera">
                {label.placeholderIcon}
              </span>
              <p className="text-[10px] text-center text-gray-500">
                {context === 'selfie' ? 'Take a clear selfie' : 'Capture your licence'}
              </p>
            </div>
          )}
        </div>

        {/* Status Message - Fixed Height, Always Present */}
        <div
          className={`px-4 py-2 border-t border-gray-100 h-[44px] flex items-center ${
            status.tone === 'success' || status.tone === 'info' || status.tone === 'pending'
              ? `${statusConfig.bgColor} ${statusConfig.textColor}`
              : 'bg-white'
          }`}
        >
          {status.tone === 'success' || status.tone === 'info' || status.tone === 'pending' ? (
            <div className="flex items-center gap-1.5 text-[10px] w-full">
              <span>{statusConfig.icon}</span>
              <span className="font-semibold">{status.label}:</span>
              <span className="flex-1 truncate">{status.message}</span>
            </div>
          ) : (
            <div className="w-full" />
          )}
        </div>

        {/* Buttons - Fixed Height */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 h-[72px] flex flex-col justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => startCamera(context)}
              disabled={isProcessing ?? false}
              className="flex-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[10px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              📸 {capture.preview ? 'Retake' : 'Take photo'}
            </button>
            <label className="flex-1 cursor-pointer rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-center text-[10px] font-semibold text-gray-700 transition hover:bg-gray-50">
              📁 Choose file
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect(context)}
                disabled={isProcessing ?? false}
                className="hidden"
              />
            </label>
          </div>
          {capture.file ? (
            <p className="text-[10px] text-gray-500 truncate">{capture.file.name}</p>
          ) : (
            <p className="text-[10px] text-gray-400">JPG, PNG, WebP (max 7MB)</p>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {error && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚠️</span>
                <p className="font-bold">Something went wrong</p>
              </div>
              <p className="text-sm whitespace-pre-line">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="flex-shrink-0 text-red-600 hover:text-red-800 focus:outline-none transition-colors"
              aria-label="Dismiss error"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      )}

      {/* Two Column Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {(['documentFront', 'selfie'] as CaptureContext[]).map(renderCaptureCard)}
      </div>

      {/* Submit Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-center gap-2">
          <input
            type="checkbox"
            id="consent-checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500 flex-shrink-0"
          />
          <label
            htmlFor="consent-checkbox"
            className="text-xs text-gray-600 text-center cursor-pointer flex-1"
          >
            <p className="mb-1">
              I consent to identity verification using biometric and document analysis.
            </p>
            <p>I confirm the images are accurate and I am the individual identified.</p>
          </label>
        </div>
        <button
          type="button"
          onClick={submitVerification}
          disabled={
            isSubmitting || !captures.documentFront.file || !captures.selfie.file || !consentChecked
          }
          className="w-full rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Uploading & Verifying...
            </span>
          ) : (
            'Submit for Review'
          )}
        </button>
        {pendingRequestId && (
          <p className="mt-2 text-xs text-gray-500 text-center">Request ID: {pendingRequestId}</p>
        )}
      </div>

      {/* Verification Results Section - Show results for any latest request */}
      {latestRequest && (
        <div
          className="rounded-lg border-2 p-4 shadow-sm mt-4"
          style={{
            borderColor:
              latestRequest.status === 'approved'
                ? 'rgb(34, 197, 94)'
                : latestRequest.status === 'rejected' || latestRequest.status === 'failed'
                  ? 'rgb(239, 68, 68)'
                  : latestRequest.status === 'manual_review'
                    ? 'rgb(251, 191, 36)'
                    : 'rgb(59, 130, 246)',
            backgroundColor:
              latestRequest.status === 'approved'
                ? 'rgb(240, 253, 244)'
                : latestRequest.status === 'rejected' || latestRequest.status === 'failed'
                  ? 'rgb(254, 242, 242)'
                  : latestRequest.status === 'manual_review'
                    ? 'rgb(255, 251, 235)'
                    : 'rgb(239, 246, 255)',
          }}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0">
              {latestRequest.status === 'approved' && (
                <div className="rounded-full bg-green-100 p-2">
                  <span className="text-2xl">✅</span>
                </div>
              )}
              {(latestRequest.status === 'rejected' || latestRequest.status === 'failed') && (
                <div className="rounded-full bg-red-100 p-2">
                  <span className="text-2xl">❌</span>
                </div>
              )}
              {(latestRequest.status === 'manual_review' ||
                latestRequest.status === 'processing' ||
                latestRequest.status === 'submitted') && (
                <div className="rounded-full bg-yellow-100 p-2">
                  <span className="text-2xl">⏳</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3
                className="text-lg font-bold mb-1"
                style={{
                  color:
                    latestRequest.status === 'approved'
                      ? 'rgb(22, 101, 52)'
                      : latestRequest.status === 'rejected' || latestRequest.status === 'failed'
                        ? 'rgb(153, 27, 27)'
                        : latestRequest.status === 'manual_review'
                          ? 'rgb(161, 98, 7)'
                          : 'rgb(30, 64, 175)',
                }}
              >
                {latestRequest.status === 'approved' && 'Verification Approved ✓'}
                {latestRequest.status === 'rejected' && 'Verification Rejected ✗'}
                {latestRequest.status === 'failed' && 'Verification Failed ✗'}
                {latestRequest.status === 'manual_review' && 'Under Manual Review'}
                {(latestRequest.status === 'processing' || latestRequest.status === 'submitted') &&
                  'Processing Verification...'}
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                {latestRequest.status === 'approved' &&
                  'Your identity has been successfully verified. You can proceed with your booking.'}
                {latestRequest.status === 'rejected' &&
                  'Your verification was rejected. Please review the issues below and resubmit.'}
                {latestRequest.status === 'failed' &&
                  'Verification failed due to technical issues. Please try again.'}
                {latestRequest.status === 'manual_review' &&
                  'Please try taking new photos and resubmitting. If you experience continued failures either wait for manual review or reach out to a member of our team.'}
                {(latestRequest.status === 'processing' || latestRequest.status === 'submitted') &&
                  'Your verification is being processed. This may take a few moments...'}
              </p>
            </div>
          </div>

          {/* Scores and Details */}
          {latestRequest.result && (
            <div className="mt-4 space-y-3">
              {/* Document Status */}
              {latestRequest.result.document_status && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">Document Status:</span>
                  <span
                    className={`text-sm font-bold px-3 py-1 rounded-full ${
                      latestRequest.status === 'approved' &&
                      latestRequest.result.document_status === 'passed'
                        ? 'bg-green-100 text-green-800'
                        : latestRequest.result.document_status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {latestRequest.status === 'approved' &&
                      latestRequest.result.document_status === 'passed' &&
                      '✓ Passed'}
                    {latestRequest.result.document_status === 'failed' && '✗ Failed'}
                    {(latestRequest.result.document_status === 'suspected' ||
                      latestRequest.status === 'manual_review') &&
                      '⚠ Needs Review'}
                    {latestRequest.result.document_status === 'not_applicable' && '— N/A'}
                  </span>
                </div>
              )}

              {/* Scores Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {latestRequest.result.face_match_score !== null &&
                  latestRequest.result.face_match_score !== undefined && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">Face Match Score</div>
                      <div
                        className="text-lg font-bold"
                        style={{
                          color:
                            latestRequest.result.face_match_score >= 0.45
                              ? 'rgb(22, 101, 52)'
                              : latestRequest.result.face_match_score >= 0.35
                                ? 'rgb(161, 98, 7)'
                                : 'rgb(153, 27, 27)',
                        }}
                      >
                        {(Math.min(latestRequest.result.face_match_score * 1.4, 1.0) * 100).toFixed(
                          1
                        )}
                        %
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {latestRequest.result.face_match_score >= 0.45 && '✓ Match'}
                        {latestRequest.result.face_match_score >= 0.35 &&
                          latestRequest.result.face_match_score < 0.45 &&
                          '⚠ Possible Match'}
                        {latestRequest.result.face_match_score < 0.35 && '✗ No Match'}
                      </div>
                    </div>
                  )}

                {latestRequest.result.processed_at && (
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Processed At</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {new Date(latestRequest.result.processed_at).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Failure Reasons - Only show if status is NOT approved */}
              {latestRequest.status !== 'approved' &&
                latestRequest.result.failure_reasons &&
                latestRequest.result.failure_reasons.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                      <span>❌</span>
                      Issues Found:
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {latestRequest.result.failure_reasons.map((reason, index) => {
                        const interpreted = interpretFailureReason(reason);
                        if (!interpreted.message) return null;
                        return (
                          <li key={index} className="text-sm text-red-800">
                            {interpreted.message}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

              {/* Success Message */}
              {latestRequest.status === 'approved' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-900 font-semibold flex items-center gap-2">
                    <span>✅</span>
                    All checks passed! Your identity verification is complete.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Processing Indicator */}
          {(latestRequest.status === 'processing' || latestRequest.status === 'submitted') &&
            isPolling && (
              <div className="mt-4 flex items-center gap-2 text-sm text-blue-700">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Checking status...</span>
              </div>
            )}
        </div>
      )}

      {showCamera && activeCapture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl rounded-3xl bg-gray-900 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {cameraContext === 'selfie' ? '📷 Take Selfie' : '🪪 Capture Licence'}
              </h3>
              <button
                type="button"
                onClick={stopCamera}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                ✕ Close
              </button>
            </div>
            <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl">
              <video
                ref={blurVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 z-10 h-full w-full object-cover blur-3xl opacity-50"
              />
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 z-20 h-full w-full object-cover"
                style={{
                  minHeight: '400px',
                  ...getClipStyles(cameraContext, 'live'),
                }}
              />
              <FrameOverlay context={cameraContext} variant="live" />
            </div>
            <div className="mt-6 flex flex-col gap-4 text-sm text-gray-200">
              <p className="font-semibold text-center text-base">
                {cameraContext === 'selfie'
                  ? 'Align your face inside the oval and hold steady before capturing.'
                  : 'Fill the rectangle with the licence. Avoid glare and keep text readable.'}
              </p>
              <div className="flex flex-col gap-3 md:flex-row">
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={!cameraReady}
                  className="flex-1 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 px-8 py-4 text-gray-900 font-bold transition-all hover:from-yellow-600 hover:to-yellow-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
                >
                  {cameraReady ? '📸 Capture Photo' : '⏳ Starting camera...'}
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-white font-semibold transition-all hover:bg-white/20 active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
