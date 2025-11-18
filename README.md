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
- **Next.js 16** - React framework with App Router, Server Components, and Turbopack
- **TypeScript 5.9** - Type-safe development with strict configuration
- **Tailwind CSS 3.4** - Utility-first styling with custom design system
- **Radix UI** - Accessible component primitives and headless components
- **React Hook Form** - Performant form handling with validation
- **TanStack Query 5.90** - Server state management with caching and optimistic updates
- **Framer Motion** - Smooth animations and transitions
- **React PDF** - PDF generation for contracts and invoices

### Development Tools
- **Storybook 10** - Component development and documentation in isolation
- **MSW 2.12** - API mocking for tests and development (Mock Service Worker)
- **Vitest** - Fast unit testing with instant feedback
- **Playwright** - End-to-end browser testing for critical flows
- **Size Limit** - Bundle size monitoring and performance budgets
- **Knip** - Unused code detection (files, dependencies, exports)
- **Lighthouse CI** - Automated performance and accessibility audits
- **Chromatic** - Visual regression testing for UI components
- **Husky** - Git hooks for pre-commit quality gates
- **Snyk** - Security vulnerability scanning (code & dependencies)
- **PostHog** - Product analytics and user behavior tracking

### Supabase Platform
- **PostgreSQL (Supabase Database)** - Managed relational database with Row-Level Security
- **Supabase Auth** - Email/password authentication with JWT session management
- **Supabase Storage** - Secure file storage for contracts and insurance documents
- **Supabase Functions & Edge** - Serverless actions for scheduled tasks and notifications
- **Realtime** - Live booking and equipment updates
- **Stripe** - Payment processing, holds, and refunds
- **SendGrid** - Transactional email delivery

### DevOps & Infrastructure
- **Supabase CLI & MCP** - Database migrations, type generation, and management
- **GitHub Actions** - CI/CD for linting, testing, E2E tests, and Lighthouse audits
- **Vercel** - Frontend deployment with Edge Runtime and automatic previews
- **Turbopack** - Fast incremental bundler with filesystem caching (70% faster restarts)
- **pnpm** - Fast, disk-space efficient package manager
- **Sentry** - Optional error monitoring and performance tracking

## 🏗️ Project Structure

```
├── frontend/                      # Next.js 16 application
│   ├── .storybook/               # Storybook configuration
│   ├── e2e/                      # Playwright E2E tests
│   ├── src/
│   │   ├── app/                  # App Router pages & API routes
│   │   ├── components/           # React components with *.stories.tsx
│   │   ├── hooks/                # Custom React hooks (TanStack Query)
│   │   ├── lib/                  # Utilities, validators, integrations
│   │   ├── test/                 # Test setup & MSW mocks
│   │   └── stories/              # Storybook stories
│   ├── docs/                     # Development guides & references
│   ├── public/                   # Static assets & MSW service worker
│   ├── knip.json                 # Unused code detection config
│   ├── .size-limit.json          # Bundle size limits
│   └── lighthouserc.js           # Lighthouse CI config
├── supabase/                     # Database migrations & types
├── .cursor/                      # Cursor AI rules & memories
│   └── rules/                    # File-scoped development rules
├── docs/                         # Project documentation
│   ├── reference/                # Coding patterns & API docs
│   ├── testing/                  # Test guides & reports
│   └── audits/                   # Security & performance audits
├── .github/workflows/            # CI/CD pipelines
├── start-frontend-clean.sh       # Optimized startup script (required)
├── start-frontend-deep-clean.sh  # Deep clean for cache issues
└── README.md                     # This file
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
   # ALWAYS use the optimized startup script (required for Turbopack caching)
   bash start-frontend-clean.sh
   # Benefits: 70% faster restarts, automatic port cleanup, cache optimization

   # Or use pnpm (configured to use the script)
   cd frontend && pnpm dev

   # Terminal 2: Component development (optional)
   cd frontend && pnpm storybook

   # Optional: run Supabase locally if you need a local database
   pnpm supabase:start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Storybook: http://localhost:6006
   - Supabase Studio (if running locally): http://localhost:54323

> ⚡ **Performance Note**: First start takes 10-15s. Restarts take only **3-5 seconds** thanks to Turbopack filesystem caching!

### Development Commands

```bash
# 🏃 Development
bash start-frontend-clean.sh       # Optimized startup (REQUIRED - uses Turbopack cache)
cd frontend && pnpm dev             # Alternative (calls startup script)
cd frontend && pnpm storybook       # Component development (port 6006)

# 🧪 Testing
cd frontend && pnpm test            # Unit tests (MSW handles API mocking)
cd frontend && pnpm test:watch      # Watch mode
cd frontend && pnpm test:coverage   # Coverage report (80%+ target)
cd frontend && pnpm test:e2e        # E2E tests (Playwright)
cd frontend && pnpm test:e2e:admin  # Admin E2E tests
cd frontend && pnpm test:accessibility  # A11y tests

# ✅ Code Quality
cd frontend && pnpm lint            # ESLint
cd frontend && pnpm lint:fix        # Auto-fix issues
cd frontend && pnpm type-check      # TypeScript compilation
cd frontend && pnpm format          # Prettier format
cd frontend && pnpm quality:fast    # Lint + Type Check (quick)
cd frontend && pnpm quality:all     # Full quality check
cd frontend && pnpm ci              # Full CI pipeline

# 🔒 Security
cd frontend && pnpm security:scan   # Snyk code scan
cd frontend && pnpm security:deps   # Snyk dependency audit
cd frontend && pnpm security:all    # Both scans
pnpm audit                          # npm/pnpm audit

# 📦 Bundle & Performance
cd frontend && pnpm size            # Check bundle sizes vs limits
cd frontend && pnpm size:why        # Analyze what's in bundles
cd frontend && pnpm analyze         # Full Next.js bundle analyzer
cd frontend && pnpm test:performance  # Lighthouse CI audit
cd frontend && pnpm knip            # Find unused code

# 🏗️ Building
cd frontend && pnpm build           # Production build
cd frontend && pnpm build:check     # Build with type checking
cd frontend && pnpm start           # Start production server
cd frontend && pnpm clean           # Clean cache/build artifacts

# 🗄️ Database (Supabase)
pnpm supabase:start                 # Start local Supabase stack
pnpm supabase:stop                  # Stop local Supabase services
pnpm supabase db push               # Apply migrations
pnpm supabase:reset                 # Reset local DB (destructive)
pnpm supabase:status                # Check status

# 📚 Storybook
cd frontend && pnpm build-storybook # Build static Storybook
npx chromatic                       # Visual regression testing
```

> 💡 **Tip**: See `frontend/docs/QUICK_COMMANDS_CHEATSHEET.md` for the complete command reference!

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
- **Unit Tests**: 80%+ coverage for business logic (Vitest + MSW)
- **Integration Tests**: API endpoints with MSW-mocked Supabase calls
- **E2E Tests**: Critical user journeys with Playwright
- **Visual Tests**: Component variations in Storybook with Chromatic
- **Accessibility Tests**: WCAG 2.1 AA compliance with axe-core
- **Performance Tests**: Lighthouse CI audits for every deployment

### Testing Tools
```
Unit/Integration (Vitest + MSW)
├─ Business logic & utilities
├─ React components (React Testing Library)
├─ API routes (MSW auto-mocks Supabase)
└─ Database interactions (mocked)

E2E Tests (Playwright)
├─ Booking flow (guest & authenticated)
├─ Payment processing (Stripe test mode)
├─ Admin dashboard operations
└─ Critical user journeys

Visual Tests (Storybook + Chromatic)
├─ Component variations (all states)
├─ Responsive layouts
├─ Theme changes
└─ Accessibility checks (axe addon)

Performance (Lighthouse CI)
├─ Core Web Vitals
├─ Accessibility score (90%+)
├─ Best practices (90%+)
└─ SEO score (90%+)
```

### Running Tests
```bash
# Unit & Integration (MSW handles API mocking automatically)
cd frontend && pnpm test

# Watch mode for TDD
cd frontend && pnpm test:watch

# Coverage report (HTML output in coverage/)
cd frontend && pnpm test:coverage

# End-to-end tests
cd frontend && pnpm test:e2e
cd frontend && pnpm test:e2e:admin  # Admin-specific flows

# Component development & visual testing
cd frontend && pnpm storybook

# Accessibility tests
cd frontend && pnpm test:accessibility

# Performance audits
cd frontend && pnpm test:performance  # Lighthouse CI
cd frontend && pnpm size              # Bundle size limits
```

> **Note**: MSW (Mock Service Worker) is configured automatically. API calls in tests are intercepted without manual mocking!

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
# Port conflicts - Use optimized script (handles this automatically)
bash start-frontend-clean.sh  # Kills processes on 3000/3001, cleans Turbopack locks

# Deep clean for cache corruption (rare)
bash start-frontend-deep-clean.sh  # Removes .next, node_modules/.cache, Turbopack cache

# Storybook issues
cd frontend && rm -rf node_modules/.cache storybook-static
pnpm build-storybook

# MSW not working
cd frontend && npx msw init public/ --save

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

## 📖 Documentation

Comprehensive documentation is available in the following locations:

### Development Guides
- **Quick Commands**: `frontend/docs/QUICK_COMMANDS_CHEATSHEET.md` - One-page command reference
- **Development Tools**: `frontend/docs/DEVELOPMENT_TOOLS_GUIDE.md` - Complete tooling guide
- **AI Coding Reference**: `docs/reference/AI_CODING_REFERENCE.md` - Established patterns & components
- **Coding Savant**: `docs/reference/CODING_SAVANT_CHEAT_SHEET.md` - Codebase-specific expertise

### Architecture & Standards
- **Cursor Rules**: `.cursor/rules/` - AI-assisted development rules
  - `testing-with-msw.mdc` - MSW testing patterns (auto-applies to `*.test.ts`)
  - `storybook-development.mdc` - Storybook workflow (auto-applies to `*.stories.tsx`)
  - `nextjs-startup-optimization.mdc` - Turbopack optimization guide
  - `CODING_SAVANT_PATTERNS.mdc` - Battle-tested patterns from this codebase

### Reference Documentation
- **Database Schema**: `docs/reference/DATABASE_SCHEMA.md`
- **Environment Variables**: `docs/reference/ENVIRONMENT_VARIABLES.md`
- **Business Logic Patterns**: `docs/reference/BUSINESS_LOGIC_PATTERNS.md`
- **Type Definitions**: `docs/reference/TYPE_DEFINITIONS_INDEX.md`
- **Error Codes**: `docs/reference/ERROR_CODES.md`

### Testing & Quality
- **Testing Guide**: `docs/testing/README.md`
- **E2E Test Status**: `docs/testing/E2E_TEST_STATUS.md`
- **Admin Tests**: `docs/testing/ADMIN_E2E_TESTS.md`

### Audits & Reports
- **Security Audits**: `docs/audits/`
- **Performance Reports**: `docs/status/`

> 💡 **Tip**: Cursor IDE automatically applies file-scoped rules when you open test or story files, guiding you with best practices!

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