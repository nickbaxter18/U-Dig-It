/**
 * Contest Email Verification Edge Function
 *
 * Verifies entrant email and validates referrals
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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

    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000';

    // Parse request
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Verification token required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // FIND ENTRANT BY TOKEN
    // ========================================================================

    const { data: entrant, error: findError } = await supabaseClient
      .from('contest_entrants')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (findError || !entrant) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired verification token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingReferralCode } = await supabaseClient
      .from('contest_referral_codes')
      .select('code')
      .eq('entrant_id', entrant.id)
      .single();

    const buildReferralLink = (code?: string | null) =>
      code ? `${siteUrl}/contest?ref=${code}` : null;

    // Check if already verified
    if (entrant.verified) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email already verified',
          alreadyVerified: true,
          verified: true,
          referralCode: existingReferralCode?.code ?? null,
          referralLink: buildReferralLink(existingReferralCode?.code)
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // VERIFY EMAIL
    // ========================================================================

    const { error: updateError } = await supabaseClient
      .from('contest_entrants')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        verification_token: null // Clear token after verification
      })
      .eq('id', entrant.id);

    if (updateError) {
      console.error('Error verifying entrant:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // VALIDATE REFERRAL (if this entrant was referred)
    // ========================================================================

    // Check if this entrant has a referral relationship
    const { data: referrals } = await supabaseClient
      .from('contest_referrals')
      .select('id, referrer_id, referral_code')
      .eq('referee_id', entrant.id)
      .eq('validated', false);

    // Validate all pending referrals for this entrant
    if (referrals && referrals.length > 0) {
      for (const referral of referrals) {
        await supabaseClient
          .from('contest_referrals')
          .update({
            validated: true,
            validated_at: new Date().toISOString()
          })
          .eq('id', referral.id);

        // Increment referral code usage count
        const { data: referralCodeRecord, error: referralCodeFetchError } = await supabaseClient
          .from('contest_referral_codes')
          .select('id, times_used')
          .eq('code', referral.referral_code)
          .eq('contest_month', entrant.contest_month)
          .single();

        if (referralCodeFetchError) {
          console.error('Error fetching referral code usage:', referralCodeFetchError);
        } else if (referralCodeRecord) {
          const { error: referralCodeUpdateError } = await supabaseClient
            .from('contest_referral_codes')
            .update({
              times_used: (referralCodeRecord.times_used ?? 0) + 1
            })
            .eq('id', referralCodeRecord.id);

          if (referralCodeUpdateError) {
            console.error('Error updating referral code usage count:', referralCodeUpdateError);
          }
        }
      }
    }

    // ========================================================================
    // GET REFERRAL CODE FOR CONFIRMED EMAIL
    // ========================================================================

    const referralCode = existingReferralCode;
    const referralLink = buildReferralLink(referralCode?.code);

    // ========================================================================
    // LOG VERIFICATION EVENT
    // ========================================================================

    await supabaseClient.from('contest_audit_logs').insert({
      action: 'email_verified',
      entrant_id: entrant.id,
      metadata: {
        email: entrant.email,
        validatedReferrals: referrals?.length || 0
      },
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0],
      user_agent: req.headers.get('user-agent')
    });

    await supabaseClient.from('contest_events').insert({
      event_type: 'email_verified',
      entrant_id: entrant.id,
      properties: {
        referralValidated: (referrals && referrals.length > 0)
      }
    });

    // ========================================================================
    // SEND CONFIRMATION EMAIL
    // ========================================================================

    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || ''
      },
      body: JSON.stringify({
        to: entrant.email,
        subject: 'You\'re Entered! - Monthly Contest',
        template: 'contest_confirmed',
        data: {
          firstName: entrant.first_name,
          referralCode: referralCode?.code,
          referralLink
        }
      })
    });

    // ========================================================================
    // RETURN SUCCESS
    // ========================================================================

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email verified! You\'re entered in the contest.',
        entrantId: entrant.id,
        referralCode: referralCode?.code,
        referralLink,
        verified: true
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


















