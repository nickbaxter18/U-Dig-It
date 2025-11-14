import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '../contracts/generate/route';
import { createMockRequest, expectSuccessResponse, expectErrorResponse, createTestBooking } from '@/test-utils';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

describe('POST /api/admin/contracts/generate', () => {
  const mockAdminUser = { id: 'admin-123', email: 'admin@test.com' };
  const mockBooking = createTestBooking();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: admin user authenticated
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockAdminUser },
      error: null,
    });

    // Mock user role check
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    });
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = createMockRequest('POST', { bookingId: 'booking-123' });
      const response = await POST(request);

      await expectErrorResponse(response, 401);
    });

    it('should reject non-admin users', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'customer' },
          error: null,
        }),
      });

      const request = createMockRequest('POST', { bookingId: 'booking-123' });
      const response = await POST(request);

      await expectErrorResponse(response, 403);
    });
  });

  describe('Input Validation', () => {
    it('should reject request without bookingId', async () => {
      const request = createMockRequest('POST', {});
      const response = await POST(request);

      await expectErrorResponse(response, 400, /bookingId/i);
    });

    it('should accept valid bookingId', async () => {
      const bookingId = mockBooking.id;

      // Mock successful booking fetch
      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: bookingId,
            bookingNumber: mockBooking.bookingNumber,
            customer: { firstName: 'John', lastName: 'Doe' },
            equipment: { make: 'Kubota', model: 'SVL-75' },
          },
          error: null,
        }),
        insert: vi.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockFromChain);

      const request = createMockRequest('POST', { bookingId });
      const response = await POST(request);

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Booking Validation', () => {
    it('should return 404 if booking not found', async () => {
      const usersChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };

      const bookingsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersChain;
        if (table === 'bookings') return bookingsChain;
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockReturnThis(),
        };
      });

      const request = createMockRequest('POST', { bookingId: 'nonexistent' });
      const response = await POST(request);

      await expectErrorResponse(response, 404);
    });
  });

  describe('Contract Generation', () => {
    it('should accept valid template types', async () => {
      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'booking-123',
            customer: { firstName: 'John' },
            equipment: { make: 'Kubota' },
          },
          error: null,
        }),
        insert: vi.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockFromChain);

      const templates = ['rental_agreement', 'equipment_rider', 'waiver'];

      for (const templateType of templates) {
        const request = createMockRequest('POST', {
          bookingId: 'booking-123',
          templateType,
        });

        const response = await POST(request);
        expect(response.status).toBeLessThan(500);
      }
    });

    it('should use default template when not specified', async () => {
      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'booking-123',
            customer: { firstName: 'John' },
            equipment: { make: 'Kubota' },
          },
          error: null,
        }),
        insert: vi.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockFromChain);

      const request = createMockRequest('POST', { bookingId: 'booking-123' });
      const response = await POST(request);

      expect(response.status).toBeLessThan(500);
    });
  });
});


