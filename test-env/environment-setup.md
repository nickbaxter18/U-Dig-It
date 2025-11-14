# Test Environment Setup

This directory contains test environment configuration and setup procedures for the Kubota Rental Platform.

## Test Environment Overview

The test environment provides a controlled environment for testing features, integrations, and deployments before production release.

## Environment Configuration

### Test Database
```env
DATABASE_URL=postgresql://test_user:test_password@localhost:5433/kubota_rentals_test
```

### Test Redis
```env
REDIS_URL=redis://localhost:6380
```

### Test Stripe
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### Test Email
```env
EMAIL_PROVIDER=test
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=test
SMTP_PASS=test
```

## Test Data Management

### Database Seeding
```bash
# Run database migrations
npm run migration:run

# Seed test data
npm run seed:test

# Reset database
npm run db:reset
```

### Test Data Categories
- **Equipment**: Sample equipment with various specifications
- **Users**: Test users with different roles
- **Bookings**: Sample bookings with different statuses
- **Payments**: Test payment records

## Test Scenarios

### Unit Tests
```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:unit:coverage

# Watch mode
npm run test:unit:watch
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Run with database
npm run test:integration:db
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run in headless mode
npm run test:e2e:headless

# Run specific test suite
npm run test:e2e -- --grep "booking flow"
```

## Test Environment Services

### Database
- **PostgreSQL 15**: Test database
- **Port**: 5433
- **Database**: kubota_rentals_test
- **User**: test_user

### Cache
- **Redis 7**: Test cache
- **Port**: 6380
- **Database**: 1

### Email
- **MailHog**: Email testing
- **Port**: 8025 (Web UI)
- **Port**: 1025 (SMTP)

### Payment
- **Stripe Test Mode**: Payment testing
- **Test Cards**: Various test card numbers
- **Webhooks**: Local webhook testing

## Test Data Fixtures

### Equipment Fixtures
```javascript
const equipmentFixtures = [
  {
    name: 'Test Skid Steer',
    category: 'skid-steer',
    rentalRate: 25000,
    availability: 'available'
  },
  // ... more fixtures
];
```

### User Fixtures
```javascript
const userFixtures = [
  {
    email: 'test@example.com',
    role: 'customer',
    firstName: 'Test',
    lastName: 'User'
  },
  // ... more fixtures
];
```

### Booking Fixtures
```javascript
const bookingFixtures = [
  {
    customerId: 'customer-001',
    equipmentId: 'equipment-001',
    startDate: '2024-10-15T08:00:00Z',
    endDate: '2024-10-17T17:00:00Z',
    status: 'confirmed'
  },
  // ... more fixtures
];
```

## Test Utilities

### Database Helpers
```javascript
// Clear test database
export async function clearDatabase() {
  await db.sync({ force: true });
}

// Seed test data
export async function seedTestData() {
  await Equipment.bulkCreate(equipmentFixtures);
  await User.bulkCreate(userFixtures);
  await Booking.bulkCreate(bookingFixtures);
}
```

### API Helpers
```javascript
// Create test user
export async function createTestUser(overrides = {}) {
  return User.create({
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    ...overrides
  });
}

// Create test booking
export async function createTestBooking(overrides = {}) {
  return Booking.create({
    customerId: 'customer-001',
    equipmentId: 'equipment-001',
    startDate: new Date(),
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'pending',
    ...overrides
  });
}
```

## Test Environment Management

### Environment Variables
```bash
# Load test environment
source .env.test

# Run tests with test environment
NODE_ENV=test npm test
```

### Docker Test Environment
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  test-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: kubota_rentals_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"

  test-redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
```

### CI/CD Test Environment
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
```

## Test Coverage

### Coverage Targets
- **Unit Tests**: 80% minimum
- **Integration Tests**: 70% minimum
- **E2E Tests**: Critical user journeys

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Performance Testing

### Load Testing
```bash
# Run load tests
npm run test:load

# Run stress tests
npm run test:stress

# Run performance benchmarks
npm run test:benchmark
```

### Performance Targets
- **API Response Time**: <500ms
- **Page Load Time**: <2s
- **Database Query Time**: <100ms
- **Concurrent Users**: 1000+

## Test Environment Maintenance

### Regular Tasks
- Update test data monthly
- Clean up old test runs
- Update dependencies
- Review test coverage

### Monitoring
- Test execution time
- Test failure rates
- Environment stability
- Resource usage

---

*This test environment guide should be updated as new testing requirements and tools are added.*
