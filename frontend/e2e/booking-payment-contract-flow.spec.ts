import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY as CONFIG_SERVICE_ROLE_KEY, SUPABASE_URL as CONFIG_SUPABASE_URL } from '@/lib/supabase/config';
import { contractNumberFromBooking } from '@/lib/utils';
import type { Database } from '../../supabase/types';

const TEST_CREDENTIALS = {
  email: process.env.PLAYWRIGHT_TEST_EMAIL ?? 'aitest2@udigit.ca',
  password: process.env.PLAYWRIGHT_TEST_PASSWORD ?? 'TestAI2024!@#$',
};

const SUPABASE_URL = process.env.SUPABASE_URL ?? CONFIG_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? CONFIG_SERVICE_ROLE_KEY;

// Skip the suite entirely if we don't have credentials to manipulate test data
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  test.describe.skip('Booking payment + contract pipeline (requires Supabase service key)', () => {
    test('skipped', () => {});
  });
} else {
  const adminSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  type CleanupRecord = {
    bookingId: string;
    customerId: string;
    originalLicense: string | null;
  };

  const cleanupQueue: CleanupRecord[] = [];

  const randomSuffix = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  async function login(page: Parameters<typeof test>[0]['page']) {
    await page.goto('/auth/signin');
    await page.getByRole('button', { name: /sign in with email/i }).click();
    await page.getByLabel('Email').fill(TEST_CREDENTIALS.email);
    await page.getByLabel('Password').fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
  }

  async function getTestUserId(): Promise<{ userId: string; originalLicense: string | null }> {
    const { data, error } = await adminSupabase.auth.admin.getUserByEmail(TEST_CREDENTIALS.email);
    if (error || !data?.user?.id) {
      throw new Error('Test user not found for booking pipeline spec');
    }

    const { data: profile } = await adminSupabase
      .from('users')
      .select('driversLicense')
      .eq('id', data.user.id)
      .maybeSingle();

    return { userId: data.user.id, originalLicense: profile?.driversLicense ?? null };
  }

  async function getAvailableEquipmentId(): Promise<string> {
    const { data, error } = await adminSupabase
      .from('equipment')
      .select('id, status')
      .eq('status', 'available')
      .limit(1)
      .maybeSingle();

    if (error || !data?.id) {
      throw new Error('No available equipment found for booking pipeline spec');
    }
    return data.id;
  }

  async function createTestBooking(customerId: string, equipmentId: string) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 4);

    const nowIso = new Date().toISOString();
    const bookingNumber = `E2E-${Date.now().toString().slice(-6)}-${randomSuffix()}`;

    const { data, error } = await adminSupabase
      .from('bookings')
      .insert({
        bookingNumber,
        customerId,
        equipmentId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        deliveryAddress: '123 QA Automation Way',
        deliveryCity: 'Saint John',
        deliveryProvince: 'NB',
        deliveryPostalCode: 'E2E 1E2',
        deliveryFee: 150,
        floatFee: 75,
        dailyRate: 450,
        weeklyRate: 2250,
        monthlyRate: 9000,
        subtotal: 900,
        taxes: 135,
        totalAmount: 1035,
        securityDeposit: 500,
        additionalCharges: 0,
        cancellationFee: 0,
        overageCharges: 0,
        overageHours: 0,
        refundAmount: 0,
        depositPaid: false,
        seasonalMultiplier: 1,
        startEngineHours: 0,
        endEngineHours: 0,
        hold_security_amount_cents: 50_000,
        stripe_customer_id: 'cus_e2e_booking',
        stripe_payment_method_id: null,
        security_hold_intent_id: null,
        type: 'delivery',
        status: 'pending',
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .select('id')
      .single();

    if (error || !data?.id) {
      throw error ?? new Error('Failed to create test booking');
    }

    return data.id;
  }

  async function markSecurityHold(bookingId: string) {
    const nowIso = new Date().toISOString();

    await adminSupabase.from('booking_payments').insert({
      booking_id: bookingId,
      purpose: 'security_hold',
      amount_cents: 50_000,
      currency: 'cad',
      stripe_payment_intent_id: `pi_${randomSuffix().toLowerCase()}`,
      idempotency_key: `e2e-hold-${bookingId}`,
      status: 'succeeded',
      metadata: {
        placed_at: nowIso,
        automated: true,
      },
    });

    await adminSupabase
      .from('bookings')
      .update({
        stripe_payment_method_id: 'pm_e2e_test_method',
        security_hold_intent_id: `pi_${randomSuffix().toLowerCase()}`,
        status: 'hold_placed',
        updatedAt: nowIso,
      })
      .eq('id', bookingId);
  }

  async function markContractInsuranceAndLicense(bookingId: string, customerId: string) {
    const nowIso = new Date().toISOString();

    await adminSupabase.from('contracts').delete().eq('bookingId', bookingId);

    await adminSupabase.from('contracts').insert({
      bookingId,
      contractNumber: contractNumberFromBooking(booking.bookingNumber),
      legalVersions: { rental_agreement: '1.0' },
      status: 'signed',
      type: 'rental_agreement',
      createdAt: nowIso,
      updatedAt: nowIso,
      signedAt: nowIso,
      completedAt: nowIso,
    });

    await adminSupabase.from('insurance_documents').insert({
      bookingId,
      documentNumber: `COI-${Date.now().toString().slice(-6)}-${randomSuffix()}`,
      fileName: 'qa-insurance.pdf',
      originalFileName: 'qa-insurance.pdf',
      fileUrl: 'https://example.com/qa-insurance.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      status: 'approved',
      type: 'coi',
      createdAt: nowIso,
      updatedAt: nowIso,
      insuranceCompany: 'QA Assurance Ltd.',
      policyNumber: `QA-${randomSuffix()}`,
    });

    await adminSupabase
      .from('users')
      .update({ driversLicense: 'QA-DRIVER-1234' })
      .eq('id', customerId);
  }

  test.describe('Booking payment + contract pipeline', () => {
    test.afterEach(async () => {
      while (cleanupQueue.length > 0) {
        const record = cleanupQueue.pop();
        if (!record) continue;

        await adminSupabase.from('booking_payments').delete().eq('booking_id', record.bookingId);
        await adminSupabase.from('insurance_documents').delete().eq('bookingId', record.bookingId);
        await adminSupabase.from('contracts').delete().eq('bookingId', record.bookingId);
        await adminSupabase.from('bookings').delete().eq('id', record.bookingId);

        if (record.originalLicense !== undefined) {
          await adminSupabase
            .from('users')
            .update({ driversLicense: record.originalLicense })
            .eq('id', record.customerId);
        }
      }
    });

    test('should progress booking through deposit and contract completion', async ({ page }) => {
      const { userId, originalLicense } = await getTestUserId();
      const equipmentId = await getAvailableEquipmentId();
      const bookingId = await createTestBooking(userId, equipmentId);

      cleanupQueue.push({ bookingId, customerId: userId, originalLicense });

      await login(page);
      await page.goto(`/booking/${bookingId}/manage`, { waitUntil: 'networkidle' });

      const cardVerificationButton = () => page.locator('button', { hasText: 'Card Verification' });
      const contractButton = () => page.locator('button', { hasText: 'Sign Contract' });
      const insuranceButton = () => page.locator('button', { hasText: 'Upload Insurance' });
      const licenseButton = () => page.locator('button', { hasText: 'Upload License' });

      await expect(cardVerificationButton()).toContainText('Verify payment method');
      await expect(contractButton()).toContainText(/Action required/i);
      await expect(insuranceButton()).toContainText('Required');
      await expect(licenseButton()).toContainText('Required');

      await markSecurityHold(bookingId);
      await page.reload({ waitUntil: 'networkidle' });
      await expect(cardVerificationButton()).toContainText('Card saved securely');

      await markContractInsuranceAndLicense(bookingId, userId);
      await page.reload({ waitUntil: 'networkidle' });

      await expect(contractButton()).toContainText(/Signed/);
      await expect(insuranceButton()).toContainText('Uploaded');
      await expect(licenseButton()).toContainText('Uploaded');
    });
  });
}
