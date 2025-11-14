# 🚀 Production Deployment Guide

**Last Updated:** November 2025
**Status:** ✅ Ready for live launch

This guide walks through deploying the Supabase + Next.js platform to production using Vercel and Supabase managed services.

---

## ✅ Pre-Deployment Checklist

- [ ] Supabase migrations applied successfully in staging
- [ ] Stripe live mode keys and webhook secret ready
- [ ] SendGrid domain or sender verified
- [ ] Google Maps API key restricted to production domain
- [ ] Vercel project connected to `frontend/`
- [ ] Environment variables configured in Vercel & Supabase
- [ ] All automated tests (lint, type-check, unit, e2e) pass

---

## 1. Prepare Supabase Production Project

1. **Create / verify production project** in the Supabase dashboard.
2. **Apply database schema**:
   ```bash
   # From the workspace root
   pnpm supabase db push            # or use mcp_supabase_apply_migration
   ```
3. **Seed baseline data** (equipment, pricing, admin users) with a vetted SQL script.
4. **Review RLS policies** to ensure only authorized roles can access sensitive data.
5. **Configure storage buckets** (`contracts`, `insurance`, etc.) and confirm access policies.
6. **Rotate keys** and store them only in Vercel/Supabase secrets (never expose service role keys to the browser).

---

## 2. Configure Vercel

1. **Connect Repository**
   - Create or select a Vercel project.
   - Set **Root Directory** to `frontend/`.
   - Build command: `pnpm build`
   - Install command: `pnpm install`
   - Output directory: `.next`

2. **Set Environment Variables**
   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key *(server only)* |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Live Stripe publishable key |
   | `STRIPE_SECRET_KEY` | Live Stripe secret key |
   | `STRIPE_WEBHOOK_SECRET` | Live webhook secret |
   | `SENDGRID_API_KEY` | Production SendGrid API key |
   | `EMAIL_FROM` / `EMAIL_FROM_NAME` | Production email sender |
   | `NEXT_PUBLIC_ENABLE_STRIPE_PAYMENTS` | `true` |
   | `NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS` | `true` |

3. **Protect Secrets**
   - NEVER expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
   - Use Vercel **Environment Variables → Encrypt** for sensitive values.

---

## 3. Stripe, SendGrid & Google Maps

### Stripe
```bash
# Production webhook endpoint
https://<your-domain>/api/webhooks/stripe

# Recommended events
payment_intent.succeeded
payment_intent.payment_failed
payment_intent.canceled
payment_intent.amount_capturable_updated
charge.dispute.created
```
After deployment, trigger a live-mode payment to verify the webhook updates bookings and payments correctly.

### SendGrid
1. Authenticate the `udigitrentals.com` domain.
2. Update `EMAIL_FROM` to a verified sender (e.g., `bookings@udigitrentals.com`).
3. Send a test email using the admin panel or a temporary script.

### Google Maps
1. Restrict the API key to `https://udigitrentals.com/*` and `https://*.vercel.app/*`.
2. Enable Places, Geocoding, and Distance Matrix APIs.

---

## 4. Launch & Verification

1. **Trigger production build** (push to `main` or run `vercel --prod`).
2. **Smoke test key flows**:
   - `/` homepage loads and equipment cards render.
   - Booking flow: select dates, review pricing, reach payment screen.
   - Admin dashboard accessible for admin accounts.
   - Stripe test in live mode (use a low-value real card, then refund).
   - Emails delivered for booking confirmation and receipts.
3. **Health checks**
   ```bash
   curl -I https://udigitrentals.com
   curl https://udigitrentals.com/api/health
   ```
4. **Post-deployment review**
   - Supabase → **Logs** (API/Auth) for errors.
   - Vercel → **Analytics** for performance regressions.
   - Supabase Advisors for security/performance warnings.

---

## 5. Monitoring & Incident Response

- **Supabase Advisors** (`mcp_supabase_get_advisors`) weekly for new recommendations.
- **Supabase Logs** (`mcp_supabase_get_logs`) to investigate API/auth anomalies.
- **Vercel Analytics / Speed Insights** for Core Web Vitals.
- **Sentry** (optional) for error tracking (`SENTRY_DSN`).
- **UptimeRobot / Better Stack**: monitor `https://udigitrentals.com` and `https://udigitrentals.com/api/health`.

### On-Call Checklist
1. Confirm incident via monitoring alert.
2. Check Supabase & Vercel logs.
3. Roll back via Vercel “Re-deploy previous build” if needed.
4. Document incident in runbook and update safeguards.

---

## 6. Rollback & Disaster Recovery

- **Frontend**: Vercel → Deployments → Redeploy previous successful build.
- **Database**: Restore from Supabase point-in-time backup (Dashboard → Backups).
- **Secrets**: Rotate compromised keys immediately and update Vercel/Supabase.

---

## 7. Post-Launch To‑Do

- Schedule weekly Supabase advisor review.
- Review Stripe payouts and refunds daily.
- Monitor SendGrid bounce/spam rates.
- Revisit pricing configuration ahead of seasonal changes.

---

**Your platform is ready for production when every checklist item above is ✅.**

Need help? Ping the team, open a GitHub issue, or run the AI assistant with specific Supabase/Vercel requests. Good luck with the launch! 🎉

## Monitoring

### Sentry

- **Dashboard**: Access via web interface
- **Error tracking**: Automatic error capture
- **Performance monitoring**: Transaction tracing

### Logs

```bash
# View logs
kubectl logs -f deployment/backend-production -n production
kubectl logs -f deployment/frontend-production -n production

# Previous pod logs
kubectl logs --previous deployment/backend-production -n production
```

## Troubleshooting

### Common Issues

1. **High CPU Usage**

   ```bash
   kubectl top pods -n production
   kubectl describe pod <pod-name> -n production
   ```

2. **Memory Leaks**

   ```bash
   kubectl top pods -n production --sort-by=memory
   ```

3. **Database Connection Issues**

   ```bash
   kubectl exec -it deployment/backend-production -n production -- /bin/sh
   # Check database connectivity
   ```

4. **Service Discovery Issues**
   ```bash
   kubectl get endpoints -n production
   nslookup backend-production.production.svc.cluster.local
   ```

## Security

### SSL/TLS

- Certificates managed via cert-manager
- Automatic renewal configured
- HTTP to HTTPS redirect active

### Network Policies

```bash
# View network policies
kubectl get networkpolicies -n production

# Create network policy
kubectl apply -f infra/k8s/production/network-policy.yml
```

### Secrets Management

```bash
# View secrets
kubectl get secrets -n production

# Update secret
kubectl create secret generic backend-secrets \
  --from-literal=database-url="postgresql://..." \
  --dry-run=client -o yaml | kubectl apply -f -
```

## Performance Optimization

### Horizontal Pod Autoscaling

```bash
# Enable HPA
kubectl autoscale deployment backend-production \
  --cpu-percent=70 --min=3 --max=10 -n production

kubectl autoscale deployment frontend-production \
  --cpu-percent=70 --min=2 --max=5 -n production
```

### Resource Limits

```bash
# Update resource limits
kubectl set resources deployment/backend-production \
  -n production --limits=cpu=1000m,memory=1Gi
```

## Backup and Recovery

### Automated Backups

```bash
# Run backup script
./scripts/production-backup.sh

# Schedule via cron
0 2 * * * /path/to/kubota-rental-platform/scripts/production-backup.sh
```

### Manual Recovery

```bash
# Scale down application
kubectl scale deployment backend-production --replicas=0 -n production
kubectl scale deployment frontend-production --replicas=0 -n production

# Restore database
psql $DATABASE_URL < backup_file.sql

# Scale back up
kubectl scale deployment backend-production --replicas=3 -n production
kubectl scale deployment frontend-production --replicas=2 -n production
```

## Cost Optimization

### Resource Optimization

- Right-size pods based on usage
- Use spot instances for non-critical workloads
- Implement auto-scaling policies

### Storage Optimization

- Use appropriate storage classes
- Implement data retention policies
- Archive old data to cheaper storage

## Compliance

### Data Protection

- PII data encrypted at rest and in transit
- Regular security audits
- Access logging enabled

### GDPR Compliance

- Data processing agreements in place
- User consent management
- Data deletion capabilities

## Emergency Contacts

### Development Team

- **On-call Engineer**: +1-XXX-XXX-XXXX
- **Tech Lead**: tech-lead@udigit-rentals.com
- **DevOps Team**: devops@udigit-rentals.com

### External Services

- **Cloud Provider**: AWS Support
- **CDN Provider**: Cloudflare Support
- **Monitoring**: Sentry Support

---

**Last Updated**: October 2025 **Version**: 1.0.0 **Environment**: Production
