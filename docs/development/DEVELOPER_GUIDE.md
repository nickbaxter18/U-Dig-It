# Developer Guide – Kubota Rental Platform

Welcome to the U-Dig It Rentals engineering team! This guide covers architecture, conventions, tooling, and daily workflows for the Supabase + Next.js stack.

---

## 📚 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Local Development](#local-development)
3. [Project Structure](#project-structure)
4. [Coding Standards](#coding-standards)
5. [Working with Supabase](#working-with-supabase)
6. [Testing Strategy](#testing-strategy)
7. [Tooling & Automation](#tooling--automation)
8. [Troubleshooting](#troubleshooting)
9. [Resources](#resources)

---

## Architecture Overview

```
Browser (React 19 + Next.js 16)
        │
        ▼
Vercel Edge Runtime / Serverless Functions
        │
        ▼
Supabase (Postgres + Auth + Storage + Realtime)
        │
        ├─ Stripe (Payments, holds, refunds)
        └─ SendGrid (Transactional email)
```

- **Next.js** renders both marketing and app surfaces using the App Router.
- **Supabase** is the single source of truth for data, auth, storage, and scheduled jobs.
- **Stripe** handles deposits, holds, and refunds; no card data touches our servers.
- **SendGrid** sends booking confirmations, payment receipts, and reminders.

> 📌 The legacy NestJS backend is archived in `_archive/` and must not be revived. All new work uses Supabase + Next.js.

---

## Local Development

```bash
pnpm install                 # install dependencies (one-time)
cp frontend/.env.example frontend/.env.local
bash start-frontend-clean.sh # start dev server on http://localhost:3000
```

Optional Supabase stack for local Postgres/Auth/Storage:

```bash
pnpm supabase:start
pnpm supabase:status
pnpm supabase:stop
pnpm supabase:reset  # destructive reset with supabase/seed.sql
```

---

## Project Structure

```
frontend/            # Next.js app
  ├─ src/
  │   ├─ app/        # App Router routes
  │   ├─ features/   # Feature-oriented modules (booking, payments, admin, etc.)
  │   ├─ components/ # Shared UI primitives
  │   ├─ lib/        # Supabase client, pricing logic, utils
  │   └─ styles/     # Tailwind config & globals
  └─ public/
docs/                # Documentation hub
supabase/            # Migrations, seed data, generated types
scripts/             # Tooling & verification scripts
start-frontend-clean.sh  # Protected startup helper
```

Key references:
- `AI_CODING_REFERENCE.md` – coding patterns and guidelines
- `COMPONENT_INDEX.md` – reusable component catalog
- `API_ROUTES_INDEX.md` – documented Next.js API endpoints

---

## Coding Standards

| Area | Guideline |
| --- | --- |
| TypeScript | Strict mode, no `any` without justification |
| Styling | Tailwind CSS + design tokens, follow brand palette |
| State management | React hooks + server actions; prefer Supabase RPC for heavy logic |
| Data access | Always via Supabase client, respect RLS policies |
| Error handling | Surface user-friendly messages, log details via `logger` |
| Security | Validate all input (zod schemas), apply rate limiting on API routes |
| Accessibility | WCAG AA minimum, use Radix primitives + composition utilities |

See `AI_CODING_REFERENCE.md` for canonical examples.

---

## Working with Supabase

- Use the Supabase MCP tools whenever possible:
  ```bash
  > mcp_supabase_list_tables({ schemas: ['public'] })
  > mcp_supabase_execute_sql({ query: 'select * from bookings limit 5' })
  > mcp_supabase_apply_migration({ name: 'add_index', query: 'create index ...' })
  ```
- Every table exposed to clients **must** have Row-Level Security with indexes that support policy filters.
- After modifying schema or policies, regenerate types:
  ```bash
  > mcp_supabase_generate_typescript_types()
  ```
- Store service-role operations in Next.js server actions / route handlers only; never expose service-role keys client-side.

---

## Testing Strategy

| Layer | Tools | Command |
| --- | --- | --- |
| Unit / Integration | Vitest + Testing Library | `cd frontend && pnpm test` |
| E2E | Playwright | `cd frontend && pnpm test:e2e` |
| Accessibility | Playwright + axe | `cd frontend && pnpm test:accessibility` |
| Coverage | Vitest coverage | `cd frontend && pnpm test:coverage` |

Run `pnpm lint` and `cd frontend && pnpm type-check` before opening PRs.

---

## Tooling & Automation

- **start-frontend-clean.sh** – the only supported way to start the dev server.
- **scripts/verify-agent-system.mjs** – sanity checks for the AI agent configuration.
- **Supabase CLI** – migrations, local stack, type-gen.
- **Playwright** – automated smoke tests for critical flows (booking, payments, admin).
- **GitHub Actions** – CI runs lint, type-check, unit tests, and Playwright smoke tests.

---

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Dev server won’t start | Kill port `3000`, rerun `bash start-frontend-clean.sh` |
| Supabase errors locally | `pnpm supabase:stop && pnpm supabase:start` |
| Stripe webhook failures | Re-copy webhook secret, confirm event list |
| Email not sending | Verify SendGrid key + sender, inspect activity feed |
| Access denied from Supabase | Check authenticated user role, RLS policy, and indexes |

Refer to `docs/troubleshooting/TROUBLESHOOTING.md` for deeper dives.

---

## Resources

- `README.md` – project overview and commands.
- `docs/setup/SETUP_GUIDE.md` – step-by-step environment setup.
- `docs/deployment/PRODUCTION-DEPLOYMENT.md` – launch checklist.
- `docs/operations/runbooks.md` – incident response + maintenance.
- `docs/planning/NEXT_STEPS.md` – roadmap and upcoming priorities.

Questions or improvements? Open a PR or drop a note in the engineering Slack channel. Welcome aboard! 🚜
# Developer Guide - Kubota Rental Platform

## 🚀 Welcome to the Team

Welcome to the U-Dig It Rentals development team! This guide will help you get started with our codebase, understand our development processes, and contribute effectively to the platform.

## 📋 Prerequisites

### Required Skills
- **JavaScript/TypeScript**: Proficient in ES6+ and TypeScript
- **React/Next.js**: Experience with React hooks and Next.js App Router
- **Node.js/NestJS**: Backend development with NestJS framework
- **Database**: SQL knowledge and ORM experience (TypeORM)
- **Git**: Version control and collaborative development

### Development Environment
- **Node.js 18+** (LTS recommended)
- **npm/pnpm** (pnpm preferred for faster installs)
- **Git** with proper SSH key setup
- **VS Code** with recommended extensions
- **Docker** (optional, for containerized development)

## 🛠️ Getting Started

### 1. Repository Setup

```bash
# Clone the repository
git clone git@github.com:your-org/kubota-rental-platform.git
cd kubota-rental-platform

# Install dependencies
pnpm install

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Configure your local environment
# Edit the .env files with your local configuration
```

### 2. Database Setup

```bash
# Start Supabase locally (or use cloud instance)
cd backend
npm run setup-database

# Or use Docker for local development
docker-compose up -d postgres redis
```

### 3. Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Database monitoring
watch -n 5 'curl -s http://localhost:3001/health | jq .'
```

## 📁 Project Structure

```
kubota-rental-platform/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── modules/         # Feature modules (auth, bookings, etc.)
│   │   ├── entities/        # Database entities
│   │   ├── common/          # Shared utilities and middleware
│   │   └── config/          # Configuration files
│   ├── tests/               # Test files
│   └── package.json
├── frontend/                # Next.js application
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # Reusable React components
│   │   ├── lib/             # Utilities and API clients
│   │   └── hooks/           # Custom React hooks
│   ├── e2e/                 # End-to-end tests
│   └── package.json
├── docs/                    # Documentation
├── scripts/                 # Build and deployment scripts
└── README.md
```

## 🔧 Development Workflow

### Daily Development

1. **Start Development Environment**
   ```bash
   # Start all services
   ./scripts/dev-setup.sh

   # Or manually:
   # Backend: npm run dev (port 3001)
   # Frontend: npm run dev (port 3000)
   ```

2. **Code Development**
   - Use feature branches for new work
   - Follow TypeScript strict mode guidelines
   - Write tests for new features
   - Update documentation as needed

3. **Testing**
   ```bash
   # Run all tests
   npm run test

   # Run specific test suites
   npm run test:unit      # Unit tests only
   npm run test:e2e       # End-to-end tests
   npm run test:coverage  # Coverage report
   ```

4. **Code Quality**
   ```bash
   # Type checking
   npm run type-check

   # Linting
   npm run lint

   # Format code
   npm run format
   ```

### Branch Strategy

#### Branch Naming
```
feature/user-authentication    # New features
bugfix/payment-validation      # Bug fixes
hotfix/critical-security       # Critical fixes
refactor/database-optimization # Code improvements
docs/api-documentation         # Documentation updates
```

#### Commit Messages
```
feat(auth): add JWT refresh token rotation

- Implement secure token rotation mechanism
- Update authentication middleware
- Add comprehensive tests

Fixes #123
```

### Pull Request Process

1. **Create PR**
   - Use clear, descriptive title
   - Reference related issues
   - Include testing instructions

2. **Code Review**
   - At least one approval required
   - All CI checks must pass
   - Security review for sensitive changes

3. **Merge Requirements**
   - Tests passing
   - TypeScript compilation successful
   - Documentation updated
   - No linting errors

## 🧪 Testing Guidelines

### Test Organization

```
src/
├── __tests__/
│   ├── unit/           # Unit tests for individual functions
│   ├── integration/    # Component integration tests
│   └── e2e/           # End-to-end user journey tests
└── modules/
    └── component.test.ts  # Component-specific tests
```

### Writing Tests

#### Unit Tests
```typescript
describe('BookingService', () => {
  let service: BookingService;
  let repository: Repository<Booking>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BookingService, BookingRepository],
    }).compile();

    service = module.get<BookingService>(BookingService);
    repository = module.get<Repository<Booking>>(getRepositoryToken(Booking));
  });

  it('should create booking successfully', async () => {
    // Arrange
    const bookingData = createMockBookingData();

    // Act
    const result = await service.createBooking(bookingData);

    // Assert
    expect(result.success).toBe(true);
    expect(result.bookingNumber).toBeDefined();
  });
});
```

#### Integration Tests
```typescript
describe('Booking API Integration', () => {
  it('should handle complete booking flow', async () => {
    // Test the entire booking process
    // from form submission to confirmation
  });
});
```

#### E2E Tests (Playwright)
```typescript
test('complete booking journey', async ({ page }) => {
  await page.goto('/book');

  // Navigate through booking flow
  await page.fill('[data-testid="customer-name"]', 'John Doe');
  await page.fill('[data-testid="email"]', 'john@example.com');
  await page.selectOption('[data-testid="equipment"]', 'svl75');

  // Submit and verify success
  await page.click('[data-testid="submit-booking"]');
  await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
});
```

## 📚 Documentation Standards

### Code Comments

#### Function Documentation
```typescript
/**
 * Calculate delivery fee based on distance and location
 *
 * @param address - Customer delivery address
 * @param city - City name for zone pricing
 * @param orderTotal - Optional order total for free delivery calculation
 * @returns Promise with delivery fee calculation result
 * @throws {BusinessLogicError} When address is outside delivery zone
 *
 * @example
 * const result = await deliveryService.calculateDeliveryFee(
 *   '123 Main St',
 *   'Saint John',
 *   500
 * );
 */
async calculateDeliveryFee(
  address: string,
  city: string,
  orderTotal?: number
): Promise<DeliveryFeeResult> {
```

#### Class Documentation
```typescript
/**
 * Service responsible for equipment rental operations
 *
 * Handles booking creation, availability checking, and equipment management
 * for the Kubota SVL-75 rental platform.
 */
@Injectable()
export class EquipmentService {
```

### API Documentation

All API endpoints must include:
- **Description**: Clear purpose and functionality
- **Request/Response schemas**: Complete type definitions
- **Error codes**: Possible error responses
- **Examples**: Usage examples where applicable

## 🔒 Security Guidelines

### Authentication
- JWT tokens with 15-minute access expiry
- Refresh tokens with 30-day expiry
- Secure token storage (httpOnly cookies)
- Rate limiting on auth endpoints

### Input Validation
- All inputs validated using class-validator
- SQL injection prevention
- XSS protection via content sanitization
- File upload restrictions

### Authorization
- Role-based access control (RBAC)
- Route guards for protected endpoints
- Permission-based resource access

## 🚀 Deployment Process

### Development Deployment
```bash
# Build and deploy to staging
npm run build
npm run deploy:staging

# Run database migrations
npm run migration:run

# Verify deployment
npm run health-check
```

### Production Deployment
```bash
# Pre-deployment checks
npm run test:coverage
npm run security-audit
npm run performance-test

# Production build
npm run build:production

# Deploy with zero downtime
npm run deploy:production

# Post-deployment verification
npm run smoke-test
```

## 🔧 Troubleshooting

### Common Issues

#### TypeScript Errors
```typescript
# Fix unused parameters
# Prefix with underscore: parameterName → _parameterName

# Fix uninitialized properties
# Add definite assignment assertion: property: Type → property!: Type
```

#### Build Failures
```bash
# Clear build cache
npm run clean

# Update dependencies
npm update

# Check for peer dependency issues
npm ls
```

#### Database Issues
```bash
# Reset database (development only)
npm run migration:reset

# Check database connection
npm run health-check

# View database logs
docker logs postgres-container
```

## 📞 Getting Help

### Communication Channels
- **Development Slack**: #dev-team, #urgent-issues
- **GitHub Issues**: Bug reports and feature requests
- **Email**: dev-team@udigitrentals.ca
- **Wiki**: Internal documentation and guides

### Code Review Process
- All changes require code review
- Use GitHub pull requests
- At least one approval required
- Consider security implications

### Emergency Contacts
- **Critical Issues**: +1-506-555-0123
- **Security Incidents**: security@udigitrentals.ca
- **Infrastructure Issues**: infra@udigitrentals.ca

## 🎯 Performance Standards

### Frontend Performance
- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)
- **Bundle Size**: < 500KB gzipped

### Backend Performance
- **Response Time**: < 200ms for API endpoints
- **Database Queries**: < 50ms average
- **Memory Usage**: < 256MB per process
- **CPU Usage**: < 70% average

## 📈 Monitoring & Analytics

### Application Monitoring
- **Error Tracking**: Sentry for error collection
- **Performance Monitoring**: Custom metrics collection
- **Health Checks**: Automated health endpoints
- **Log Aggregation**: Structured logging with correlation IDs

### Business Metrics
- **Booking Conversion Rate**: Target > 15%
- **Customer Retention**: Target > 80%
- **Equipment Utilization**: Target > 85%
- **System Availability**: Target 99.9%

## 🔄 Continuous Improvement

### Weekly Reviews
- Code quality metrics review
- Performance optimization opportunities
- Security vulnerability assessments
- Documentation completeness checks

### Monthly Reviews
- Architecture evolution planning
- Technology stack evaluation
- Development process improvements
- Team skill development planning

### Quarterly Reviews
- Major feature planning
- Technical debt assessment
- Platform scalability review
- Business goal alignment

## 📋 Checklists

### Feature Development Checklist
- [ ] Requirements documented and understood
- [ ] Database schema designed/reviewed
- [ ] API endpoints implemented with proper validation
- [ ] Frontend components created with accessibility
- [ ] Unit tests written (90%+ coverage)
- [ ] Integration tests added
- [ ] E2E tests included
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance tested
- [ ] Code review approved

### Code Review Checklist
- [ ] TypeScript compilation passes
- [ ] ESLint rules satisfied
- [ ] Tests pass with good coverage
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] Documentation is complete
- [ ] Follows established patterns
- [ ] Backward compatibility maintained

### Release Checklist
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Database migrations tested
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured
- [ ] Team notified of changes

## 🏆 Recognition & Growth

### Code Quality Recognition
- **Monthly MVP**: Best code contribution
- **Quality Champion**: Consistent code quality
- **Innovation Award**: Creative problem solving

### Learning & Development
- **Tech Talks**: Weekly knowledge sharing
- **Code Reviews**: Learning through feedback
- **Conference Attendance**: Industry event participation
- **Training Budget**: Professional development support

### Career Progression
- **Junior → Mid**: Demonstrate consistent quality
- **Mid → Senior**: Lead complex features
- **Senior → Lead**: Mentor junior developers
- **Lead → Principal**: Drive architectural decisions

---

**Last Updated**: January 21, 2025
**Version**: 2.0.0
**Maintainer**: Development Team Lead

This guide ensures consistent development practices and helps new team members quickly become productive contributors to the platform.


