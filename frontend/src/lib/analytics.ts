// Analytics tracking utilities
import { logger } from '@/lib/logger';

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined') return;

  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, properties);
  }

  // Custom analytics
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Analytics Event:', {
      component: 'analytics',
      action: 'debug',
      metadata: { eventName, properties },
    });
  }
};

export const trackPageView = (pageName: string, pagePath: string) => {
  if (typeof window === 'undefined') return;

  if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_MEASUREMENT_ID', {
      page_title: pageName,
      page_location: window.location.href,
      page_path: pagePath,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    logger.debug('Page View:', { component: 'analytics', action: 'debug', metadata: { pageName, pagePath } });
  }
};

export const trackBookingStart = () => {
  trackEvent('booking_started', {
    event_category: 'booking',
    event_label: 'booking_flow_started',
  });
};

export const trackBookingStep = (step: number, stepName: string) => {
  trackEvent('booking_step', {
    event_category: 'booking',
    event_label: stepName,
    value: step,
  });
};

export const trackBookingComplete = (bookingData: unknown) => {
  trackEvent('booking_completed', {
    event_category: 'booking',
    event_label: 'booking_successful',
    value: (bookingData as any)?.total || 0,
    currency: 'CAD',
  });
};

export const trackEquipmentView = (equipmentType: string) => {
  trackEvent('equipment_viewed', {
    event_category: 'equipment',
    event_label: equipmentType,
  });
};

export const trackContactForm = (formType: string) => {
  trackEvent('contact_form_submitted', {
    event_category: 'contact',
    event_label: formType,
  });
};

export const trackPhoneCall = () => {
  trackEvent('phone_call_initiated', {
    event_category: 'contact',
    event_label: 'phone_click',
  });
};

export const trackEmailClick = () => {
  trackEvent('email_clicked', {
    event_category: 'contact',
    event_label: 'email_click',
  });
};

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

declare const gtag: (...args: unknown[]) => void;
