import { User } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { createClient } from './server';
import { createServiceClient } from './service';

const ADMIN_ROLES = ['admin', 'super_admin'];

interface RequireAdminSuccess {
  supabase: ReturnType<typeof createServiceClient>;
  user: User;
  role: string;
}

type RequireAdminResult =
  | (RequireAdminSuccess & { error?: undefined })
  | { supabase: Awaited<ReturnType<typeof createClient>>; error: NextResponse };

export async function requireAdmin(request: NextRequest): Promise<RequireAdminResult> {
  const anonSupabase = await createClient();

  const authHeader = request.headers.get('authorization');
  let user: User | null = null;
  let authError = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const { data, error } = await anonSupabase.auth.getUser(token);
    user = data?.user ?? null;
    authError = error;
  } else {
    const { data, error } = await anonSupabase.auth.getUser();
    user = data?.user ?? null;
    authError = error;
  }

  if (authError || !user) {
    return {
      supabase: anonSupabase,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: userData, error: userError } = await anonSupabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userData || !ADMIN_ROLES.includes(userData.role)) {
    return {
      supabase: anonSupabase,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  const serviceSupabase = createServiceClient();
  const supabaseClient = serviceSupabase ?? anonSupabase;

  return {
    supabase: supabaseClient,
    user,
    role: userData.role,
  };
}
