import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[0-9]/, 'Password must include a number'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
});

function sanitize(value: string) {
  return value.replace(/<[^>]+>/g, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, company } = registerSchema.parse(body);

    const supabase = await createClient();

    const sanitizedFirstName = sanitize(firstName);
    const sanitizedLastName = sanitize(lastName);
    const sanitizedCompany = company ? sanitize(company) : null;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
          phone,
          company: sanitizedCompany,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message || 'Unable to register user' }, { status: 400 });
    }

    if (data.user) {
      await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          firstName: sanitizedFirstName,
          lastName: sanitizedLastName,
          phone,
          companyName: sanitizedCompany,
        })
        .select()
        .single();
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email to confirm your account.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


