# U-Dig It Rentals - Kubota SVL-75 Rental Platform

A comprehensive equipment rental platform specializing in Kubota SVL-75 Compact Track Loader rentals in Saint John, New Brunswick. Built with modern web technologies for professional construction and excavation projects.

## 🚀 Features

### Core Functionality
- **Equipment Showcase**: Interactive display of Kubota SVL-75 specifications and capabilities
- **Smart Booking System**: Multi-step booking flow with real-time availability checking
- **Dynamic Pricing**: Automatic pricing calculation with delivery fees and taxes
- **Guest Checkout**: Seamless booking experience for both registered and guest users
- **Payment Integration**: Secure Stripe payment processing with multiple payment methods

### User Experience
- **Mobile-First Design**: Optimized for field workers and mobile devices
- **Real-Time Updates**: Live booking status and availability tracking
- **Smart Suggestions**: AI-powered date recommendations and pricing optimization
- **Progressive Web App**: Offline capabilities and native app-like experience

### Administrative Tools
- **Admin Dashboard**: Comprehensive equipment and booking management
- **Analytics & Reporting**: Revenue tracking, utilization reports, and customer insights
- **Contract Management**: Digital contract generation and signature processing
- **Insurance Verification**: Document upload and verification system

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router and Server Components
- **TypeScript 5.9** - Type-safe development with strict configuration
- **Tailwind CSS 3.4** - Utility-first styling with custom design system
- **Radix UI** - Accessible component primitives and headless components
- **React Hook Form** - Performant form handling with validation
- **NextAuth.js** - Authentication with OAuth providers
- **TanStack Query** - Server state management and caching
- **Framer Motion** - Smooth animations and transitions
- **React PDF** - PDF generation for contracts and invoices

### Supabase Platform
- **PostgreSQL (Supabase Database)** - Managed relational database with Row-Level Security
- **Supabase Auth** - Email/password authentication with JWT session management
- **Supabase Storage** - Secure file storage for contracts and insurance documents
- **Supabase Functions & Edge** - Serverless actions for scheduled tasks and notifications
- **Realtime** - Live booking and equipment updates
- **Stripe** - Payment processing, holds, and refunds
- **SendGrid** - Transactional email delivery

### DevOps & Infrastructure
- **Supabase CLI** - Local database emulation, migrations, and seeding
- **GitHub Actions** - CI for linting, type-checking, and tests
- **Vercel** - Frontend deployment with Edge Runtime support
- **Sentry** - Optional error monitoring and performance tracking
- **Lighthouse CI** - Performance and accessibility auditing

## 🏗️ Project Structure

```
├── frontend/                 # Next.js 16 application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Reusable React components
│   │   ├── lib/             # Utility functions and configurations
│   │   └── styles/          # Global styles and CSS modules
│   └── public/              # Static assets
├── supabase/                # Database migrations, types, and config
├── docs/                    # Documentation hub
├── scripts/                 # Tooling and maintenance scripts
├── start-frontend-clean.sh  # Clean startup helper (Cursor default)
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **pnpm 9+** (package manager)
- **Docker & Docker Compose** (for containerized development)
- **PostgreSQL 15+** (if running locally)
- **Redis 7+** (if running locally)

### Quick Start

1. **Clone and setup**
   ```bash
   git clone https://github.com/your-org/kubota-rental-platform.git
   cd kubota-rental-platform
   pnpm install
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment template
   cp frontend/.env.example frontend/.env.local

   # Edit frontend/.env.local with your Supabase, Stripe, and SendGrid keys
   # (See Environment Variables section below)
   ```

3. **Start Development Environment**
   ```bash
   # Always use the protected startup script
   bash start-frontend-clean.sh

   # Optional: run Supabase locally if you need a local database
   pnpm supabase:start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Supabase Studio (if running locally): http://localhost:54323

### Development Commands

```bash
# Package Management
pnpm install              # Install all dependencies
cd frontend && pnpm clean # Clean Next.js build artifacts

# Development
bash start-frontend-clean.sh   # Clean frontend start (Cursor default)
pnpm supabase:start            # Optional: start local Supabase stack
pnpm supabase:stop             # Stop local Supabase services

# Building
cd frontend && pnpm build
cd frontend && pnpm build:check

# Testing
cd frontend && pnpm test
cd frontend && pnpm test:watch
cd frontend && pnpm test:coverage
cd frontend && pnpm test:e2e
cd frontend && pnpm test:accessibility

# Code Quality
pnpm lint                 # Lint all workspaces
pnpm lint:fix             # Auto-fix lint issues
cd frontend && pnpm type-check
pnpm format               # Format with Prettier

# Database
pnpm supabase db push     # Apply migrations
pnpm supabase:reset       # Reset local DB with seed data (destructive)

# Tooling
pnpm supabase:start       # Start local Supabase stack
pnpm supabase:stop        # Stop local Supabase stack
```

## 📱 Key Features

### Equipment Management
- Comprehensive equipment catalog with detailed specifications
- Real-time availability tracking
- Equipment condition monitoring
- Maintenance scheduling integration

### Booking System
- Multi-step booking flow with validation
- Date and time slot selection
- Equipment availability checking
- Automatic conflict resolution

### Payment Processing
- Stripe integration for secure payments
- Multiple payment methods support
- Invoice generation and tracking
- Refund processing

### Customer Experience
- User-friendly booking interface
- Mobile-optimized design
- Real-time booking status updates
- Customer support integration

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (test mode by default)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SendGrid)
SENDGRID_API_KEY=SG.your-sendgrid-key
EMAIL_FROM=bookings@udigitrentals.com
EMAIL_FROM_NAME=U-Dig It Rentals

# Feature flags
NEXT_PUBLIC_ENABLE_STRIPE_PAYMENTS=true
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true
```

> ℹ️ Service-role keys (`SUPABASE_SERVICE_ROLE_KEY`, etc.) should **only** be stored in server-side environments (Vercel, Supabase Edge Functions, or `.env` used by automation scripts). Never expose them to the browser.

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:3001`
- **Production**: `https://api.udigit.ca`

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```bash
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Authentication
```bash
POST /auth/register          # Register new user
POST /auth/login             # User login
POST /auth/refresh           # Refresh JWT token
GET  /auth/profile           # Get user profile
POST /auth/change-password   # Change user password
POST /auth/oauth             # OAuth sign-in
```

#### Bookings
```bash
GET    /bookings                    # List all bookings (with filters)
POST   /bookings                    # Create new booking
GET    /bookings/:id                # Get booking by ID
PATCH  /bookings/:id/status         # Update booking status
POST   /bookings/:id/cancel         # Cancel booking
POST   /bookings/:id/extend         # Extend booking duration
GET    /bookings/availability/check # Check equipment availability
GET    /bookings/stats              # Get booking statistics
GET    /bookings/dashboard          # Get dashboard data
```

#### Equipment
```bash
GET  /equipment           # List all equipment
GET  /equipment/:id       # Get equipment details
POST /equipment           # Create equipment (admin)
PUT  /equipment/:id       # Update equipment (admin)
```

#### Payments
```bash
POST /payments/create-intent    # Create payment intent
POST /payments/confirm          # Confirm payment
GET  /payments/history          # Payment history
POST /payments/refund           # Process refund
```

### Example API Usage

#### Create a Booking
```bash
curl -X POST http://localhost:3001/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "equipmentId": "svl-75-001",
    "startDate": "2024-01-15",
    "endDate": "2024-01-17",
    "deliveryAddress": "123 Main St, Saint John, NB",
    "deliveryCity": "Saint John",
    "customerEmail": "customer@example.com"
  }'
```

#### Check Availability
```bash
curl "http://localhost:3001/bookings/availability/check?equipmentId=svl-75-001&startDate=2024-01-15&endDate=2024-01-17"
```

### API Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Handling
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "startDate",
        "message": "Start date is required"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🧪 Testing

### Test Coverage
- **Unit Tests**: 85%+ coverage for business logic
- **Integration Tests**: API endpoints and database interactions
- **E2E Tests**: Critical user journeys with Playwright
- **Accessibility Tests**: WCAG 2.1 AA compliance

### Running Tests
```bash
# Frontend unit & integration tests
cd frontend && pnpm test

# Watch mode
cd frontend && pnpm test:watch

# End-to-end (Playwright)
cd frontend && pnpm test:e2e

# Accessibility suite
cd frontend && pnpm test:accessibility

# Coverage report
cd frontend && pnpm test:coverage
```

## 📦 Deployment

### Frontend (Vercel)
1. **Connect Repository**
   - Link GitHub repository to Vercel
   - Set root directory to `frontend/`
   - Use the default Next.js preset

2. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SENDGRID_API_KEY=SG.your-production-key
   EMAIL_FROM=bookings@udigitrentals.com
   EMAIL_FROM_NAME=U-Dig It Rentals
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # server-side only
   ```

3. **Build Configuration**
   - Install Command: `pnpm install`
   - Build Command: `pnpm build`
   - Output Directory: `.next`

### Supabase (Database, Auth & Storage)
1. **Create Production Project** via the Supabase dashboard
2. **Apply migrations** using the Supabase CLI or MCP tools:
   ```bash
   pnpm supabase db push           # CLI option
   # or request the AI agent to run mcp_supabase_apply_migration
   ```
3. **Seed baseline data** (equipment catalog, pricing, roles) via your own SQL scripts
4. **Configure storage buckets** and verify Row-Level Security policies
5. **Rotate keys** and store them only in Vercel/Supabase secrets (never in the client)

### Monitoring & Analytics
- **Supabase Advisors**: Security and performance recommendations (`mcp_supabase_get_advisors`)
- **Vercel Analytics & Speed Insights**: Frontend performance metrics
- **Sentry (optional)**: Error tracking for frontend and Edge Functions
- **Lighthouse CI / Web Vitals**: Automated UX and accessibility audits

## 🔧 Troubleshooting

### Common Issues

#### Development Environment
```bash
# Port already in use
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000

# Restart the protected startup script
bash start-frontend-clean.sh

# Supabase CLI issues (local stack)
pnpm supabase:stop && pnpm supabase:start

# Clear all caches
cd frontend && pnpm clean
pnpm install
```

#### Build Issues
```bash
# TypeScript errors
cd frontend && pnpm type-check

# Linting errors
pnpm lint:fix

# Build failures
cd frontend && rm -rf .next .turbo
pnpm install && pnpm build
```

#### Supabase Issues
```bash
# Check local Supabase status
pnpm supabase:status

# Restart local stack
pnpm supabase:stop && pnpm supabase:start

# Reset database with seed data
pnpm supabase:reset

# Run migrations manually (CLI)
pnpm supabase db push
```

### Performance Issues

#### Frontend Performance
- Check bundle size: `cd frontend && pnpm test:bundle-analyze`
- Run Lighthouse audit: `cd frontend && pnpm test:performance`
- Optimize images and assets
- Enable compression and caching

#### Supabase Performance
- Review Supabase dashboards for slow queries
- Run `mcp_supabase_get_advisors({ type: 'performance' })`
- Ensure indexes align with high-volume filters
- Monitor connection usage and storage limits

### Debugging

#### Frontend Debugging
```bash
# Enable debug mode
NEXT_DEBUG=1 bash start-frontend-clean.sh

# Check browser console for errors
# Use React Developer Tools
# Monitor Network tab for API calls
```

### Getting Help

1. **Check Logs**
   - Frontend: Browser console, Vercel build/runtime logs
   - Database: Supabase logs (`mcp_supabase_get_logs`)

2. **Common Solutions**
   - Restart services: `bash start-frontend-clean.sh`, `pnpm supabase:stop && pnpm supabase:start`
   - Clear caches: `cd frontend && pnpm clean`
   - Update dependencies: `pnpm update`

3. **Support Channels**
   - GitHub Issues: Bug reports and feature requests
   - Email: support@udigit.ca
   - Documentation: Check this README and API docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@kubotarentals.ca or create an issue in the GitHub repository.

---

**Built with ❤️ for Kubota Equipment Rental in Saint John, New Brunswick**