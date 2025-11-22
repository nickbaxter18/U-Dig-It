import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { logPermissionChange } from '@/lib/permissions/audit';
import { checkPermission } from '@/lib/permissions/middleware';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const createAdminUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'super_admin']).default('admin'),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    // Check permission
    const permissionResult = await checkPermission(request, 'admin_users:read:all');
    if (!permissionResult.hasAccess) {
      return permissionResult.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { supabase } = adminResult;
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    // Get users with pagination
    const {
      data: users,
      error: usersError,
      count,
    } = await supabase
      .from('users')
      .select('id, email, firstName, lastName, role, status', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (usersError) {
      logger.error('Failed to fetch users', {
        component: 'admin-users-api',
        action: 'get_users',
      });
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({
      users: (users || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        status: user.status,
      })),
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (error) {
    logger.error('Unexpected error fetching users', {
      component: 'admin-users-api',
      action: 'get_users',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withRateLimit(RateLimitPresets.STRICT, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;
    const { supabase } = adminResult;
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Check permission using new permission system
    const permissionResult = await checkPermission(request, 'admin_users:create:all');
    if (!permissionResult.hasAccess) {
      return (
        permissionResult.error ||
        NextResponse.json(
          { error: 'Forbidden', message: 'You do not have permission to create admin users' },
          { status: 403 }
        )
      );
    }

    const requesterUser = permissionResult.user;
    const requesterRole = adminResult.role;

    const supabaseClient = supabase;

    // Verify service role client is available (required for admin operations)
    if (!supabaseClient) {
      logger.error('Supabase client not available for admin user creation', {
        component: 'admin-users-api',
        action: 'create_admin_user',
      });
      return NextResponse.json({ error: 'Database client not configured' }, { status: 500 });
    }

    // Service role client is required for admin operations (bypasses RLS)
    if (!supabaseClient.auth?.admin) {
      logger.error('Supabase service role client unavailable for admin user creation', {
        component: 'admin-users-api',
        action: 'create_admin_user',
        metadata: {
          hasClient: !!supabaseClient,
          hasAuth: !!supabaseClient.auth,
          hasAdmin: !!supabaseClient.auth?.admin,
        },
      });
      return NextResponse.json(
        {
          error: 'Service role client is not configured',
          details:
            'Admin operations require service role access. Please check SUPABASE_SERVICE_ROLE_KEY configuration.',
        },
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
      .select('id, email, firstName, lastName, role, status')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingError) {
      logger.error(
        'Failed to check existing user before creation',
        {
          component: 'admin-users-api',
          action: 'create_admin_user',
          metadata: { email: normalizedEmail, errorCode: existingError.code },
        },
        existingError
      );
      return NextResponse.json(
        {
          error: 'Unable to verify existing user',
          details: existingError.message || 'Database query failed',
        },
        { status: 500 }
      );
    }

    // If user exists in users table, upgrade them to admin instead of erroring
    if (existingUser) {
      // Check if they're already an admin
      if (existingUser.role === 'admin' || existingUser.role === 'super_admin') {
        return NextResponse.json({ error: 'This user is already an admin' }, { status: 409 });
      }

      // Upgrade existing user to admin
      const { data: updatedUser, error: updateError } = await supabaseClient
        .from('users')
        .update({
          role: payload.role,
          status: payload.status || 'active',
          firstName: firstName || existingUser.firstName,
          lastName: lastName || existingUser.lastName,
        })
        .eq('id', existingUser.id)
        .select('id, email, firstName, lastName, role, status')
        .single();

      if (updateError) {
        logger.error(
          'Failed to upgrade user to admin',
          {
            component: 'admin-users-api',
            action: 'upgrade_user_to_admin',
            metadata: {
              userId: existingUser.id,
              email: normalizedEmail,
              currentRole: existingUser.role,
              targetRole: payload.role,
              errorCode: updateError.code,
              errorMessage: updateError.message,
            },
          },
          updateError
        );

        // Provide more specific error messages
        if (updateError.code === 'PGRST116' || updateError.message?.includes('permission denied')) {
          return NextResponse.json(
            {
              error: 'Permission denied. Unable to upgrade user. Please check RLS policies.',
              details: 'The update was blocked by database security policies.',
            },
            { status: 403 }
          );
        }

        return NextResponse.json(
          {
            error: 'Failed to upgrade user to admin',
            details: updateError.message || 'Database update failed',
          },
          { status: 500 }
        );
      }

      logger.info('User upgraded to admin successfully', {
        component: 'admin-users-api',
        action: 'upgrade_user_to_admin',
        metadata: { userId: existingUser.id, newRole: payload.role },
      });

      return NextResponse.json({
        data: updatedUser,
        message: 'User upgraded to admin successfully',
        upgraded: true,
      });
    }

    // Check if user exists in Supabase Auth but not in users table
    // Only check Auth if user not found in users table (optimization)
    try {
      const { data: authUser, error: getUserError } =
        await supabaseClient.auth.admin.getUserByEmail(normalizedEmail);

      if (!getUserError && authUser?.user) {
        // User exists in Auth but not in users table - create user record with admin role
        const { data: newUser, error: insertError } = await supabaseClient
          .from('users')
          .insert({
            id: authUser.user.id,
            email: normalizedEmail,
            firstName,
            lastName,
            role: payload.role,
            status: payload.status || 'active',
          })
          .select('id, email, firstName, lastName, role, status')
          .single();

        if (insertError) {
          logger.error(
            'Failed to create user record for existing auth user',
            {
              component: 'admin-users-api',
              action: 'create_user_record',
              metadata: { userId: authUser.user.id, email: normalizedEmail },
              error: insertError.message,
              code: insertError.code,
            },
            insertError
          );
          return NextResponse.json(
            {
              error: 'Failed to create user record',
              details: insertError.message || 'Database insert failed',
            },
            { status: 500 }
          );
        }

        logger.info('Existing auth user upgraded to admin successfully', {
          component: 'admin-users-api',
          action: 'upgrade_auth_user_to_admin',
          metadata: { userId: authUser.user.id, newRole: payload.role, email: normalizedEmail },
        });

        return NextResponse.json({
          data: newUser,
          message: 'User upgraded to admin successfully',
          upgraded: true,
        });
      }
    } catch (authCheckError) {
      // getUserByEmail might not be available in all Supabase versions
      // Log but continue to invite flow
      logger.warn(
        'Could not check auth users (may not be available in this Supabase version)',
        {
          component: 'admin-users-api',
          action: 'check_auth_user',
          metadata: { email: normalizedEmail },
        },
        authCheckError instanceof Error ? authCheckError : new Error(String(authCheckError))
      );
    }

    const { data: inviteData, error: inviteError } =
      await supabaseClient.auth.admin.inviteUserByEmail(normalizedEmail, {
        data: {
          firstName,
          lastName,
          role: payload.role,
        },
      });

    if (inviteError) {
      logger.error(
        'Failed to invite admin user',
        {
          component: 'admin-users-api',
          action: 'create_admin_user',
          metadata: { normalizedEmail },
        },
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
        {
          component: 'admin-users-api',
          action: 'create_admin_user',
          metadata: { userId: createdUser.id },
        },
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
});
