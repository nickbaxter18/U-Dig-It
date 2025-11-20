/**
 * MSW (Mock Service Worker) Request Handlers
 *
 * Define mock API responses for testing without hitting real endpoints.
 * Supports both REST and GraphQL APIs.
 *
 * @see https://mswjs.io/docs/
 */
import { HttpResponse, http } from 'msw';

// Base URLs for different services
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const API_BASE = '/api';

/**
 * Mock Handlers for Supabase API
 */
export const supabaseHandlers = [
  // Mock equipment list
  http.get(`${SUPABASE_URL}/rest/v1/equipment`, () => {
    return HttpResponse.json([
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Kubota SVL-75',
        category: 'compact-track-loader',
        dailyRate: 250,
        weeklyRate: 1500,
        monthlyRate: 5000,
        status: 'available',
        specifications: {
          operating_weight: '8,157 lbs',
          rated_operating_capacity: '2,590 lbs',
          bucket_capacity: '0.26 yd³',
        },
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Mini Excavator',
        category: 'excavator',
        dailyRate: 200,
        weeklyRate: 1200,
        monthlyRate: 4000,
        status: 'available',
        specifications: {},
      },
    ]);
  }),

  // Mock single equipment
  http.get(`${SUPABASE_URL}/rest/v1/equipment`, ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id === 'eq.123e4567-e89b-12d3-a456-426614174000') {
      return HttpResponse.json([
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Kubota SVL-75',
          category: 'compact-track-loader',
          dailyRate: 250,
          status: 'available',
        },
      ]);
    }

    return HttpResponse.json([]);
  }),

  // Mock bookings list
  http.get(`${SUPABASE_URL}/rest/v1/bookings`, () => {
    return HttpResponse.json([
      {
        id: '223e4567-e89b-12d3-a456-426614174000',
        bookingNumber: 'BK-2025-001',
        customerId: 'user-123',
        equipmentId: '123e4567-e89b-12d3-a456-426614174000',
        startDate: '2025-11-20',
        endDate: '2025-11-25',
        status: 'confirmed',
        totalAmount: 1250,
        createdAt: '2025-11-17T12:00:00Z',
      },
    ]);
  }),

  // Mock booking creation
  http.post(`${SUPABASE_URL}/rest/v1/bookings`, async () => {
    return HttpResponse.json(
      {
        id: '223e4567-e89b-12d3-a456-426614174000',
        bookingNumber: 'BK-2025-001',
        status: 'pending',
      },
      { status: 201 }
    );
  }),

  // Mock auth user
  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        firstName: 'Test',
        lastName: 'User',
      },
    });
  }),
];

/**
 * Mock Handlers for Internal API Routes
 */
export const apiHandlers = [
  // Mock Stripe payment intent creation
  http.post(`${API_BASE}/stripe/payment-intent`, async () => {
    return HttpResponse.json({
      clientSecret: 'pi_test_secret_123',
      paymentIntentId: 'pi_123456789',
    });
  }),

  // Mock Stripe webhook
  http.post(`${API_BASE}/webhooks/stripe`, async ({ request }) => {
    const _body = await request.json(); // Unused - kept for future validation
    return HttpResponse.json({ received: true });
  }),

  // Mock booking availability check
  http.post(`${API_BASE}/bookings/check-availability`, async ({ request }) => {
    const _body = await request.json(); // Unused - kept for future validation
    return HttpResponse.json({
      available: true,
      conflicts: [],
    });
  }),

  // Mock SendGrid email
  http.post(`${API_BASE}/emails/send`, async () => {
    return HttpResponse.json({
      success: true,
      messageId: 'msg_123',
    });
  }),

  // Mock analytics export
  http.get(`${API_BASE}/admin/analytics/export`, () => {
    return HttpResponse.json({
      revenue: {
        total: 50000,
        byMonth: [
          { month: '2025-11', revenue: 15000 },
          { month: '2025-10', revenue: 18000 },
        ],
      },
      bookings: {
        total: 120,
        completed: 100,
        cancelled: 20,
      },
    });
  }),
];

/**
 * Error Handlers for Testing Error States
 */
export const errorHandlers = [
  // Simulate API error
  http.get(`${SUPABASE_URL}/rest/v1/equipment-error`, () => {
    return HttpResponse.json(
      { error: 'Internal Server Error', message: 'Database connection failed' },
      { status: 500 }
    );
  }),

  // Simulate unauthorized
  http.get(`${SUPABASE_URL}/rest/v1/bookings-unauthorized`, () => {
    return HttpResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in' },
      { status: 401 }
    );
  }),

  // Simulate rate limit
  http.post(`${API_BASE}/bookings-rate-limit`, () => {
    return HttpResponse.json(
      { error: 'Too Many Requests', message: 'Rate limit exceeded' },
      { status: 429 }
    );
  }),
];

/**
 * All handlers combined
 */
export const handlers = [...supabaseHandlers, ...apiHandlers, ...errorHandlers];
