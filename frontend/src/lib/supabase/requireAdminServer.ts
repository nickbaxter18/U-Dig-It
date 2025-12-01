/**
 * Server Component Admin Access Check
 *
 * Use this in Server Components to verify admin access.
 * Returns user and role if admin, throws redirect/notFound if not.
 */

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

import { createClient } from './server';

const ADMIN_ROLES = ['admin', 'super_admin'];

interface RequireAdminServerResult {
  user: { id: string; email?: string };
  role: string;
}

/**
 * Verify admin access in Server Components
 *
 * @throws {redirect} Redirects to /auth/signin if not authenticated
 * @throws {notFound} Returns 404 if not admin
 * @returns User and role if admin
 */
export async function requireAdminServer(): Promise<RequireAdminServerResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/signin');
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userData || !ADMIN_ROLES.includes(userData.role)) {
    notFound(); // Return 404 for non-admins (security through obscurity)
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    role: userData.role,
  };
}






