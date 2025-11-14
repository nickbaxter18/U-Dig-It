'use client';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import Link from 'next/link';
import { useState } from 'react';

interface GuestCheckoutProps {
  onGuestCheckout: (guestData: GuestData) => void;
  onLogin: () => void;
  onRegister: () => void;
}

interface GuestData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export default function GuestCheckout({
  onGuestCheckout,
  onLogin,
  onRegister,
}: GuestCheckoutProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<GuestData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-()]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onGuestCheckout(formData);
    } catch (error: unknown) {
      setErrors({ general: error instanceof Error ? error.message : 'Checkout failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="premium-form-container mx-auto max-w-md rounded-2xl border-2 border-gray-100 p-8">
      <div className="premium-form-ambient"></div>

      <div className="relative z-10 mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Guest Checkout</h2>
        <p className="mt-2 text-gray-600">Complete your booking without creating an account</p>
      </div>

      {errors.general && (
        <div className="relative z-10 mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{errors.general}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="premium-label">
              First name *
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              className={`premium-input mt-1 block w-full rounded-lg border-2 px-4 py-3 outline-none ${
                errors.firstName ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="First name"
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
          </div>

          <div>
            <label htmlFor="lastName" className="premium-label">
              Last name *
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              className={`premium-input mt-1 block w-full rounded-lg border-2 px-4 py-3 outline-none ${
                errors.lastName ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Last name"
            />
            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="premium-label">
            Email address *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={`premium-input mt-1 block w-full rounded-lg border-2 px-4 py-3 outline-none ${
              errors.email ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="Enter your email"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="premium-label">
            Phone number (optional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className={`premium-input mt-1 block w-full rounded-lg border-2 px-4 py-3 outline-none ${
              errors.phone ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="Enter your phone number"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="premium-button flex w-full justify-center rounded-lg border border-transparent bg-gradient-to-r from-[#E1BC56] to-yellow-500 px-6 py-4 text-base font-bold text-white focus:outline-none focus:ring-4 focus:ring-[#E1BC56]/20"
          >
            {isSubmitting ? 'Processing...' : 'Continue as Guest'}
          </button>
        </div>
      </form>

      <div className="relative z-10 mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={onLogin}
            className="flex w-full justify-center rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
          >
            Sign in to existing account
          </button>

          <button
            onClick={onRegister}
            className="flex w-full justify-center rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
          >
            Create new account
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-6 text-center">
        <p className="text-xs text-gray-500">
          By continuing as a guest, you agree to our{' '}
          <Link href="/terms" className="text-blue-600 hover:text-blue-500">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
