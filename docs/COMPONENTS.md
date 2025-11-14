# Component Documentation

This document provides comprehensive documentation for all React components in the U-Dig It Rentals platform.

## Table of Contents

- [Core Components](#core-components)
- [Form Components](#form-components)
- [Layout Components](#layout-components)
- [UI Components](#ui-components)
- [Business Logic Components](#business-logic-components)

## Core Components

### EnhancedBookingFlow

A comprehensive multi-step booking component with smart features and real-time validation.

**Location**: `frontend/src/components/EnhancedBookingFlow.tsx`

**Props**:
```typescript
interface EnhancedBookingFlowProps {
  smartDefaults?: SmartDefaults;
  progressIndicator?: 'animated' | 'simple' | 'none';
  className?: string;
}
```

**Features**:
- Multi-step booking process (5 steps)
- Real-time availability checking
- Smart date suggestions
- Dynamic pricing calculation
- Guest checkout support
- Mobile-optimized design
- Form validation with error handling

**Usage Example**:
```tsx
<EnhancedBookingFlow
  smartDefaults={{
    suggestWeekends: true,
    recommendDelivery: true,
    showSeasonalPricing: true
  }}
  progressIndicator="animated"
  className="max-w-4xl mx-auto"
/>
```

**State Management**:
- Uses React hooks for local state
- Integrates with NextAuth for user authentication
- Manages form data, validation errors, and loading states

### EquipmentShowcase

Interactive equipment display component with rotating views and specifications.

**Location**: `frontend/src/components/EquipmentShowcase.tsx`

**Props**:
```typescript
interface EquipmentShowcaseProps {
  className?: string;
}
```

**Features**:
- Auto-rotating equipment views
- Interactive specifications display
- Call-to-action buttons
- Mobile-responsive design
- Performance metrics display

**Usage Example**:
```tsx
<EquipmentShowcase className="mb-16" />
```

## Form Components

### GuestCheckout

Handles guest user checkout process with form validation.

**Location**: `frontend/src/components/GuestCheckout.tsx`

**Props**:
```typescript
interface GuestCheckoutProps {
  onGuestCheckout: (guest: GuestData) => void;
  onLogin: () => void;
  onRegister: () => void;
}
```

**Features**:
- Guest user form collection
- Form validation
- Integration with booking flow
- Login/register redirect options

### ContactForm

Contact form component with validation and submission handling.

**Location**: `frontend/src/components/ContactForm.tsx`

**Features**:
- Form validation
- Email submission
- Success/error states
- Mobile optimization

## Layout Components

### Navigation

Main navigation component with responsive design and authentication integration.

**Location**: `frontend/src/components/Navigation.tsx`

**Features**:
- Responsive navigation menu
- Authentication state display
- Mobile menu toggle
- Active route highlighting

### Footer

Site footer with links and company information.

**Location**: `frontend/src/components/Footer.tsx`

**Features**:
- Company information
- Quick links
- Social media links
- Contact information

## UI Components

### LoadingSpinner

Reusable loading spinner component.

**Location**: `frontend/src/components/LoadingSpinner.tsx`

**Props**:
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

### ErrorBoundary

Error boundary component for graceful error handling.

**Location**: `frontend/src/components/ErrorBoundary.tsx`

**Features**:
- Catches JavaScript errors
- Displays fallback UI
- Error reporting integration
- User-friendly error messages

### Toast

Toast notification component for user feedback.

**Location**: `frontend/src/components/Toast.tsx`

**Features**:
- Success, error, warning, and info variants
- Auto-dismiss functionality
- Custom positioning
- Animation support

## Business Logic Components

### UserDashboard

User dashboard with booking management and account information.

**Location**: `frontend/src/components/UserDashboard.tsx`

**Features**:
- Booking history display
- Upcoming bookings
- Account settings
- Payment history

### AdminDashboard

Administrative dashboard for equipment and booking management.

**Location**: `frontend/src/components/AdminDashboard.tsx`

**Features**:
- Equipment management
- Booking oversight
- Analytics and reporting
- User management

### PaymentIntegration

Stripe payment integration component.

**Location**: `frontend/src/components/PaymentIntegration.tsx`

**Features**:
- Stripe Elements integration
- Payment method selection
- Secure payment processing
- Error handling

## Component Guidelines

### Naming Conventions

- Use PascalCase for component names
- Use descriptive names that indicate purpose
- Include component type in name when appropriate (e.g., `EnhancedBookingFlow`)

### Props Interface

- Always define TypeScript interfaces for props
- Use JSDoc comments for complex props
- Provide default values where appropriate
- Use optional props with `?` when not required

### State Management

- Use React hooks for local state
- Consider context for shared state
- Use external state management for complex data
- Implement proper error boundaries

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and typography
- Ensure accessibility compliance

### Testing

- Write unit tests for business logic
- Test user interactions and form validation
- Include accessibility tests
- Test responsive behavior

## Best Practices

1. **Component Composition**: Build complex components from smaller, reusable pieces
2. **Props Validation**: Always validate props and provide meaningful error messages
3. **Error Handling**: Implement proper error boundaries and user feedback
4. **Performance**: Use React.memo and useMemo for expensive operations
5. **Accessibility**: Follow WCAG guidelines and use semantic HTML
6. **Documentation**: Document complex components with JSDoc comments
7. **Testing**: Write comprehensive tests for all components

## Common Patterns

### Form Handling
```tsx
const [formData, setFormData] = useState<FormData>({});
const [errors, setErrors] = useState<ValidationErrors>({});

const validateForm = (data: FormData): boolean => {
  // Validation logic
};

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (validateForm(formData)) {
    // Submit logic
  }
};
```

### Loading States
```tsx
const [isLoading, setIsLoading] = useState(false);

const handleAsyncOperation = async () => {
  setIsLoading(true);
  try {
    await performOperation();
  } finally {
    setIsLoading(false);
  }
};
```

### Error Handling
```tsx
const [error, setError] = useState<string | null>(null);

const handleError = (err: Error) => {
  setError(err.message);
  // Log error to monitoring service
};
```

## Contributing

When adding new components:

1. Follow the established patterns and conventions
2. Add comprehensive JSDoc documentation
3. Include TypeScript interfaces for all props
4. Write unit tests for the component
5. Update this documentation
6. Ensure accessibility compliance
7. Test on multiple devices and browsers