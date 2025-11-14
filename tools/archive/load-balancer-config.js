const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class LoadBalancerConfig {
  constructor() {
    this.config = {
      nginx: {
        upstream: {
          servers: [
            { name: 'auth', host: 'localhost:3001', weight: 1 },
            { name: 'users', host: 'localhost:3002', weight: 1 },
            { name: 'equipment', host: 'localhost:3003', weight: 1 },
            { name: 'bookings', host: 'localhost:3004', weight: 1 },
            { name: 'payments', host: 'localhost:3005', weight: 1 },
            { name: 'notifications', host: 'localhost:3006', weight: 1 },
          ],
        },
        ssl: {
          enabled: true,
          certificate: '/etc/ssl/certs/cert.pem',
          key: '/etc/ssl/private/key.pem',
        },
        rateLimiting: {
          enabled: true,
          rate: '100r/s',
          burst: 200,
        },
      },
      haproxy: {
        global: {
          maxconn: 4096,
          log: '127.0.0.1:514',
        },
        defaults: {
          mode: 'http',
          timeout: {
            connect: '5s',
            client: '50s',
            server: '50s',
          },
        },
        frontend: {
          name: 'api_frontend',
          bind: '*:80',
          redirect: 'scheme https code 301',
        },
        backend: {
          name: 'api_backend',
          balance: 'roundrobin',
          servers: [
            { name: 'auth1', host: 'localhost:3001', check: 'enabled' },
            { name: 'auth2', host: 'localhost:3001', check: 'enabled' },
            { name: 'users1', host: 'localhost:3002', check: 'enabled' },
            { name: 'users2', host: 'localhost:3002', check: 'enabled' },
          ],
        },
      },
    };
  }

  async generateLoadBalancerConfigs() {
    console.log(
      '⚖️ Load Balancer Config - Generating comprehensive load balancer configurations...'
    );

    // Generate Nginx configuration
    await this.generateNginxConfig();

    // Generate HAProxy configuration
    await this.generateHAProxyConfig();

    // Generate Docker Compose for load balancer
    await this.generateDockerCompose();

    // Generate Kubernetes ingress
    await this.generateKubernetesIngress();

    // Generate monitoring configuration
    await this.generateMonitoringConfig();

    console.log('✅ Load balancer configurations generated!');
  }

  async generateNginxConfig() {
    console.log('🌐 Generating Nginx configuration...');

    const nginxConfig = `
# Nginx Load Balancer Configuration
upstream api_backend {
    # Authentication service
    server localhost:3001 weight=1 max_fails=3 fail_timeout=30s;
    server localhost:3001 weight=1 max_fails=3 fail_timeout=30s;
    
    # Users service
    server localhost:3002 weight=1 max_fails=3 fail_timeout=30s;
    server localhost:3002 weight=1 max_fails=3 fail_timeout=30s;
    
    # Equipment service
    server localhost:3003 weight=1 max_fails=3 fail_timeout=30s;
    server localhost:3003 weight=1 max_fails=3 fail_timeout=30s;
    
    # Bookings service
    server localhost:3004 weight=1 max_fails=3 fail_timeout=30s;
    server localhost:3004 weight=1 max_fails=3 fail_timeout=30s;
    
    # Payments service
    server localhost:3005 weight=1 max_fails=3 fail_timeout=30s;
    server localhost:3005 weight=1 max_fails=3 fail_timeout=30s;
    
    # Notifications service
    server localhost:3006 weight=1 max_fails=3 fail_timeout=30s;
    server localhost:3006 weight=1 max_fails=3 fail_timeout=30s;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/s;

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name api.example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.example.com;
    
    # SSL configuration
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
    
    # Rate limiting
    limit_req zone=api burst=200 nodelay;
    
    # API routing
    location /api/auth {
        limit_req zone=auth burst=20 nodelay;
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
    
    location /api/users {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
    
    location /api/equipment {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
    
    location /api/bookings {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
    
    location /api/payments {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
    
    location /api/notifications {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
    `;

    fs.writeFileSync('nginx-load-balancer.conf', nginxConfig);
    console.log('✅ Nginx configuration generated');
  }

  async generateHAProxyConfig() {
    console.log('⚖️ Generating HAProxy configuration...');

    const haproxyConfig = `
# HAProxy Load Balancer Configuration
global
    maxconn 4096
    log 127.0.0.1:514 local0
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

defaults
    mode http
    log global
    option httplog
    option dontlognull
    option log-health-checks
    option forwardfor
    option httpchk GET /health
    timeout connect 5000
    timeout client 50000
    timeout server 50000
    errorfile 400 /etc/haproxy/errors/400.http
    errorfile 403 /etc/haproxy/errors/403.http
    errorfile 408 /etc/haproxy/errors/408.http
    errorfile 500 /etc/haproxy/errors/500.http
    errorfile 502 /etc/haproxy/errors/502.http
    errorfile 503 /etc/haproxy/errors/503.http
    errorfile 504 /etc/haproxy/errors/504.http

# Statistics
listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 30s
    stats admin if TRUE

# Frontend
frontend api_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/cert.pem
    redirect scheme https if !{ ssl_fc }
    
    # Rate limiting
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny if { sc_http_req_rate(0) gt 100 }
    
    # Routing
    use_backend auth_backend if { path_beg /api/auth }
    use_backend users_backend if { path_beg /api/users }
    use_backend equipment_backend if { path_beg /api/equipment }
    use_backend bookings_backend if { path_beg /api/bookings }
    use_backend payments_backend if { path_beg /api/payments }
    use_backend notifications_backend if { path_beg /api/notifications }

# Backends
backend auth_backend
    balance roundrobin
    server auth1 localhost:3001 check
    server auth2 localhost:3001 check

backend users_backend
    balance roundrobin
    server users1 localhost:3002 check
    server users2 localhost:3002 check

backend equipment_backend
    balance roundrobin
    server equipment1 localhost:3003 check
    server equipment2 localhost:3003 check

backend bookings_backend
    balance roundrobin
    server bookings1 localhost:3004 check
    server bookings2 localhost:3004 check

backend payments_backend
    balance roundrobin
    server payments1 localhost:3005 check
    server payments2 localhost:3005 check

backend notifications_backend
    balance roundrobin
    server notifications1 localhost:3006 check
    server notifications2 localhost:3006 check
    `;

    fs.writeFileSync('haproxy.cfg', haproxyConfig);
    console.log('✅ HAProxy configuration generated');
  }

  async generateDockerCompose() {
    console.log('🐳 Generating Docker Compose configuration...');

    const dockerCompose = `
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-load-balancer.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - auth
      - users
      - equipment
      - bookings
      - payments
      - notifications
    restart: unless-stopped

  haproxy:
    image: haproxy:alpine
    ports:
      - "8404:8404"
    volumes:
      - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg
    depends_on:
      - auth
      - users
      - equipment
      - bookings
      - payments
      - notifications
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=kubota_rental
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    restart: unless-stopped
    `;

    fs.writeFileSync('docker-compose-load-balancer.yml', dockerCompose);
    console.log('✅ Docker Compose configuration generated');
  }

  async generateKubernetesIngress() {
    console.log('☸️ Generating Kubernetes ingress configuration...');

    const ingressConfig = `
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.2 TLSv1.3"
    nginx.ingress.kubernetes.io/ssl-ciphers: "ECDHE-RSA-AES256-GCM-SHA512"
spec:
  tls:
  - hosts:
    - api.example.com
    secretName: api-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /api/auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 80
      - path: /api/users
        pathType: Prefix
        backend:
          service:
            name: users-service
            port:
              number: 80
      - path: /api/equipment
        pathType: Prefix
        backend:
          service:
            name: equipment-service
            port:
              number: 80
      - path: /api/bookings
        pathType: Prefix
        backend:
          service:
            name: bookings-service
            port:
              number: 80
      - path: /api/payments
        pathType: Prefix
        backend:
          service:
            name: payments-service
            port:
              number: 80
      - path: /api/notifications
        pathType: Prefix
        backend:
          service:
            name: notifications-service
            port:
              number: 80
    `;

    fs.writeFileSync('kubernetes-ingress.yaml', ingressConfig);
    console.log('✅ Kubernetes ingress configuration generated');
  }

  async generateMonitoringConfig() {
    console.log('📊 Generating monitoring configuration...');

    const monitoringConfig = {
      prometheus: {
        scrape_configs: [
          {
            job_name: 'nginx',
            static_configs: [{ targets: ['localhost:9113'] }],
          },
          {
            job_name: 'haproxy',
            static_configs: [{ targets: ['localhost:8404'] }],
          },
          {
            job_name: 'api-services',
            static_configs: [
              { targets: ['localhost:3001'] },
              { targets: ['localhost:3002'] },
              { targets: ['localhost:3003'] },
              { targets: ['localhost:3004'] },
              { targets: ['localhost:3005'] },
              { targets: ['localhost:3006'] },
            ],
          },
        ],
      },
      grafana: {
        dashboards: [
          {
            name: 'Load Balancer Metrics',
            panels: [
              {
                title: 'Request Rate',
                type: 'graph',
                query: 'rate(nginx_http_requests_total[5m])',
              },
              {
                title: 'Response Time',
                type: 'graph',
                query:
                  'histogram_quantile(0.95, rate(nginx_http_request_duration_seconds_bucket[5m]))',
              },
              {
                title: 'Error Rate',
                type: 'graph',
                query: 'rate(nginx_http_requests_total{status=~"5.."}[5m])',
              },
            ],
          },
        ],
      },
    };

    fs.writeFileSync(
      'monitoring-config.json',
      JSON.stringify(monitoringConfig, null, 2)
    );
    console.log('✅ Monitoring configuration generated');
  }
}

// Run load balancer configuration generation
const config = new LoadBalancerConfig();
config.generateLoadBalancerConfigs();
