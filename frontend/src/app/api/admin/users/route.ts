import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createAdminUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'super_admin']).default('admin'),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;
    const { supabase } = adminResult;
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const requesterRole = adminResult.role;
    if (requesterRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can create admin users' },
        { status: 403 }
      );
    }

    const supabaseClient = supabase;

    if (!supabaseClient || !supabaseClient.auth?.admin) {
      logger.error('Supabase service role client unavailable for admin user creation', {
        component: 'admin-users-api',
        action: 'create_admin_user',
      });
      return NextResponse.json(
        { error: 'Service role client is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const payload = createAdminUserSchema.parse(body);

    const normalizedEmail = payload.email.trim().toLowerCase();
    const firstName = payload.firstName.trim();
    const lastName = payload.lastName.trim();
    const status = payload.status ?? 'active';

    const { data: existingUser, error: existingError } = await supabaseClient
      .from('users')
      .select('id, role, status')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingError) {
      logger.error(
        'Failed to check existing user before creation',
        { component: 'admin-users-api', action: 'create_admin_user' });
      return NextResponse.json({ error: 'Unable to verify existing user' }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    const { data: inviteData, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        data: {
          firstName,
          lastName,
          role: payload.role,
        },
      }
    );

    if (inviteError) {
      logger.error(
        'Failed to invite admin user',
        { component: 'admin-users-api', action: 'create_admin_user', metadata: { normalizedEmail } },
        inviteError
      );
      return NextResponse.json(
        { error: inviteError.message || 'Failed to invite user' },
        { status: 400 }
      );
    }

    const createdUser = inviteData?.user;
    if (!createdUser?.id) {
      logger.error('Supabase invite did not return a user id', {
        component: 'admin-users-api',
        action: 'create_admin_user',
        metadata: { normalizedEmail },
      });
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    const { error: insertError } = await supabaseClient.from('users').upsert(
      {
        id: createdUser.id,
        email: normalizedEmail,
        firstName,
        lastName,
        role: payload.role,
        status,
      },
      { onConflict: 'id' }
    );

    if (insertError) {
      logger.error(
        'Failed to upsert admin user record',
        { component: 'admin-users-api', action: 'create_admin_user', metadata: { userId: createdUser.id } },
        insertError
      );

      return NextResponse.json(
        { error: 'Failed to persist admin user record', details: insertError.message },
        { status: 500 }
      );
    }

    logger.info('Admin user invited successfully', {
      component: 'admin-users-api',
      action: 'create_admin_user',
      metadata: {
        createdUserId: createdUser.id,
        email: normalizedEmail,
        role: payload.role,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: createdUser.id,
          email: normalizedEmail,
          firstName,
          lastName,
          role: payload.role,
          status: 'active',
        },
        invitation: {
          status: 'sent',
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.issues }, { status: 400 });
    }

    logger.error(
      'Unexpected error creating admin user',
      { component: 'admin-users-api', action: 'create_admin_user' },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
