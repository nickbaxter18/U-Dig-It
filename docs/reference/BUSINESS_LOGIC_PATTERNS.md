# Business Logic Patterns

**Purpose**: Documented workflows and business rules for booking creation, pricing calculation, payment processing, and equipment management.

**Last Updated**: 2025-01-21

---

## 📚 Table of Contents

- [Booking Creation Flow](#booking-creation-flow)
- [Pricing Calculation](#pricing-calculation)
- [Payment Processing](#payment-processing)
- [Equipment Status Transitions](#equipment-status-transitions)
- [Contract Generation](#contract-generation)
- [Discount & Coupon Application](#discount--coupon-application)
- [Seasonal Pricing](#seasonal-pricing)
- [Delivery Fee Calculation](#delivery-fee-calculation)

---

## Booking Creation Flow

### Step-by-Step Process

1. **Validate User Authentication**
   - User must be authenticated (`auth.uid()`)
   - Check user status (`active`, `inactive`, `suspended`)

2. **Check Equipment Availability**
   - Query `bookings` table for conflicts
   - Check `equipment.status` = `'available'`
   - Verify no overlapping bookings for date range
   - Consider `actual_start_date` and `actual_end_date` for active rentals

3. **Validate Booking Dates**
   - `start_date` must be today or future
   - `end_date` must be after `start_date`
   - Maximum rental duration: 365 days
   - Minimum rental duration: 1 day

4. **Calculate Pricing**
   - Base rental cost (daily/weekly/monthly rates)
   - Apply long-term discounts (weekly 10%, monthly 20%)
   - Add delivery fee (if applicable)
   - Add insurance fee (8% of rental cost, if selected)
   - Add operator fee ($150/day, if selected)
   - Apply coupon discount (if valid)
   - Calculate HST (15% on subtotal)
   - Calculate security deposit (30% of total)

5. **Create Booking Record**
   - Generate unique `booking_number` (format: `UDR-YYYYMMDD-RRR`)
   - Set `status` = `'pending'`
   - Store pricing breakdown
   - Store delivery information
   - Store customer acceptance of terms

6. **Send Notifications**
   - Email confirmation to customer
   - Email notification to admin
   - Create notification record in `notifications` table

7. **Update Equipment Status** (if needed)
   - Equipment remains `'available'` until booking is `'confirmed'`
   - Status changes to `'rented'` when booking becomes `'active'`

### Booking Status Lifecycle

```
pending → confirmed → active → completed
   ↓
cancelled
```

**Status Definitions:**
- `pending`: Booking created, awaiting payment/confirmation
- `confirmed`: Payment received, booking confirmed
- `active`: Equipment picked up, rental in progress
- `completed`: Equipment returned, rental finished
- `cancelled`: Booking cancelled (may have cancellation fee)

### Code Example

```typescript
// Simplified booking creation flow
export async function createBooking(data: BookingFormData) {
  // 1. Authenticate
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // 2. Check availability
  const availability = await checkAvailability(
    data.equipmentId,
    data.startDate,
    data.endDate
  );
  if (!availability.available) {
    throw new Error('Equipment not available');
  }

  // 3. Validate dates
  validateDates(data.startDate, data.endDate);

  // 4. Calculate pricing
  const pricing = calculateBookingPricing({
    equipment: equipmentData,
    startDate: data.startDate,
    endDate: data.endDate,
    delivery: { distanceKm: data.distanceKm },
    includeInsurance: data.includeInsurance,
    includeOperator: data.includeOperator,
    coupon: data.coupon,
  });

  // 5. Create booking
  const { data: booking } = await supabase
    .from('bookings')
    .insert({
      booking_number: generateBookingNumber(),
      customer_id: user.id,
      equipment_id: data.equipmentId,
      start_date: data.startDate,
      end_date: data.endDate,
      status: 'pending',
      ...pricing,
    })
    .select()
    .single();

  // 6. Send notifications
  await sendBookingConfirmation(booking);

  return booking;
}
```

---

## Pricing Calculation

### Base Rental Cost

**Daily Rate Calculation:**
```
rental_cost = daily_rate × rental_days
```

**Weekly Rate Calculation:**
```
if rental_days >= 7:
  rental_cost = weekly_rate × (rental_days / 7)
  discount = rental_cost × 0.10  # 10% weekly discount
```

**Monthly Rate Calculation:**
```
if rental_days >= 30:
  rental_cost = monthly_rate × (rental_days / 30)
  discount = rental_cost × 0.20  # 20% monthly discount
```

### Long-Term Discounts

- **Weekly (7+ days)**: 10% discount on base rental cost
- **Monthly (30+ days)**: 20% discount on base rental cost
- Discounts are applied to base rental cost, not add-ons

### Add-Ons

**Insurance Fee:**
```
insurance_fee = rental_cost × 0.08  # 8% of rental cost
```

**Operator Fee:**
```
operator_fee = 150 × rental_days  # $150 per day
```

**Delivery Fee:**
See [Delivery Fee Calculation](#delivery-fee-calculation)

### Coupon Discounts

**Percentage Coupon:**
```
coupon_discount = subtotal × (coupon_value / 100)
```

**Fixed Amount Coupon:**
```
coupon_discount = coupon_value
```

**Rules:**
- Coupon discount cannot exceed subtotal
- Coupon must be valid (not expired, within usage limits)
- Coupon must match equipment type (if specified)
- Minimum booking amount may apply

### Tax Calculation

**HST (Harmonized Sales Tax):**
```
taxes = subtotal × 0.15  # 15% HST
```

**Tax applies to:**
- Equipment rental cost
- Delivery fee
- Insurance fee
- Operator fee

**Tax does NOT apply to:**
- Coupon discounts
- Security deposits (refundable)

### Security Deposit

```
deposit = total × 0.30  # 30% of total amount
```

**Purpose:**
- Covers potential damage
- Covers overage charges
- Refunded after equipment return and inspection

### Final Total

```
subtotal = rental_cost - discount + insurance_fee + operator_fee + delivery_fee - coupon_discount
taxes = subtotal × 0.15
total = subtotal + taxes
deposit = total × 0.30
```

### Code Example

```typescript
import { calculateBookingPricing } from '@/lib/booking/pricing';

const pricing = calculateBookingPricing({
  equipment: {
    dailyRate: 450,
    weeklyRate: 2250,
    monthlyRate: 9000,
    overageHourlyRate: 50,
    dailyHourAllowance: 8,
    weeklyHourAllowance: 40,
  },
  startDate: '2025-01-01',
  endDate: '2025-01-08', // 7 days
  delivery: { distanceKm: 25 },
  includeInsurance: true,
  includeOperator: false,
  coupon: { type: 'percentage', value: 10 },
});

// Result:
// {
//   days: 7,
//   rentalCost: 2250,        // Weekly rate
//   discount: 225,           // 10% weekly discount
//   insuranceFee: 180,       // 8% of rental cost
//   operatorFee: 0,
//   deliveryFee: 75,
//   couponDiscount: 228,    // 10% of subtotal
//   subtotal: 2052,         // 2250 - 225 + 180 + 75 - 228
//   taxes: 307.80,          // 15% HST
//   total: 2359.80,
//   deposit: 707.94,        // 30% of total
//   breakdown: [...]
// }
```

---

## Payment Processing

### Payment Flow

1. **Create Payment Intent** (Stripe)
   - Amount: Booking `total_amount`
   - Currency: `CAD`
   - Payment method: Card, ACH, etc.
   - Metadata: Booking ID, customer ID

2. **Process Payment**
   - Customer submits payment
   - Stripe processes payment
   - Webhook received on success/failure

3. **Update Booking Status**
   - On success: `status` = `'confirmed'`
   - On failure: `status` = `'pending'` (retry allowed)

4. **Create Payment Record**
   - Insert into `payments` table
   - Link to booking via `booking_id`
   - Store Stripe payment intent ID
   - Store Stripe charge ID

5. **Send Confirmation**
   - Email receipt to customer
   - Update booking with payment confirmation

### Payment Types

**Security Hold:**
- Temporary hold on card
- Amount: Security deposit
- Released after equipment return
- No charge unless damage/overage

**Full Payment:**
- Charge entire booking amount
- Includes rental, fees, taxes
- Security deposit separate

**Partial Payment:**
- Installment payments (if enabled)
- Payment schedule in `payment_schedules` table
- Each payment creates separate `payments` record

### Payment Status

- `pending`: Payment initiated, awaiting processing
- `processing`: Payment being processed
- `completed`: Payment successful
- `failed`: Payment failed (retry allowed)
- `refunded`: Payment refunded

### Refund Rules

**Cancellation Refunds:**
- > 7 days before start: Full refund (minus processing fee)
- 3-7 days before start: 50% refund
- < 3 days before start: No refund

**Damage Refunds:**
- Security deposit refunded minus damage costs
- Damage costs itemized and documented

### Code Example

```typescript
// Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(booking.total_amount * 100), // Convert to cents
  currency: 'cad',
  metadata: {
    booking_id: booking.id,
    customer_id: booking.customer_id,
  },
});

// Process payment (client-side)
const { error } = await stripe.confirmCardPayment(
  paymentIntent.client_secret,
  { payment_method: { card: cardElement } }
);

// Update booking on success
if (!error) {
  await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', booking.id);

  await supabase.from('payments').insert({
    booking_id: booking.id,
    amount: booking.total_amount,
    status: 'completed',
    stripe_payment_intent_id: paymentIntent.id,
  });
}
```

---

## Equipment Status Transitions

### Status Flow

```
available → rented → available
    ↓         ↓
maintenance  maintenance
    ↓
retired
```

### Status Definitions

- `available`: Available for rental
- `rented`: Currently rented out
- `maintenance`: In maintenance/repair
- `retired`: Retired from service

### Automatic Status Updates

**Booking Confirmed:**
- Equipment remains `available` (not yet picked up)

**Booking Active:**
- Equipment status → `rented`
- Triggered when `actual_start_date` is set

**Booking Completed:**
- Equipment status → `available`
- Triggered when `actual_end_date` is set
- Only if no maintenance required

**Maintenance Scheduled:**
- Equipment status → `maintenance`
- Triggered by `equipment_maintenance` record

**Maintenance Completed:**
- Equipment status → `available`
- Triggered when maintenance `status` = `'completed'`

### Manual Status Updates

Admins can manually update equipment status:
- Set to `maintenance` for repairs
- Set to `retired` for decommissioned equipment
- Set to `available` after manual inspection

### Code Example

```typescript
// Update equipment status when booking becomes active
export async function activateBooking(bookingId: string) {
  const { data: booking } = await supabase
    .from('bookings')
    .update({
      status: 'active',
      actual_start_date: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  // Update equipment status
  await supabase
    .from('equipment')
    .update({ status: 'rented' })
    .eq('id', booking.equipment_id);

  return booking;
}
```

---

## Contract Generation

### Contract Creation Flow

1. **Generate Contract Number**
   - Format: `CT-{booking_number}` or `CT-{timestamp}-{random}`
   - Stored in `contracts.contract_number`

2. **Select Template**
   - Based on equipment type
   - Template version stored in `contracts.template_version`

3. **Populate Contract Data**
   - Customer information
   - Equipment details
   - Booking dates and pricing
   - Terms and conditions version

4. **Generate PDF**
   - Use contract template
   - Include all booking details
   - Store PDF URL in `contracts.contract_url`

5. **Send for Signature**
   - Email contract to customer
   - DocuSign integration (if enabled)
   - Store DocuSign envelope ID

6. **Track Signature Status**
   - `draft`: Contract generated
   - `generated`: PDF created
   - `sent`: Sent to customer
   - `signed`: Customer signed
   - `expired`: Signature deadline passed

### Contract Requirements

**Before Booking Confirmation:**
- Contract must be `generated` or `signed`
- Customer must accept terms (`terms_accepted` JSONB)

**Before Equipment Pickup:**
- Contract must be `signed`
- All required documents uploaded

### Code Example

```typescript
export async function generateContract(bookingId: string) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, equipment:equipment_id(*), customer:customer_id(*)')
    .eq('id', bookingId)
    .single();

  // Generate contract number
  const contractNumber = generateContractNumber(booking.booking_number);

  // Create contract record
  const { data: contract } = await supabase
    .from('contracts')
    .insert({
      booking_id: bookingId,
      contract_number: contractNumber,
      status: 'draft',
      template_version: 'v2.1',
      terms_version: 'v1.0',
      rider_version: 'v1.0',
    })
    .select()
    .single();

  // Generate PDF
  const pdfUrl = await generateContractPDF(contract, booking);

  // Update contract with PDF URL
  await supabase
    .from('contracts')
    .update({
      contract_url: pdfUrl,
      status: 'generated',
      generated_at: new Date().toISOString(),
    })
    .eq('id', contract.id);

  return contract;
}
```

---

## Discount & Coupon Application

### Coupon Validation

**Before Application:**
1. Check coupon exists and is active
2. Verify coupon is not expired
3. Check usage limits (`used_count < max_uses`)
4. Check per-user usage limit
5. Verify minimum booking amount (if specified)
6. Verify equipment type matches (if specified)

### Coupon Types

**Percentage Discount:**
```
discount = subtotal × (coupon_value / 100)
```

**Fixed Amount Discount:**
```
discount = coupon_value
```

**Free Delivery:**
```
delivery_fee = 0
```

### Coupon Application Order

1. Calculate base rental cost
2. Apply long-term discounts (weekly/monthly)
3. Add add-ons (insurance, operator, delivery)
4. Calculate subtotal
5. **Apply coupon discount** (reduces subtotal)
6. Calculate taxes on reduced subtotal
7. Calculate total

### Code Example

```typescript
// Validate and apply coupon
export async function validateCoupon(
  code: string,
  bookingAmount: number,
  equipmentType: string
) {
  const { data: coupon } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (!coupon) {
    throw new Error('Invalid coupon code');
  }

  // Check expiration
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    throw new Error('Coupon has expired');
  }

  // Check usage limits
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    throw new Error('Coupon usage limit reached');
  }

  // Check minimum booking amount
  if (coupon.min_booking_amount && bookingAmount < coupon.min_booking_amount) {
    throw new Error(`Minimum booking amount: ${coupon.min_booking_amount}`);
  }

  // Check equipment type
  if (
    coupon.applicable_equipment_types &&
    !coupon.applicable_equipment_types.includes(equipmentType)
  ) {
    throw new Error('Coupon not valid for this equipment type');
  }

  return coupon;
}
```

---

## Seasonal Pricing

### Seasonal Multiplier Application

**Seasonal Rules:**
- Defined in `seasonal_pricing` table
- Applied based on `start_date` of booking
- Multiplier applied to base rental rates

**Calculation:**
```
adjusted_daily_rate = daily_rate × seasonal_multiplier
adjusted_weekly_rate = weekly_rate × seasonal_multiplier
adjusted_monthly_rate = monthly_rate × seasonal_multiplier
```

**Example:**
- Base daily rate: $450
- Summer multiplier: 1.2 (20% increase)
- Summer daily rate: $450 × 1.2 = $540

### Seasonal Periods

**Peak Season (May-September):**
- Construction season in Saint John, NB
- Higher demand
- Multiplier: 1.15 - 1.25

**Off-Season (October-April):**
- Lower demand
- Multiplier: 0.85 - 0.95

### Code Example

```typescript
export async function getSeasonalMultiplier(
  equipmentType: string,
  startDate: Date
): Promise<number> {
  const { data: seasonalRule } = await supabase
    .from('seasonal_pricing')
    .select('multiplier')
    .eq('equipment_type', equipmentType)
    .eq('is_active', true)
    .lte('start_date', startDate.toISOString().split('T')[0])
    .gte('end_date', startDate.toISOString().split('T')[0])
    .single();

  return seasonalRule?.multiplier ?? 1.0;
}
```

---

## Delivery Fee Calculation

### Distance-Based Pricing

**Tiered Pricing:**
- ≤ 10 km: $50
- ≤ 25 km: $75
- ≤ 50 km: $125
- > 50 km: $125 + ($2/km for each km over 50)

**Formula:**
```typescript
function calculateDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 10) return 50;
  if (distanceKm <= 25) return 75;
  if (distanceKm <= 50) return 125;
  return 125 + (distanceKm - 50) * 2;
}
```

### City-Based Pricing (Fallback)

If distance not available, use city-based pricing:
- Saint John: $150
- Rothesay: $175
- Quispamsis: $175
- Other areas: $200

### Pickup vs Delivery

**Pickup (`type: 'pickup'`):**
- Customer picks up equipment
- No delivery fee

**Delivery (`type: 'delivery'`):**
- Equipment delivered to customer
- Delivery fee applies
- Includes pickup fee (same amount)

### Code Example

```typescript
import { calculateDeliveryFee } from '@/lib/booking/pricing';

// Using distance
const fee1 = calculateDeliveryFee(15); // 75

// Using city (fallback)
const DELIVERY_FEES: Record<string, number> = {
  'Saint John': 150,
  'Rothesay': 175,
  'Quispamsis': 175,
};

const fee2 = DELIVERY_FEES[city] ?? 200;
```

---

## Quick Reference

### Booking Creation Checklist

- [ ] User authenticated
- [ ] Equipment available
- [ ] Dates valid
- [ ] Pricing calculated
- [ ] Booking record created
- [ ] Notifications sent

### Pricing Calculation Order

1. Base rental cost
2. Long-term discounts
3. Add-ons (insurance, operator, delivery)
4. Subtotal
5. Coupon discount
6. Taxes (HST 15%)
7. Total
8. Security deposit (30%)

### Payment Processing Checklist

- [ ] Payment intent created
- [ ] Payment processed
- [ ] Booking status updated
- [ ] Payment record created
- [ ] Confirmation sent

---

**Remember**:
- 💰 **Pricing calculated server-side**
- 🔒 **Always validate coupons**
- 📅 **Seasonal pricing applied automatically**
- 🚚 **Delivery fee based on distance**
- 📝 **Contracts required before pickup**
- ✅ **Status transitions are automatic**



