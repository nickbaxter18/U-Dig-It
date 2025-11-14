'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [formState, setFormState] = useState<FormState>({
    loading: false,
    success: false,
    error: null,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState({ loading: true, success: false, error: null });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setFormState({ loading: false, success: true, error: null });
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      } else {
        setFormState({
          loading: false,
          success: false,
          error: result.message || 'An error occurred',
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Contact form error:', { component: 'ContactForm', action: 'error' }, error instanceof Error ? error : new Error(String(error)));
      }
      setFormState({ loading: false, success: false, error: 'Network error. Please try again.' });
    }
  };

  return (
    <div className="premium-form-container rounded-2xl border-2 border-gray-100 p-8">
      <div className="premium-form-ambient"></div>
      <h2 className="relative z-10 mb-6 text-2xl font-bold text-gray-900">Send Us a Message</h2>

      {formState.success && (
        <div className="relative z-10 mb-6 rounded-md border border-green-200 bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Thank you for your message! We will get back to you within 24 hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {formState.error && (
        <div className="relative z-10 mb-6 rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{formState.error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="premium-label">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className="premium-input mt-1 block w-full rounded-lg border-2 border-gray-200 px-4 py-3 outline-none"
              aria-describedby="firstName-error"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="premium-label">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className="premium-input mt-1 block w-full rounded-lg border-2 border-gray-200 px-4 py-3 outline-none"
              aria-describedby="lastName-error"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="premium-label">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="premium-input mt-1 block w-full rounded-lg border-2 border-gray-200 px-4 py-3 outline-none"
            aria-describedby="email-error"
          />
        </div>

        <div>
          <label htmlFor="phone" className="premium-label">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="premium-input mt-1 block w-full rounded-lg border-2 border-gray-200 px-4 py-3 outline-none"
            aria-describedby="phone-error"
          />
        </div>

        <div>
          <label htmlFor="subject" className="premium-label">
            Subject *
          </label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            required
            className="premium-select mt-1 block w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 outline-none"
            aria-describedby="subject-error"
          >
            <option value="">Select a subject</option>
            <option value="rental-inquiry">Equipment Rental Inquiry</option>
            <option value="availability">Availability Question</option>
            <option value="pricing">Pricing Information</option>
            <option value="support">Technical Support</option>
            <option value="delivery">Delivery/Pickup</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="premium-label">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleInputChange}
            required
            className="premium-textarea mt-1 block w-full rounded-lg border-2 border-gray-200 px-4 py-3 outline-none"
            placeholder="Please provide details about your inquiry..."
            aria-describedby="message-error"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={formState.loading}
            className="premium-button w-full rounded-lg bg-gradient-to-r from-[#E1BC56] to-yellow-500 px-6 py-4 font-bold text-white focus:outline-none focus:ring-4 focus:ring-[#E1BC56]/20"
          >
            {formState.loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending Message...
              </div>
            ) : (
              'Send Message'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
