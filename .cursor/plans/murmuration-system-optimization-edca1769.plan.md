<!-- edca1769-e7d6-4cef-b9e6-f1a1c2fff3d8 f0cf628a-9966-42f4-a1c5-19e8bbb802d2 -->
# Complete Kubota Rental Platform Success Plan

## Overview

This plan delivers a fully functional Kubota rental platform in 16 weeks with a part-time solo developer schedule. It strategically balances murmuration AI optimization (completed first for productivity gains) with platform development, using third-party services for faster delivery where appropriate.

## Timeline Strategy

- **Week 1**: Murmuration optimization (6 hours) - productivity multiplier for remaining work
- **Weeks 2-16**: Platform development (15 weeks × 20 hours/week = 300 hours total)
- **Parallel approach**: Backend + Frontend + Testing in coordinated sprints

## Phase 0: AI Productivity Boost (Week 1 - 6 hours)

### Complete Murmuration Optimization First

**Rationale**: These optimizations provide 10x faster AI responses and better code suggestions, accelerating all subsequent development.

**Files**: `.cursor/intelligence/murmuration/`

**Implementation** (following existing plan):

1. Fix recommendation generation (5 min)
2. Optimize hot rules pre-loading (2 min)
3. Implement smart caching (5 min)
4. Add intent detection (2 min)
5. Add context persistence (10 min)
6. Add working memory (3 min)
7. Implement confidence boosting (5 min)
8. Add rule chains for workflows (10 min)
9. Create error learning system (15 min)
10. Add multi-file context awareness (5 min)

**Result**: All murmuration todos completed, 200% more recommendations, 10x faster responses

## Phase 1: Backend Core (Weeks 2-5 - 80 hours)

### Week 2: API Controllers Completion (20 hours)

**Objective**: Complete all stubbed controller methods with full CRUD operations

**Files to Complete**:

- `backend/src/bookings/bookings.controller.ts` - Complete all booking endpoints
- `backend/src/equipment/equipment.controller.ts` - Complete equipment CRUD
- `backend/src/payments/payments.controller.ts` - Complete payment methods
- `backend/src/contracts/contracts.controller.ts` - Complete contract endpoints
- `backend/src/insurance/insurance.controller.ts` - Complete insurance endpoints

**Key Implementations**:

```typescript
// backend/src/bookings/bookings.controller.ts
@Get()
async findAll(@Query() filters: BookingFilters) {
  return await this.bookingsService.findAll(filters);
}

@Get(':id')
async findOne(@Param('id') id: string) {
  return await this.bookingsService.findOne(id);
}

@Put(':id')
async update(@Param('id') id: string, @Body() updateDto: UpdateBookingDto) {
  return await this.bookingsService.update(id, updateDto);
}

@Delete(':id')
async remove(@Param('id') id: string) {
  return await this.bookingsService.remove(id);
}
```

**Deliverables**:

- All controller methods implemented
- DTOs completed with validation rules
- Swagger documentation for all endpoints

### Week 3: Service Layer Business Logic (20 hours)

**Objective**: Implement core business logic for all services

**Files to Complete**:

- `backend/src/bookings/bookings.service.ts` - Complete booking lifecycle
- `backend/src/equipment/equipment.service.ts` - Availability checking, pricing
- `backend/src/payments/payments.service.ts` - Payment processing, refunds
- `backend/src/contracts/contracts.service.ts` - Contract generation logic
- `backend/src/insurance/insurance.service.ts` - Document verification

**Critical Implementations**:

1. **Availability Checking** (`bookings.service.ts`):
```typescript
async checkAvailability(equipmentId: string, startDate: Date, endDate: Date): Promise<boolean> {
  const overlappingBookings = await this.bookingRepository.find({
    where: {
      equipmentId,
      status: Not(In([BookingStatus.CANCELLED, BookingStatus.REJECTED])),
    }
  });
  
  return !overlappingBookings.some(booking => 
    this.datesOverlap(booking.startDate, booking.endDate, startDate, endDate)
  );
}
```

2. **Dynamic Pricing** (`equipment.service.ts`):
```typescript
async calculatePrice(equipmentId: string, startDate: Date, endDate: Date, deliveryCity: string): Promise<PriceBreakdown> {
  const equipment = await this.findOne(equipmentId);
  const days = this.calculateDays(startDate, endDate);
  const seasonalMultiplier = this.getSeasonalMultiplier(startDate);
  
  const baseRate = days <= 7 ? equipment.dailyRate * days :
                   days <= 30 ? equipment.weeklyRate * Math.ceil(days / 7) :
                   equipment.monthlyRate * Math.ceil(days / 30);
  
  const subtotal = baseRate * seasonalMultiplier;
  const deliveryFee = this.getDeliveryFee(deliveryCity);
  const taxes = (subtotal + deliveryFee) * 0.15; // HST
  
  return { subtotal, deliveryFee, taxes, total: subtotal + deliveryFee + taxes };
}
```


**Deliverables**:

- All service methods implemented
- Business logic fully functional
- Integration with TypeORM repositories

### Week 4: Error Handling & Validation (20 hours)

**Objective**: Comprehensive error handling and input validation

**Implementation Areas**:

1. **Global Exception Filter** (`backend/src/common/filters/http-exception.filter.ts`):
```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error: process.env.NODE_ENV === 'production' ? undefined : exception
    });
  }
}
```

2. **Complete All DTOs** with class-validator:
```typescript
// backend/src/bookings/dto/create-booking.dto.ts
export class CreateBookingDto {
  @IsUUID()
  equipmentId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  @Validate(CustomValidators.IsAfter, ['startDate'])
  endDate: string;

  @IsEnum(BookingType)
  type: BookingType;

  @IsString()
  @MinLength(5)
  deliveryAddress: string;

  @IsString()
  deliveryCity: string;
}
```


**Deliverables**:

- Comprehensive error handling across all modules
- All DTOs completed with validation
- Custom validators for business rules

### Week 5: Database Migrations & Seeding (20 hours)

**Objective**: Database versioning and test data

**Files to Create**:

- `backend/src/database/migrations/001-initial-schema.ts`
- `backend/src/database/migrations/002-add-indexes.ts`
- `backend/src/database/seeds/equipment.seed.ts`
- `backend/src/database/seeds/users.seed.ts`

**Implementation**:

1. **Migration System**:
```typescript
// backend/src/database/migrations/001-initial-schema.ts
export class InitialSchema1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'equipment',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'unitId', type: 'varchar', length: '50', isUnique: true },
        { name: 'serialNumber', type: 'varchar', length: '100', isUnique: true },
        // ... all columns
      ]
    }));
  }
}
```

2. **Seed Data** for Kubota SVL-75:
```typescript
// backend/src/database/seeds/equipment.seed.ts
export async function seedEquipment(connection: Connection) {
  const equipmentRepo = connection.getRepository(Equipment);
  
  await equipmentRepo.save({
    unitId: 'SVL75-001',
    serialNumber: 'KUBOTA-SVL75-2025-001',
    type: EquipmentType.SVL75,
    model: 'SVL75-3',
    year: 2025,
    make: 'Kubota',
    dailyRate: 350,
    weeklyRate: 2100,
    monthlyRate: 7500,
    // ... specifications
  });
}
```


**Deliverables**:

- All migrations created and tested
- Seed data for equipment catalog
- Database rollback capabilities

## Phase 2: Critical Integrations (Weeks 6-8 - 60 hours)

### Week 6: Email & Notification System (20 hours)

**Objective**: Implement email service with templates using third-party service (SendGrid)

**Third-Party Service**: SendGrid (easier than custom SMTP)

**Files to Create**:

- `backend/src/email/email.service.ts` - Complete implementation
- `backend/src/email/templates/booking-confirmation.hbs`
- `backend/src/email/templates/payment-received.hbs`
- `backend/src/email/templates/booking-reminder.hbs`

**Implementation**:

1. **Email Service** with SendGrid:
```typescript
// backend/src/email/email.service.ts
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendBookingConfirmation(booking: Booking): Promise<void> {
    const template = await this.loadTemplate('booking-confirmation');
    const html = this.renderTemplate(template, {
      customerName: booking.customer.firstName,
      bookingNumber: booking.bookingNumber,
      startDate: booking.startDate,
      endDate: booking.endDate,
      total: booking.total
    });

    await sgMail.send({
      to: booking.customer.email,
      from: 'bookings@udigit.ca',
      subject: `Booking Confirmation - ${booking.bookingNumber}`,
      html
    });
  }
}
```

2. **Email Templates** (Handlebars):
```handlebars
<!-- backend/src/email/templates/booking-confirmation.hbs -->
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Email-safe CSS */
  </style>
</head>
<body>
  <h1>Booking Confirmed!</h1>
  <p>Hi {{customerName}},</p>
  <p>Your booking <strong>{{bookingNumber}}</strong> has been confirmed.</p>
  <table>
    <tr><td>Equipment:</td><td>Kubota SVL-75</td></tr>
    <tr><td>Start Date:</td><td>{{startDate}}</td></tr>
    <tr><td>End Date:</td><td>{{endDate}}</td></tr>
    <tr><td>Total:</td><td>${{total}}</td></tr>
  </table>
</body>
</html>
```


**Deliverables**:

- SendGrid integration complete
- Email templates for all booking events
- Background job queue for emails

### Week 7: Contract Management & DocuSign (20 hours)

**Objective**: PDF generation and DocuSign integration

**Third-Party Service**: DocuSign API

**Files to Complete**:

- `backend/src/contracts/contracts.service.ts` - Full implementation
- `backend/src/contracts/templates/rental-agreement.ts` - PDF template
- `backend/src/contracts/docusign.service.ts` - DocuSign integration

**Implementation**:

1. **PDF Generation** with PDFKit:
```typescript
// backend/src/contracts/contracts.service.ts
async generateContractPDF(booking: Booking): Promise<Buffer> {
  const doc = new PDFDocument();
  const buffers = [];
  
  doc.on('data', buffers.push.bind(buffers));
  
  // Header
  doc.fontSize(20).text('EQUIPMENT RENTAL AGREEMENT', { align: 'center' });
  doc.moveDown();
  
  // Contract details
  doc.fontSize(12);
  doc.text(`Contract Number: ${contract.contractNumber}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();
  
  // Parties
  doc.text('RENTAL COMPANY:', { underline: true });
  doc.text('U-Dig It Rentals');
  doc.text('Saint John, New Brunswick');
  doc.moveDown();
  
  doc.text('CUSTOMER:', { underline: true });
  doc.text(`${booking.customer.firstName} ${booking.customer.lastName}`);
  doc.text(booking.customer.address);
  doc.moveDown();
  
  // Equipment details, terms, signatures
  // ... full contract content
  
  doc.end();
  
  return Buffer.concat(buffers);
}
```

2. **DocuSign Integration**:
```typescript
// backend/src/contracts/docusign.service.ts
@Injectable()
export class DocuSignService {
  private apiClient: DocuSign.ApiClient;
  
  async sendForSignature(contract: Contract, pdf: Buffer): Promise<string> {
    const envelopeDefinition = {
      emailSubject: `Please sign rental agreement ${contract.contractNumber}`,
      documents: [{
        documentBase64: pdf.toString('base64'),
        name: 'Rental Agreement',
        fileExtension: 'pdf',
        documentId: '1'
      }],
      recipients: {
        signers: [{
          email: contract.booking.customer.email,
          name: `${contract.booking.customer.firstName} ${contract.booking.customer.lastName}`,
          recipientId: '1',
          routingOrder: '1',
          tabs: {
            signHereTabs: [{ xPosition: '100', yPosition: '650', documentId: '1', pageNumber: '4' }],
            dateSignedTabs: [{ xPosition: '300', yPosition: '650', documentId: '1', pageNumber: '4' }]
          }
        }]
      },
      status: 'sent'
    };
    
    const envelopesApi = new DocuSign.EnvelopesApi(this.apiClient);
    const envelope = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });
    
    return envelope.envelopeId;
  }
}
```


**Deliverables**:

- PDF contract generation
- DocuSign integration complete
- Webhook handling for signature status

### Week 8: Background Jobs & Queue Management (20 hours)

**Objective**: BullMQ job processors for async operations

**Files to Create**:

- `backend/src/jobs/processors/email.processor.ts`
- `backend/src/jobs/processors/contract.processor.ts`
- `backend/src/jobs/processors/notification.processor.ts`

**Implementation**:

```typescript
// backend/src/jobs/processors/email.processor.ts
@Processor('email')
export class EmailProcessor {
  constructor(private emailService: EmailService) {}
  
  @Process('booking-confirmation')
  async handleBookingConfirmation(job: Job<{ bookingId: string }>) {
    const booking = await this.bookingsService.findOne(job.data.bookingId);
    await this.emailService.sendBookingConfirmation(booking);
  }
  
  @Process('payment-received')
  async handlePaymentReceived(job: Job<{ paymentId: string }>) {
    const payment = await this.paymentsService.findOne(job.data.paymentId);
    await this.emailService.sendPaymentConfirmation(payment);
  }
}
```

**Deliverables**:

- All job processors implemented
- Queue monitoring dashboard
- Failed job retry logic

## Phase 3: Frontend Enhancement (Weeks 9-11 - 60 hours)

### Week 9: Admin Dashboard Foundation (20 hours)

**Objective**: Create admin interface for bookings and equipment management

**Files to Create**:

- `frontend/src/app/admin/layout.tsx` - Admin layout with navigation
- `frontend/src/app/admin/dashboard/page.tsx` - Dashboard overview
- `frontend/src/app/admin/bookings/page.tsx` - Bookings list
- `frontend/src/app/admin/equipment/page.tsx` - Equipment management
- `frontend/src/components/admin/` - Admin-specific components

**Implementation**:

1. **Admin Layout** with role-based access:
```typescript
// frontend/src/app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }
  
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
```

2. **Bookings Management**:
```typescript
// frontend/src/app/admin/bookings/page.tsx
export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState({ status: 'all', dateRange: 'all' });
  
  return (
    <div>
      <h1>Booking Management</h1>
      <BookingFilters filters={filters} onChange={setFilters} />
      <BookingsTable 
        bookings={bookings} 
        onStatusChange={handleStatusChange}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
}
```


**Deliverables**:

- Admin dashboard with overview stats
- Bookings management interface
- Equipment CRUD interface

### Week 10: Search & Filtering (20 hours)

**Objective**: Equipment search with advanced filters

**Files to Create**:

- `frontend/src/components/EquipmentSearch.tsx`
- `frontend/src/components/AdvancedFilters.tsx`
- `backend/src/equipment/equipment.search.service.ts`

**Implementation**:

1. **Search Service** with TypeORM:
```typescript
// backend/src/equipment/equipment.search.service.ts
@Injectable()
export class EquipmentSearchService {
  async search(query: SearchEquipmentDto): Promise<Equipment[]> {
    const qb = this.equipmentRepository.createQueryBuilder('equipment');
    
    if (query.available) {
      qb.andWhere('equipment.status = :status', { status: EquipmentStatus.AVAILABLE });
    }
    
    if (query.dateRange) {
      // Check availability for date range
      qb.andWhere(/* complex availability query */);
    }
    
    if (query.priceRange) {
      qb.andWhere('equipment.dailyRate BETWEEN :min AND :max', query.priceRange);
    }
    
    return await qb.getMany();
  }
}
```

2. **Frontend Search Component**:
```typescript
// frontend/src/components/EquipmentSearch.tsx
export default function EquipmentSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState([]);
  
  const handleSearch = async () => {
    const response = await fetch('/api/equipment/search', {
      method: 'POST',
      body: JSON.stringify({ query: searchTerm, ...filters })
    });
    setResults(await response.json());
  };
  
  return (
    <div>
      <SearchBar value={searchTerm} onChange={setSearchTerm} onSearch={handleSearch} />
      <AdvancedFilters filters={filters} onChange={setFilters} />
      <SearchResults results={results} />
    </div>
  );
}
```


**Deliverables**:

- Full-text equipment search
- Advanced filtering (availability, price, location)
- Search result pagination

### Week 11: Analytics & Reporting (20 hours)

**Objective**: Admin analytics dashboard with key metrics

**Files to Create**:

- `frontend/src/app/admin/analytics/page.tsx`
- `frontend/src/components/analytics/` - Chart components
- `backend/src/analytics/analytics.service.ts`

**Implementation**:

1. **Analytics Service**:
```typescript
// backend/src/analytics/analytics.service.ts
@Injectable()
export class AnalyticsService {
  async getBookingStats(dateRange: DateRange): Promise<BookingStats> {
    const bookings = await this.bookingRepository.find({
      where: { createdAt: Between(dateRange.start, dateRange.end) }
    });
    
    return {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((sum, b) => sum + b.total, 0),
      averageBookingValue: this.calculateAverage(bookings),
      bookingsByStatus: this.groupByStatus(bookings),
      revenueByMonth: this.groupByMonth(bookings)
    };
  }
  
  async getEquipmentUtilization(): Promise<UtilizationStats> {
    // Calculate equipment usage percentage
    // Days booked vs days available
  }
}
```

2. **Analytics Dashboard** with Chart.js:
```typescript
// frontend/src/app/admin/analytics/page.tsx
export default function AnalyticsPage() {
  const { data: stats } = useQuery(['analytics'], fetchAnalytics);
  
  return (
    <div className="grid grid-cols-2 gap-6">
      <RevenueChart data={stats.revenueByMonth} />
      <BookingsChart data={stats.bookingsByStatus} />
      <UtilizationChart data={stats.utilization} />
      <CustomerMetrics data={stats.customerStats} />
    </div>
  );
}
```


**Deliverables**:

- Revenue analytics dashboard
- Equipment utilization metrics
- Customer insights and trends

## Phase 4: Testing & Quality (Weeks 12-13 - 40 hours)

### Week 12: Unit & Integration Tests (20 hours)

**Objective**: 85%+ test coverage for critical paths

**Files to Create**:

- `backend/src/__tests__/unit/bookings.service.spec.ts`
- `backend/src/__tests__/unit/payments.service.spec.ts`
- `backend/src/__tests__/integration/booking-flow.spec.ts`
- `frontend/src/components/__tests__/` - Component tests

**Implementation**:

1. **Service Unit Tests**:
```typescript
// backend/src/__tests__/unit/bookings.service.spec.ts
describe('BookingsService', () => {
  let service: BookingsService;
  let repository: MockRepository<Booking>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useClass: MockRepository }
      ]
    }).compile();
    
    service = module.get(BookingsService);
  });
  
  describe('checkAvailability', () => {
    it('should return true when equipment is available', async () => {
      repository.find.mockResolvedValue([]);
      const result = await service.checkAvailability('eq-1', new Date(), new Date());
      expect(result).toBe(true);
    });
    
    it('should return false when equipment is booked', async () => {
      repository.find.mockResolvedValue([{ /* overlapping booking */ }]);
      const result = await service.checkAvailability('eq-1', new Date(), new Date());
      expect(result).toBe(false);
    });
  });
});
```

2. **Integration Tests** for booking flow:
```typescript
// backend/src/__tests__/integration/booking-flow.spec.ts
describe('Booking Flow (Integration)', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    app = await createTestApp();
  });
  
  it('should complete full booking flow', async () => {
    // 1. Check availability
    const availabilityResponse = await request(app.getHttpServer())
      .post('/bookings/check-availability')
      .send({ equipmentId, startDate, endDate })
      .expect(200);
    
    // 2. Create booking
    const bookingResponse = await request(app.getHttpServer())
      .post('/bookings')
      .send(bookingData)
      .expect(201);
    
    // 3. Process payment
    const paymentResponse = await request(app.getHttpServer())
      .post(`/payments/booking/${bookingResponse.body.id}`)
      .send(paymentData)
      .expect(201);
    
    // 4. Verify booking status
    const booking = await request(app.getHttpServer())
      .get(`/bookings/${bookingResponse.body.id}`)
      .expect(200);
    
    expect(booking.body.status).toBe('CONFIRMED');
  });
});
```


**Deliverables**:

- 85%+ code coverage
- All critical paths tested
- Integration test suite

### Week 13: E2E & Performance Tests (20 hours)

**Objective**: End-to-end user journey tests and performance validation

**Files to Create**:

- `frontend/e2e/booking-flow.spec.ts`
- `frontend/e2e/admin-management.spec.ts`
- `scripts/performance-test.js`

**Implementation**:

1. **E2E Tests** with Playwright:
```typescript
// frontend/e2e/booking-flow.spec.ts
test('complete booking flow as guest', async ({ page }) => {
  // Navigate to booking page
  await page.goto('/book');
  
  // Step 1: Select dates
  await page.fill('[name="startDate"]', '2025-06-01');
  await page.fill('[name="endDate"]', '2025-06-07');
  await page.click('button:has-text("Next")');
  
  // Step 2: Enter delivery details
  await page.fill('[name="deliveryAddress"]', '123 Main St');
  await page.selectOption('[name="deliveryCity"]', 'Saint John');
  await page.click('button:has-text("Next")');
  
  // Step 3: Guest checkout
  await page.click('button:has-text("Continue as Guest")');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="firstName"]', 'John');
  await page.fill('[name="lastName"]', 'Doe');
  await page.click('button:has-text("Next")');
  
  // Step 4: Payment
  await page.fill('[name="cardNumber"]', '4242424242424242');
  await page.fill('[name="expiry"]', '12/28');
  await page.fill('[name="cvc"]', '123');
  await page.click('button:has-text("Complete Booking")');
  
  // Verify confirmation
  await expect(page.locator('h1')).toContainText('Booking Confirmed');
});
```

2. **Performance Tests** with Artillery:
```yaml
# scripts/performance-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Sustained load
scenarios:
  - name: Booking flow
    flow:
      - post:
          url: '/bookings/check-availability'
          json:
            equipmentId: '{{ equipmentId }}'
            startDate: '2025-06-01'
            endDate: '2025-06-07'
      - post:
          url: '/bookings'
          json:
            # booking data
```


**Deliverables**:

- E2E tests for all user journeys
- Performance benchmarks
- Load testing results

## Phase 5: Polish & Deployment (Weeks 14-16 - 60 hours)

### Week 14: Security Hardening (20 hours)

**Objective**: Security audit and vulnerability fixes

**Implementation Areas**:

1. **Security Headers** (already partially done):
```typescript
// backend/src/main.ts - enhance existing
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
});
```

2. **Rate Limiting Enhancement**:
```typescript
// Add IP-based rate limiting for sensitive endpoints
@Throttle({ short: { limit: 3, ttl: 60000 } })
@Post('payment')
async processPayment(@Ip() ip: string, @Body() dto: PaymentDto) {
  await this.securityService.checkIPReputation(ip);
  return await this.paymentsService.process(dto);
}
```

3. **Input Sanitization**:
```typescript
// Add SQL injection prevention
// Add XSS protection
// Add CSRF tokens
```


**Deliverables**:

- Security audit completed
- All vulnerabilities fixed
- Penetration testing results

### Week 15: Performance Optimization (20 hours)

**Objective**: Optimize for Core Web Vitals and API performance

**Implementation Areas**:

1. **Frontend Optimization**:

- Image optimization with Next.js Image
- Code splitting and lazy loading
- Bundle size reduction
- Service worker caching strategy

2. **Backend Optimization**:
```typescript
// Add database query optimization
@Entity()
@Index(['customerId', 'status'])  // Add strategic indexes
@Index(['equipmentId', 'startDate'])
export class Booking {
  // ...
}

// Add query result caching
@UseInterceptors(CacheInterceptor)
@CacheTTL(300) // 5 minutes
@Get('equipment')
async findAllEquipment() {
  return await this.equipmentService.findAll();
}
```

3. **API Response Optimization**:

- Implement pagination for large lists
- Add field selection (only return needed fields)
- Implement API response compression

**Deliverables**:

- Lighthouse score >90 for all metrics
- API response times <200ms
- Database query optimization

### Week 16: Production Deployment & Documentation (20 hours)

**Objective**: Deploy to production and finalize documentation

**Implementation Areas**:

1. **Production Deployment**:
```bash
# Use existing deployment scripts
./scripts/deploy-production.sh --environment production
```

2. **Environment Configuration**:
```env
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:password@prod-db:5432/udigit_production
REDIS_URL=redis://prod-redis:6379
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG.live...
DOCUSIGN_API_KEY=docusign_live...
```

3. **Documentation**:

- API documentation (Swagger)
- User guide for admin dashboard
- Deployment runbook
- Troubleshooting guide

**Deliverables**:

- Production deployment successful
- All documentation complete
- Monitoring dashboards configured
- Backup and disaster recovery tested

## Success Metrics

### Technical Metrics

- **Test Coverage**: 85%+
- **API Response Time**: <200ms (95th percentile)
- **Lighthouse Score**: >90 (all metrics)
- **Uptime**: 99.9%
- **Security**: No critical vulnerabilities

### Business Metrics

- **Booking Flow**: <3 minutes average completion
- **Admin Efficiency**: Booking management <2 minutes per booking
- **Customer Satisfaction**: <5% support ticket rate
- **System Reliability**: <0.1% error rate

## Risk Mitigation

1. **Part-Time Schedule**: Built-in buffer weeks, prioritized features
2. **Third-Party Dependencies**: Backup plans for critical services
3. **Technical Debt**: Weekly refactoring sessions
4. **Testing Failures**: Continuous testing throughout, not just at end
5. **Scope Creep**: Strict adherence to plan, defer nice-to-haves

## Key Success Factors

1. **Murmuration Optimization First**: 10x productivity boost for remaining work
2. **Strategic Third-Party Use**: Faster delivery for email, contracts, payments
3. **Parallel Development**: Backend, frontend, testing in coordinated sprints
4. **Continuous Testing**: Test as you build, not after
5. **Regular Milestones**: Weekly deliverables maintain momentum

### To-dos

- [ ] Fix recommendation generation in murmuration-ai-system.js (Priority 1)
- [ ] Verify and optimize hot rules pre-loading (Priority 2)
- [ ] Implement smart caching with semantic similarity (Priority 3)
- [ ] Add intent detection from file paths (Priority 4)
- [ ] Create and run Phase 1 optimization tests
- [ ] Implement context persistence with session memory (Priority 5)
- [ ] Add working memory window (Priority 6)
- [ ] Implement confidence boosting from success patterns (Priority 7)
- [ ] Create and run Phase 2 optimization tests
- [ ] Add rule chains for common workflows (Priority 8)
- [ ] Implement multi-file context awareness (Priority 10)
- [ ] Create error pattern recognition system (Priority 9)
- [ ] Create and run Phase 3 optimization tests
- [ ] Create Cursor integration module and update coordinator rule
- [ ] Run comprehensive benchmarks and document improvements