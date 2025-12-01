import { createMockRequest, expectErrorResponse, expectSuccessResponse } from '@/test-utils';
import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH } from '../customers/[id]/route';

const { mockRequireAdmin, mockSupabase, mockCreateServiceClient } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockSupabase: {
    from: vi.fn(),
  },
  mockCreateServiceClient: vi.fn(),
}));

vi.mock('@/lib/supabase/requireAdmin', () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: mockCreateServiceClient,
}));

describe('PATCH /api/admin/customers/[id]', () => {
  const mockAdminUser = { id: 'admin-123', email: 'admin@test.com' };
  const mockCustomerId = 'customer-123';
  const mockUpdatedCustomer = {
    id: mockCustomerId,
    email: 'customer@test.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-1234',
    companyName: 'Test Company',
    address: '123 Main St',
    city: 'Saint John',
    province: 'NB',
    postalCode: 'E2K 1A1',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: admin user authenticated
    mockRequireAdmin.mockResolvedValue({
      supabase: mockSupabase,
      user: mockAdminUser,
      role: 'admin',
    });

    // Mock service client
    const mockServiceClient = {
      from: vi.fn(),
    };
    mockCreateServiceClient.mockResolvedValue(mockServiceClient);

    // Mock successful update
    mockServiceClient.from.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockUpdatedCustomer,
        error: null,
      }),
    });
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      const unauthorized = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      mockRequireAdmin.mockResolvedValueOnce({
        supabase: mockSupabase,
        error: unauthorized,
      });

      const request = createMockRequest('PATCH', { firstName: 'John' }, {
        url: `http://localhost:3000/api/admin/customers/${mockCustomerId}`,
      });
      const response = await PATCH(request, { params: { id: mockCustomerId } });

      expect(response.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      const forbidden = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      mockRequireAdmin.mockResolvedValueOnce({
        supabase: mockSupabase,
        error: forbidden,
      });

      const request = createMockRequest('PATCH', { firstName: 'John' }, {
        url: `http://localhost:3000/api/admin/customers/${mockCustomerId}`,
      });
      const response = await PATCH(request, { params: { id: mockCustomerId } });

      expect(response.status).toBe(403);
    });
  });

  describe('Input Validation', () => {
    it('should reject empty update payload', async () => {
      const request = createMockRequest('PATCH', {}, {
        url: `http://localhost:3000/api/admin/customers/${mockCustomerId}`,
      });
      const response = await PATCH(request, { params: { id: mockCustomerId } });

      await expectErrorResponse(response, 400);
    });

    it('should accept valid customer fields', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '555-5678',
        companyName: 'New Company',
        address: '456 Oak Ave',
        city: 'Moncton',
        province: 'NB',
        postalCode: 'E1C 1A1',
      };

      const request = createMockRequest('PATCH', updateData, {
        url: `http://localhost:3000/api/admin/customers/${mockCustomerId}`,
      });
      const response = await PATCH(request, { params: { id: mockCustomerId } });

      const data = await expectSuccessResponse(response);
      expect(data.data).toBeDefined();
    });

    it('should accept partial updates', async () => {
      const updateData = {
        firstName: 'Jane',
      };

      const request = createMockRequest('PATCH', updateData, {
        url: `http://localhost:3000/api/admin/customers/${mockCustomerId}`,
      });
      const response = await PATCH(request, { params: { id: mockCustomerId } });

      const data = await expectSuccessResponse(response);
      expect(data.data).toBeDefined();
    });

    it('should reject invalid field types', async () => {
      const updateData = {
        firstName: 123, // Should be string
      };

      const request = createMockRequest('PATCH', updateData, {
        url: `http://localhost:3000/api/admin/customers/${mockCustomerId}`,
      });
      const response = await PATCH(request, { params: { id: mockCustomerId } });

      await expectErrorResponse(response, 400);
    });
  });

  describe('Database Operations', () => {
    it('should update customer with service role client', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const mockServiceClient = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockUpdatedCustomer, ...updateData },
            error: null,
          }),
        }),
      };
      mockCreateServiceClient.mockResolvedValue(mockServiceClient);

      const request = createMockRequest('PATCH', updateData, {
        url: `http://localhost:3000/api/admin/customers/${mockCustomerId}`,
      });
      const response = await PATCH(request, { params: { id: mockCustomerId } });

      expect(mockCreateServiceClient).toHaveBeenCalled();
      expect(mockServiceClient.from).toHaveBeenCalledWith('users');
      await expectSuccessResponse(response);
    });

    it('should handle database errors', async () => {
      const mockServiceClient = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      };
      mockCreateServiceClient.mockResolvedValue(mockServiceClient);

      const request = createMockRequest('PATCH', { firstName: 'Jane' }, {
        url: `http://localhost:3000/api/admin/customers/${mockCustomerId}`,
      });
      const response = await PATCH(request, { params: { id: mockCustomerId } });

      await expectErrorResponse(response, 500);
    });
  });

  describe('All Fields', () => {
    it('should update all 8 customer fields', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '555-5678',
        companyName: 'New Company',
        address: '456 Oak Ave',
        city: 'Moncton',
        province: 'NS',
        postalCode: 'B3H 1A1',
      };

      const mockServiceClient = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockUpdatedCustomer, ...updateData },
            error: null,
          }),
        }),
      };
      mockCreateServiceClient.mockResolvedValue(mockServiceClient);

      const request = createMockRequest('PATCH', updateData, {
        url: `http://localhost:3000/api/admin/customers/${mockCustomerId}`,
      });
      const response = await PATCH(request, { params: { id: mockCustomerId } });

      const data = await expectSuccessResponse(response);
      expect(data.data.firstName).toBe('Jane');
      expect(data.data.lastName).toBe('Smith');
      expect(data.data.phone).toBe('555-5678');
      expect(data.data.companyName).toBe('New Company');
      expect(data.data.address).toBe('456 Oak Ave');
      expect(data.data.city).toBe('Moncton');
      expect(data.data.province).toBe('NS');
      expect(data.data.postalCode).toBe('B3H 1A1');
    });
  });
});


