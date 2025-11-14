'use client';

import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { sanitizePassword, validatePassword, validatePasswordsMatch } from '@/lib/validators/password';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface SignUpFormProps {
  redirectTo?: string;
}

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

function SignUpFormContent({ redirectTo = '/dashboard' }: SignUpFormProps) {
  const router = useRouter();
  const { signUp, signInWithGoogle, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
  });

  // Real-time validation when fields are touched
  useEffect(() => {
    const errors: FieldErrors = {};

    // Validate firstName
    if (touched.has('firstName') && !formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (touched.has('firstName') && formData.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    // Validate lastName
    if (touched.has('lastName') && !formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (touched.has('lastName') && formData.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    // Validate email
    if (touched.has('email')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Validate phone (optional but must be valid if provided)
    if (touched.has('phone') && formData.phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = 'Please enter a valid phone number';
      } else if (formData.phone.replace(/\D/g, '').length < 10) {
        errors.phone = 'Phone number must have at least 10 digits';
      }
    }

    // Validate password
    if (touched.has('password') && formData.password) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors[0];
      }
    }

    // Validate confirmPassword
    if (touched.has('confirmPassword') && formData.confirmPassword) {
      if (!validatePasswordsMatch(formData.password, formData.confirmPassword)) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFieldErrors(errors);
  }, [formData, touched]);

  const handleProviderSignIn = async (provider: string) => {
    setIsLoading(true);
    setError('');
    try {
      if (provider === 'google') {
        await signInWithGoogle(redirectTo);
        // Redirect will be handled by the auth callback
      } else {
        router.push('/');
      }
    } catch (error) {
      logger.error('Sign in error', { component: 'SignUpForm', action: 'error' }, error instanceof Error ? error : undefined);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => new Set(prev).add(fieldName));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    // Mark all fields as touched
    setTouched(new Set(['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phone']));

    // Check all validations
    const hasErrors = Object.keys(fieldErrors).length > 0;
    if (hasErrors) {
      setError('Please fix the errors above before continuing');
      return false;
    }

    // Final password match check
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate form
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    // Sanitize password
    const cleanPassword = sanitizePassword(formData.password);

    try {
      const result = await signUp(formData.email.trim(), cleanPassword, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
        companyName: formData.company.trim() || null,
      });

      const resultAny: any = result;
      logger.debug('Signup result', {
        component: 'SignUpForm',
        action: 'signup_result',
        metadata: {
          hasUser: !!resultAny?.user,
          hasSession: !!resultAny?.session,
          userId: resultAny?.user?.id,
        },
      });

      // Check result - if user was created, it's a success!
      if (resultAny?.user) {
        if (resultAny.session) {
          // Account created and logged in immediately (email confirmation disabled)
          logger.debug('Account created and logged in', {
            component: 'SignUpForm',
            action: 'signup_success_immediate',
          });
          router.push(redirectTo);
        } else {
          // Account created successfully, email confirmation required
          logger.debug('Account created, email confirmation required', {
            component: 'SignUpForm',
            action: 'signup_success_confirm_required',
            metadata: { email: formData.email.trim() },
          });
          setUserEmail(formData.email.trim());
          setSuccess(true);
        }
      } else {
        // No user created - this would be unexpected
        logger.error('Signup succeeded but no user returned', {
          component: 'SignUpForm',
          action: 'signup_unexpected_state',
        });
        setError('Unexpected error during account creation. Please try again or contact support.');
      }
    } catch (error) {
      logger.error('Email sign up error', { component: 'SignUpForm', action: 'error' }, error instanceof Error ? error : undefined);

      // Show specific error messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already registered') || errorMessage.includes('User already registered')) {
        setError('This email is already registered. Please sign in or use a different email.');
      } else if (errorMessage.includes('weak and easy to guess') || errorMessage.includes('weak_password')) {
        setError('This password is too common and easy to guess. Please choose a more unique password with a mix of characters, numbers, and symbols.');
      } else if (errorMessage.includes('Password should be at least')) {
        setError('Password must be at least 6 characters long.');
      } else if (errorMessage.includes('Invalid email')) {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to create account. Please try again or contact support.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  // Show success message if email confirmation is required
  if (success) {
    const handleResendEmail = async () => {
      setResending(true);
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: userEmail,
        });

        if (error) throw error;

        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      } catch (err) {
        logger.error('Resend confirmation error', {
          component: 'SignUpForm',
          action: 'resend_error',
        }, err instanceof Error ? err : undefined);
      } finally {
        setResending(false);
      }
    };

    return (
      <div className="space-y-8">
        {/* Professional Success Screen */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Success Header */}
          <div className="border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50 px-8 py-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-md">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold text-gray-900">Account Created Successfully</h2>
                <p className="text-sm text-gray-600">One more step to get started</p>
              </div>
            </div>
          </div>

          {/* Email Sent Notification */}
          <div className="border-b border-gray-100 bg-blue-50 px-8 py-5">
            <div className="flex items-start space-x-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Confirmation email sent to:</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="px-8 py-6">
            <h3 className="mb-5 text-base font-semibold text-gray-900">Complete Your Setup</h3>

            <div className="space-y-5">
              {/* Step 1 */}
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <span className="text-base font-bold text-gray-700">1</span>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-semibold text-gray-900">Check your inbox</h4>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    Look for an email from <span className="font-medium text-gray-900">NickBaxter@udigit.ca</span>
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <span className="text-base font-bold text-gray-700">2</span>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-semibold text-gray-900">Click the confirmation link</h4>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    Verify your email address to activate your account
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <span className="text-base font-bold text-gray-700">3</span>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-semibold text-gray-900">You'll be automatically logged in!</h4>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    After clicking the link, you'll be taken straight to your dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Troubleshooting Section */}
          <div className="border-t border-gray-100 bg-gray-50 px-8 py-6">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900">
                <span>Didn't receive the email?</span>
                <svg className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>

              <div className="mt-4 space-y-4">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <svg className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="2" />
                    </svg>
                    Check your spam or junk folder
                  </li>
                  <li className="flex items-start">
                    <svg className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="2" />
                    </svg>
                    Wait a few minutes for email delivery
                  </li>
                  <li className="flex items-start">
                    <svg className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="2" />
                    </svg>
                    Confirmation link expires in 24 hours
                  </li>
                </ul>

                {resendSuccess ? (
                  <div className="flex items-center rounded-lg bg-emerald-50 px-4 py-3 text-emerald-700">
                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">Email sent successfully</span>
                  </div>
                ) : (
                  <button
                    onClick={handleResendEmail}
                    disabled={resending}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resending ? (
                      <>
                        <svg className="mr-2 inline h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending email...
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Resend confirmation email
                      </>
                    )}
                  </button>
                )}
              </div>
            </details>
          </div>
        </div>

        {/* Sign In Link */}
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-4 text-center shadow-sm">
          <p className="mb-3 text-sm text-gray-600">Already confirmed your email?</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Continue to Sign In
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}
      {!showEmailForm ? (
        <>
          {/* Social Sign Up Options */}
          <div className="space-y-4">
            <button
              onClick={() => handleProviderSignIn('google')}
              disabled={isLoading || loading}
              className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Image
                src="/images/google-logo.svg"
                alt="Google logo"
                width={20}
                height={20}
                className="mr-3"
              />
              {isLoading || loading ? 'Signing up...' : 'Continue with Google'}
            </button>

            <button
              onClick={() => handleProviderSignIn('github')}
              disabled={isLoading || loading}
              className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Image
                src="/images/github-logo.svg"
                alt="GitHub logo"
                width={20}
                height={20}
                className="mr-3"
              />
              {isLoading || loading ? 'Signing up...' : 'Continue with GitHub'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or create account with email</span>
            </div>
          </div>

          {/* Email Sign Up Button */}
          <button
            onClick={() => setShowEmailForm(true)}
            className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <svg
              className="mr-3 h-5 w-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </svg>
            Sign up with email
          </button>
        </>
      ) : (
        <>
          {/* Back Button */}
          <button
            onClick={() => setShowEmailForm(false)}
            className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to other options
          </button>

          {/* Email Sign Up Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('firstName')}
                  className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 ${
                    fieldErrors.firstName
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-red-500'
                  }`}
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('lastName')}
                  className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 ${
                    fieldErrors.lastName
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-red-500'
                  }`}
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={() => handleBlur('email')}
                className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 ${
                  fieldErrors.email
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-red-500'
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                autoComplete="tel"
                placeholder="(506) 555-0100"
                value={formData.phone}
                onChange={handleInputChange}
                onBlur={() => handleBlur('phone')}
                className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 ${
                  fieldErrors.phone
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-red-500'
                }`}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="company" className="mb-1 block text-sm font-medium text-gray-700">
                Company (Optional)
              </label>
              <input
                type="text"
                id="company"
                name="company"
                autoComplete="organization"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('password')}
                  className={`w-full rounded-lg border px-3 py-2 pr-10 focus:border-transparent focus:outline-none focus:ring-2 ${
                    fieldErrors.password
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-red-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}

              {/* Password Strength Indicator */}
              <PasswordStrengthIndicator
                password={formData.password}
                show={formData.password.length > 0}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`w-full rounded-lg border px-3 py-2 pr-10 focus:border-transparent focus:outline-none focus:ring-2 ${
                    fieldErrors.confirmPassword
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-red-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || loading}
              className="flex w-full justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading || loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </>
      )}

      {/* Benefits Section */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-medium text-gray-900">Why choose U-Dig It Rentals?</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Professional Kubota equipment
          </li>
          <li className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Fast delivery and pickup
          </li>
          <li className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Competitive rates
          </li>
          <li className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Expert support
          </li>
        </ul>
      </div>

      {/* Terms and Privacy */}
      <div className="text-center text-xs text-gray-500">
        By continuing, you agree to our{' '}
        <a href="/terms" className="text-red-600 hover:text-red-500">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-red-600 hover:text-red-500">
          Privacy Policy
        </a>
      </div>
    </div>
  );
}

export default function SignUpForm({ redirectTo }: SignUpFormProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpFormContent redirectTo={redirectTo} />
    </Suspense>
  );
}
