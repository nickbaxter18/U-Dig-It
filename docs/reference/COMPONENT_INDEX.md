# Component Index

Quick reference for all React components in the project.

---

## 📦 Core Components

| Component | Path | Purpose |
|-----------|------|---------|
| `EquipmentShowcase` | `components/EquipmentShowcase.tsx` | Main equipment display with specs and booking CTA |
| `EnhancedBookingFlow` | `components/EnhancedBookingFlow.tsx` | Main booking wizard (legacy) |
| `EnhancedBookingFlowV2` | `components/EnhancedBookingFlowV2.tsx` | Updated booking wizard |
| `UserDashboard` | `components/UserDashboard.tsx` | User dashboard with bookings overview |
| `AdminDashboard` | `components/AdminDashboard.tsx` | Admin dashboard with analytics |
| `BookingWidget` | `components/BookingWidget.tsx` | Embedded booking widget |
| `GuestCheckout` | `components/GuestCheckout.tsx` | Guest checkout flow |

---

## 🔐 Authentication Components

| Component | Path | Purpose |
|-----------|------|---------|
| `SignInForm` | `components/auth/SignInForm.tsx` | Email/password sign in |
| `SignUpForm` | `components/auth/SignUpForm.tsx` | User registration form |
| `OAuthButtons` | `components/auth/OAuthButtons.tsx` | Google/GitHub OAuth buttons |
| `PasswordStrengthIndicator` | `components/auth/PasswordStrengthIndicator.tsx` | Password strength meter |

---

## 📅 Booking Components

| Component | Path | Purpose |
|-----------|------|---------|
| `PaymentSection` | `components/booking/PaymentSection.tsx` | Payment form with Stripe |
| `InsuranceUploadSection` | `components/booking/InsuranceUploadSection.tsx` | Insurance COI upload |
| `ContractSigningSection` | `components/booking/ContractSigningSection.tsx` | Contract signing interface |
| `BookingDetailsCard` | `components/booking/BookingDetailsCard.tsx` | Booking summary card |
| `HoldPaymentModal` | `components/booking/HoldPaymentModal.tsx` | Security hold payment modal |
| `BookingConfirmedModal` | `components/booking/BookingConfirmedModal.tsx` | Booking confirmation dialog |
| `VerificationHoldPayment` | `components/booking/VerificationHoldPayment.tsx` | Verification hold payment |

---

## 📄 Contract Components

| Component | Path | Purpose |
|-----------|------|---------|
| `ContractPDF` | `components/contracts/ContractPDF.tsx` | PDF contract renderer |
| `PDFGenerator` | `components/contracts/PDFGenerator.tsx` | PDF generation utility |
| `EnhancedContractSigner` | `components/contracts/EnhancedContractSigner.tsx` | Contract signing interface |
| `TypedSignature` | `components/contracts/TypedSignature.tsx` | Typed signature input |
| `DrawSignature` | `components/contracts/DrawSignature.tsx` | Draw signature canvas |
| `SignedContractDisplay` | `components/contracts/SignedContractDisplay.tsx` | Display signed contract |
| `EquipmentRiderViewer` | `components/contracts/EquipmentRiderViewer.tsx` | Equipment rider viewer |
| `SVL75EquipmentRider` | `components/contracts/SVL75EquipmentRider.tsx` | SVL-75 specific rider |

---

## 👨‍💼 Admin Components

| Component | Path | Purpose |
|-----------|------|---------|
| `BookingsTable` | `components/admin/BookingsTable.tsx` | Bookings management table |
| `HoldManagementDashboard` | `components/admin/HoldManagementDashboard.tsx` | Hold management interface |
| `RevenueChart` | `components/admin/RevenueChart.tsx` | Revenue analytics chart |
| `StatsCard` | `components/admin/StatsCard.tsx` | Statistics card component |
| `BookingDetailsModal` | `components/admin/BookingDetailsModal.tsx` | Booking details modal |
| `RefundModal` | `components/admin/RefundModal.tsx` | Refund processing modal |
| `EquipmentStatus` | `components/admin/EquipmentStatus.tsx` | Equipment status display |
| `RecentBookings` | `components/admin/RecentBookings.tsx` | Recent bookings list |
| `BookingTrendsChart` | `components/admin/BookingTrendsChart.tsx` | Booking trends chart |
| `EquipmentUtilizationChart` | `components/admin/EquipmentUtilizationChart.tsx` | Equipment utilization chart |
| `FinancialReportsSection` | `components/admin/FinancialReportsSection.tsx` | Financial reports |
| `DisputesSection` | `components/admin/DisputesSection.tsx` | Disputes management |
| `AdminBreadcrumb` | `components/admin/AdminBreadcrumb.tsx` | Admin breadcrumb navigation |

---

## 🎨 UI Components

| Component | Path | Purpose |
|-----------|------|---------|
| `Navigation` | `components/Navigation.tsx` | Main navigation bar |
| `MobileMenu` | `components/MobileMenu.tsx` | Mobile navigation menu |
| `Footer` | `components/Footer.tsx` | Site footer |
| `LoadingSpinner` | `components/LoadingSpinner.tsx` | Loading spinner |
| `LoadingOverlay` | `components/LoadingOverlay.tsx` | Full-screen loading overlay |
| `Toast` | `components/Toast.tsx` | Toast notification component |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` | React error boundary |
| `OptimizedImage` | `components/OptimizedImage.tsx` | Optimized image component |
| `LazyImage` | `components/LazyImage.tsx` | Lazy-loaded image |
| `SkeletonLoader` | `components/SkeletonLoader.tsx` | Skeleton loading state |

---

## 📊 Chart Components

| Component | Path | Purpose |
|-----------|------|---------|
| `SimpleBarChart` | `components/charts/SimpleBarChart.tsx` | Simple bar chart |
| `SimpleLineChart` | `components/charts/SimpleLineChart.tsx` | Simple line chart |

---

## 📝 Form Components

| Component | Path | Purpose |
|-----------|------|---------|
| `ContactForm` | `components/ContactForm.tsx` | Contact form |
| `MobileContactForm` | `components/MobileContactForm.tsx` | Mobile-optimized contact form |
| `DiscountCodeInput` | `components/DiscountCodeInput.tsx` | Discount code input |
| `LocationPicker` | `components/LocationPicker.tsx` | Location picker component |
| `RentalDurationSelector` | `components/RentalDurationSelector.tsx` | Rental duration selector |
| `EquipmentSearch` | `components/EquipmentSearch.tsx` | Equipment search interface |
| `AdvancedFilters` | `components/AdvancedFilters.tsx` | Advanced filtering UI |

---

## 🔔 Notification Components

| Component | Path | Purpose |
|-----------|------|---------|
| `NotificationCenter` | `components/NotificationCenter.tsx` | Notification center UI |
| `EmailNotification` | `components/EmailNotification.tsx` | Email notification display |

---

## 🎰 Special Features

| Component | Path | Purpose |
|-----------|------|---------|
| `SpinWheel` | `components/SpinWheel.tsx` | Spin-to-win wheel component |

---

## 🛡️ Provider Components

| Component | Path | Purpose |
|-----------|------|---------|
| `SupabaseAuthProvider` | `components/providers/SupabaseAuthProvider.tsx` | Supabase auth context provider |
| `ClientProviders` | `components/providers/ClientProviders.tsx` | Client-side providers wrapper |
| `ProtectedRoute` | `components/providers/ProtectedRoute.tsx` | Route protection wrapper |

---

## 🎯 Utility Components

| Component | Path | Purpose |
|-----------|------|---------|
| `SafeHTML` | `components/SafeHTML.tsx` | Safe HTML renderer (sanitized) |
| `StructuredData` | `components/StructuredData.tsx` | JSON-LD structured data |
| `DebugToolbar` | `components/DebugToolbar.tsx` | Development debug toolbar |
| `AttachmentSelector` | `components/AttachmentSelector.tsx` | File attachment selector |
| `ProfilePictureUpload` | `components/ProfilePictureUpload.tsx` | Profile picture upload |

---

## 📱 Mobile Components

| Component | Path | Purpose |
|-----------|------|---------|
| `MobileOptimizedBooking` | `components/MobileOptimizedBooking.tsx` | Mobile booking flow |
| `MobileEquipmentShowcase` | `components/MobileEquipmentShowcase.tsx` | Mobile equipment display |
| `MobileNavigation` | `components/MobileNavigation.tsx` | Mobile navigation |

---

## 🎨 Branding Components

| Component | Path | Purpose |
|-----------|------|---------|
| `HeroWatermark` | `components/HeroWatermark.tsx` | Hero section watermark |
| `GeoWatermark` | `components/GeoWatermark.tsx` | Geographic watermark |
| `OptimizedWatermark` | `components/OptimizedWatermark.tsx` | Optimized watermark |

---

## 📊 Analytics Components

| Component | Path | Purpose |
|-----------|------|---------|
| `AnalyticsDashboard` | `components/AnalyticsDashboard.tsx` | Analytics dashboard |
| `BookingManagementDashboard` | `components/BookingManagementDashboard.tsx` | Booking management UI |

---

## 🎁 Marketing Components

| Component | Path | Purpose |
|-----------|------|---------|
| `HowItWorksSection` | `components/HowItWorksSection.tsx` | How it works section |
| `TestimonialsSection` | `components/TestimonialsSection.tsx` | Customer testimonials |
| `TrustBadges` | `components/TrustBadges.tsx` | Trust badges display |
| `SpecialOffersBanner` | `components/SpecialOffersBanner.tsx` | Special offers banner |
| `FAQSection` | `components/FAQSection.tsx` | FAQ section |
| `ServiceAreaLinks` | `components/ServiceAreaLinks.tsx` | Service area links |
| `SearchResults` | `components/SearchResults.tsx` | Search results display |
| `AvailabilityCalendar` | `components/AvailabilityCalendar.tsx` | Availability calendar view |
| `LiveBookingStatus` | `components/LiveBookingStatus.tsx` | Live booking status display |

---

## 🔧 Integration Components

| Component | Path | Purpose |
|-----------|------|---------|
| `PaymentIntegration` | `components/PaymentIntegration.tsx` | Stripe payment integration |
| `TermsAcceptance` | `components/TermsAcceptance.tsx` | Terms and conditions acceptance |

---

## 📋 Component Usage Patterns

### Import Pattern
```typescript
import ComponentName from '@/components/ComponentName';
// or
import { ComponentName } from '@/components/category/ComponentName';
```

### Component Structure
```typescript
'use client'; // If client component

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ComponentName() {
  // Component logic
  return <div>...</div>;
}
```

---

**Last Updated**: November 2025


