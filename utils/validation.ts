// Validation Utilities
// This file contains validation functions and schemas

import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const urlSchema = z.string().url('Invalid URL');

// Equipment validation schemas
export const equipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  specifications: z.record(z.any()).optional(),
  rentalRate: z.number().positive('Rental rate must be positive'),
  location: z.string().min(1, 'Location is required'),
  availability: z.enum(['available', 'rented', 'maintenance', 'unavailable']),
});

// Booking validation schemas
export const bookingSchema = z.object({
  equipmentId: z.string().uuid('Invalid equipment ID'),
  customerId: z.string().uuid('Invalid customer ID'),
  startDate: z.date(),
  endDate: z.date(),
  notes: z.string().optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

// Customer validation schemas
export const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: emailSchema,
  phone: phoneSchema,
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    province: z.string().min(1, 'Province is required'),
    postalCode: z.string().regex(/^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/, 'Invalid postal code'),
  }),
});

// Payment validation schemas
export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  bookingId: z.string().uuid('Invalid booking ID'),
});

// User validation schemas
export const userSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['customer', 'admin', 'staff']).default('customer'),
});

// Login validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Validation utility functions
export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

export function validatePhone(phone: string): boolean {
  try {
    phoneSchema.parse(phone);
    return true;
  } catch {
    return false;
  }
}

export function validatePostalCode(postalCode: string): boolean {
  const canadianPostalCodeRegex = /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/;
  return canadianPostalCodeRegex.test(postalCode);
}

export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return endDate > startDate;
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Form validation utilities
export function getFieldError(
  field: string,
  errors: Record<string, string[]>
): string | undefined {
  return errors[field]?.[0];
}

export function hasFieldError(
  field: string,
  errors: Record<string, string[]>
): boolean {
  return !!errors[field]?.length;
}

// API response validation
export function validateApiResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => e.message).join(', '),
      };
    }
    return {
      success: false,
      error: 'Validation failed',
    };
  }
}
