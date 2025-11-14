import type { Tensor3D } from '@tensorflow/tfjs-node';
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  GlobalHistogramBinarizer,
  HybridBinarizer,
  InvertedLuminanceSource,
  MultiFormatReader,
  NotFoundException,
  RGBLuminanceSource,
} from '@zxing/library';

import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';

import type { ImageAnalysis, LocalVerificationParams, LocalVerificationResult } from './types';

type TfModule = typeof import('@tensorflow/tfjs-node');
type SharpModule = typeof import('sharp');
type HumanModule = typeof import('@vladmandic/human');
type HumanCtor = HumanModule extends { default: infer D } ? D : never;
type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>;
type SharpInstance = ReturnType<SharpModule>;
type SharpMetadata = Awaited<ReturnType<SharpInstance['metadata']>>;
type SharpTransform = (img: SharpInstance, meta: SharpMetadata) => SharpInstance;

const isNodeRuntime = typeof process !== 'undefined' && process.release?.name === 'node';

const getNodeRequire = (): NodeRequire => {
  if (!isNodeRuntime) {
    throw new Error('node_runtime_required');
  }

  return eval('require') as NodeRequire;
};

let tfModulePromise: Promise<TfModule> | null = null;
let sharpModulePromise: Promise<SharpModule> | null = null;
let humanCtorPromise: Promise<HumanCtor> | null = null;

async function loadTfModule(): Promise<TfModule> {
  if (!tfModulePromise) {
    tfModulePromise = Promise.resolve().then(() => {
      const runtimeRequire = getNodeRequire();
      const tfModule = runtimeRequire('@tensorflow/tfjs-node') as TfModule;
      if (!(globalThis as unknown as { tf?: TfModule }).tf) {
        (globalThis as unknown as { tf?: TfModule }).tf = tfModule;
      }
      return tfModule;
    });
  }
  return tfModulePromise;
}

async function loadSharpModule(): Promise<SharpModule> {
  if (!sharpModulePromise) {
    sharpModulePromise = Promise.resolve().then(() => {
      const runtimeRequire = getNodeRequire();
      return runtimeRequire('sharp') as SharpModule;
    });
  }
  return sharpModulePromise;
}

async function loadHumanCtor(): Promise<HumanCtor> {
  if (!humanCtorPromise) {
    humanCtorPromise = Promise.resolve().then(async () => {
      const runtimeRequire = getNodeRequire();
      const module = runtimeRequire('@vladmandic/human') as HumanModule;
      const ctor = (module as { default?: HumanCtor }).default ?? (module as unknown as HumanCtor);
      const humanCtor = ctor;
      const tf = await loadTfModule();
      // Some versions expect tf on ctor or global scope; ensure both.
      if ('tf' in humanCtor) {
        (humanCtor as unknown as { tf?: TfModule }).tf = tf;
      }
      return humanCtor;
    });
  }
  return humanCtorPromise;
}

type LocalVerificationParams = {
  requestId: string;
  bookingId: string;
  userId: string;
  documentPath: string;
  selfiePath: string;
};

type FaceMetrics = {
  detected: boolean;
  confidence: number;
  descriptor?: number[];
  yaw?: number | null;
  pitch?: number | null;
  roll?: number | null;
  boxAreaRatio?: number | null;
};

type ImageStats = {
  width: number;
  height: number;
  averageBrightness: number;
  edgeStrength: number;
  skinPixelRatio: number;
  horizontalEdgeRatio?: number; // Ratio of horizontal edges (indicates text lines)
  documentStructureScore?: number; // Score indicating document-like structure (0-1)
};

type ImageAnalysis = {
  stats: ImageStats;
  face?: FaceMetrics;
  barcode?: {
    text: string;
    format: string;
  } | null;
  textPatterns?: {
    hasText: boolean;
    textLineCount: number;
  };
};

type VerificationScores = {
  faceMatchScore: number | null;
  documentSharpnessScore: number | null;
  selfieSharpnessScore: number | null;
};

type LocalVerificationResult = {
  status: 'approved' | 'manual_review' | 'rejected';
  failureReasons: string[];
  scores: VerificationScores;
  stats: {
    documents?: Array<ImageStats & { face?: FaceMetrics; barcode?: ImageAnalysis['barcode'] }>;
    selfie?: ImageStats & { face?: FaceMetrics };
  };
};

// TUNED THRESHOLDS FOR ACCURATE DETECTION
const DOCUMENT_SIZE_THRESHOLD = { width: 600, height: 400 };
const SELFIE_SIZE_THRESHOLD = { width: 400, height: 400 };
const BRIGHTNESS_RANGE = { min: 0.2, max: 0.85 };
const SHARPNESS_THRESHOLD_DOCUMENT = 18;
const SHARPNESS_THRESHOLD_SELFIE = 12;
// RELAXED: Driver's licenses are credit card sized (~1.6:1), but allow wider range for camera angles
// This helps distinguish licenses from regular photos while allowing for slight variations
const DOCUMENT_ASPECT_RATIO_RANGE = { min: 1.3, max: 1.9 };
const SELFIE_ASPECT_RATIO_RANGE = { min: 0.6, max: 1.4 };
// RELAXED: Increased to 0.30 to allow fingers and hands visible when holding license
const DOCUMENT_MAX_SKIN_RATIO = 0.3;
// RELAXED: Increased from 0.015 to 0.02 for better selfie detection
const SELFIE_MIN_SKIN_RATIO = 0.02;
// RELAXED: Document face should be small (photo on card), but allow some variation
const DOCUMENT_FACE_AREA_RANGE = { min: 0.01, max: 0.15 };
// RELAXED: Selfie face can be larger, range expanded slightly
const SELFIE_FACE_AREA_RANGE = { min: 0.04, max: 0.8 };
// RELAXED: Face match threshold lowered to be more lenient - 0.45 allows for lighting/angle variations and different photo conditions
const FACE_MATCH_THRESHOLD = 0.45; // Cosine similarity threshold (lower = more lenient)

const BARCODE_FORMAT_SETS: BarcodeFormat[][] = [
  [BarcodeFormat.PDF_417],
  [
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODABAR,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
  ],
  [BarcodeFormat.DATA_MATRIX, BarcodeFormat.QR_CODE, BarcodeFormat.AZTEC, BarcodeFormat.PDF_417],
];

// Non-blocking reasons that don't prevent auto-approval
// Quality issues (aspect ratio, brightness, blur, resolution) are warnings only
// Skin ratio and face area issues are warnings when face match is good
// Only structure, text detection, and face detection are blocking
const NON_BLOCKING_FAILURE_REASONS = new Set<string>([
  'document_resolution_low_front',
  'document_aspect_invalid_front',
  'document_brightness_out_of_range_front',
  'document_blurry_front',
  'document_contains_face_front',
  'document_high_skin_ratio',
  'document_face_area_exceeds_ratio',
  'document_face_area_too_small',
  'selfie_resolution_low',
  'selfie_aspect_invalid',
  'selfie_brightness_out_of_range',
  'selfie_blurry',
  'selfie_missing_face',
  'selfie_face_area_too_small',
  'selfie_face_area_exceeds_ratio',
]);

const clamp01 = (value: number) => {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const logFaceDetectionIssue = (
  type: 'document' | 'selfie',
  requestId: string,
  stats: ImageStats | undefined,
  face: FaceMetrics | undefined,
  reason: string
) => {
  logger.warn('Face detection issue', {
    component: 'local-id-verification',
    action: `${type}_face_detection_issue`,
    requestId,
    reason,
    stats,
    face,
  });
};

let humanInstance: InstanceType<HumanCtor> | null = null;
let humanReady = false;

async function ensureHumanReady() {
  if (!humanInstance) {
    const HumanClass = await loadHumanCtor();
    const instance = new HumanClass({
      cacheSensitivity: 0,
      warmup: 'face',
      face: {
        enabled: true,
        detector: {
          enabled: true,
          rotation: false,
          maxDetected: 1,
          return: true,
          // TIGHTENED: Increased minConfidence from 0.25 to 0.3 for better accuracy
          minConfidence: 0.3,
          skipFrames: 0,
        },
        mesh: { enabled: true },
        iris: { enabled: false },
        emotion: { enabled: false },
        description: { enabled: true },
      },
      body: { enabled: false },
      hand: { enabled: false },
      gesture: { enabled: false },
      object: { enabled: false },
      modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models',
    }) as InstanceType<HumanCtor>;

    if ('tf' in instance && !(instance as { tf?: TfModule }).tf) {
      (instance as { tf?: TfModule }).tf = await loadTfModule();
    }

    humanInstance = instance;
  }

  if (!humanReady) {
    await humanInstance.load();
    await humanInstance.warmup();
    humanReady = true;
  }

  return humanInstance;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function runLocalIdVerification(
  params: LocalVerificationParams
): Promise<LocalVerificationResult> {
  const serviceClientRaw = createServiceClient();
  if (!serviceClientRaw) {
    logger.error('Service client unavailable for local ID verification', {
      component: 'local-id-verification',
      action: 'service_client_missing',
      requestId: params.requestId,
    });
    return {
      status: 'manual_review',
      failureReasons: ['service_client_unavailable'],
      scores: {
        faceMatchScore: null,
        documentSharpnessScore: null,
        selfieSharpnessScore: null,
      },
      stats: {},
    };
  }

  const serviceClient: ServiceClient = serviceClientRaw;

  const { data: requestRecord } = await serviceClient
    .from('id_verification_requests')
    .select('metadata')
    .eq('id', params.requestId)
    .single();

  const failureReasons: string[] = [];
  const documents: Array<ImageStats & { face?: FaceMetrics; barcode?: ImageAnalysis['barcode'] }> =
    [];
  let selfie: (ImageStats & { face?: FaceMetrics }) | undefined;
  let faceMatchScore: number | null = null;

  try {
    const documentAnalysis = await analyzeRemoteImage(
      serviceClient,
      params.documentPath,
      'documentFront'
    );

    const { stats, face } = documentAnalysis;
    documents.push({ ...stats, face });

    const aspectRatio = stats.width / Math.max(stats.height, 1);
    if (
      stats.width < DOCUMENT_SIZE_THRESHOLD.width ||
      stats.height < DOCUMENT_SIZE_THRESHOLD.height
    ) {
      failureReasons.push(`document_resolution_low_front_${stats.width}x${stats.height}`);
    }
    if (
      aspectRatio < DOCUMENT_ASPECT_RATIO_RANGE.min ||
      aspectRatio > DOCUMENT_ASPECT_RATIO_RANGE.max
    ) {
      failureReasons.push(`document_aspect_invalid_front_${aspectRatio.toFixed(2)}`);
    }
    if (
      stats.averageBrightness < BRIGHTNESS_RANGE.min ||
      stats.averageBrightness > BRIGHTNESS_RANGE.max
    ) {
      failureReasons.push(
        `document_brightness_out_of_range_front_${stats.averageBrightness.toFixed(2)}`
      );
    }
    if (stats.edgeStrength < SHARPNESS_THRESHOLD_DOCUMENT) {
      failureReasons.push(`document_blurry_front_${stats.edgeStrength.toFixed(2)}`);
    }
    // RELAXED: Only flag if skin ratio is very high (>45%) - allows fingers/hands holding license
    // This is non-blocking, just a warning
    if (stats.skinPixelRatio > 0.45) {
      failureReasons.push(`document_contains_face_front_${stats.skinPixelRatio.toFixed(2)}`);
    }

    // TIGHTENED: Document face detection - require higher confidence (0.5 instead of 0.4)
    // This ensures we detect the photo on the licence, not random faces
    if (!face || !face.detected || face.confidence < 0.5) {
      failureReasons.push('document_face_not_detected');
    }
    if (face?.boxAreaRatio != null) {
      // CRITICAL: If face area is too large, it's likely a selfie, not a license card
      // License cards have small face photos (typically 1-15% of image), selfies have large faces (30%+)
      if (face.boxAreaRatio > DOCUMENT_FACE_AREA_RANGE.max) {
        failureReasons.push(`document_face_area_exceeds_ratio_${face.boxAreaRatio.toFixed(3)}`);
        logger.warn('Face area too large - likely a selfie, not a license card', {
          component: 'local-id-verification',
          action: 'face_area_too_large',
          requestId: params.requestId,
          metadata: {
            faceAreaRatio: face.boxAreaRatio,
            threshold: DOCUMENT_FACE_AREA_RANGE.max,
            isLikelySelfie: face.boxAreaRatio > 0.25,
          },
        });
      } else if (face.boxAreaRatio < DOCUMENT_FACE_AREA_RANGE.min) {
        failureReasons.push(`document_face_area_too_small_${face.boxAreaRatio.toFixed(3)}`);
      }
    }

    // RELAXED: Check skin pixel ratio - selfies have high skin ratio, cards have low
    // Only flag if skin ratio is VERY high (>55%) - allows for hands/fingers holding license
    // This should only trigger for actual selfies, not legitimate license photos with visible hands
    if (stats.skinPixelRatio > 0.55) {
      failureReasons.push(`document_high_skin_ratio_${stats.skinPixelRatio.toFixed(2)}`);
      logger.warn('Skin pixel ratio very high - may be a selfie rather than a license card', {
        component: 'local-id-verification',
        action: 'high_skin_ratio',
        requestId: params.requestId,
        metadata: {
          skinPixelRatio: stats.skinPixelRatio,
          isLikelySelfie: stats.skinPixelRatio > 0.55,
        },
      });
    }

    // CRITICAL: Validate document structure to verify this is actually a license card
    // This is one of the ONLY blocking requirements - must be card-like structure
    // Selfies and regular photos have very different structure than cards
    const documentStructureScore = stats.documentStructureScore ?? 0;
    const horizontalEdgeRatio = stats.horizontalEdgeRatio ?? 0;

    // CRITICAL: Detect text patterns - license cards MUST have text, selfies don't
    // This is the most reliable way to distinguish cards from selfies
    // RELAXED: Only fail if we're very confident there's no text (very low count AND structure score is low)
    const textPatterns = documentAnalysis.textPatterns;

    // Only flag as no text if:
    // 1. No text detected AND
    // 2. Structure score is also low (double-check it's not a card)
    // This prevents false positives on blurry/low-quality license photos
    if (
      (!textPatterns || !textPatterns.hasText || textPatterns.textLineCount < 2) &&
      documentStructureScore < 0.3
    ) {
      failureReasons.push(`document_no_text_detected_${textPatterns?.textLineCount || 0}`);
      logger.warn(
        'No text patterns detected and low structure score - likely a selfie, not a license card',
        {
          component: 'local-id-verification',
          action: 'no_text_detected',
          requestId: params.requestId,
          metadata: {
            hasText: textPatterns?.hasText || false,
            textLineCount: textPatterns?.textLineCount || 0,
            documentStructureScore,
            isLikelySelfie: true,
          },
        }
      );
    } else if (textPatterns?.hasText) {
      logger.info('Text patterns detected successfully', {
        component: 'local-id-verification',
        action: 'text_detected',
        requestId: params.requestId,
        metadata: {
          textLineCount: textPatterns.textLineCount,
        },
      });
    }

    // VERY STRICT: Must have strong document-like structure (card with text patterns)
    // Selfies typically have structure scores < 0.3, cards should be > 0.5
    // We need a much higher threshold to distinguish cards from selfies/photos
    if (documentStructureScore < 0.5) {
      // Much higher threshold - cards have structured layouts with text, selfies don't
      failureReasons.push(`document_structure_invalid_${documentStructureScore.toFixed(2)}`);
      logger.warn(
        'Document structure does not match license card characteristics - may be a selfie or photo',
        {
          component: 'local-id-verification',
          action: 'document_structure_invalid',
          requestId: params.requestId,
          metadata: {
            documentStructureScore,
            horizontalEdgeRatio,
            edgeStrength: stats.edgeStrength,
            faceAreaRatio: face?.boxAreaRatio,
            skinPixelRatio: stats.skinPixelRatio,
            isLikelySelfie: documentStructureScore < 0.3,
          },
        }
      );
    }

    // VERY STRICT: Must have text-like patterns (horizontal edges indicate text lines on card)
    // Cards have 25-65% horizontal edges (text lines), selfies typically have < 20% or > 75%
    if (horizontalEdgeRatio < 0.25 || horizontalEdgeRatio > 0.65) {
      // Stricter range - cards have structured text patterns, selfies don't
      failureReasons.push(`document_text_pattern_invalid_${horizontalEdgeRatio.toFixed(2)}`);
      logger.warn('Document lacks text-like patterns typical of license cards - may be a selfie', {
        component: 'local-id-verification',
        action: 'text_pattern_invalid',
        requestId: params.requestId,
        metadata: {
          horizontalEdgeRatio,
          isLikelySelfie: horizontalEdgeRatio < 0.2 || horizontalEdgeRatio > 0.75,
        },
      });
    }

    const selfieAnalysis = await analyzeRemoteImage(serviceClient, params.selfiePath, 'selfie');
    selfie = { ...selfieAnalysis.stats, face: selfieAnalysis.face };

    const selfieAspectRatio = selfie.width / Math.max(selfie.height, 1);
    if (
      selfie.width < SELFIE_SIZE_THRESHOLD.width ||
      selfie.height < SELFIE_SIZE_THRESHOLD.height
    ) {
      failureReasons.push(`selfie_resolution_low_${selfie.width}x${selfie.height}`);
    }
    if (
      selfieAspectRatio < SELFIE_ASPECT_RATIO_RANGE.min ||
      selfieAspectRatio > SELFIE_ASPECT_RATIO_RANGE.max
    ) {
      failureReasons.push(`selfie_aspect_invalid_${selfieAspectRatio.toFixed(2)}`);
    }
    if (
      selfie.averageBrightness < BRIGHTNESS_RANGE.min ||
      selfie.averageBrightness > BRIGHTNESS_RANGE.max
    ) {
      failureReasons.push(`selfie_brightness_out_of_range_${selfie.averageBrightness.toFixed(2)}`);
    }
    if (selfie.edgeStrength < SHARPNESS_THRESHOLD_SELFIE) {
      failureReasons.push(`selfie_blurry_${selfie.edgeStrength.toFixed(2)}`);
    }
    if (selfie.skinPixelRatio < SELFIE_MIN_SKIN_RATIO) {
      logFaceDetectionIssue(
        'selfie',
        params.requestId,
        selfie,
        selfie?.face,
        `selfie_missing_face_${selfie.skinPixelRatio.toFixed(2)}`
      );
      failureReasons.push(`selfie_missing_face_${selfie.skinPixelRatio.toFixed(2)}`);
    }

    // TIGHTENED: Selfie face detection - require higher confidence (0.35 instead of 0.25)
    // This reduces false positives while still allowing good selfies
    if (!selfie.face || !selfie.face.detected || selfie.face.confidence < 0.35) {
      logFaceDetectionIssue(
        'selfie',
        params.requestId,
        selfie,
        selfie?.face,
        'selfie_face_not_detected'
      );
      failureReasons.push('selfie_face_not_detected');
    }
    if (selfie.face?.boxAreaRatio != null) {
      if (selfie.face.boxAreaRatio < SELFIE_FACE_AREA_RANGE.min) {
        logFaceDetectionIssue(
          'selfie',
          params.requestId,
          selfie,
          selfie.face,
          `selfie_face_area_too_small_${selfie.face.boxAreaRatio.toFixed(3)}`
        );
        failureReasons.push(`selfie_face_area_too_small_${selfie.face.boxAreaRatio.toFixed(3)}`);
      } else if (selfie.face.boxAreaRatio > SELFIE_FACE_AREA_RANGE.max) {
        logFaceDetectionIssue(
          'selfie',
          params.requestId,
          selfie,
          selfie.face,
          `selfie_face_area_exceeds_ratio_${selfie.face.boxAreaRatio.toFixed(3)}`
        );
        failureReasons.push(
          `selfie_face_area_exceeds_ratio_${selfie.face.boxAreaRatio.toFixed(3)}`
        );
      }
    }

    const frontFaceDescriptor = documents[0]?.face?.descriptor;
    const selfieDescriptor = selfie.face?.descriptor;

    if (frontFaceDescriptor && selfieDescriptor) {
      faceMatchScore = Number(cosineSimilarity(frontFaceDescriptor, selfieDescriptor).toFixed(4));
      if (faceMatchScore < FACE_MATCH_THRESHOLD) {
        failureReasons.push(`face_mismatch_${faceMatchScore.toFixed(3)}`);
      }
    } else {
      failureReasons.push('face_descriptor_unavailable');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(
      'Local ID verification failed during analysis',
      {
        component: 'local-id-verification',
        action: 'analysis_error',
        requestId: params.requestId,
      },
      error instanceof Error ? error : new Error(String(error))
    );
    failureReasons.push(`analysis_error_${message}`);
  }

  // Check if reason matches any non-blocking prefix (since reasons include values like "_0.42")
  const nonBlockingFailureReasons = failureReasons.filter((reason) =>
    Array.from(NON_BLOCKING_FAILURE_REASONS).some((nonBlocking) => reason.startsWith(nonBlocking))
  );
  const blockingFailureReasons = failureReasons.filter(
    (reason) =>
      !Array.from(NON_BLOCKING_FAILURE_REASONS).some((nonBlocking) =>
        reason.startsWith(nonBlocking)
      )
  );

  const hasCriticalMismatch = blockingFailureReasons.some((reason) =>
    reason.startsWith('face_mismatch')
  );
  const hasAnalysisError = failureReasons.some((reason) => reason.startsWith('analysis_error'));

  // CRITICAL BLOCKING REQUIREMENTS:
  // 1. Document must have a face (card photo)
  // 2. Document must be card-like (structure validation)
  // 3. Document must have TEXT (most reliable check - cards have text, selfies don't)
  // 4. Selfie must have a face
  // NOTE: Skin ratio and face area issues are now non-blocking (warnings only)
  const hasDocumentCritical =
    blockingFailureReasons.includes('document_face_not_detected') ||
    blockingFailureReasons.some(
      (reason) =>
        reason.startsWith('document_structure_invalid') ||
        reason.startsWith('document_text_pattern_invalid') ||
        reason.startsWith('document_no_text_detected')
    );
  const hasSelfieCritical = blockingFailureReasons.includes('selfie_face_not_detected');

  // All quality issues are already non-blocking (in NON_BLOCKING_FAILURE_REASONS)
  // Only structure and face detection are blocking
  const effectiveBlockingReasons = blockingFailureReasons;

  let status: LocalVerificationResult['status'] = 'approved';
  // Only reject for analysis errors
  if (hasAnalysisError) {
    status = 'rejected';
  } else if (
    hasCriticalMismatch ||
    effectiveBlockingReasons.length > 0 ||
    hasDocumentCritical ||
    hasSelfieCritical
  ) {
    // Face mismatch and other blocking issues go to manual review
    status = 'manual_review';
  }

  const documentSharpnessScore =
    documents.length > 0
      ? Number(
          clamp01(
            documents.reduce((acc, stat) => acc + stat.edgeStrength, 0) /
              (documents.length * SHARPNESS_THRESHOLD_DOCUMENT)
          ).toFixed(2)
        )
      : null;
  const selfieSharpnessScore = selfie
    ? Number(clamp01(selfie.edgeStrength / SHARPNESS_THRESHOLD_SELFIE).toFixed(2))
    : null;

  // Determine document status - exclude non-blocking issues when face match passes
  const documentBlockingReasons = effectiveBlockingReasons.filter((reason) =>
    reason.startsWith('document_')
  );

  // Document status should reflect the overall verification status
  let documentStatus: 'passed' | 'failed' | 'suspected' | 'not_applicable';
  if (hasDocumentCritical) {
    documentStatus = 'failed';
  } else if (status === 'approved') {
    // Only show 'passed' if overall status is approved
    documentStatus = 'passed';
  } else if (documentBlockingReasons.length > 0 || status === 'manual_review') {
    // Show 'suspected' if there are document issues or if going to manual review
    documentStatus = 'suspected';
  } else {
    documentStatus = 'passed';
  }

  const { error: resultsError } = await serviceClient
    .from('id_verification_results')
    .upsert(
      {
        request_id: params.requestId,
        document_status: documentStatus,
        document_liveness_score: documentSharpnessScore,
        face_liveness_score: selfieSharpnessScore,
        face_match_score: faceMatchScore,
        // Only store blocking failure reasons (or all if status is not approved)
        failure_reasons:
          status === 'approved'
            ? effectiveBlockingReasons.length > 0
              ? effectiveBlockingReasons
              : null
            : failureReasons.length > 0
              ? failureReasons
              : null,
        raw_payload: {
          source: 'local_automation',
          stats: {
            documents,
            selfie,
          },
          generated_at: new Date().toISOString(),
        },
        processed_at: new Date().toISOString(),
        extracted_fields: {},
      },
      { onConflict: 'request_id' }
    )
    .select()
    .single();

  if (resultsError) {
    logger.error(
      'Failed to upsert local verification results',
      {
        component: 'local-id-verification',
        action: 'results_upsert_error',
        requestId: params.requestId,
      },
      resultsError
    );
  }

  const { error: requestUpdateError } = await serviceClient
    .from('id_verification_requests')
    .update({
      status,
      metadata: {
        ...(requestRecord?.metadata ?? {}),
        localAutomation: {
          status,
          failureReasons,
          blockingFailureReasons,
          nonBlockingFailureReasons,
          scores: {
            faceMatchScore,
            documentSharpnessScore,
            selfieSharpnessScore,
          },
          processedAt: new Date().toISOString(),
        },
      },
    })
    .eq('id', params.requestId);

  if (requestUpdateError) {
    logger.error(
      'Failed to update verification request after local automation',
      {
        component: 'local-id-verification',
        action: 'request_update_error',
        requestId: params.requestId,
        metadata: {
          status,
          failureReasons,
        },
      },
      requestUpdateError
    );
  }

  await serviceClient.from('id_verification_audits').insert({
    request_id: params.requestId,
    action:
      status === 'approved'
        ? 'auto_decision'
        : status === 'rejected'
          ? 'auto_rejected'
          : 'manual_review_opened',
    performed_by: null,
    notes: failureReasons.length ? failureReasons.join('; ') : null,
    metadata: {
      source: 'local_automation',
      scores: {
        faceMatchScore,
        documentSharpnessScore,
        selfieSharpnessScore,
      },
    },
  });

  return {
    status,
    failureReasons,
    scores: {
      faceMatchScore,
      documentSharpnessScore,
      selfieSharpnessScore,
    },
    stats: {
      documents: documents.length ? documents : undefined,
      selfie,
    },
  };
}

async function detectTextPatterns(
  buffer: Buffer
): Promise<{ hasText: boolean; textLineCount: number }> {
  try {
    const sharp = await loadSharpModule();
    // Convert to grayscale and enhance contrast for text detection
    // Use higher resolution for better text detection
    const { data, info } = await sharp(buffer)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .greyscale()
      .normalise()
      .sharpen({ sigma: 1 }) // Sharpen to enhance text edges
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    if (!width || !height) {
      return { hasText: false, textLineCount: 0 };
    }

    // RELAXED: Detect horizontal text lines by looking for rows with edge patterns
    // Lower thresholds to catch text even in lower quality/blurry images
    const textLineThreshold = 0.08; // Lower threshold - text can be subtle
    const minLineLength = Math.floor(width * 0.2); // Lower minimum (20% instead of 30%)
    const edgeThreshold = 20; // Lower edge threshold (20 instead of 30)
    let textLineCount = 0;
    const textRows: number[] = []; // Track which rows have text

    // Sample every 2nd row for performance
    for (let y = 0; y < height; y += 2) {
      let edgeCount = 0;
      let lineStart = -1;
      let lineEnd = -1;
      let transitions = 0; // Count dark-to-light transitions (characteristic of text)

      for (let x = 0; x < width - 1; x++) {
        const idx = y * width + x;
        const current = data[idx];
        const next = data[idx + 1];
        const edgeStrength = Math.abs(current - next);

        // Count edges (text has many edges)
        if (edgeStrength > edgeThreshold) {
          edgeCount++;
          if (lineStart === -1) lineStart = x;
          lineEnd = x;
        }

        // Count transitions (text has many dark-to-light transitions)
        const isDark = current < 128;
        const nextIsDark = next < 128;
        if (isDark !== nextIsDark) {
          transitions++;
        }
      }

      const edgeDensity = edgeCount / width;
      const transitionDensity = transitions / width;
      const lineLength = lineEnd - lineStart;

      // Text rows have: high edge density OR high transition density AND form a line
      // This catches text even if contrast is low
      const hasTextPattern =
        (edgeDensity > textLineThreshold || transitionDensity > 0.1) && lineLength > minLineLength;

      if (hasTextPattern) {
        textLineCount++;
        textRows.push(y);
      }
    }

    // RELAXED: Require at least 2 text lines (was 3)
    // Also check if text rows are distributed (not all clustered)
    const hasDistributedText =
      textRows.length >= 2 &&
      (textRows.length === 0 || textRows[textRows.length - 1] - textRows[0] > height * 0.2); // Text spans at least 20% of height

    const hasText = textLineCount >= 2 || hasDistributedText;

    logger.info('Text pattern detection completed', {
      component: 'local-id-verification',
      action: 'text_detection_complete',
      metadata: {
        textLineCount,
        hasText,
        imageWidth: width,
        imageHeight: height,
        textRowsCount: textRows.length,
      },
    });

    return { hasText, textLineCount };
  } catch (error) {
    logger.warn('Text pattern detection failed', {
      component: 'local-id-verification',
      action: 'text_detection_failed',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return { hasText: false, textLineCount: 0 };
  }
}

async function analyzeRemoteImage(
  serviceClient: ServiceClient,
  path: string,
  context: 'documentFront' | 'selfie'
): Promise<ImageAnalysis> {
  const { data, error } = await serviceClient.storage
    .from('idkit-intake')
    .createSignedUrl(path, 120);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'unable_to_sign_url');
  }

  const response = await fetch(data.signedUrl);
  if (!response.ok) {
    throw new Error(`fetch_failed_${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  const stats = await computeImageStats(buffer, context);

  let face: FaceMetrics | undefined;
  if (context === 'documentFront' || context === 'selfie') {
    face = await detectFace(buffer);
  }

  // CRITICAL: Detect text patterns - license cards have text, selfies don't
  let textPatterns: { hasText: boolean; textLineCount: number } | undefined;
  if (context === 'documentFront') {
    textPatterns = await detectTextPatterns(buffer);
  }

  // NOTE: Barcode detection removed - barcodes are typically on the back of licenses
  // We use document structure analysis and text detection instead to verify license authenticity
  return { stats, face, barcode: null, textPatterns };
}

const extractBoxDimensions = (
  face: {
    box?: unknown;
    boxRaw?: unknown;
    boxSize?: unknown;
    mesh?: unknown;
  },
  imageWidth: number,
  imageHeight: number
): number | null => {
  const normaliseDimensions = (width: number, height: number) => {
    const widthPx = width <= 1 ? width * imageWidth : width;
    const heightPx = height <= 1 ? height * imageHeight : height;
    if (widthPx <= 0 || heightPx <= 0) return null;
    return (widthPx * heightPx) / (imageWidth * imageHeight);
  };

  const parseBoxCandidate = (candidate: unknown): number | null => {
    if (!candidate) return null;
    if (Array.isArray(candidate)) {
      if (candidate.length >= 4) {
        const [_x, _y, width, height] = candidate;
        if (typeof width === 'number' && typeof height === 'number') {
          return normaliseDimensions(Math.abs(width), Math.abs(height));
        }
        if (
          candidate.length >= 2 &&
          typeof candidate[0] === 'number' &&
          typeof candidate[1] === 'number'
        ) {
          const widthCandidate = Math.abs(candidate[1] - candidate[0]);
          const heightCandidate =
            candidate.length >= 3 && typeof candidate[2] === 'number' ? Math.abs(candidate[2]) : 0;
          if (widthCandidate > 0 && heightCandidate > 0) {
            return normaliseDimensions(widthCandidate, heightCandidate);
          }
        }
      }
      return null;
    }

    if (typeof candidate === 'object') {
      const boxObject = candidate as Record<string, unknown>;
      const width =
        typeof boxObject.width === 'number'
          ? boxObject.width
          : Array.isArray(boxObject.endPoint) && Array.isArray(boxObject.startPoint)
            ? Math.abs(Number(boxObject.endPoint[0]) - Number(boxObject.startPoint[0]))
            : undefined;
      const height =
        typeof boxObject.height === 'number'
          ? boxObject.height
          : Array.isArray(boxObject.endPoint) && Array.isArray(boxObject.startPoint)
            ? Math.abs(Number(boxObject.endPoint[1]) - Number(boxObject.startPoint[1]))
            : undefined;
      if (typeof width === 'number' && typeof height === 'number') {
        return normaliseDimensions(Math.abs(width), Math.abs(height));
      }
    }
    return null;
  };

  const candidates = [face.box, face.boxRaw, face.boxSize];
  for (const candidate of candidates) {
    const area = parseBoxCandidate(candidate);
    if (area !== null) {
      return area;
    }
  }

  const mesh = face.mesh;
  if (Array.isArray(mesh) && mesh.length > 0) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let found = false;

    for (const point of mesh) {
      let x: number | null = null;
      let y: number | null = null;
      if (Array.isArray(point)) {
        [x, y] = point as [number, number];
      } else if (point && typeof point === 'object') {
        const px = (point as Record<string, unknown>).x;
        const py = (point as Record<string, unknown>).y;
        if (typeof px === 'number' && typeof py === 'number') {
          x = px;
          y = py;
        }
      }
      if (typeof x === 'number' && typeof y === 'number') {
        found = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (found && isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
      const width = Math.max(0, maxX - minX);
      const height = Math.max(0, maxY - minY);
      if (width > 0 && height > 0) {
        return normaliseDimensions(width, height);
      }
    }
  }

  return null;
};

async function detectFace(buffer: Buffer): Promise<FaceMetrics | undefined> {
  try {
    const [human, tf] = await Promise.all([ensureHumanReady(), loadTfModule()]);
    const tensor = tf.node.decodeImage(buffer, 3);
    const [tensorHeight, tensorWidth] = tensor.shape;
    const result = await human.detect(tensor as unknown as Tensor3D);
    tensor.dispose();
    const face = result.face?.[0];

    if (!face) {
      return { detected: false, confidence: 0 };
    }

    return {
      detected: true,
      confidence: face.score ?? face.boxScore ?? face.faceScore ?? 0,
      descriptor: face.embedding ? Array.from(face.embedding) : undefined,
      yaw: face.rotation?.angle?.yaw ?? null,
      pitch: face.rotation?.angle?.pitch ?? null,
      roll: face.rotation?.angle?.roll ?? null,
      boxAreaRatio:
        typeof tensorWidth === 'number' && typeof tensorHeight === 'number'
          ? extractBoxDimensions(face, tensorWidth, tensorHeight)
          : null,
    };
  } catch (error) {
    logger.warn('Face detection failed', {
      component: 'local-id-verification',
      action: 'face_detection_failed',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return { detected: false, confidence: 0 };
  }
}

async function decodeBarcode(buffer: Buffer): Promise<ImageAnalysis['barcode']> {
  let attempts = 0;
  const attemptErrors: string[] = [];
  try {
    const sharp = await loadSharpModule();
    const oriented = sharp(buffer).rotate();
    const baseTransforms: SharpTransform[] = [
      (img) => img,
      (img) => img.linear(1.1, -12),
      (img) => img.linear(0.9, 10),
      (img) => img.linear(1.2, -18).sharpen(),
      (img) => img.linear(1.35, -28).sharpen(),
      (img) => img.normalise(),
      (img) => img.gamma(1.05),
      (img) => img.threshold(160),
      (img) => img.median(3),
      (img) => img.sharpen({ sigma: 1 }),
      (img) => img.modulate({ brightness: 1.1, saturation: 0.9 }).linear(1.45, -30),
      (img) => img.greyscale().blur(0.6).linear(2.2, -140),
      (img) => img.greyscale().linear(1.8, -60).threshold(140),
    ];

    const scaleFactors = [1, 1.5, 2, 2.5, 3, 4, 5, 6];
    for (const factor of scaleFactors) {
      baseTransforms.push((img, meta) => {
        if (!meta.width || !meta.height) {
          return img.greyscale();
        }
        const width = Math.max(32, Math.round(meta.width * factor));
        const height = Math.max(32, Math.round(meta.height * factor));
        return img
          .greyscale()
          .resize({ width, height, kernel: factor >= 2 ? 'lanczos3' : 'cubic' })
          .sharpen({ sigma: factor >= 2 ? 1.2 : 0.8 });
      });
    }

    const regionExtractors: SharpTransform[] = [
      (img) => img,
      (img, meta) => {
        if (!meta.width || !meta.height) return img;
        const marginX = Math.max(0, Math.floor(meta.width * 0.05));
        const marginY = Math.max(0, Math.floor(meta.height * 0.05));
        return img.extract({
          left: marginX,
          top: marginY,
          width: Math.max(16, meta.width - marginX * 2),
          height: Math.max(16, meta.height - marginY * 2),
        });
      },
      (img, meta) => {
        if (!meta.width || !meta.height) return img;
        const bandHeight = Math.max(24, Math.floor(meta.height * 0.45));
        return img.extract({
          left: 0,
          top: Math.max(0, meta.height - bandHeight),
          width: meta.width,
          height: bandHeight,
        });
      },
      (img, meta) => {
        if (!meta.width || !meta.height) return img;
        const bandHeight = Math.max(24, Math.floor(meta.height * 0.6));
        const top = Math.max(0, Math.floor((meta.height - bandHeight) / 2));
        return img.extract({
          left: 0,
          top,
          width: meta.width,
          height: bandHeight,
        });
      },
      (img, meta) => {
        if (!meta.width || !meta.height) return img;
        const width = Math.max(24, Math.floor(meta.width * 0.7));
        const height = Math.max(24, Math.floor(meta.height * 0.6));
        return img.extract({
          left: Math.max(0, meta.width - width),
          top: Math.max(0, meta.height - height),
          width,
          height,
        });
      },
      (img, meta) => {
        if (!meta.width || !meta.height) return img;
        const width = Math.max(24, Math.floor(meta.width * 0.8));
        const left = Math.max(0, Math.floor((meta.width - width) / 2));
        const height = Math.max(24, Math.floor(meta.height * 0.4));
        const top = Math.max(0, meta.height - height - Math.floor(meta.height * 0.05));
        return img.extract({
          left,
          top,
          width,
          height,
        });
      },
    ];

    const coarseAngles = [0, 90, 180, 270];
    const fineOffsets = [0, -12, 12, -8, 8, -5, 5, -2, 2];
    const rotationAngles = Array.from(
      new Set(coarseAngles.flatMap((base) => fineOffsets.map((offset) => base + offset)))
    );
    const rotationBackground = { r: 255, g: 255, b: 255, alpha: 1 } as const;
    const hintSets = BARCODE_FORMAT_SETS.map((formats) => {
      const hints = new Map<DecodeHintType, unknown>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      hints.set(DecodeHintType.TRY_HARDER, true);
      return hints;
    });
    const binarizers = [HybridBinarizer, GlobalHistogramBinarizer];

    const MAX_DECODE_ATTEMPTS = 220;

    class AttemptLimitError extends Error {
      constructor(message = 'barcode_attempt_limit') {
        super(message);
      }
    }

    const attemptDecode = (
      sources: Array<RGBLuminanceSource | InvertedLuminanceSource>
    ): ImageAnalysis['barcode'] => {
      for (const SourceBinarizer of binarizers) {
        for (const source of sources) {
          for (const hints of hintSets) {
            if (attempts >= MAX_DECODE_ATTEMPTS) {
              throw new AttemptLimitError();
            }
            const reader = new MultiFormatReader();
            reader.setHints(hints);
            attempts += 1;
            try {
              const result = reader.decode(new BinaryBitmap(new SourceBinarizer(source)));
              return {
                text: result.getText(),
                format: result.getBarcodeFormat().toString(),
              };
            } catch (error) {
              if (!(error instanceof NotFoundException)) {
                attemptErrors.push(error instanceof Error ? error.message : String(error));
              }
            } finally {
              reader.reset();
            }
          }
        }
      }
      return null;
    };

    const computeRoiFromGradients = (
      grayscale: Float64Array,
      width: number,
      height: number
    ): { left: number; top: number; width: number; height: number } | null => {
      if (width < 32 || height < 32) {
        return null;
      }

      const rowScores = new Float64Array(height);
      const columnScores = new Float64Array(width);

      for (let y = 0; y < height; y += 1) {
        let rowSum = 0;
        for (let x = 0; x < width - 1; x += 1) {
          const idx = y * width + x;
          const grad = Math.abs(grayscale[idx + 1] - grayscale[idx]);
          rowSum += grad;
          columnScores[x] += grad;
        }
        rowScores[y] = rowSum / Math.max(1, width - 1);
      }

      columnScores[width - 1] = columnScores[width - 2] ?? columnScores[width - 1];

      const computeBounds = (
        scores: Float64Array,
        length: number,
        padding: number,
        fallbackStart: number,
        fallbackEnd: number,
        minSpan: number
      ) => {
        const mean = scores.reduce((acc, val) => acc + val, 0) / length;
        const variance = scores.reduce((acc, val) => acc + (val - mean) * (val - mean), 0) / length;
        const std = Math.sqrt(variance);
        const threshold = std > 0 ? mean + std * 0.75 : mean;
        const indices: number[] = [];
        for (let i = 0; i < length; i += 1) {
          if (scores[i] >= threshold) {
            indices.push(i);
          }
        }

        if (indices.length === 0) {
          return {
            start: fallbackStart,
            end: fallbackEnd,
          };
        }

        const start = Math.max(0, Math.min(...indices) - padding);
        const end = Math.min(length - 1, Math.max(...indices) + padding);

        if (end - start + 1 < minSpan) {
          return {
            start: fallbackStart,
            end: fallbackEnd,
          };
        }

        return { start, end };
      };

      const rowBounds = computeBounds(
        rowScores,
        height,
        Math.max(2, Math.floor(height * 0.02)),
        Math.max(0, Math.floor(height * 0.45)),
        height - 1,
        Math.max(12, Math.floor(height * 0.15))
      );
      const columnBounds = computeBounds(
        columnScores,
        width,
        Math.max(2, Math.floor(width * 0.02)),
        Math.max(0, Math.floor(width * 0.1)),
        Math.min(width - 1, Math.floor(width * 0.9)),
        Math.max(16, Math.floor(width * 0.2))
      );

      const roiWidth = columnBounds.end - columnBounds.start + 1;
      const roiHeight = rowBounds.end - rowBounds.start + 1;

      if (roiWidth < 24 || roiHeight < 24) {
        return null;
      }

      if (roiWidth >= width && roiHeight >= height) {
        return null;
      }

      return {
        left: columnBounds.start,
        top: rowBounds.start,
        width: roiWidth,
        height: roiHeight,
      };
    };

    for (const angle of rotationAngles) {
      const rotated = oriented.clone().rotate(angle, { background: rotationBackground });
      const rotatedMeta = await rotated.metadata();

      for (const transform of baseTransforms) {
        let base: SharpInstance;
        try {
          base = transform(rotated.clone(), rotatedMeta);
        } catch {
          continue;
        }
        const baseMeta = await base.metadata();

        for (const region of regionExtractors) {
          let regionImage: SharpInstance;
          try {
            regionImage = region(base.clone(), baseMeta);
          } catch {
            continue;
          }

          const processed = regionImage.toColourspace('rgb').ensureAlpha();
          const regionBuffer = await processed
            .raw()
            .toBuffer({ resolveWithObject: true })
            .catch(() => null);

          if (!regionBuffer) {
            continue;
          }

          const { data, info } = regionBuffer;

          if (!info?.width || !info?.height || !info?.channels) {
            continue;
          }

          if (info.width < 16 || info.height < 16) {
            continue;
          }

          const pixelCount = info.width * info.height;
          const pixels = new Int32Array(pixelCount);
          const grayscale = new Float64Array(pixelCount);
          const channels = info.channels;

          for (let i = 0; i < pixelCount; i += 1) {
            const baseIndex = i * channels;
            const r = data[baseIndex];
            const g = channels >= 2 ? data[baseIndex + 1] : data[baseIndex];
            const b = channels >= 3 ? data[baseIndex + 2] : data[baseIndex];
            pixels[i] = (255 << 24) | (r << 16) | (g << 8) | b;
            grayscale[i] = 0.299 * r + 0.587 * g + 0.114 * b;
          }

          const baseSource = new RGBLuminanceSource(pixels, info.width, info.height);
          const baseResult = attemptDecode([baseSource, new InvertedLuminanceSource(baseSource)]);
          if (baseResult) {
            return baseResult;
          }

          let grayscaleStdDev = 0;
          if (pixelCount > 1) {
            let graySum = 0;
            for (let i = 0; i < pixelCount; i += 1) {
              graySum += grayscale[i];
            }
            const grayMean = graySum / pixelCount;
            let variance = 0;
            for (let i = 0; i < pixelCount; i += 1) {
              const diff = grayscale[i] - grayMean;
              variance += diff * diff;
            }
            grayscaleStdDev = Math.sqrt(variance / (pixelCount - 1));
          }

          if (grayscaleStdDev < 2.5) {
            continue;
          }

          const roi = computeRoiFromGradients(grayscale, info.width, info.height);
          if (roi) {
            const roiPixels = new Int32Array(roi.width * roi.height);
            const roiGrayscale = new Float64Array(roi.width * roi.height);
            for (let y = 0; y < roi.height; y += 1) {
              for (let x = 0; x < roi.width; x += 1) {
                const sourceIndex = ((roi.top + y) * info.width + (roi.left + x)) * channels;
                const destIndex = y * roi.width + x;
                const r = data[sourceIndex];
                const g = channels >= 2 ? data[sourceIndex + 1] : data[sourceIndex];
                const b = channels >= 3 ? data[sourceIndex + 2] : data[sourceIndex];
                roiPixels[destIndex] = (255 << 24) | (r << 16) | (g << 8) | b;
                roiGrayscale[destIndex] = grayscale[(roi.top + y) * info.width + (roi.left + x)];
              }
            }

            const roiSource = new RGBLuminanceSource(roiPixels, roi.width, roi.height);
            const roiResult = attemptDecode([roiSource, new InvertedLuminanceSource(roiSource)]);

            if (roiResult) {
              return roiResult;
            }

            let roiMean = 0;
            for (let i = 0; i < roiGrayscale.length; i += 1) {
              roiMean += roiGrayscale[i];
            }
            roiMean /= Math.max(1, roiGrayscale.length);

            let roiVariance = 0;
            for (let i = 0; i < roiGrayscale.length; i += 1) {
              const diff = roiGrayscale[i] - roiMean;
              roiVariance += diff * diff;
            }
            const roiStd = Math.sqrt(roiVariance / Math.max(roiGrayscale.length - 1, 1));

            if (roiStd < 2) {
              continue;
            }

            const roiBinaryPixels = new Int32Array(roi.width * roi.height);
            for (let i = 0; i < roiGrayscale.length; i += 1) {
              const value = roiGrayscale[i] > roiMean ? 255 : 0;
              roiBinaryPixels[i] = (255 << 24) | (value << 16) | (value << 8) | value;
            }
            const roiBinarySource = new RGBLuminanceSource(roiBinaryPixels, roi.width, roi.height);
            const roiBinaryResult = attemptDecode([
              roiBinarySource,
              new InvertedLuminanceSource(roiBinarySource),
            ]);

            if (roiBinaryResult) {
              return roiBinaryResult;
            }
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof AttemptLimitError) {
      logger.debug('Barcode decode attempt limit reached', {
        component: 'local-id-verification',
        action: 'barcode_decode_limit',
        metadata: {
          attempts,
        },
      });
      return null;
    }

    logger.debug('Barcode decode attempt failed', {
      component: 'local-id-verification',
      action: 'barcode_decode_failed',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        attempts,
      },
    });
    return null;
  }

  if (attempts > 0) {
    logger.debug('Barcode decode exhausted without matches', {
      component: 'local-id-verification',
      action: 'barcode_decode_exhausted',
      metadata: {
        attempts,
        errorSamples: attemptErrors.slice(0, 3),
      },
    });
  }

  return null;
}

export const __testables = {
  decodeBarcode,
};

async function computeImageStats(
  buffer: Buffer,
  context?: 'documentFront' | 'selfie'
): Promise<ImageStats> {
  const sharp = await loadSharpModule();
  const { data, info } = await sharp(buffer)
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  if (!width || !height || !channels) {
    throw new Error('invalid_image_dimensions');
  }

  // Optimize sampling: use larger step for document structure analysis to avoid performance issues
  const sampleStep = context === 'documentFront' ? 4 : 2; // Larger step for documents (faster, reduces processing time)
  let brightnessTotal = 0;
  let edgeTotal = 0;
  let edgeSamples = 0;
  let skinPixels = 0;
  let totalSamples = 0;

  const getRgb = (x: number, y: number): [number, number, number] => {
    const idx = (y * width + x) * channels;
    const r = data[idx];
    const g = channels > 1 ? data[idx + 1] : data[idx];
    const b = channels > 2 ? data[idx + 2] : data[idx];
    return [r, g, b];
  };

  const getGray = (x: number, y: number): number => {
    const [r, g, b] = getRgb(x, y);
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  const isLikelySkin = (r: number, g: number, b: number) => {
    const sum = r + g + b;
    if (sum === 0) return false;
    const normalizedR = r / sum;
    const normalizedG = g / sum;
    const normalizedB = b / sum;
    if (normalizedR < 0.32 || normalizedR > 0.62) return false;
    if (normalizedG < 0.23 || normalizedG > 0.46) return false;
    if (normalizedB < 0.13 || normalizedB > 0.38) return false;

    const cb = 128 - 0.168736 * r - 0.331364 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    return cb > 77 && cb < 127 && cr > 133 && cr < 173;
  };

  let horizontalEdgeCount = 0;
  let diagonalEdgeCount = 0;
  let totalEdgeCount = 0;

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const [r, g, b] = getRgb(x, y);
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      brightnessTotal += gray / 255;
      totalSamples += 1;

      if (isLikelySkin(r, g, b)) {
        skinPixels += 1;
      }

      if (x > 0 && y > 0 && x < width - 1 && y < height - 1) {
        const gx = getGray(x + 1, y) - getGray(x - 1, y);
        const gy = getGray(x, y + 1) - getGray(x, y - 1);
        const edgeMagnitude = Math.sqrt(gx * gx + gy * gy);
        edgeTotal += gx * gx + gy * gy;
        edgeSamples += 1;

        // Analyze edge direction for document structure detection (only for documents)
        // Use higher threshold to reduce noise and improve performance
        if (context === 'documentFront' && edgeMagnitude > 15) {
          // Threshold to consider it a significant edge (higher = fewer false positives)
          totalEdgeCount += 1;
          const absGx = Math.abs(gx);
          const absGy = Math.abs(gy);

          // Classify edge direction: horizontal (text lines) or diagonal/vertical
          if (absGx > absGy * 1.5) {
            horizontalEdgeCount += 1; // Horizontal edge (text line)
          } else {
            diagonalEdgeCount += 1; // Diagonal/vertical edge (less common in documents)
          }
        }
      }
    }
  }

  const sampleCount = Math.max(totalSamples, 1);
  const averageBrightness = brightnessTotal / sampleCount;
  const edgeStrength = edgeSamples > 0 ? edgeTotal / edgeSamples : 0;
  const skinPixelRatio = skinPixels / sampleCount;

  // Calculate document structure metrics
  // Licenses have many horizontal edges (text lines) and structured layout
  const horizontalEdgeRatio = totalEdgeCount > 0 ? horizontalEdgeCount / totalEdgeCount : 0;

  // Document structure score: higher for structured layouts (more horizontal/vertical, less diagonal)
  // STRICT: Cards have structured text (20-70% horizontal edges), selfies have different patterns
  const documentStructureScore =
    totalEdgeCount > 50 // Need sufficient edges to analyze structure
      ? clamp01(
          (horizontalEdgeRatio >= 0.2 && horizontalEdgeRatio <= 0.7 ? 1 : 0.4) * // Cards have structured text
            (diagonalEdgeCount / Math.max(totalEdgeCount, 1) < 0.35 ? 1 : 0.6) // Cards have fewer diagonal edges
        )
      : 0.2; // Low score if not enough edges (likely not a card)

  return {
    width,
    height,
    averageBrightness,
    edgeStrength,
    skinPixelRatio,
    horizontalEdgeRatio,
    documentStructureScore,
  };
}
