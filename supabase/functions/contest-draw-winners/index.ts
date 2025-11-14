/**
 * Contest Winner Draw Edge Function
 *
 * Admin-only function to randomly select contest winners
 * Features: Cryptographically secure random selection, audit trail, verification
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface DrawRequest {
  contestMonth: string; // YYYY-MM-DD format (first day of month)
  prizeType: 'grand_prize_1' | 'grand_prize_2_referral';
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

    // ========================================================================
    // VERIFY ADMIN AUTH
    // ========================================================================

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin role
    const { data: userData } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // PARSE REQUEST
    // ========================================================================

    const body: DrawRequest = await req.json();

    if (!body.contestMonth || !body.prizeType) {
      return new Response(
        JSON.stringify({ error: 'Missing contestMonth or prizeType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // CHECK IF WINNER ALREADY DRAWN
    // ========================================================================

    const { data: existingWinner } = await supabaseClient
      .from('contest_winners')
      .select('id, entrant_id')
      .eq('contest_month', body.contestMonth)
      .eq('prize_type', body.prizeType)
      .single();

    if (existingWinner) {
      return new Response(
        JSON.stringify({
          error: 'Winner already drawn for this prize',
          winnerId: existingWinner.id
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // GET ELIGIBLE ENTRANTS
    // ========================================================================

    let eligibleEntrants: any[] = [];

    if (body.prizeType === 'grand_prize_1') {
      // Grand Prize 1: ALL verified entrants
      const { data, error } = await supabaseClient
        .from('contest_entrants')
        .select('id, first_name, last_name, email')
        .eq('contest_month', body.contestMonth)
        .eq('verified', true)
        .eq('disqualified', false);

      if (error) {
        console.error('Error fetching entrants:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch entrants' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      eligibleEntrants = data || [];

    } else if (body.prizeType === 'grand_prize_2_referral') {
      // Grand Prize 2: Only entrants with VALIDATED referrals
      const { data, error } = await supabaseClient
        .from('contest_referrals')
        .select(`
          referrer_id,
          referee_id,
          contest_entrants!contest_referrals_referrer_id_fkey(id, first_name, last_name, email),
          contest_entrants!contest_referrals_referee_id_fkey(id, first_name, last_name, email)
        `)
        .eq('contest_month', body.contestMonth)
        .eq('validated', true);

      if (error) {
        console.error('Error fetching referral entrants:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch referral entrants' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Collect unique entrants (both referrers and referees)
      const entrantSet = new Set<string>();
      const entrantMap = new Map<string, any>();

      data?.forEach((ref: any) => {
        if (ref.contest_entrants) {
          entrantSet.add(ref.referrer_id);
          entrantMap.set(ref.referrer_id, ref.contest_entrants);
        }
      });

      eligibleEntrants = Array.from(entrantSet).map(id => entrantMap.get(id));
    }

    // ========================================================================
    // VALIDATE POOL SIZE
    // ========================================================================

    if (eligibleEntrants.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No eligible entrants found for this prize type',
          details: `Prize: ${body.prizeType}, Month: ${body.contestMonth}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // RANDOM SELECTION (Cryptographically Secure)
    // ========================================================================

    // Generate random seed for audit trail
    const seed = crypto.randomUUID();

    // Use crypto.getRandomValues for secure random selection
    const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % eligibleEntrants.length;
    const winner = eligibleEntrants[randomIndex];

    // Generate unique voucher code
    const voucherCode = `CONTEST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculate expiration (6 months from draw)
    const voucherExpires = new Date();
    voucherExpires.setMonth(voucherExpires.getMonth() + 6);

    // ========================================================================
    // CREATE WINNER RECORD
    // ========================================================================

    const { data: winnerRecord, error: winnerError } = await supabaseClient
      .from('contest_winners')
      .insert({
        entrant_id: winner.id,
        contest_month: body.contestMonth,
        prize_type: body.prizeType,
        prize_description: '4-hour machine + operator voucher (value: $450)',
        drawn_at: new Date().toISOString(),
        draw_seed: seed,
        total_entries_at_draw: eligibleEntrants.length,
        voucher_code: voucherCode,
        voucher_expires_at: voucherExpires.toISOString().split('T')[0],
        notified_at: new Date().toISOString(),
        response_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();

    if (winnerError) {
      console.error('Error creating winner:', winnerError);
      return new Response(
        JSON.stringify({ error: 'Failed to record winner' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // LOG DRAW EVENT
    // ========================================================================

    await supabaseClient.from('contest_audit_logs').insert({
      action: 'winner_drawn',
      entrant_id: winner.id,
      metadata: {
        prizeType: body.prizeType,
        contestMonth: body.contestMonth,
        totalEntries: eligibleEntrants.length,
        drawSeed: seed,
        selectedIndex: randomIndex,
        voucherCode,
        drawnBy: user.id
      }
    });

    await supabaseClient.from('contest_events').insert({
      event_type: 'winner_selected',
      entrant_id: winner.id,
      properties: {
        prizeType: body.prizeType,
        voucherCode
      }
    });

    // ========================================================================
    // SEND WINNER NOTIFICATION EMAIL
    // ========================================================================

    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || ''
      },
      body: JSON.stringify({
        to: winner.email,
        subject: 'YOU WON! 🎉 Claim Your 4-Hour Machine Voucher - U-Dig It Rentals',
        template: 'contest_winner',
        data: {
          firstName: winner.first_name,
          voucherCode,
          voucherExpires: voucherExpires.toLocaleDateString(),
          responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
        }
      })
    });

    // ========================================================================
    // RETURN SUCCESS
    // ========================================================================

    return new Response(
      JSON.stringify({
        success: true,
        winner: {
          id: winner.id,
          firstName: winner.first_name,
          lastName: winner.last_name,
          email: winner.email,
          voucherCode,
          voucherExpires: voucherExpires.toISOString()
        },
        drawDetails: {
          prizeType: body.prizeType,
          totalEntries: eligibleEntrants.length,
          selectedIndex: randomIndex,
          seed
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Draw error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


















