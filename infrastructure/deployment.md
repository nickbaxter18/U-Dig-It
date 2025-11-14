# Infrastructure & Deployment Guide

This directory contains infrastructure documentation and deployment configurations for the Kubota Rental Platform.

## Deployment Architecture

### Production Environment
- **Frontend**: Vercel (Next.js optimized hosting)
- **Backend**: Railway or Render (Node.js hosting)
- **Database**: Managed PostgreSQL service
- **Cache**: Managed Redis service
- **CDN**: Vercel Edge Network

### Development Environment
- **Local Development**: Docker Compose
- **Database**: Local PostgreSQL with Docker
- **Cache**: Local Redis with Docker

## Environment Configuration

### Frontend Environment Variables
```env
NEXT_PUBLIC_API_URL=https://api.kubotarentals.ca
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://kubotarentals.ca
```

### Backend Environment Variables
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-production-jwt-secret
STRIPE_SECRET_KEY=sk_live_...
REDIS_URL=redis://host:6379
```

## Deployment Process

### Automated Deployment
1. **Code Push**: Changes pushed to main branch
2. **CI/CD Pipeline**: GitHub Actions triggered
3. **Testing**: Automated tests run
4. **Build**: Applications built for production
5. **Deploy**: Applications deployed to hosting services

### Manual Deployment
1. **Build Applications**
   ```bash
   pnpm run build
   ```

2. **Deploy Frontend to Vercel**
   ```bash
   vercel --prod
   ```

3. **Deploy Backend to Railway/Render**
   - Connect GitHub repository
   - Configure environment variables
   - Deploy from main branch

## Database Management

### Migrations
- TypeORM migrations for schema changes
- Automated migration execution in CI/CD
- Rollback procedures for failed migrations

### Backup Strategy
- Daily automated backups
- Point-in-time recovery capability
- Cross-region backup replication

## Monitoring & Alerting

### Application Monitoring
- **Uptime Monitoring**: Pingdom or UptimeRobot
- **Performance Monitoring**: New Relic or DataDog
- **Error Tracking**: Sentry for error reporting
- **Log Management**: LogRocket or similar service

### Infrastructure Monitoring
- **Server Metrics**: CPU, Memory, Disk usage
- **Database Performance**: Query performance, connection pools
- **Cache Performance**: Hit rates, memory usage

## Security Considerations

### SSL/TLS
- Automatic SSL certificates via Let's Encrypt
- HTTPS enforcement across all services
- HSTS headers for security

### Network Security
- Firewall configuration
- DDoS protection
- Rate limiting and abuse prevention

### Data Security
- Database encryption at rest
- Secure environment variable management
- Regular security audits and penetration testing

## Scaling Strategy

### Horizontal Scaling
- Load balancer configuration
- Auto-scaling based on traffic
- Database read replicas

### Vertical Scaling
- Resource monitoring and optimization
- Performance tuning
- Capacity planning

## Disaster Recovery

### Backup Procedures
- Automated daily backups
- Cross-region backup storage
- Regular backup restoration testing

### Recovery Procedures
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour
- Documented recovery procedures

## Cost Optimization

### Resource Optimization
- Right-sizing instances based on usage
- Reserved instances for predictable workloads
- Spot instances for non-critical workloads

### Monitoring Costs
- Cost alerts and budgets
- Regular cost reviews
- Resource utilization optimization

---

*This infrastructure guide should be reviewed and updated regularly as the system grows.*
