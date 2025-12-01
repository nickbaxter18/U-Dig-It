import { z, ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import {
  validateGeneralSettings,
  validatePricingSettings,
  validateSecuritySettings,
  validateIntegrationSettings,
} from '@/lib/validation/settings-validators';

// Schema for general settings
const generalSettingsSchema = z.object({
  siteName: z.string().optional(),
  siteDescription: z.string().optional(),
  maintenanceMode: z.boolean().optional(),
  maxBookingsPerDay: z.number().optional(),
  defaultCurrency: z.string().optional(),
  timezone: z.string().optional(),
});

// Schema for pricing settings
const pricingSettingsSchema = z.object({
  baseDailyRate: z.number().optional(),
  weekendMultiplier: z.number().optional(),
  holidayMultiplier: z.number().optional(),
  longTermDiscount: z.number().optional(),
  depositPercentage: z.number().optional(),
  lateFeePerDay: z.number().optional(),
});

// Schema for notifications settings
const notificationsSettingsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  adminNotifications: z.boolean().optional(),
  customerNotifications: z.boolean().optional(),
  reminderDays: z.number().optional(),
});

// Schema for integrations settings
const integrationsSettingsSchema = z.object({
  stripeEnabled: z.boolean().optional(),
  stripePublicKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  docusignEnabled: z.boolean().optional(),
  docusignClientId: z.string().optional(),
  googleMapsApiKey: z.string().optional(),
});

// Schema for security settings
const securitySettingsSchema = z.object({
  sessionTimeout: z.number().optional(),
  maxLoginAttempts: z.number().optional(),
  passwordMinLength: z.number().optional(),
  requireTwoFactor: z.boolean().optional(),
  allowedIpRanges: z.array(z.string()).optional(),
});

// Schema for category update
const categoryUpdateSchema = z.object({
  category: z.enum(['general', 'pricing', 'notifications', 'integrations', 'security']),
  settings: z.union([
    generalSettingsSchema,
    pricingSettingsSchema,
    notificationsSettingsSchema,
    integrationsSettingsSchema,
    securitySettingsSchema,
  ]),
});

// Schema for PATCH request body
const settingsUpdateSchema = z.object({
  updates: z.array(categoryUpdateSchema).min(1),
});

/**
 * GET /api/admin/settings
 * Fetch all system settings (admin only)
 */
export const GET = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest) => {
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Create service role client for database operations
      const supabaseAdmin = await createServiceClient();

      // Fetch all settings
      const { data: settingsData, error: settingsError } = await supabaseAdmin
        .from('system_settings')
        .select('category, settings')
        .order('category', { ascending: true });

      if (settingsError) {
        logger.error(
          'Failed to fetch settings',
          {
            component: 'admin-settings-api',
            action: 'fetch_error',
            metadata: { adminId: adminResult.user?.id || 'unknown' },
          },
          settingsError
        );
        return NextResponse.json(
          { error: 'Failed to fetch settings', details: settingsError.message },
          { status: 500 }
        );
      }

      // Transform array of settings into object by category
      const settingsMap: Record<string, unknown> = {};
      (settingsData || []).forEach((item: { category: string; settings: unknown }) => {
        settingsMap[item.category] = item.settings;
      });

      logger.info('Settings fetched by admin', {
        component: 'admin-settings-api',
        action: 'settings_fetched',
        metadata: {
          adminId: adminResult.user?.id || 'unknown',
          categories: Object.keys(settingsMap),
        },
      });

      return NextResponse.json({ data: settingsMap });
    } catch (err) {
      logger.error(
        'Unexpected error in admin settings API',
        {
          component: 'admin-settings-api',
          action: 'unexpected_error',
        },
        err instanceof Error ? err : new Error(String(err))
      );

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

/**
 * PATCH /api/admin/settings
 * Update system settings (admin only)
 */
export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest) => {
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging and updated_by field
      const { user } = adminResult;

      // Parse and validate request body
      const body = await request.json();
      const validatedData = settingsUpdateSchema.parse(body);

      // Additional business logic validation
      const validationErrors: Record<string, string> = {};

      for (const update of validatedData.updates) {
        if (update.category === 'general') {
          const result = validateGeneralSettings(update.settings);
          Object.keys(result.errors).forEach((key) => {
            validationErrors[`general.${key}`] = result.errors[key];
          });
        } else if (update.category === 'pricing') {
          const result = validatePricingSettings(update.settings);
          Object.keys(result.errors).forEach((key) => {
            validationErrors[`pricing.${key}`] = result.errors[key];
          });
        } else if (update.category === 'security') {
          const result = validateSecuritySettings(update.settings);
          Object.keys(result.errors).forEach((key) => {
            validationErrors[`security.${key}`] = result.errors[key];
          });
        } else if (update.category === 'integrations') {
          const result = validateIntegrationSettings(update.settings);
          Object.keys(result.errors).forEach((key) => {
            validationErrors[`integrations.${key}`] = result.errors[key];
          });
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationErrors },
          { status: 400 }
        );
      }

      // Create service role client for database operations
      const supabaseAdmin = await createServiceClient();

      // Prepare upsert data
      const settingsToSave = validatedData.updates.map((update) => ({
        category: update.category,
        settings: update.settings,
        updated_by: user?.id || null,
      }));

      // Upsert settings with conflict resolution on category
      const { data, error: saveError } = await supabaseAdmin
        .from('system_settings')
        .upsert(settingsToSave, {
          onConflict: 'category',
        })
        .select('category, settings');

      if (saveError) {
        logger.error(
          'Failed to save settings',
          {
            component: 'admin-settings-api',
            action: 'save_error',
            metadata: {
              adminId: user?.id || 'unknown',
              categories: validatedData.updates.map((u) => u.category),
            },
          },
          saveError
        );
        return NextResponse.json(
          { error: 'Failed to save settings', details: saveError.message },
          { status: 500 }
        );
      }

      logger.info('Settings saved by admin', {
        component: 'admin-settings-api',
        action: 'settings_saved',
        metadata: {
          adminId: user?.id || 'unknown',
          categories: validatedData.updates.map((u) => u.category),
        },
      });

      // Transform response to match GET format
      const settingsMap: Record<string, unknown> = {};
      (data || []).forEach((item: { category: string; settings: unknown }) => {
        settingsMap[item.category] = item.settings;
      });

      return NextResponse.json({ data: settingsMap });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: err.issues },
          { status: 400 }
        );
      }

      logger.error(
        'Unexpected error in admin settings API',
        {
          component: 'admin-settings-api',
          action: 'unexpected_error',
        },
        err instanceof Error ? err : new Error(String(err))
      );

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);


