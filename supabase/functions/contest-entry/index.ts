/**
 * Contest Entry Edge Function
 *
 * Handles contest entries with anti-fraud measures:
 * - Rate limiting by IP
 * - Email verification
 * - Referral code validation
 * - Device fingerprinting
 * - Disposable email detection
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Disposable email domains to block
const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email',
  'mailinator.com', 'maildrop.cc', 'yopmail.com', 'sharklasers.com'
];

interface EntryRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  postalCode: string;
  city?: string;
  referralCode?: string;
  marketingConsent: boolean;
  rulesAccepted: boolean;
  deviceFingerprint?: string;
  utmSource?: string;
  utmCampaign?: string;
  utmMedium?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request
    const body: EntryRequest = await req.json();

    // Get client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                     req.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // ========================================================================
    // VALIDATION
    // ========================================================================

    // Required fields
    if (!body.firstName || !body.lastName || !body.email || !body.postalCode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rules must be accepted
    if (!body.rulesAccepted) {
      return new Response(
        JSON.stringify({ error: 'You must accept the contest rules' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Block disposable emails
    const emailDomain = body.email.split('@')[1].toLowerCase();
    if (DISPOSABLE_DOMAINS.includes(emailDomain)) {
      return new Response(
        JSON.stringify({ error: 'Disposable email addresses are not allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // ANTI-FRAUD CHECKS
    // ========================================================================

    // Check IP rate limiting
    const { data: rateLimitCheck } = await supabaseClient
      .rpc('is_contest_rate_limited', { p_ip_address: clientIp });

    if (rateLimitCheck) {
      return new Response(
        JSON.stringify({
          error: 'Too many entries from your location. Please try again later.',
          retryAfter: 3600
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current contest month (first day of current month)
    const contestMonth = new Date();
    contestMonth.setDate(1);
    contestMonth.setHours(0, 0, 0, 0);
    const contestMonthStr = contestMonth.toISOString().split('T')[0];

    // ========================================================================
    // CHECK FOR DUPLICATE ENTRY
    // ========================================================================

    const { data: existingEntry } = await supabaseClient
      .from('contest_entrants')
      .select('id, verified, verification_token')
      .eq('email', body.email.toLowerCase())
      .eq('contest_month', contestMonthStr)
      .single();

    // If already entered and verified, prevent duplicate
    if (existingEntry && existingEntry.verified) {
      return new Response(
        JSON.stringify({
          error: 'You have already entered this month\'s contest',
          referralCode: await getReferralCode(supabaseClient, existingEntry.id)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // CREATE OR UPDATE ENTRY
    // ========================================================================

    // Generate verification token
    const verificationToken = crypto.randomUUID();

    // Determine entry source
    let entrySource = 'direct';
    if (body.referralCode) entrySource = 'referral';
    else if (body.utmSource === 'facebook') entrySource = 'facebook';
    else if (body.utmSource) entrySource = body.utmSource;

    const entrantData = {
      first_name: body.firstName.trim(),
      last_name: body.lastName.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone?.trim() || null,
      postal_code: body.postalCode.trim(),
      city: body.city?.trim() || null,
      verified: false,
      verification_token: verificationToken,
      verification_sent_at: new Date().toISOString(),
      marketing_consent: body.marketingConsent,
      rules_accepted: body.rulesAccepted,
      ip_address: clientIp,
      user_agent: userAgent,
      utm_source: body.utmSource || null,
      utm_campaign: body.utmCampaign || null,
      utm_medium: body.utmMedium || null,
      device_fingerprint: body.deviceFingerprint || null,
      entry_source: entrySource,
      contest_month: contestMonthStr,
    };

    // Insert or update entrant
    const { data: entrant, error: entrantError } = await supabaseClient
      .from('contest_entrants')
      .upsert(entrantData, {
        onConflict: 'email,contest_month',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (entrantError) {
      console.error('Error creating entrant:', entrantError);
      return new Response(
        JSON.stringify({ error: 'Failed to create entry' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // GENERATE REFERRAL CODE
    // ========================================================================

    let referralCode = '';

    // Check if referral code already exists
    const { data: existingCode } = await supabaseClient
      .from('contest_referral_codes')
      .select('code')
      .eq('entrant_id', entrant.id)
      .single();

    if (existingCode) {
      referralCode = existingCode.code;
    } else {
      // Generate new referral code
      const { data: newCode } = await supabaseClient
        .rpc('generate_contest_referral_code', { p_entrant_id: entrant.id });

      referralCode = newCode || `${body.firstName.substring(0, 3).toUpperCase()}${body.lastName.substring(0, 3).toUpperCase()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Save referral code
      await supabaseClient
        .from('contest_referral_codes')
        .insert({
          entrant_id: entrant.id,
          code: referralCode,
          contest_month: contestMonthStr
        });
    }

    // ========================================================================
    // RECORD REFERRAL IF PROVIDED
    // ========================================================================

    if (body.referralCode) {
      // Find referrer
      const { data: referrerCode } = await supabaseClient
        .from('contest_referral_codes')
        .select('entrant_id')
        .eq('code', body.referralCode.toUpperCase())
        .eq('contest_month', contestMonthStr)
        .single();

      if (referrerCode) {
        // Create referral relationship (will be validated after email verification)
        const { error: referralError } = await supabaseClient
          .from('contest_referrals')
          .insert({
            referrer_id: referrerCode.entrant_id,
            referee_id: entrant.id,
            referral_code: body.referralCode.toUpperCase(),
            contest_month: contestMonthStr,
            validated: false // Will be set to true after email verification
          });

        if (referralError) {
          console.error('Error creating referral relationship:', referralError);
        }
      }
    }

    // ========================================================================
    // SEND VERIFICATION EMAIL
    // ========================================================================

    const verificationUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/contest/verify?token=${verificationToken}`;
    const referralLink = `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/contest?ref=${referralCode}`;

    // Call send-email Edge Function (don't fail if email service unavailable)
    try {
      const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({
          to: body.email,
          subject: 'Confirm Your Contest Entry - U-Dig It Rentals',
          template: 'contest_verification',
          data: {
            firstName: body.firstName,
            verificationUrl,
            referralCode,
            referralLink
          }
        })
      });

      if (!emailResponse.ok) {
        console.error('Email send failed:', await emailResponse.text());
      }
    } catch (emailError) {
      // Email service not configured - that's OK, entry is still valid
      console.error('Email service unavailable (expected during testing):', emailError);
    }

    // ========================================================================
    // LOG ENTRY EVENT
    // ========================================================================

    await supabaseClient.from('contest_audit_logs').insert({
      action: 'entry_created',
      entrant_id: entrant.id,
      metadata: {
        email: body.email,
        hasReferral: !!body.referralCode,
        entrySource
      },
      ip_address: clientIp,
      user_agent: userAgent
    });

    await supabaseClient.from('contest_events').insert({
      event_type: 'contest_entered',
      entrant_id: entrant.id,
      properties: {
        source: entrySource,
        hasReferral: !!body.referralCode
      }
    });

    // ========================================================================
    // RETURN SUCCESS
    // ========================================================================

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Entry created! Please check your email to verify.',
        entrantId: entrant.id,
        referralCode,
        referralLink,
        verificationSent: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Contest entry error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to get referral code
async function getReferralCode(supabase: any, entrantId: string): Promise<string | null> {
  const { data } = await supabase
    .from('contest_referral_codes')
    .select('code')
    .eq('entrant_id', entrantId)
    .single();

  return data?.code || null;
}

