# API Documentation

This document provides comprehensive documentation for the U-Dig It Rentals API endpoints.

## Table of Contents

- [Base Information](#base-information)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Base Information

- **Base URL**: `https://api.udigit.ca` (Production) / `http://localhost:3001` (Development)
- **API Version**: v1
- **Content Type**: `application/json`
- **Documentation**: Available at `/api` endpoint (Swagger UI)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

## Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/login
Authenticate user and return JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET /auth/profile
Get current user profile (requires authentication).

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /auth/refresh
Refresh JWT token using refresh token.

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Booking Endpoints

#### GET /bookings
Get all bookings with optional filters.

**Query Parameters**:
- `status` (optional): Filter by booking status
- `customerId` (optional): Filter by customer ID
- `equipmentId` (optional): Filter by equipment ID
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Example**:
```bash
GET /bookings?status=confirmed&startDate=2024-01-15&endDate=2024-01-31
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "booking-123",
      "equipmentId": "svl-75-001",
      "customerId": "user-123",
      "startDate": "2024-01-15T08:00:00Z",
      "endDate": "2024-01-17T18:00:00Z",
      "status": "confirmed",
      "totalCost": 1050.00,
      "createdAt": "2024-01-10T10:30:00Z"
    }
  ]
}
```

#### POST /bookings
Create a new booking.

**Request Body**:
```json
{
  "equipmentId": "svl-75-001",
  "startDate": "2024-01-15T08:00:00Z",
  "endDate": "2024-01-17T18:00:00Z",
  "deliveryAddress": "123 Main St, Saint John, NB",
  "deliveryCity": "Saint John",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "customerPhone": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "booking-123",
    "bookingNumber": "BK-2024-001",
    "equipmentId": "svl-75-001",
    "customerId": "user-123",
    "startDate": "2024-01-15T08:00:00Z",
    "endDate": "2024-01-17T18:00:00Z",
    "status": "pending",
    "totalCost": 1050.00,
    "createdAt": "2024-01-10T10:30:00Z"
  }
}
```

#### GET /bookings/:id
Get a specific booking by ID.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "booking-123",
    "bookingNumber": "BK-2024-001",
    "equipment": {
      "id": "svl-75-001",
      "name": "Kubota SVL-75",
      "type": "Compact Track Loader"
    },
    "customer": {
      "id": "user-123",
      "name": "John Doe",
      "email": "customer@example.com"
    },
    "startDate": "2024-01-15T08:00:00Z",
    "endDate": "2024-01-17T18:00:00Z",
    "status": "confirmed",
    "pricing": {
      "dailyRate": 350.00,
      "rentalDays": 3,
      "subtotal": 1050.00,
      "taxes": 157.50,
      "deliveryFee": 300.00,
      "total": 1507.50
    },
    "createdAt": "2024-01-10T10:30:00Z"
  }
}
```

#### GET /bookings/availability/check
Check equipment availability for specific dates.

**Query Parameters**:
- `equipmentId` (required): Equipment ID to check
- `startDate` (required): Start date (ISO 8601)
- `endDate` (required): End date (ISO 8601)

**Example**:
```bash
GET /bookings/availability/check?equipmentId=svl-75-001&startDate=2024-01-15&endDate=2024-01-17
```

**Response**:
```json
{
  "success": true,
  "data": {
    "available": true,
    "conflictingBookings": []
  }
}
```

#### POST /bookings/:id/cancel
Cancel a booking.

**Request Body**:
```json
{
  "reason": "Customer requested cancellation"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "booking-123",
    "status": "cancelled",
    "cancelledAt": "2024-01-12T14:30:00Z",
    "cancellationReason": "Customer requested cancellation"
  }
}
```

### Equipment Endpoints

#### GET /equipment
Get all available equipment.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "svl-75-001",
      "name": "Kubota SVL-75",
      "type": "Compact Track Loader",
      "specifications": {
        "horsepower": "74.3 HP",
        "operatingWeight": "9,420 lbs",
        "liftCapacity": "2,690 lbs"
      },
      "dailyRate": 350.00,
      "weeklyRate": 2100.00,
      "monthlyRate": 8400.00,
      "available": true
    }
  ]
}
```

#### GET /equipment/:id
Get specific equipment details.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "svl-75-001",
    "name": "Kubota SVL-75",
    "type": "Compact Track Loader",
    "description": "Professional-grade compact track loader for construction and excavation projects.",
    "specifications": {
      "horsepower": "74.3 HP",
      "operatingWeight": "9,420 lbs",
      "liftCapacity": "2,690 lbs",
      "digDepth": "13.5 ft",
      "travelSpeed": "7.1 mph",
      "fuelCapacity": "27.7 gal"
    },
    "features": [
      "Fully enclosed ROPS cabin",
      "Air suspension seat",
      "Pilot operated controls",
      "Climate control system"
    ],
    "pricing": {
      "dailyRate": 350.00,
      "weeklyRate": 2100.00,
      "monthlyRate": 8400.00
    },
    "availability": {
      "available": true,
      "nextAvailable": "2024-01-20T08:00:00Z"
    }
  }
}
```

### Payment Endpoints

#### POST /payments/create-intent
Create a Stripe payment intent.

**Request Body**:
```json
{
  "bookingId": "booking-123",
  "amount": 1507.50,
  "currency": "cad"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_1234567890_secret_abcdef",
    "paymentIntentId": "pi_1234567890"
  }
}
```

#### POST /payments/confirm
Confirm a payment.

**Request Body**:
```json
{
  "paymentIntentId": "pi_1234567890",
  "bookingId": "booking-123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_1234567890",
    "status": "succeeded",
    "amount": 1507.50,
    "currency": "cad"
  }
}
```

### Analytics Endpoints

#### GET /bookings/stats
Get booking statistics for the authenticated user.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalBookings": 15,
    "activeBookings": 2,
    "completedBookings": 13,
    "totalSpent": 15750.00,
    "averageRentalDuration": 3.2
  }
}
```

#### GET /bookings/reports/revenue
Get revenue report.

**Query Parameters**:
- `startDate` (optional): Report start date
- `endDate` (optional): Report end date
- `groupBy` (optional): Group by day, week, or month

**Response**:
```json
{
  "success": true,
  "data": {
    "revenue": [
      {
        "date": "2024-01-15",
        "revenue": 1050.00,
        "bookings": 3
      },
      {
        "date": "2024-01-16",
        "revenue": 2100.00,
        "bookings": 6
      }
    ],
    "totalRevenue": 3150.00,
    "totalBookings": 9
  }
}
```

## Error Handling

The API uses standard HTTP status codes and returns consistent error responses.

### Error Response Format

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

### Common Error Codes

- `VALIDATION_ERROR` (400): Input validation failed
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict (e.g., equipment not available)
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_SERVER_ERROR` (500): Server error

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 10 requests per 15 minutes
- **Payment endpoints**: 20 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

## Examples

### Complete Booking Flow

1. **Check Availability**:
```bash
curl "https://api.udigit.ca/bookings/availability/check?equipmentId=svl-75-001&startDate=2024-01-15&endDate=2024-01-17"
```

2. **Create Booking**:
```bash
curl -X POST https://api.udigit.ca/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "equipmentId": "svl-75-001",
    "startDate": "2024-01-15T08:00:00Z",
    "endDate": "2024-01-17T18:00:00Z",
    "deliveryAddress": "123 Main St, Saint John, NB",
    "deliveryCity": "Saint John",
    "customerEmail": "customer@example.com"
  }'
```

3. **Create Payment Intent**:
```bash
curl -X POST https://api.udigit.ca/payments/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "bookingId": "booking-123",
    "amount": 1507.50,
    "currency": "cad"
  }'
```

4. **Confirm Payment**:
```bash
curl -X POST https://api.udigit.ca/payments/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "paymentIntentId": "pi_1234567890",
    "bookingId": "booking-123"
  }'
```

### Error Handling Example

```bash
curl -X POST https://api.udigit.ca/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "equipmentId": "svl-75-001",
    "startDate": "2024-01-10",
    "endDate": "2024-01-15"
  }'
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Equipment not available for selected dates",
    "details": [
      {
        "field": "dates",
        "message": "Equipment is already booked from 2024-01-12 to 2024-01-14"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## SDK and Libraries

### JavaScript/TypeScript

```typescript
import { UDigItAPI } from '@udigit/api-client';

const api = new UDigItAPI({
  baseURL: 'https://api.udigit.ca',
  apiKey: 'your-api-key'
});

// Create a booking
const booking = await api.bookings.create({
  equipmentId: 'svl-75-001',
  startDate: '2024-01-15T08:00:00Z',
  endDate: '2024-01-17T18:00:00Z',
  deliveryAddress: '123 Main St, Saint John, NB',
  deliveryCity: 'Saint John',
  customerEmail: 'customer@example.com'
});
```

### Python

```python
import requests

class UDigItAPI:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def create_booking(self, booking_data):
        response = requests.post(
            f'{self.base_url}/bookings',
            json=booking_data,
            headers=self.headers
        )
        return response.json()

api = UDigItAPI('https://api.udigit.ca', 'your-api-key')
booking = api.create_booking({
    'equipmentId': 'svl-75-001',
    'startDate': '2024-01-15T08:00:00Z',
    'endDate': '2024-01-17T18:00:00Z',
    'deliveryAddress': '123 Main St, Saint John, NB',
    'deliveryCity': 'Saint John',
    'customerEmail': 'customer@example.com'
})
```

## Support

For API support and questions:

- **Documentation**: https://api.udigit.ca/api
- **Email**: api-support@udigit.ca
- **GitHub Issues**: https://github.com/udigit/api-issues