import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NextRequest } from 'next/server';

import { POST } from '../id-verification/submit/route';

vi.mock('@zxing/library', () => {
  const decodeMock = vi.fn(() => ({
    getText: () => 'PDF417DATA',
    getBarcodeFormat: () => ({ toString: () => 'PDF_417' }),
  }));

  return {
    BinaryBitmap: vi.fn(),
    DecodeHintType: { POSSIBLE_FORMATS: 'POSSIBLE_FORMATS' },
    HybridBinarizer: vi.fn(),
    PDF417Reader: vi.fn().mockImplementation(() => ({
      decode: decodeMock,
    })),
    RGBLuminanceSource: vi.fn(),
    BarcodeFormat: { PDF_417: 'PDF_417' },
  };
});

vi.mock('@vladmandic/human', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      load: vi.fn(),
      warmup: vi.fn(),
      detect: vi.fn(async () => ({
        face: [
          {
            score: 0.95,
            embedding: new Float32Array(512).fill(0.9),
            rotation: { angle: { yaw: 0.1, pitch: 0.05, roll: 0.02 } },
          },
        ],
      })),
    })),
  };
});

const mockTensor = vi.hoisted(() => ({ dispose: vi.fn() }));
vi.mock('@tensorflow/tfjs-node', () => ({
  node: {
    decodeImage: vi.fn(() => mockTensor),
  },
}));

const RATE_LIMIT_HEADERS = new Headers();

const userId = 'user-123';
const bookingId = '00000000-0000-4000-8000-000000000789';

const supabaseMock = vi.hoisted(() => ({
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
  functions: {
    invoke: vi.fn(),
  },
}));

const rateLimit = vi.hoisted(() => vi.fn());
const triggerCompletionCheck = vi.hoisted(() => vi.fn());
const runLocalIdVerification = vi.hoisted(() => vi.fn());

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/rate-limiter', () => ({
  rateLimit,
  RateLimitPresets: {
    STRICT: {},
  },
}));

vi.mock('@/lib/trigger-completion-check', () => ({
  triggerCompletionCheck,
}));

vi.mock('@/lib/id-verification/local-processor', () => ({
  runLocalIdVerification,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => supabaseMock),
}));

const bookingRecord = {
  id: bookingId,
  customerId: userId,
  status: 'pending',
};

const buildSupabaseFromMock = () => {
  const counters = {
    idRequests: 0,
    idAudits: 0,
  };

  supabaseMock.from.mockImplementation((table: string) => {
    if (table === 'bookings') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: bookingRecord, error: null }),
      };
    }

    if (table === 'id_verification_requests') {
      counters.idRequests += 1;
      if (counters.idRequests === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { attempt_number: 1 }, error: null }),
        };
      }

      if (counters.idRequests === 2) {
        const singleMock = vi.fn().mockResolvedValue({ data: { id: 'req-1' }, error: null });
        const selectMock = vi.fn().mockReturnValue({ single: singleMock });
        const insertMock = vi.fn().mockReturnValue({ select: selectMock });
        return {
          insert: insertMock,
        };
      }

      if (counters.idRequests === 3) {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };
      }
    }

    if (table === 'id_verification_audits') {
      counters.idAudits += 1;
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }

    throw new Error(`Unexpected table access in test: ${table}`);
  });
};

describe('API Route: /api/id-verification/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    rateLimit.mockResolvedValue({ success: true, headers: RATE_LIMIT_HEADERS });
    triggerCompletionCheck.mockResolvedValue(undefined);
    runLocalIdVerification.mockResolvedValue({
      status: 'approved',
      failureReasons: [],
      scores: {
        faceMatchScore: 0.92,
        documentSharpnessScore: 0.88,
        selfieSharpnessScore: 0.85,
      },
      stats: {},
    });

    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
    supabaseMock.functions.invoke.mockResolvedValue({
      data: null,
      error: new Error('idkit unavailable'),
    });

    buildSupabaseFromMock();
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';
  });

  afterEach(() => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('approves verification via local automation when IDKit is unavailable', async () => {
    const documentAnalysis = {
      width: 1200,
      height: 800,
      aspectRatio: 1.5,
      brightness: 0.45,
      sharpness: 1.6,
      hash: '1010101010101010',
    };

    const selfieAnalysis = {
      width: 900,
      height: 900,
      aspectRatio: 1,
      brightness: 0.5,
      sharpness: 1.2,
      hash: '0101010101010101',
    };

    const payload = {
      bookingId,
      documentPath: `${userId}/${bookingId}/documentFront.jpg`,
      selfiePath: `${userId}/${bookingId}/selfie.jpg`,
      consentMethod: 'digital_consent',
      consentRecordedAt: new Date().toISOString(),
      analysis: {
        documentFront: documentAnalysis,
        selfie: selfieAnalysis,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/id-verification/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('approved');
    expect(data.automation.status).toBe('approved');
    expect(runLocalIdVerification).toHaveBeenCalledWith({
      requestId: 'req-1',
      bookingId,
      userId,
      documentPath: payload.documentPath,
      selfiePath: payload.selfiePath,
    });
  });
});
