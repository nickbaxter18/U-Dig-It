import { expect, test } from '@playwright/test';

const SUPABASE_PROJECT = '127.0.0.1:54321';
const STORAGE_KEY = `sb-${SUPABASE_PROJECT}-auth-token`;

const adminSession = {
  currentSession: {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: 'admin-user-1',
      email: 'admin@example.com',
      user_metadata: { role: 'super_admin', full_name: 'Test Admin' },
      app_metadata: { provider: 'email' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      role: 'authenticated',
    },
  },
  currentUser: {
    id: 'admin-user-1',
    email: 'admin@example.com',
    user_metadata: { role: 'super_admin', full_name: 'Test Admin' },
  },
};

const equipmentRows = [
  {
    id: 'equip-1',
    unitId: 'KBT-001',
    make: 'Kubota',
    model: 'SVL75',
    serialNumber: 'SVL75-12345',
    status: 'available',
    location: { name: 'Main Yard', city: 'Saint John' },
    dailyRate: 350,
    weeklyRate: 1500,
    monthlyRate: 4200,
    nextMaintenanceDue: '2025-03-01T00:00:00Z',
    lastMaintenanceDate: '2025-01-15T00:00:00Z',
    total_rental_days: 120,
    revenue_generated: 85000,
    utilization_rate: 78.5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2025-01-20T00:00:00Z',
    type: 'svl75',
    year: 2023,
  },
  {
    id: 'equip-2',
    unitId: 'KBT-002',
    make: 'Kubota',
    model: 'KX040',
    serialNumber: 'KX040-98765',
    status: 'rented',
    location: { name: 'Job Site A', city: 'Saint John' },
    dailyRate: 300,
    weeklyRate: 1300,
    monthlyRate: 3900,
    nextMaintenanceDue: '2025-02-10T00:00:00Z',
    lastMaintenanceDate: '2025-01-05T00:00:00Z',
    total_rental_days: 90,
    revenue_generated: 62000,
    utilization_rate: 64.2,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2025-01-20T00:00:00Z',
    type: 'excavator',
    year: 2022,
  },
];

const bookingRows = [
  {
    id: 'booking-1',
    bookingNumber: 'UDR-1010',
    equipmentId: 'equip-1',
    customerId: 'customer-1',
    status: 'completed',
    totalAmount: 1800,
    createdAt: '2025-01-15T12:00:00Z',
    startDate: '2025-01-16T00:00:00Z',
    endDate: '2025-01-18T00:00:00Z',
    equipment: {
      id: 'equip-1',
      model: 'SVL75',
      make: 'Kubota',
      year: 2023,
      dailyRate: 350,
      images: [],
    },
    customer: {
      id: 'customer-1',
      firstName: 'Avery',
      lastName: 'Smith',
      email: 'avery@example.com',
    },
  },
  {
    id: 'booking-2',
    bookingNumber: 'UDR-1011',
    equipmentId: 'equip-1',
    customerId: 'customer-2',
    status: 'completed',
    totalAmount: 2200,
    createdAt: '2025-01-10T12:00:00Z',
    startDate: '2025-01-11T00:00:00Z',
    endDate: '2025-01-14T00:00:00Z',
    equipment: {
      id: 'equip-1',
      model: 'SVL75',
      make: 'Kubota',
      year: 2023,
      dailyRate: 350,
      images: [],
    },
    customer: {
      id: 'customer-2',
      firstName: 'Morgan',
      lastName: 'Lee',
      email: 'morgan@example.com',
    },
  },
  {
    id: 'booking-3',
    bookingNumber: 'UDR-1012',
    equipmentId: 'equip-1',
    customerId: 'customer-3',
    status: 'cancelled',
    totalAmount: 0,
    createdAt: '2025-01-05T12:00:00Z',
    startDate: '2025-01-08T00:00:00Z',
    endDate: '2025-01-10T00:00:00Z',
    equipment: {
      id: 'equip-1',
      model: 'SVL75',
      make: 'Kubota',
      year: 2023,
      dailyRate: 350,
      images: [],
    },
    customer: {
      id: 'customer-3',
      firstName: 'Jordan',
      lastName: 'Quinn',
      email: 'jordan@example.com',
    },
  },
  {
    id: 'booking-4',
    bookingNumber: 'UDR-1013',
    equipmentId: 'equip-2',
    customerId: 'customer-4',
    status: 'in_progress',
    totalAmount: 2600,
    createdAt: '2025-01-20T12:00:00Z',
    startDate: '2025-01-21T00:00:00Z',
    endDate: '2025-01-24T00:00:00Z',
    equipment: {
      id: 'equip-2',
      model: 'KX040',
      make: 'Kubota',
      year: 2022,
      dailyRate: 300,
      images: [],
    },
    customer: {
      id: 'customer-4',
      firstName: 'Reese',
      lastName: 'Taylor',
      email: 'reese@example.com',
    },
  },
];

const attachmentRows = [
  {
    id: 'attach-1',
    name: 'Hydraulic Breaker',
    attachment_type: 'breaker',
    daily_rate: 95,
    quantity_available: 4,
    quantity_in_use: 1,
    is_active: true,
  },
  {
    id: 'attach-2',
    name: 'Trenching Bucket',
    attachment_type: 'bucket',
    daily_rate: 0,
    quantity_available: 3,
    quantity_in_use: 0,
    is_active: true,
  },
];

const bookingAttachments = [
  {
    attachment_id: 'attach-1',
    total_amount: 760,
    quantity: 4,
    days_rented: 8,
    created_at: '2025-01-15T00:00:00Z',
  },
  {
    attachment_id: 'attach-1',
    total_amount: 190,
    quantity: 1,
    days_rented: 2,
    created_at: '2025-01-08T00:00:00Z',
  },
  {
    attachment_id: 'attach-2',
    total_amount: 0,
    quantity: 2,
    days_rented: 6,
    created_at: '2025-01-05T00:00:00Z',
  },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(adminSession)]
  );

  const maintenanceRecords: {
    id: string;
    title: string;
    maintenanceType: string;
    priority: string;
    status: string;
    scheduledDate: string;
    performedBy?: string;
    cost?: number;
    nextDueDate?: string;
  }[] = [];

  await page.route('http://127.0.0.1:54321/rest/v1/users', async (route) => {
    const method = route.request().method();
    if (method === 'HEAD') {
      await route.fulfill({
        status: 200,
        headers: {
          'content-range': '0-0/5',
        },
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ role: 'super_admin' }]),
    });
  });

  await page.route('http://127.0.0.1:54321/rest/v1/equipment', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(equipmentRows),
    });
  });

  await page.route('http://127.0.0.1:54321/rest/v1/bookings', async (route) => {
    const url = new URL(route.request().url());
    const equipmentFilter = url.searchParams.get('equipmentId');
    const customerFilter = url.searchParams.get('customerId');

    let filtered = bookingRows;

    if (equipmentFilter?.startsWith('eq.')) {
      const id = equipmentFilter.slice(3);
      filtered = filtered.filter((item) => item.equipmentId === id);
    }

    if (customerFilter?.startsWith('eq.')) {
      const id = customerFilter.slice(3);
      filtered = filtered.filter((item) => item.customerId === id);
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(filtered),
    });
  });

  await page.route('http://127.0.0.1:54321/rest/v1/equipment_attachments', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(attachmentRows),
    });
  });

  await page.route('http://127.0.0.1:54321/rest/v1/booking_attachments', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(bookingAttachments),
    });
  });

  await page.route('**/api/admin/equipment/*/maintenance', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: maintenanceRecords }),
      });
      return;
    }

    const body = route.request().postDataJSON() as {
      title: string;
      maintenanceType: string;
      priority: string;
      scheduledDate: string;
      performedBy?: string;
      cost?: number;
      nextDueDate?: string;
    };

    const newRecord = {
      id: `maint-${maintenanceRecords.length + 1}`,
      title: body.title,
      maintenanceType: body.maintenanceType,
      priority: body.priority,
      status: 'scheduled',
      scheduledDate: body.scheduledDate,
      performedBy: body.performedBy,
      cost: body.cost,
      nextDueDate: body.nextDueDate ?? null,
    };

    maintenanceRecords.unshift(newRecord);

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ data: newRecord }),
    });
  });
});

test('schedule maintenance from equipment page', async ({ page }) => {
  await page.goto('/admin/equipment');

  await expect(page.getByRole('heading', { name: 'Equipment Management' })).toBeVisible();
  await expect(page.getByText('Kubota SVL75')).toBeVisible();

  await page.locator('button[title="Schedule Maintenance"]').first().click();
  await expect(page.getByRole('heading', { name: /Schedule Maintenance/i })).toBeVisible();

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);
  futureDate.setHours(9, 30, 0, 0);

  const iso = futureDate.toISOString().slice(0, 16);

  await page.fill('input[type="datetime-local"]', iso);
  await page.selectOption('#maintenance-type', 'preventive');
  await page.selectOption('#maintenance-priority', 'high');
  await page.fill('#performed-by', 'Casey Technician');
  await page.fill('#maintenance-cost', '275');
  await page.fill('#next-due-date', futureDate.toISOString().slice(0, 10));
  await page.fill('#maintenance-notes', 'Replace hydraulic filters and inspect tracks.');
  await page.click('button:has-text("Schedule Maintenance")');

  await expect(page.getByRole('heading', { name: /Equipment Management/i })).toBeVisible();

  await page.locator('button[title="Schedule Maintenance"]').first().click();
  await expect(page.getByText('Casey Technician')).toBeVisible();
  await expect(page.getByText('$275.00')).toBeVisible();
  await page
    .getByRole('button', { name: 'Close maintenance modal' })
    .click({ force: true })
    .catch(() => {});
});

test('dashboard and growth metrics render analytics data', async ({ page }) => {
  await page.goto('/admin/dashboard');

  await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();
  await expect(page.getByText('Total Bookings')).toBeVisible();
  await expect(page.getByText('Total Bookings').locator('xpath=..')).toContainText('4');
  await expect(page.getByText('Booking Trends')).toBeVisible();
  await expect(page.getByText('Top Equipment Utilization')).toBeVisible();
  await expect(page.getByText('78.5%')).toBeVisible();

  await page.goto('/admin/growth-metrics');
  await expect(page.getByRole('heading', { name: 'Growth Metrics Dashboard' })).toBeVisible();
  await expect(page.getByText('Total Rentals (6 mo)')).toBeVisible();
  await expect(page.getByText('Revenue from Attachments')).toContainText('$950');
  await expect(page.getByText('Hydraulic Breaker')).toBeVisible();
  await expect(page.getByText('Times Rented (6 mo)').locator('xpath=..')).toContainText('5');
});
