# Deployment Guide

This directory contains deployment documentation and configurations for the Kubota Rental Platform.

## Docker Deployment

### Prerequisites
- Docker and Docker Compose installed
- Environment variables configured
- SSL certificates (for production)

### Development Deployment
```bash
# Clone the repository
git clone <repository-url>
cd kubota-rental-platform

# Copy environment files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Scale services if needed
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

## Environment Configuration

### Frontend Environment (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.kubotarentals.ca
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://kubotarentals.ca
NEXT_PUBLIC_ANALYTICS_ID=GA-...
```

### Backend Environment (.env)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db:5432/kubota_rentals
JWT_SECRET=your-production-jwt-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
REDIS_URL=redis://redis:6379
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@kubotarentals.ca
EMAIL_PASS=your-email-password
```

## Service Configuration

### Frontend Service
- **Image**: Custom Next.js image
- **Port**: 3000
- **Health Check**: HTTP GET /api/health
- **Resources**: 512MB RAM, 1 CPU

### Backend Service
- **Image**: Custom NestJS image
- **Port**: 8000
- **Health Check**: HTTP GET /health
- **Resources**: 1GB RAM, 2 CPU

### Database Service
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Volume**: postgres_data
- **Resources**: 2GB RAM, 2 CPU

### Redis Service
- **Image**: redis:7-alpine
- **Port**: 6379
- **Volume**: redis_data
- **Resources**: 256MB RAM, 1 CPU

## Monitoring Configuration

### Health Checks
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Logging Configuration
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Scaling Configuration

### Horizontal Scaling
```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Scale frontend services
docker-compose up -d --scale frontend=2
```

### Load Balancer Configuration
```nginx
upstream backend {
    server backend_1:8000;
    server backend_2:8000;
    server backend_3:8000;
}

upstream frontend {
    server frontend_1:3000;
    server frontend_2:3000;
}
```

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker-compose exec db pg_dump -U postgres kubota_rentals > backup.sql

# Restore backup
docker-compose exec -T db psql -U postgres kubota_rentals < backup.sql
```

### Volume Backup
```bash
# Backup volumes
docker run --rm -v kubota_rental_platform_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz /data
docker run --rm -v kubota_rental_platform_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis_data.tar.gz /data
```

## Security Configuration

### SSL/TLS Setup
```yaml
nginx:
  volumes:
    - ./ssl/cert.pem:/etc/nginx/ssl/cert.pem
    - ./ssl/key.pem:/etc/nginx/ssl/key.pem
```

### Firewall Rules
```bash
# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow SSH (if needed)
ufw allow 22/tcp
```

## Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports 80, 443, 3000, 8000 are available
2. **Permission issues**: Ensure Docker has proper permissions
3. **Memory issues**: Increase Docker memory allocation
4. **Network issues**: Check Docker network configuration

### Debug Commands
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs [service_name]

# Access container shell
docker-compose exec [service_name] sh

# Check resource usage
docker stats
```

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Monitor disk space usage
- Review and rotate logs
- Update SSL certificates
- Backup database weekly

### Updates
```bash
# Pull latest images
docker-compose pull

# Rebuild and restart services
docker-compose up -d --build

# Clean up unused images
docker system prune -a
```

---

*This deployment guide should be updated as the infrastructure evolves.*
