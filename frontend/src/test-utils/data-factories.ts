/**
 * Test data factories for creating realistic test data
 * Use these instead of hardcoding test data
 */

let userCounter = 0;
let equipmentCounter = 0;
let bookingCounter = 0;

/**
 * Reset all counters (useful between test suites)
 */
export const resetCounters = () => {
  userCounter = 0;
  equipmentCounter = 0;
  bookingCounter = 0;
};

/**
 * Create a test user
 */
export const createTestUser = (overrides: any = {}) => {
  const id = overrides.id || `user-${++userCounter}`;

  return {
    id,
    email: `test${userCounter}@example.com`,
    firstName: 'Test',
    lastName: `User${userCounter}`,
    phone: `(506) 555-0${String(100 + userCounter).slice(-3)}`,
    role: 'customer',
    company: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
};

/**
 * Create an admin user
 */
export const createTestAdmin = (overrides: any = {}) => {
  return createTestUser({
    role: 'admin',
    firstName: 'Admin',
    ...overrides,
  });
};

/**
 * Create test equipment
 */
export const createTestEquipment = (overrides: any = {}) => {
  const id = overrides.id || `equipment-${++equipmentCounter}`;
  const unitNumber = String(equipmentCounter).padStart(3, '0');

  return {
    id,
    unitId: `SVL75-${unitNumber}`,
    type: 'SVL75',
    model: 'SVL75-2',
    year: 2023,
    status: 'available',
    dailyRate: 350,
    weeklyRate: 1750,
    monthlyRate: 5250,
    location: 'Saint John',
    description: 'Kubota SVL75-2 Compact Track Loader',
    specifications: {
      operatingWeight: '8157 lbs',
      enginePower: '74.3 HP',
      bucketCapacity: '0.32 yd³',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
};

/**
 * Create test booking
 */
export const createTestBooking = (overrides: any = {}) => {
  const id = overrides.id || `booking-${++bookingCounter}`;
  const year = new Date().getFullYear();
  const bookingNumber = `UDR-${year}-${String(bookingCounter).padStart(3, '0')}`;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7); // Start in 7 days

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 3); // 3 day rental

  return {
    id,
    bookingNumber,
    customerId: overrides.customerId || createTestUser().id,
    equipmentId: overrides.equipmentId || createTestEquipment().id,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'confirmed',
    totalAmount: 1050, // 3 days * $350
    depositAmount: 525, // 50% deposit
    deliveryAddress: '123 Main Street',
    deliveryCity: 'Saint John',
    deliveryProvince: 'NB',
    deliveryPostalCode: 'E2L 1A1',
    specialInstructions: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
};

/**
 * Create test payment
 */
export const createTestPayment = (overrides: any = {}) => {
  const bookingId = overrides.bookingId || createTestBooking().id;

  return {
    id: `payment-${Date.now()}`,
    bookingId,
    amount: 525,
    type: 'deposit',
    status: 'completed',
    stripePaymentIntentId: `pi_mock_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
};

/**
 * Create test contract
 */
export const createTestContract = (overrides: any = {}) => {
  const bookingId = overrides.bookingId || createTestBooking().id;

  return {
    id: `contract-${Date.now()}`,
    bookingId,
    status: 'pending',
    signedAt: null,
    signatureData: null,
    pdfUrl: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
};

/**
 * Create signed contract
 */
export const createSignedContract = (overrides: any = {}) => {
  return createTestContract({
    status: 'signed',
    signedAt: new Date().toISOString(),
    signatureData: 'data:image/png;base64,mock-signature',
    pdfUrl: 'https://example.com/contracts/mock.pdf',
    ...overrides,
  });
};

/**
 * Create booking with related data (user, equipment, payment, contract)
 */
export const createFullBooking = (overrides: any = {}) => {
  const user = createTestUser(overrides.user);
  const equipment = createTestEquipment(overrides.equipment);
  const booking = createTestBooking({
    customerId: user.id,
    equipmentId: equipment.id,
    ...overrides.booking,
  });
  const payment = createTestPayment({
    bookingId: booking.id,
    ...overrides.payment,
  });
  const contract = createTestContract({
    bookingId: booking.id,
    ...overrides.contract,
  });

  return {
    user,
    equipment,
    booking,
    payment,
    contract,
  };
};

/**
 * Create multiple test items
 */
export const createTestUsers = (count: number, overrides: any = {}) => {
  return Array.from({ length: count }, () => createTestUser(overrides));
};

export const createTestEquipments = (count: number, overrides: any = {}) => {
  return Array.from({ length: count }, () => createTestEquipment(overrides));
};

export const createTestBookings = (count: number, overrides: any = {}) => {
  return Array.from({ length: count }, () => createTestBooking(overrides));
};

/**
 * Create test availability block
 */
export const createAvailabilityBlock = (overrides: any = {}) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 3);

  return {
    id: `block-${Date.now()}`,
    equipmentId: createTestEquipment().id,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    reason: 'booked',
    bookingId: null,
    ...overrides,
  };
};


