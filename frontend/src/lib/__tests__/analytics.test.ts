import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsEvent, trackConversion, trackEvent, trackPageView } from '../analytics';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe('trackEvent', () => {
    it('should track basic events', async () => {
      await trackEvent(AnalyticsEvent.BOOKING_STARTED, {
        equipmentId: 'eq-123',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('BOOKING_STARTED'),
        })
      );
    });

    it('should include event metadata', async () => {
      await trackEvent(AnalyticsEvent.PAYMENT_COMPLETED, {
        amount: 1050.0,
        bookingId: 'booking-123',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.metadata.amount).toBe(1050.0);
      expect(callBody.metadata.bookingId).toBe('booking-123');
    });

    it('should include timestamp', async () => {
      await trackEvent(AnalyticsEvent.PAGE_VIEW, {});

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.timestamp).toBeDefined();
    });

    it('should include user ID if available', async () => {
      await trackEvent(AnalyticsEvent.BOOKING_COMPLETED, {
        userId: 'user-123',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.userId).toBe('user-123');
    });

    it('should handle tracking failures gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Should not throw
      await expect(trackEvent(AnalyticsEvent.ERROR, {})).resolves.not.toThrow();
    });
  });

  describe('trackPageView', () => {
    it('should track page views', async () => {
      await trackPageView('/equipment');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('PAGE_VIEW'),
        })
      );
    });

    it('should include page path', async () => {
      await trackPageView('/book/confirm');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.metadata.path).toBe('/book/confirm');
    });

    it('should include referrer if available', async () => {
      Object.defineProperty(document, 'referrer', {
        value: 'https://google.com',
        writable: true,
      });

      await trackPageView('/home');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.metadata.referrer).toBe('https://google.com');
    });
  });

  describe('trackConversion', () => {
    it('should track conversion events', async () => {
      await trackConversion('BOOKING_COMPLETED', {
        revenue: 1500.0,
        bookingId: 'booking-456',
      });

      expect(mockFetch).toHaveBeenCalled();
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.event).toBe('CONVERSION');
      expect(callBody.metadata.conversionType).toBe('BOOKING_COMPLETED');
    });

    it('should include revenue data', async () => {
      await trackConversion('PAYMENT_COMPLETED', {
        revenue: 2500.0,
        currency: 'CAD',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.metadata.revenue).toBe(2500.0);
      expect(callBody.metadata.currency).toBe('CAD');
    });
  });

  describe('Event Types', () => {
    it('should track booking events', async () => {
      await trackEvent(AnalyticsEvent.BOOKING_STARTED, {});
      await trackEvent(AnalyticsEvent.BOOKING_COMPLETED, {});
      await trackEvent(AnalyticsEvent.BOOKING_CANCELLED, {});

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should track payment events', async () => {
      await trackEvent(AnalyticsEvent.PAYMENT_INITIATED, {});
      await trackEvent(AnalyticsEvent.PAYMENT_COMPLETED, {});
      await trackEvent(AnalyticsEvent.PAYMENT_FAILED, {});

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should track user events', async () => {
      await trackEvent(AnalyticsEvent.USER_SIGNUP, {});
      await trackEvent(AnalyticsEvent.USER_LOGIN, {});
      await trackEvent(AnalyticsEvent.USER_LOGOUT, {});

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should track equipment events', async () => {
      await trackEvent(AnalyticsEvent.EQUIPMENT_VIEWED, {});
      await trackEvent(AnalyticsEvent.EQUIPMENT_SEARCHED, {});

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should track error events', async () => {
      await trackEvent(AnalyticsEvent.ERROR, {
        errorType: 'ValidationError',
        message: 'Invalid input',
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Privacy', () => {
    it('should not track in Do Not Track mode', async () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        writable: true,
      });

      await trackEvent(AnalyticsEvent.PAGE_VIEW, {});

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should anonymize IP addresses', async () => {
      await trackEvent(AnalyticsEvent.PAGE_VIEW, {});

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.ipAddress).toBeUndefined();
    });

    it('should not track personal information', async () => {
      await trackEvent(AnalyticsEvent.USER_LOGIN, {
        email: 'user@example.com', // Should be filtered
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.metadata.email).toBeUndefined();
    });
  });

  describe('Performance', () => {
    it('should batch events when configured', async () => {
      await trackEvent(AnalyticsEvent.PAGE_VIEW, {}, { batch: true });
      await trackEvent(AnalyticsEvent.PAGE_VIEW, {}, { batch: true });

      // Should batch and send together
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throttle rapid events', async () => {
      // Send 10 events rapidly
      for (let i = 0; i < 10; i++) {
        await trackEvent(AnalyticsEvent.CLICK, { button: `btn-${i}` });
      }

      // Should throttle
      expect(mockFetch.mock.calls.length).toBeLessThan(10);
    });
  });
});
