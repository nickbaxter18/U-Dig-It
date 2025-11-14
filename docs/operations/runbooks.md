# Operations Runbook

**Platform:** Next.js 16 (Vercel) + Supabase (Database/Auth/Storage) + Stripe + SendGrid
**Last Updated:** November 2025

Use this runbook to triage incidents, perform maintenance, and keep the Kubota Rental Platform healthy.

---

## 🚨 Incident Response

### 1. Immediate Actions
1. Confirm the alert (monitoring, customer report, or automated test).
2. Capture the current time and any error IDs.
3. Notify the core team in Slack `#ops` with severity + symptoms.

### 2. Quick Checks
| Area | How to Inspect |
| --- | --- |
| Frontend | Vercel → Project → Deployments → latest build logs |
| Database / Auth | `mcp_supabase_get_logs({ service: 'api' })` and `{ service: 'auth' }` |
| Storage | Supabase dashboard → Storage → Usage / Logs |
| Payments | Stripe Dashboard → Developers → Logs |
| Email | SendGrid → Activity Feed |

### 3. Triage Flow
1. **Is the site down?**
   - `curl -I https://udigitrentals.com`
   - `curl https://udigitrentals.com/api/health`
2. **Is Supabase reachable?**
   - `mcp_supabase_get_logs({ service: 'api' })` for elevated error rates
   - Supabase dashboard → Monitoring → Status
3. **Identify blast radius** (only admin? all bookings? payments?).
4. **Mitigate** (rollback, temp feature flag, disable promotions).
5. **Resolve** (deploy fix, update Supabase data, rotate keys).
6. **Document** in `docs/operations/runbooks.md` (Incident Log section) or internal ticket.

---

## 🔄 Rollback Procedures

### Frontend (Vercel)
1. Vercel → Project → Deployments.
2. Select the last green deployment.
3. Click **Redeploy** → **Promote to Production**.
4. Announce rollback in Slack and verify `/api/health`.

### Supabase Migrations
1. Locate the migration version in `supabase/migrations`.
2. Use Supabase CLI or dashboard to restore a point-in-time backup.
3. If using CLI locally:
   ```bash
   pnpm supabase db reset  # destructive (local only)
   ```
4. For production, contact Supabase support if point-in-time restore is required.

### Feature Flags / Config
- Disable promotions or risky flows via Supabase tables (e.g., `feature_flags`).
- Announce temporary limitations to support staff.

---

## 🛠️ Operational Tasks

### Supabase Maintenance
| Task | Frequency | Command / Location |
| --- | --- | --- |
| Review advisors | Weekly | `mcp_supabase_get_advisors({ type: 'security' })` & `{ type: 'performance' }` |
| Monitor slow queries | Weekly | Supabase Dashboard → Database → Logs (SQL) |
| Refresh database types | After schema change | `mcp_supabase_generate_typescript_types()` |
| Rotate keys | Quarterly | Supabase → Authentication → API |

### Frontend (Vercel)
| Task | Frequency | Location |
| --- | --- | --- |
| Check build errors | Each deployment | Vercel → Deployments |
| Monitor Core Web Vitals | Weekly | Vercel → Analytics / Speed Insights |
| Review environment vars | Monthly | Vercel → Settings → Environment Variables |

### Stripe & SendGrid
| Task | Frequency | Location |
| --- | --- | --- |
| Review disputes/refunds | Weekly | Stripe Dashboard |
| Verify webhook health | Weekly | Stripe → Developers → Webhooks |
| Monitor email deliverability | Weekly | SendGrid → Activity / Suppressions |

---

## 🧹 Scheduled Maintenance

### Daily
- Check Supabase logs for spikes.
- Confirm Vercel uptime and deploy status.
- Review Stripe dashboard for failed payments or disputes.

### Weekly
- Run automated test suite against production config (Playwright smoke tests).
- Review Supabase advisors and resolve new warnings.
- Inspect Supabase storage usage (contracts, insurance documents).

### Monthly
- Rotate API keys if required by vendors.
- Audit Supabase RLS policies and verify indexes.
- Review backups (Supabase Dashboard → Database → Backups).

---

## 📈 Performance & Capacity

| Metric | Target | How to Measure |
| --- | --- | --- |
| Homepage TTFB | < 200 ms | Vercel Analytics |
| Booking creation success | ≥ 99% | Stripe + Supabase booking stats |
| Email delivery rate | ≥ 98% | SendGrid Activity |
| Supabase DB CPU | < 70% sustained | Supabase Monitoring |

If thresholds are breached:
1. Check Supabase usage dashboards.
2. Add indexes / adjust queries.
3. Scale Supabase plan if necessary.

---

## 🔐 Security & Compliance

- **Supabase RLS**: mandatory for every user-facing table. Audit policies quarterly.
- **Stripe**: verify PCI compliance by using Stripe Elements only (no raw card storage).
- **SendGrid**: maintain unsubscribe links where applicable.
- **Logging**: PII is not logged; use Supabase audit tables for critical actions.
- **Incident documentation**: record root cause, resolution, follow-up tasks.

---

## 🧭 Runbook Commands Cheatsheet

```bash
# Health checks
curl https://udigitrentals.com/api/health

# Supabase logs (API/Auth)
> mcp_supabase_get_logs({ service: 'api' })
> mcp_supabase_get_logs({ service: 'auth' })

# Supabase advisors
> mcp_supabase_get_advisors({ type: 'security' })
> mcp_supabase_get_advisors({ type: 'performance' })

# Local verification
bash start-frontend-clean.sh
cd frontend && pnpm type-check && pnpm test
```

---

## 📚 Incident Log Template

When an incident occurs, capture the following:

```
Date:
Reporter:
Severity: (Low / Medium / High / Critical)
Symptoms:
Root Cause:
Resolution:
Follow-up Actions:
Links (logs, PRs, dashboards):
```

Store the incident summary in the internal knowledge base or `docs/operations/incidents/YYYY-MM.md`.

---

Maintain this runbook as the single source of truth for operational knowledge. If a step changed or a new tool was introduced, update this document immediately after the incident or maintenance window. 🚧
# Operations Runbooks

## 🚨 Emergency Procedures

### **Critical Incident Response**
1. **Immediate Actions**
   - Check system status dashboard
   - Verify all health endpoints
   - Review recent deployments
   - Check monitoring alerts

2. **Communication**
   - Notify team via Slack/Teams
   - Update status page
   - Escalate to management if needed
   - Document all actions taken

3. **Recovery Steps**
   - Identify root cause
   - Implement fix or rollback
   - Verify system stability
   - Monitor for 24 hours

### **Database Issues**
1. **Connection Problems**
   ```bash
   # Check database connectivity
   kubectl exec -it postgres-pod -- pg_isready

   # Check connection pool
   kubectl logs backend-pod | grep "connection"

   # Restart database if needed
   kubectl rollout restart deployment/postgres
   ```

2. **Performance Issues**
   ```bash
   # Check slow queries
   kubectl exec -it postgres-pod -- psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

   # Check database size
   kubectl exec -it postgres-pod -- psql -c "SELECT pg_size_pretty(pg_database_size('udigit_rental'));"
   ```

3. **Data Corruption**
   ```bash
   # Check database integrity
   kubectl exec -it postgres-pod -- psql -c "VACUUM ANALYZE;"

   # Restore from backup if needed
   kubectl exec -it postgres-pod -- psql -d udigit_rental < backup.sql
   ```

### **Application Issues**
1. **Frontend Problems**
   ```bash
   # Check frontend health
   curl -f https://udigit-rentals.com/health

   # Check build status
   kubectl logs frontend-pod | grep "error"

   # Restart frontend
   kubectl rollout restart deployment/frontend
   ```

2. **Backend Problems**
   ```bash
   # Check backend health
   curl -f https://api.udigit-rentals.com/health

   # Check API responses
   curl -f https://api.udigit-rentals.com/api/equipment

   # Restart backend
   kubectl rollout restart deployment/backend
   ```

3. **Payment Issues**
   ```bash
   # Check Stripe connectivity
   curl -f https://api.udigit-rentals.com/api/payments/health

   # Verify Stripe keys
   kubectl get secret stripe-secrets -o yaml

   # Check payment logs
   kubectl logs backend-pod | grep "stripe"
   ```

## 🔧 Maintenance Procedures

### **Daily Maintenance**
1. **Health Checks**
   - Verify all services are running
   - Check disk space usage
   - Review error logs
   - Monitor performance metrics

2. **Backup Verification**
   - Check backup completion
   - Verify backup integrity
   - Test restore procedures
   - Update backup documentation

3. **Security Monitoring**
   - Review security alerts
   - Check for vulnerabilities
   - Update security patches
   - Monitor access logs

### **Weekly Maintenance**
1. **Performance Review**
   - Analyze performance metrics
   - Check for bottlenecks
   - Optimize slow queries
   - Update performance baselines

2. **Security Updates**
   - Update dependencies
   - Apply security patches
   - Review access controls
   - Update security documentation

3. **Capacity Planning**
   - Monitor resource usage
   - Plan for growth
   - Update scaling policies
   - Review cost optimization

### **Monthly Maintenance**
1. **Compliance Review**
   - GDPR compliance check
   - PCI-DSS validation
   - Equipment rental regulations
   - Audit trail review

2. **Disaster Recovery**
   - Test backup procedures
   - Verify recovery capabilities
   - Update recovery documentation
   - Conduct recovery drills

3. **Performance Optimization**
   - Analyze trends
   - Optimize code
   - Update infrastructure
   - Plan improvements

## 📊 Monitoring & Alerting

### **Key Metrics to Monitor**
1. **Application Metrics**
   - Response time < 100ms
   - Error rate < 0.1%
   - Uptime > 99.9%
   - Throughput > 1000 req/min

2. **Database Metrics**
   - Connection count < 80%
   - Query time < 100ms
   - Disk usage < 80%
   - Memory usage < 80%

3. **Business Metrics**
   - Booking success rate > 99%
   - Payment success rate > 99.5%
   - Customer satisfaction > 4.5/5
   - Equipment utilization > 80%

### **Alert Thresholds**
1. **Critical Alerts**
   - Service down
   - Database unavailable
   - Payment processing failed
   - Security breach detected

2. **Warning Alerts**
   - High response time
   - High error rate
   - Resource usage > 80%
   - Performance degradation

3. **Info Alerts**
   - Deployment completed
   - Backup completed
   - Security scan completed
   - Performance test completed

## 🔄 Deployment Procedures

### **Staging Deployment**
1. **Pre-deployment**
   - Run quality gates
   - Execute security scans
   - Run performance tests
   - Verify test coverage

2. **Deployment**
   - Deploy to staging
   - Run smoke tests
   - Verify functionality
   - Monitor for issues

3. **Post-deployment**
   - Run regression tests
   - Check performance
   - Verify security
   - Update documentation

### **Production Deployment**
1. **Pre-deployment**
   - Final quality checks
   - Security validation
   - Performance verification
   - Backup current state

2. **Deployment**
   - Blue-green deployment
   - Health check validation
   - Traffic switching
   - Monitoring activation

3. **Post-deployment**
   - Verify all services
   - Check business flows
   - Monitor performance
   - Update stakeholders

### **Rollback Procedures**
1. **Immediate Rollback**
   - Stop current deployment
   - Switch traffic to previous version
   - Verify system stability
   - Notify team

2. **Data Rollback**
   - Restore database from backup
   - Verify data integrity
   - Update application state
   - Test functionality

3. **Configuration Rollback**
   - Revert configuration changes
   - Restart affected services
   - Verify functionality
   - Update documentation

## 🛡️ Security Procedures

### **Security Incident Response**
1. **Detection**
   - Monitor security alerts
   - Check access logs
   - Review system behavior
   - Analyze anomalies

2. **Containment**
   - Isolate affected systems
   - Block malicious traffic
   - Preserve evidence
   - Notify security team

3. **Recovery**
   - Patch vulnerabilities
   - Update security controls
   - Restore normal operations
   - Monitor for recurrence

### **Security Monitoring**
1. **Access Monitoring**
   - Failed login attempts
   - Unusual access patterns
   - Privilege escalation
   - Data access anomalies

2. **System Monitoring**
   - File system changes
   - Process anomalies
   - Network traffic
   - Configuration changes

3. **Application Monitoring**
   - Input validation
   - Output encoding
   - Authentication failures
   - Authorization errors

## 📈 Performance Optimization

### **Performance Monitoring**
1. **Application Performance**
   - Response time analysis
   - Throughput monitoring
   - Error rate tracking
   - Resource utilization

2. **Database Performance**
   - Query performance
   - Connection pooling
   - Index optimization
   - Cache efficiency

3. **Infrastructure Performance**
   - CPU utilization
   - Memory usage
   - Disk I/O
   - Network latency

### **Optimization Strategies**
1. **Code Optimization**
   - Algorithm improvements
   - Memory management
   - Caching strategies
   - Database queries

2. **Infrastructure Optimization**
   - Resource allocation
   - Scaling policies
   - Load balancing
   - CDN optimization

3. **Database Optimization**
   - Query optimization
   - Index tuning
   - Connection pooling
   - Cache configuration

## 🔍 Troubleshooting Guide

### **Common Issues**
1. **High Response Time**
   - Check database queries
   - Verify cache efficiency
   - Review resource usage
   - Analyze network latency

2. **Memory Issues**
   - Check for memory leaks
   - Review garbage collection
   - Analyze heap usage
   - Optimize data structures

3. **Database Issues**
   - Check connection pool
   - Verify query performance
   - Review index usage
   - Analyze lock contention

### **Debugging Procedures**
1. **Log Analysis**
   - Review application logs
   - Check system logs
   - Analyze error patterns
   - Identify root causes

2. **Performance Analysis**
   - Profile application code
   - Analyze database queries
   - Review resource usage
   - Identify bottlenecks

3. **Network Analysis**
   - Check connectivity
   - Analyze traffic patterns
   - Review firewall rules
   - Verify DNS resolution

## 📞 Escalation Procedures

### **Escalation Matrix**
1. **Level 1**: Development Team
   - Code issues
   - Application bugs
   - Performance problems
   - Feature requests

2. **Level 2**: DevOps Team
   - Infrastructure issues
   - Deployment problems
   - Monitoring issues
   - Security concerns

3. **Level 3**: Management
   - Business impact
   - Security breaches
   - Compliance issues
   - Strategic decisions

### **Communication Channels**
1. **Immediate**: Slack/Teams
2. **Formal**: Email
3. **Documentation**: Confluence
4. **Tracking**: Jira/GitHub Issues

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Maintainer**: DevOps Team
