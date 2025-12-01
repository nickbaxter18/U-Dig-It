# Payment System Safeguards - Quick Reference Guide

## 🚀 Quick Start

### Check System Health
```bash
curl http://localhost:3000/api/health/payments
```

### Validate Single Booking
```bash
curl "http://localhost:3000/api/admin/payments/validate-balance?bookingId=xxx" \
  -H "Cookie: <session-cookie>"
```

### Get Balance Alerts
```bash
curl "http://localhost:3000/api/admin/payments/balance-alerts?hours=24&minSeverity=high" \
  -H "Cookie: <session-cookie>"
```

### Get Payment Metrics
```bash
curl "http://localhost:3000/api/admin/payments/metrics?days=7" \
  -H "Cookie: <session-cookie>"
```

### Trigger Manual Reconciliation
```bash
curl -X POST "http://localhost:3000/api/admin/payments/reconcile" \
  -H "Cookie: <session-cookie>" \
  -H "Content-Type: application/json" \
  -d '{"limit": 500, "autoCorrect": true}'
```

---

## 📋 API Endpoints Reference

### Health & Monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/payments` | GET | System health check |
| `/api/admin/payments/metrics` | GET | Payment processing metrics |
| `/api/admin/payments/balance-alerts` | GET | Balance discrepancy alerts |

### Validation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/payments/validate-balance` | GET | Validate single booking |
| `/api/admin/payments/validate-balances` | POST | Validate multiple bookings |
| `/api/admin/payments/validate-balances` | GET | Get validation logs |

### Reconciliation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/payments/reconcile` | POST | Manual reconciliation trigger |
| `/api/admin/payments/reconciliation-report` | POST | Generate reconciliation report |
| `/api/admin/payments/reconciliation-report` | GET | Get recent reconciliation data |
| `/api/cron/daily-balance-reconciliation` | GET | Cron endpoint (automated) |

---

## 🔍 Database Functions

### Validate Booking Balance
```sql
SELECT * FROM validate_booking_balance('booking-id-here');
```

### Check Validation Logs
```sql
SELECT * FROM balance_validation_log
ORDER BY created_at DESC
LIMIT 10;
```

### Check for Duplicates
```sql
SELECT "bookingId", amount, type, status, COUNT(*)
FROM payments
WHERE status IN ('pending', 'processing')
GROUP BY "bookingId", amount, type, status
HAVING COUNT(*) > 1;
```

---

## 📊 Alert Severity Levels

| Severity | Amount Threshold | Percentage Threshold | Action Required |
|----------|------------------|----------------------|-----------------|
| **Critical** | $100+ | 10%+ | Immediate review |
| **High** | $50+ | 5%+ | Review within 24h |
| **Medium** | $10+ | 1%+ | Review within 7d |
| **Low** | $0.01+ | 0.01%+ | Monitor monthly |

---

## ⚙️ Configuration

### Environment Variables
```bash
CRON_SECRET=your-secure-cron-secret-here
```

### Cron Schedule (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-balance-reconciliation",
      "schedule": "0 2 * * *"  // Daily at 2:00 AM UTC
    }
  ]
}
```

---

## 🎯 Common Tasks

### Daily Check
1. Check health: `GET /api/health/payments`
2. Review alerts: `GET /api/admin/payments/balance-alerts?hours=24`
3. Check metrics: `GET /api/admin/payments/metrics?days=1`

### Weekly Review
1. Generate report: `POST /api/admin/payments/reconciliation-report`
2. Review metrics: `GET /api/admin/payments/metrics?days=7`
3. Check validation logs: `GET /api/admin/payments/validate-balances?limit=100`

### Investigate Discrepancy
1. Validate booking: `GET /api/admin/payments/validate-balance?bookingId=xxx`
2. Check logs: Query `balance_validation_log` table
3. Review payments: Check `payments` and `manual_payments` tables

---

## 🚨 Troubleshooting

### Health Check Failing
- Check database connectivity
- Review recent payment failures
- Check for critical balance discrepancies

### High Discrepancy Count
- Review validation logs
- Check for refund processing issues
- Verify balance calculation logic

### Reconciliation Slow
- Reduce `limit` parameter
- Check database performance
- Review index usage

---

## 📞 Support

For issues or questions:
1. Check health endpoint first
2. Review validation logs
3. Check alert summary
4. Review metrics for trends

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0


