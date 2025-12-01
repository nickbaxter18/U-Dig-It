import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/config/banner
 * Returns the current banner visibility settings (public endpoint)
 * Returns both special_offers_banner and spin_wheel_banner settings
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all public banner configs
    const { data, error } = await supabase
      .from('system_config')
      .select('key, value')
      .in('key', ['special_offers_banner_enabled', 'spin_wheel_banner_enabled'])
      .eq('is_public', true);

    if (error) {
      logger.warn('Banner config not found, using defaults', {
        component: 'banner-config-api',
        action: 'get_config',
        metadata: { error: error.message },
      });
      return NextResponse.json({
        enabled: true,  // Legacy: special_offers_banner
        specialOffersBanner: true,
        spinWheelBanner: true
      });
    }

    // Parse config values
    const specialOffers = data?.find(c => c.key === 'special_offers_banner_enabled');
    const spinWheel = data?.find(c => c.key === 'spin_wheel_banner_enabled');

    const specialOffersEnabled = specialOffers?.value === true || specialOffers?.value === 'true';
    const spinWheelEnabled = spinWheel?.value === true || spinWheel?.value === 'true';

    return NextResponse.json({
      enabled: specialOffersEnabled,  // Legacy compatibility
      specialOffersBanner: specialOffersEnabled,
      spinWheelBanner: spinWheelEnabled
    });
  } catch (error) {
    logger.error(
      'Failed to fetch banner config',
      { component: 'banner-config-api', action: 'get_config_error' },
      error instanceof Error ? error : new Error(String(error))
    );
    // Default to showing banners if config fetch fails
    return NextResponse.json({
      enabled: true,
      specialOffersBanner: true,
      spinWheelBanner: true
    });
  }
}

/**
 * PUT /api/config/banner
 * Updates the banner visibility setting (admin only)
 * Accepts: { enabled: boolean, bannerType?: 'special_offers' | 'spin_wheel' }
 * If bannerType is not provided, defaults to 'special_offers' for backward compatibility
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { enabled, bannerType = 'special_offers' } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request: enabled must be a boolean' }, { status: 400 });
    }

    // Validate banner type
    const validBannerTypes = ['special_offers', 'spin_wheel'];
    if (!validBannerTypes.includes(bannerType)) {
      return NextResponse.json({
        error: 'Invalid request: bannerType must be "special_offers" or "spin_wheel"'
      }, { status: 400 });
    }

    // Determine the config key based on banner type
    const configKey = bannerType === 'spin_wheel'
      ? 'spin_wheel_banner_enabled'
      : 'special_offers_banner_enabled';

    // Update the banner config
    const { error: updateError } = await supabase
      .from('system_config')
      .update({
        value: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('key', configKey);

    if (updateError) {
      logger.error(
        'Failed to update banner config',
        { component: 'banner-config-api', action: 'update_config_error', metadata: { bannerType } },
        updateError
      );
      return NextResponse.json({ error: 'Failed to update banner config' }, { status: 500 });
    }

    logger.info('Banner config updated', {
      component: 'banner-config-api',
      action: 'update_config',
      metadata: { enabled, bannerType, configKey, adminId: user.id },
    });

    return NextResponse.json({ success: true, enabled, bannerType });
  } catch (error) {
    logger.error(
      'Failed to update banner config',
      { component: 'banner-config-api', action: 'update_config_error' },
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

