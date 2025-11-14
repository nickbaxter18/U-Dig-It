# Phase 4: Component Migration Guide

**Duration:** 6-8 hours
**Risk:** 🔴 High (many files to move, import updates required)
**Approach:** Incremental - one feature at a time

---

## 🎯 Goal

Transform flat component structure into feature-based organization:

```
Before:                         After:
components/                     features/
├── BookingWidget.tsx          ├── booking/components/BookingWidget.tsx
├── EquipmentSearch.tsx        ├── equipment/components/EquipmentSearch.tsx
├── PaymentIntegration.tsx     ├── payments/components/PaymentIntegration.tsx
└── ... (100+ files)           └── ... (organized by feature)
```

---

## 📋 Pre-Migration Checklist

- [ ] All tests passing (`pnpm test`)
- [ ] Build successful (`pnpm run build`)
- [ ] Backup branch created
- [ ] Type-check passing (`pnpm run type-check`)
- [ ] No uncommitted changes

---

## 🗺️ Feature Mapping

### Features to Create

1. **booking** - Booking flow components
2. **equipment** - Equipment catalog and search
3. **payments** - Payment processing
4. **contracts** - Contract signing
5. **admin** - Admin dashboard
6. **auth** - Authentication
7. **contest** - Spin-to-win
8. **dashboard** - User dashboard

---

## 🚀 Step-by-Step Migration

### Step 1: Create Feature Structure

```bash
cd frontend/src

# Create all feature directories
mkdir -p features/{booking,equipment,payments,contracts,admin,auth,contest,dashboard}/{components,hooks,utils,types}

# Verify structure
tree features/
```

---

### Step 2: Migrate Booking Feature

#### 2.1 Identify Booking Components

```bash
# List all booking-related components
ls -la components/ | grep -i booking
ls -la components/booking/
```

**Components to move:**
- `BookingWidget.tsx`
- `EnhancedBookingFlow.tsx`
- `booking/BookingConfirmedModal.tsx`
- `booking/BookingDetailsCard.tsx`
- `booking/ContractSigningSection.tsx`
- `booking/HoldPaymentModal.tsx`
- `booking/PaymentSection.tsx`
- `booking/VerificationHoldPayment.tsx`
- `booking/InsuranceUploadSection.tsx`
- `booking/LicenseUploadSection.tsx`

#### 2.2 Move Components

```bash
# Move from components/ to features/booking/components/
git mv components/BookingWidget.tsx features/booking/components/
git mv components/EnhancedBookingFlow.tsx features/booking/components/

# Move from components/booking/ to features/booking/components/
git mv components/booking/* features/booking/components/
```

#### 2.3 Create Barrel Export

```typescript
// features/booking/components/index.ts
export { BookingWidget } from './BookingWidget';
export { EnhancedBookingFlow } from './EnhancedBookingFlow';
export { BookingConfirmedModal } from './BookingConfirmedModal';
export { BookingDetailsCard } from './BookingDetailsCard';
// ... etc
```

#### 2.4 Update Imports (Method 1: Manual)

Find all files importing booking components:

```bash
# Find all imports
grep -r "from.*BookingWidget" frontend/src/

# Example results:
# src/app/book/page.tsx:import { BookingWidget } from '@/components/BookingWidget'
# src/app/dashboard/page.tsx:import { BookingWidget } from '@/components/BookingWidget'
```

Update each file:

```typescript
// Before:
import { BookingWidget } from '@/components/BookingWidget';
import { BookingConfirmedModal } from '@/components/booking/BookingConfirmedModal';

// After:
import { BookingWidget, BookingConfirmedModal } from '@/features/booking/components';
```

#### 2.5 Update Imports (Method 2: Automated with sed)

```bash
# Replace BookingWidget imports
find frontend/src/app -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i \
  's|@/components/BookingWidget|@/features/booking/components/BookingWidget|g'

# Replace booking/* imports
find frontend/src/app -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i \
  's|@/components/booking/\(.*\)|@/features/booking/components/\1|g'
```

#### 2.6 Test After Migration

```bash
# Type check
pnpm run type-check

# Build
pnpm run build

# Run tests
pnpm test

# Start dev server
pnpm dev
# Test booking flow manually
```

#### 2.7 Commit

```bash
git add .
git commit -m "feat: migrate booking components to features/booking"
```

---

### Step 3: Migrate Equipment Feature

**Components to move:**
- `EquipmentShowcase.tsx` (keep only one version!)
- `EquipmentSearch.tsx`
- `AvailabilityCalendar.tsx`
- `LazyImage.tsx` (if equipment-specific)

```bash
# Move components
git mv components/EquipmentShowcase.tsx features/equipment/components/
git mv components/EquipmentSearch.tsx features/equipment/components/
git mv components/AvailabilityCalendar.tsx features/equipment/components/

# Delete duplicates
rm components/EquipmentShowcase.backup.tsx
rm components/EquipmentShowcase.preview.tsx

# Update imports (find and replace)
find src/app -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  's|@/components/EquipmentShowcase|@/features/equipment/components/EquipmentShowcase|g' {} +

# Test
pnpm run type-check
pnpm run build

# Commit
git add .
git commit -m "feat: migrate equipment components to features/equipment"
```

---

### Step 4: Migrate Payments Feature

**Components to move:**
- `PaymentIntegration.tsx`
- `booking/PaymentSection.tsx`
- `booking/HoldPaymentModal.tsx`
- `booking/VerificationHoldPayment.tsx`

```bash
# Move from components/
git mv components/PaymentIntegration.tsx features/payments/components/

# Move from components/booking/ (payment-related)
git mv components/booking/PaymentSection.tsx features/payments/components/
git mv components/booking/HoldPaymentModal.tsx features/payments/components/
git mv components/booking/VerificationHoldPayment.tsx features/payments/components/

# Update imports
find src/app -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  's|@/components/PaymentIntegration|@/features/payments/components/PaymentIntegration|g' {} +

# Test & commit
pnpm run type-check && pnpm run build
git add . && git commit -m "feat: migrate payment components to features/payments"
```

---

### Step 5: Migrate Contracts Feature

**Components to move:**
- `booking/ContractSigningSection.tsx`
- `contracts/*` (all contract components)
- Custom signing components (EnhancedContractSigner, DrawSignature, TypedSignature)

```bash
# Move contract components
git mv components/booking/ContractSigningSection.tsx features/contracts/components/
git mv components/contracts/* features/contracts/components/

# Update imports
find src/app -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  's|@/components/contracts/\(.*\)|@/features/contracts/components/\1|g' {} +

# Test & commit
pnpm run type-check && pnpm run build
git add . && git commit -m "feat: migrate contract components to features/contracts"
```

---

### Step 6: Migrate Admin Feature

**Components to move:**
- `AdminDashboard.tsx`
- `admin/*` (all admin components)
- `AnalyticsDashboard.tsx`
- `BookingManagementDashboard.tsx`

```bash
# Move admin components
git mv components/AdminDashboard.tsx features/admin/components/
git mv components/admin/* features/admin/components/
git mv components/AnalyticsDashboard.tsx features/admin/components/
git mv components/BookingManagementDashboard.tsx features/admin/components/

# Update imports
find src/app/admin -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  's|@/components/admin/\(.*\)|@/features/admin/components/\1|g' {} +

# Test & commit
pnpm run type-check && pnpm run build
git add . && git commit -m "feat: migrate admin components to features/admin"
```

---

### Step 7: Migrate Auth Feature

**Components to move:**
- `auth/*` (all auth components)
- `OAuthButtons.tsx`
- `GuestCheckout.tsx`

```bash
# Move auth components
git mv components/auth/* features/auth/components/
git mv components/OAuthButtons.tsx features/auth/components/
git mv components/GuestCheckout.tsx features/auth/components/

# Update imports
find src/app/auth -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  's|@/components/auth/\(.*\)|@/features/auth/components/\1|g' {} +

# Test & commit
pnpm run type-check && pnpm run build
git add . && git commit -m "feat: migrate auth components to features/auth"
```

---

### Step 8: Migrate Contest Feature

**Components to move:**
- `SpinWheel.tsx`

```bash
# Move contest components
git mv components/SpinWheel.tsx features/contest/components/

# Update imports
find src/app/contest -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  's|@/components/SpinWheel|@/features/contest/components/SpinWheel|g' {} +

# Test & commit
pnpm run type-check && pnpm run build
git add . && git commit -m "feat: migrate contest components to features/contest"
```

---

### Step 9: Migrate Dashboard Feature

**Components to move:**
- `UserDashboard.tsx`
- `LiveBookingStatus.tsx`
- `NotificationCenter.tsx`

```bash
# Move dashboard components
git mv components/UserDashboard.tsx features/dashboard/components/
git mv components/LiveBookingStatus.tsx features/dashboard/components/
git mv components/NotificationCenter.tsx features/dashboard/components/

# Update imports
find src/app/dashboard -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  's|@/components/UserDashboard|@/features/dashboard/components/UserDashboard|g' {} +

# Test & commit
pnpm run type-check && pnpm run build
git add . && git commit -m "feat: migrate dashboard components to features/dashboard"
```

---

### Step 10: Reorganize Shared Components

**What stays in `components/`:**
- UI primitives (buttons, inputs, dialogs)
- Layout components (Navigation, Footer, MobileMenu)
- Forms (ContactForm, LocationPicker)
- Feedback components (Toast, LoadingSpinner, ErrorBoundary)

**Reorganize:**

```bash
# Create UI subdirectories
mkdir -p components/{ui,layout,forms,feedback}

# Move layout components
git mv components/Navigation.tsx components/layout/
git mv components/Footer.tsx components/layout/
git mv components/MobileMenu.tsx components/layout/
git mv components/MobileNavigation.tsx components/layout/

# Move form components
git mv components/ContactForm.tsx components/forms/
git mv components/LocationPicker.tsx components/forms/
git mv components/MobileContactForm.tsx components/forms/

# Move feedback components
git mv components/Toast.tsx components/feedback/
git mv components/LoadingSpinner.tsx components/feedback/
git mv components/LoadingOverlay.tsx components/feedback/
git mv components/ErrorBoundary.tsx components/feedback/
git mv components/SkeletonLoader.tsx components/feedback/

# Update imports
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  's|@/components/Navigation|@/components/layout/Navigation|g' {} +

# Test & commit
pnpm run type-check && pnpm run build
git add . && git commit -m "feat: organize shared components by type"
```

---

## ✅ Post-Migration Checklist

- [ ] All components moved to features/
- [ ] Shared UI components organized in components/
- [ ] All imports updated
- [ ] Type-check passes
- [ ] Build succeeds
- [ ] All tests pass
- [ ] Manual testing of key flows
- [ ] No duplicate files remaining
- [ ] All changes committed

---

## 🧪 Testing Checklist

### Manual Testing Required
- [ ] Homepage loads correctly
- [ ] Booking flow works end-to-end
- [ ] Equipment search displays results
- [ ] Payment processing works
- [ ] Contract signing works
- [ ] Admin dashboard accessible
- [ ] User dashboard shows bookings
- [ ] Spin wheel contest works
- [ ] Auth (login/signup) works
- [ ] Navigation between pages works

### Automated Testing
```bash
# Type check
pnpm run type-check

# Build
pnpm run build

# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Lint
pnpm run lint
```

---

## 🐛 Troubleshooting

### "Module not found" errors

**Problem:** Import paths not updated correctly

**Solution:**
```bash
# Find broken imports
pnpm run type-check

# Search for old import patterns
grep -r "@/components/BookingWidget" src/

# Update manually or with sed
```

### Build fails after migration

**Problem:** Circular dependencies or missing exports

**Solution:**
```bash
# Check for circular dependencies
pnpm run build --verbose

# Verify barrel exports exist
cat features/booking/components/index.ts
```

### Tests fail

**Problem:** Test files still using old import paths

**Solution:**
```bash
# Update test imports
find src -name "*.test.ts*" -exec sed -i \
  's|@/components/\(.*\)|@/features/booking/components/\1|g' {} +
```

---

## 📊 Progress Tracking

| Feature | Components | Status | Committed |
|---------|------------|--------|-----------|
| Booking | 10+ | ⏸️ Pending | ⬜ |
| Equipment | 3 | ⏸️ Pending | ⬜ |
| Payments | 4 | ⏸️ Pending | ⬜ |
| Contracts | 5+ | ⏸️ Pending | ⬜ |
| Admin | 20+ | ⏸️ Pending | ⬜ |
| Auth | 5 | ⏸️ Pending | ⬜ |
| Contest | 1 | ⏸️ Pending | ⬜ |
| Dashboard | 3 | ⏸️ Pending | ⬜ |
| Shared UI | 15+ | ⏸️ Pending | ⬜ |

Update as you go!

---

## 🎯 Tips for Success

1. **One feature at a time** - Don't try to move everything at once
2. **Test after each feature** - Catch issues early
3. **Commit frequently** - Small, atomic commits are easier to revert
4. **Use automated tools** - sed/grep for bulk replacements
5. **Keep VS Code TypeScript server happy** - Reload window after big changes
6. **Take breaks** - This is mentally taxing work

---

## 🔄 Rollback

If something goes wrong:

```bash
# Rollback to last good commit
git reset --hard HEAD~1

# Or checkout backup branch
git checkout backup/component-migration-YYYYMMDD

# Or revert specific commit
git revert <commit-hash>
```

---

**Good luck! This is the hardest phase, but you've got this! 💪**

---

*Estimated Time: 6-8 hours*
*Take breaks every 2 hours*
*Test thoroughly after each feature*


