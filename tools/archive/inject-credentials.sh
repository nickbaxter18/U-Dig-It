#!/bin/bash

echo "🔐 Injecting example credentials into environment files..."
echo "⚠️  WARNING: This script creates example files with placeholder values."
echo "   Replace all placeholder values with your actual production credentials."

# Create backend .env file with example credentials
echo "📝 Creating backend/.env with example credentials..."
cat > backend/.env << 'EOF'
# Application
NODE_ENV=development
PORT=3001
APP_BASE_URL=http://localhost:3001

# Database - Supabase (Production)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
# Note: Get your actual Supabase connection string from Supabase dashboard

# Database - Local Development (Docker)
DATABASE_URL_LOCAL=postgresql://kubota_user:kubota_password@localhost:5433/kubota_rental

# Redis - Production (Redis Cloud)
REDIS_URL=rediss://default:your_redis_password@your-redis-host:17736
REDIS_ENABLED=true

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Stripe Payment Processing
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_CURRENCY=CAD

# DocuSign Integration
DOCUSIGN_CLIENT_ID=your_docusign_client_id_here
DOCUSIGN_CLIENT_SECRET=your_docusign_client_secret_here
DOCUSIGN_ACCOUNT_ID=your_docusign_account_id_here
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
DOCUSIGN_REDIRECT_URI=http://localhost:3001/auth/docusign/callback

# Sentry Error Monitoring
SENTRY_DSN=https://your_sentry_dsn@sentry.io/your_project_id
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=1.0.0

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
EMAIL_FROM=noreply@your-domain.com

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# File Storage
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Monitoring & Analytics
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX-X
HOTJAR_ID=your_hotjar_id_here
MIXPANEL_TOKEN=your_mixpanel_token_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Security Headers
HELMET_ENABLED=true
CSP_ENABLED=true
HSTS_ENABLED=true
EOF

# Create frontend .env.local file with example credentials
echo "📝 Creating frontend/.env.local with example credentials..."
cat > frontend/.env.local << 'EOF'
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Stripe Payment Processing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Sentry Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your_sentry_dsn@sentry.io/your_project_id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
NEXT_PUBLIC_SENTRY_RELEASE=1.0.0

# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX-X
NEXT_PUBLIC_HOTJAR_ID=your_hotjar_id_here
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token_here

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_HOTJAR=false
NEXT_PUBLIC_ENABLE_MIXPANEL=false
NEXT_PUBLIC_ENABLE_SENTRY=false
EOF

echo "✅ Example environment files created successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Replace all placeholder values with your actual credentials"
echo "2. Never commit these files to version control"
echo "3. Use .env.example files for reference"
echo ""
echo "⚠️  Security reminder:"
echo "   - Keep your credentials secure"
echo "   - Use different credentials for development and production"
echo "   - Rotate your keys regularly"
echo "   - Monitor for unauthorized access"