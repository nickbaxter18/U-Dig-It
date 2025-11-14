import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MonitoringService, logMetric, recordError, recordPerformance } from '../monitoring';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Monitoring Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe('logMetric', () => {
    it('should log custom metrics', async () => {
      await logMetric('bookings.created', 1, {
        customerId: 'user-123',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/metrics'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should include metric value', async () => {
      await logMetric('revenue.daily', 5000.0);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.value).toBe(5000.0);
    });

    it('should include timestamp', async () => {
      await logMetric('users.active', 150);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.timestamp).toBeDefined();
    });

    it('should include tags/dimensions', async () => {
      await logMetric('api.response_time', 250, {
        endpoint: '/api/bookings',
        method: 'GET',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.tags.endpoint).toBe('/api/bookings');
      expect(callBody.tags.method).toBe('GET');
    });
  });

  describe('recordError', () => {
    it('should record errors with stack traces', async () => {
      const error = new Error('Test error');

      await recordError(error, {
        context: 'booking-flow',
        userId: 'user-123',
      });

      expect(mockFetch).toHaveBeenCalled();
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.message).toBe('Test error');
      expect(callBody.stack).toBeDefined();
    });

    it('should include error context', async () => {
      const error = new Error('Payment failed');

      await recordError(error, {
        context: 'payment',
        bookingId: 'booking-456',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.context).toBe('payment');
      expect(callBody.bookingId).toBe('booking-456');
    });

    it('should categorize error severity', async () => {
      const error = new Error('Critical failure');

      await recordError(error, {
        severity: 'critical',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.severity).toBe('critical');
    });

    it('should include user information', async () => {
      const error = new Error('User error');

      await recordError(error, {
        userId: 'user-789',
        userEmail: 'test@example.com',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.userId).toBe('user-789');
    });

    it('should handle non-Error objects', async () => {
      await recordError('String error');

      expect(mockFetch).toHaveBeenCalled();
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.message).toBe('String error');
    });
  });

  describe('recordPerformance', () => {
    it('should record performance metrics', async () => {
      await recordPerformance('page.load', 1250, {
        page: '/dashboard',
      });

      expect(mockFetch).toHaveBeenCalled();
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.duration).toBe(1250);
    });

    it('should include performance marks', async () => {
      await recordPerformance('api.request', 350, {
        endpoint: '/api/bookings',
        marks: {
          'request-start': 100,
          'response-received': 450,
        },
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.marks).toBeDefined();
    });

    it('should calculate percentiles', async () => {
      // Record multiple samples
      await recordPerformance('query.time', 100);
      await recordPerformance('query.time', 150);
      await recordPerformance('query.time', 200);

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('MonitoringService', () => {
    it('should track application health', async () => {
      const service = new MonitoringService();

      await service.recordHealthCheck({
        status: 'healthy',
        checks: {
          database: true,
          cache: true,
          api: true,
        },
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should detect anomalies', async () => {
      const service = new MonitoringService();

      // Record normal values
      for (let i = 0; i < 10; i++) {
        await service.recordMetric('response_time', 100 + i * 5);
      }

      // Record anomaly
      await service.recordMetric('response_time', 5000);

      // Should trigger alert
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should aggregate metrics', async () => {
      const service = new MonitoringService();

      await service.recordMetric('bookings.count', 5);
      await service.recordMetric('bookings.count', 10);
      await service.recordMetric('bookings.count', 8);

      const aggregated = service.getAggregatedMetrics('bookings.count');

      expect(aggregated.count).toBe(3);
      expect(aggregated.sum).toBe(23);
      expect(aggregated.avg).toBeCloseTo(7.67);
    });
  });

  describe('Alert Thresholds', () => {
    it('should trigger alerts for high error rates', async () => {
      const service = new MonitoringService();

      // Record many errors
      for (let i = 0; i < 100; i++) {
        await service.recordError(new Error('Error'));
      }

      // Should trigger alert
      expect(service.shouldAlert('error_rate')).toBe(true);
    });

    it('should trigger alerts for slow performance', async () => {
      const service = new MonitoringService();

      await service.recordPerformance('page.load', 15000); // 15 seconds

      expect(service.shouldAlert('slow_page')).toBe(true);
    });

    it('should not trigger false alerts', async () => {
      const service = new MonitoringService();

      await service.recordMetric('bookings.count', 5);

      expect(service.shouldAlert('bookings.count')).toBe(false);
    });
  });

  describe('Data Retention', () => {
    it('should expire old metrics', () => {
      vi.useFakeTimers();
      const service = new MonitoringService();

      service.recordMetric('test.metric', 100);

      // Advance time past retention period
      vi.advanceTimersByTime(24 * 60 * 60 * 1000); // 24 hours

      service.cleanupOldData();

      const metrics = service.getMetrics('test.metric');
      expect(metrics.length).toBe(0);

      vi.useRealTimers();
    });
  });
});
