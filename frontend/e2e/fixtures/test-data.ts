// Test data fixtures for admin E2E tests

export const testData = {
  equipment: {
    valid: {
      unitId: `TEST-${Date.now()}`,
      make: 'Kubota',
      model: 'SVL75',
      serialNumber: `SN-${Date.now()}`,
      year: 2023,
      dailyRate: 350,
      weeklyRate: 1500,
      monthlyRate: 4200,
      status: 'available',
      location: 'Main Yard',
    },
  },

  customer: {
    valid: {
      firstName: 'Test',
      lastName: 'Customer',
      email: `testcustomer${Date.now()}@example.com`,
      phone: '506-555-0100',
      address: '123 Test Street',
      city: 'Saint John',
      province: 'NB',
      postalCode: 'E2K 1A1',
    },
  },

  booking: {
    valid: {
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
      deliveryAddress: '123 Test Street, Saint John, NB',
      specialInstructions: 'Test booking instructions',
    },
  },

  promotion: {
    valid: {
      code: `TEST${Date.now().toString().slice(-6)}`,
      discountType: 'percentage' as const,
      discountValue: 10,
      maxUses: 100,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  },

  supportTicket: {
    valid: {
      subject: 'Test Support Ticket',
      description: 'This is a test support ticket for E2E testing',
      priority: 'medium' as const,
      category: 'technical' as const,
    },
  },
};

export const adminPages = [
  { path: '/admin/dashboard', name: 'Dashboard' },
  { path: '/admin/bookings', name: 'Bookings' },
  { path: '/admin/equipment', name: 'Equipment' },
  { path: '/admin/customers', name: 'Customers' },
  { path: '/admin/payments', name: 'Payments' },
  { path: '/admin/operations', name: 'Operations' },
  { path: '/admin/support', name: 'Support' },
  { path: '/admin/insurance', name: 'Insurance' },
  { path: '/admin/promotions', name: 'Promotions' },
  { path: '/admin/contracts', name: 'Contracts' },
  { path: '/admin/communications', name: 'Communications' },
  { path: '/admin/analytics', name: 'Analytics' },
  { path: '/admin/audit', name: 'Audit Log' },
  { path: '/admin/settings', name: 'Settings' },
  { path: '/admin/security/id-verification', name: 'ID Verification' },
] as const;

