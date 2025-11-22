'use client';

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Hand,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { useEffect, useRef, useState } from 'react';

import { logger } from '@/lib/logger';

interface MobileContactFormProps {
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  preferredContact: 'email' | 'phone' | 'either';
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

/**
 * Mobile-optimized contact form component
 * Features:
 * - Large touch targets and easy input
 * - Voice input support
 * - Auto-save to localStorage
 * - Haptic feedback
 * - Accessibility enhancements
 * - One-handed operation support
 */
export default function MobileContactForm({ className = '' }: MobileContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    preferredContact: 'either',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [activeField, setActiveField] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Contact information
  const contactInfo = [
    { icon: Phone, label: 'Phone', value: '(506) 555-0123', href: 'tel:+15065550123' },
    {
      icon: Mail,
      label: 'Email',
      value: 'info@kubotarental.ca',
      href: 'mailto:info@kubotarental.ca',
    },
    {
      icon: MapPin,
      label: 'Address',
      value: '123 Industrial Blvd, Saint John, NB E2H 2X1',
      href: 'https://maps.google.com',
    },
    { icon: Clock, label: 'Hours', value: 'Mon-Fri: 7AM-6PM, Sat: 8AM-4PM', href: null },
  ];

  // Check for voice support
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsVoiceSupported(true);
    }
  }, []);

  // Auto-save form data to localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('contactFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData((prev) => ({ ...prev, ...parsedData }));
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          logger.error(
            'Failed to parse saved form data:',
            {
              component: 'MobileContactForm',
              action: 'error',
            },
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }
    }
  }, []);

  // Save form data to localStorage on change
  useEffect(() => {
    localStorage.setItem('contactFormData', JSON.stringify(formData));
  }, [formData]);

  // Haptic feedback
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  // Handle input change
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
        return newErrors;
      });
    }

    triggerHapticFeedback();
  };

  // Voice input handler
  const handleVoiceInput = (field: keyof FormData) => {
    if (!isVoiceSupported) return;

    setIsListening(true);
    setActiveField(field);
    triggerHapticFeedback();

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-CA';

    recognition.onresult = (event: unknown) => {
      const transcript = (event as any).results[0][0].transcript;
      handleInputChange(field, transcript);
      setIsListening(false);
      setActiveField(null);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setActiveField(null);
    };

    recognition.start();
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-()]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      triggerHapticFeedback();
      return;
    }

    setIsSubmitting(true);
    triggerHapticFeedback();

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Clear form and localStorage
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        preferredContact: 'either',
      });
      localStorage.removeItem('contactFormData');

      setIsSubmitted(true);

      // Speak confirmation
      if (!isMuted) {
        const utterance = new SpeechSynthesisUtterance(
          'Your message has been sent successfully. We will contact you soon.'
        );
        utterance.rate = 0.9;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to submit form:',
          {
            component: 'MobileContactForm',
            action: 'error',
          },
          error instanceof Error ? error : new Error(String(error))
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Speak field label
  const speakFieldLabel = (label: string) => {
    if (isMuted) return;

    const utterance = new SpeechSynthesisUtterance(label);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  };

  if (isSubmitted) {
    return (
      <div className={`rounded-2xl bg-white p-8 text-center shadow-lg ${className}`}>
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Message Sent!</h2>
        <p className="mb-6 text-gray-600">
          Thank you for contacting us. We'll get back to you within 24 hours.
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="bg-kubota-orange hover:bg-kubota-orange-dark rounded-xl px-6 py-3 font-semibold text-white transition-colors"
          style={{ minHeight: '44px' }}
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl bg-white shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
            <p className="text-gray-600">Get in touch with our team</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-gray-600" />
              ) : (
                <Volume2 className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Contact</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {contactInfo.map((info: unknown, index: unknown) => {
            const Icon = info.icon;
            const content = (
              <div className="flex items-center space-x-3 rounded-lg bg-white p-3">
                <Icon className="text-kubota-orange h-5 w-5" />
                <div>
                  <div className="text-sm text-gray-600">{info.label}</div>
                  <div className="font-medium text-gray-900">{info.value}</div>
                </div>
              </div>
            );

            return info.href ? (
              <a
                key={index}
                href={info.href}
                className="block rounded-lg transition-colors hover:bg-gray-100"
                onClick={triggerHapticFeedback}
              >
                {content}
              </a>
            ) : (
              <div key={index}>{content}</div>
            );
          })}
        </div>
      </div>

      {/* Contact Form */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 p-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
            Full Name *
          </label>
          <div className="relative">
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onFocus={() => speakFieldLabel('Full Name')}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className={`w-full rounded-xl border-2 p-4 text-lg transition-colors focus:ring-0 ${
                errors.name
                  ? 'border-red-300 focus:border-red-500'
                  : 'focus:border-kubota-orange border-gray-200'
              }`}
              style={{ minHeight: '44px' }}
              placeholder="Enter your full name"
            />
            {isVoiceSupported && (
              <button
                type="button"
                onClick={() => handleVoiceInput('name')}
                disabled={isListening && activeField === 'name'}
                aria-label={
                  isListening && activeField === 'name'
                    ? 'Voice input is listening'
                    : 'Start voice input for name'
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 transform rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                style={{ minHeight: '36px', minWidth: '36px' }}
              >
                {isListening && activeField === 'name' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600"></div>
                ) : (
                  <Hand className="h-4 w-4 text-gray-600" />
                )}
              </button>
            )}
          </div>
          {errors.name && (
            <div
              id="name-error"
              className="mt-2 flex items-center text-red-600"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="mr-1 h-4 w-4" aria-hidden="true" />
              <span className="text-sm">{errors.name}</span>
            </div>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onFocus={() => speakFieldLabel('Email Address')}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`w-full rounded-xl border-2 p-4 text-lg transition-colors focus:ring-0 ${
                errors.email
                  ? 'border-red-300 focus:border-red-500'
                  : 'focus:border-kubota-orange border-gray-200'
              }`}
              style={{ minHeight: '44px' }}
              placeholder="Enter your email address"
            />
            {isVoiceSupported && (
              <button
                type="button"
                onClick={() => handleVoiceInput('email')}
                disabled={isListening && activeField === 'email'}
                className="absolute right-3 top-1/2 -translate-y-1/2 transform rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                style={{ minHeight: '36px', minWidth: '36px' }}
              >
                {isListening && activeField === 'email' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600"></div>
                ) : (
                  <Hand className="h-4 w-4 text-gray-600" />
                )}
              </button>
            )}
          </div>
          {errors.email && (
            <div
              id="email-error"
              className="mt-2 flex items-center text-red-600"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="mr-1 h-4 w-4" aria-hidden="true" />
              <span className="text-sm">{errors.email}</span>
            </div>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Phone Number *</label>
          <div className="relative">
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              onFocus={() => speakFieldLabel('Phone Number')}
              className={`w-full rounded-xl border-2 p-4 text-lg transition-colors focus:ring-0 ${
                errors.phone
                  ? 'border-red-300 focus:border-red-500'
                  : 'focus:border-kubota-orange border-gray-200'
              }`}
              style={{ minHeight: '44px' }}
              placeholder="Enter your phone number"
            />
            {isVoiceSupported && (
              <button
                type="button"
                onClick={() => handleVoiceInput('phone')}
                disabled={isListening && activeField === 'phone'}
                aria-label={
                  isListening && activeField === 'phone'
                    ? 'Voice input is listening'
                    : 'Start voice input for phone number'
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 transform rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                style={{ minHeight: '36px', minWidth: '36px' }}
              >
                {isListening && activeField === 'phone' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600"></div>
                ) : (
                  <Hand className="h-4 w-4 text-gray-600" />
                )}
              </button>
            )}
          </div>
          {errors.phone && (
            <div
              id="phone-error"
              className="mt-2 flex items-center text-red-600"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="mr-1 h-4 w-4" aria-hidden="true" />
              <span className="text-sm">{errors.phone}</span>
            </div>
          )}
        </div>

        {/* Subject Field */}
        <div>
          <label htmlFor="subject" className="mb-2 block text-sm font-medium text-gray-700">
            Subject *
          </label>
          <div className="relative">
            <input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              onFocus={() => speakFieldLabel('Subject')}
              aria-describedby={errors.subject ? 'subject-error' : undefined}
              className={`w-full rounded-xl border-2 p-4 text-lg transition-colors focus:ring-0 ${
                errors.subject
                  ? 'border-red-300 focus:border-red-500'
                  : 'focus:border-kubota-orange border-gray-200'
              }`}
              style={{ minHeight: '44px' }}
              placeholder="What is this about?"
            />
            {isVoiceSupported && (
              <button
                type="button"
                onClick={() => handleVoiceInput('subject')}
                disabled={isListening && activeField === 'subject'}
                className="absolute right-3 top-1/2 -translate-y-1/2 transform rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                style={{ minHeight: '36px', minWidth: '36px' }}
              >
                {isListening && activeField === 'subject' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600"></div>
                ) : (
                  <Hand className="h-4 w-4 text-gray-600" />
                )}
              </button>
            )}
          </div>
          {errors.subject && (
            <div
              id="subject-error"
              className="mt-2 flex items-center text-red-600"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="mr-1 h-4 w-4" aria-hidden="true" />
              <span className="text-sm">{errors.subject}</span>
            </div>
          )}
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="mb-2 block text-sm font-medium text-gray-700">
            Message *
          </label>
          <div className="relative">
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              onFocus={() => speakFieldLabel('Message')}
              aria-describedby={errors.message ? 'message-error' : undefined}
              rows={4}
              className={`w-full resize-none rounded-xl border-2 p-4 text-lg transition-colors focus:ring-0 ${
                errors.message
                  ? 'border-red-300 focus:border-red-500'
                  : 'focus:border-kubota-orange border-gray-200'
              }`}
              placeholder="Tell us more about your inquiry..."
            />
            {isVoiceSupported && (
              <button
                type="button"
                onClick={() => handleVoiceInput('message')}
                disabled={isListening && activeField === 'message'}
                aria-label={
                  isListening && activeField === 'message'
                    ? 'Voice input is listening'
                    : 'Start voice input for message'
                }
                className="absolute bottom-3 right-3 rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                style={{ minHeight: '36px', minWidth: '36px' }}
              >
                {isListening && activeField === 'message' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600"></div>
                ) : (
                  <Hand className="h-4 w-4 text-gray-600" />
                )}
              </button>
            )}
          </div>
          {errors.message && (
            <div
              id="message-error"
              className="mt-2 flex items-center text-red-600"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="mr-1 h-4 w-4" aria-hidden="true" />
              <span className="text-sm">{errors.message}</span>
            </div>
          )}
        </div>

        {/* Preferred Contact Method */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Preferred Contact Method
          </label>
          <div className="space-y-2">
            {[
              { value: 'email', label: 'Email' },
              { value: 'phone', label: 'Phone' },
              { value: 'either', label: 'Either' },
            ].map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center space-x-3 rounded-lg bg-gray-50 p-3"
              >
                <input
                  type="radio"
                  name="preferredContact"
                  value={option.value}
                  checked={formData.preferredContact === option.value}
                  onChange={(e) => handleInputChange('preferredContact', e.target.value)}
                  className="text-kubota-orange focus:ring-kubota-orange h-5 w-5"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-kubota-orange hover:bg-kubota-orange-dark flex w-full items-center justify-center space-x-2 rounded-xl p-4 text-lg font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          style={{ minHeight: '44px' }}
        >
          {isSubmitting ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              <span>Send Message</span>
            </>
          )}
        </button>

        {/* Mobile Features Info */}
        <div className="rounded-xl bg-blue-50 p-4">
          <h4 className="mb-2 font-semibold text-blue-900">Mobile Features</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <Hand className="h-4 w-4" />
              <span>Voice input for all fields</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Auto-save to prevent data loss</span>
            </div>
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4" />
              <span>Audio feedback and confirmations</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Large touch targets for easy input</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
