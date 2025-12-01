# UI Components Inventory

Complete inventory of admin components and their API integrations.

Generated: $(date)

## Admin Components

### Layout & Navigation
- **AdminHeader** (`components/admin/AdminHeader.tsx`)
  - Purpose: Admin header navigation
  - APIs Used: None

- **AdminSidebar** (`components/admin/AdminSidebar.tsx`)
  - Purpose: Admin sidebar navigation
  - APIs Used: None

- **AdminFooter** (`components/admin/AdminFooter.tsx`)
  - Purpose: Admin footer
  - APIs Used:
    - `GET /api/health`

- **AdminBreadcrumb** (`components/admin/AdminBreadcrumb.tsx`)
  - Purpose: Breadcrumb navigation
  - APIs Used: None

- **AdminToastProvider** (`components/admin/AdminToastProvider.tsx`)
  - Purpose: Toast notification provider
  - APIs Used: None

### Dashboard Components
- **DashboardAlerts** (`components/admin/DashboardAlerts.tsx`)
  - Purpose: Display and manage dashboard alerts
  - APIs Used:
    - `GET /api/admin/dashboard/alerts`
    - `POST /api/admin/dashboard/alerts/[id]/acknowledge`
    - `POST /api/admin/dashboard/alerts/[id]/resolve`

- **StatsCard** (`components/admin/StatsCard.tsx`)
  - Purpose: Statistics card display
  - APIs Used: None (receives data as props)

- **RecentBookings** (`components/admin/RecentBookings.tsx`)
  - Purpose: Recent bookings list
  - APIs Used: Direct Supabase queries

- **RevenueChart** (`components/admin/RevenueChart.tsx`)
  - Purpose: Revenue analytics chart
  - APIs Used: Receives data as props

- **BookingTrendsChart** (`components/admin/BookingTrendsChart.tsx`)
  - Purpose: Booking trends visualization
  - APIs Used: Receives data as props

- **EquipmentUtilizationChart** (`components/admin/EquipmentUtilizationChart.tsx`)
  - Purpose: Equipment utilization visualization
  - APIs Used: Receives data as props

- **DashboardChart** (`components/admin/DashboardChart.tsx`)
  - Purpose: Generic dashboard chart
  - APIs Used: Receives data as props

### Bookings Management
- **BookingsTable** (`components/admin/BookingsTable.tsx`)
  - Purpose: Bookings management table
  - APIs Used: Direct Supabase queries

- **BookingDetailsModal** (`components/admin/BookingDetailsModal.tsx`)
  - Purpose: Booking details modal
  - APIs Used:
    - `GET /api/admin/payments/receipt/[id]`
    - Payment-related APIs

- **BookingFilters** (`components/admin/BookingFilters.tsx`)
  - Purpose: Booking filters UI
  - APIs Used: None (filter logic only)

- **BookingCalendarView** (`components/admin/BookingCalendarView.tsx`)
  - Purpose: Calendar view for bookings
  - APIs Used: Direct Supabase queries

### Equipment Management
- **EquipmentTable** (`components/admin/EquipmentTable.tsx`)
  - Purpose: Equipment management table
  - APIs Used: Direct Supabase queries

- **EquipmentModal** (`components/admin/EquipmentModal.tsx`)
  - Purpose: Equipment create/edit modal
  - APIs Used: Direct Supabase queries

- **EquipmentDetailsModal** (`components/admin/EquipmentDetailsModal.tsx`)
  - Purpose: Equipment details modal
  - APIs Used: Direct Supabase queries

- **EquipmentStatus** (`components/admin/EquipmentStatus.tsx`)
  - Purpose: Equipment status display
  - APIs Used: Direct Supabase queries

- **EquipmentFilters** (`components/admin/EquipmentFilters.tsx`)
  - Purpose: Equipment filters UI
  - APIs Used: None

- **EquipmentMediaGallery** (`components/admin/EquipmentMediaGallery.tsx`)
  - Purpose: Equipment media gallery
  - APIs Used:
    - `GET /api/admin/equipment/[id]/media`
    - `POST /api/admin/equipment/[id]/media`
    - `PATCH /api/admin/equipment/[id]/media`
    - `DELETE /api/admin/equipment/[id]/media`

- **MaintenanceHistoryLog** (`components/admin/MaintenanceHistoryLog.tsx`)
  - Purpose: Maintenance history display
  - APIs Used: Direct Supabase queries (equipment maintenance)

- **MaintenanceScheduleModal** (`components/admin/MaintenanceScheduleModal.tsx`)
  - Purpose: Schedule maintenance
  - APIs Used:
    - Equipment maintenance APIs
    - Maintenance scheduling APIs

### Customers Management
- **CustomerEditModal** (`components/admin/CustomerEditModal.tsx`)
  - Purpose: Customer edit modal
  - APIs Used: Direct Supabase queries

- **CustomerAvatar** (`components/admin/CustomerAvatar.tsx`)
  - Purpose: Customer avatar display
  - APIs Used: None (receives data as props)

- **CustomerTagsManager** (`components/admin/CustomerTagsManager.tsx`)
  - Purpose: Manage customer tags
  - APIs Used:
    - `GET /api/admin/customer-tags`
    - `POST /api/admin/customer-tags`
    - `PATCH /api/admin/customer-tags/[id]`
    - `DELETE /api/admin/customer-tags/[id]`
    - `GET /api/admin/customers/[id]/tags`
    - `POST /api/admin/customers/[id]/tags`
    - `DELETE /api/admin/customers/[id]/tags`

- **CustomerSegmentsManager** (`components/admin/CustomerSegmentsManager.tsx`)
  - Purpose: Manage customer segments
  - APIs Used:
    - `GET /api/admin/customers/segments`
    - `POST /api/admin/customers/segments`
    - `PATCH /api/admin/customers/segments/[id]`
    - `DELETE /api/admin/customers/segments/[id]`

- **CustomerTimeline** (`components/admin/CustomerTimeline.tsx`)
  - Purpose: Customer activity timeline
  - APIs Used:
    - `GET /api/admin/customers/[id]/timeline`

### Payments Management
- **RefundModal** (`components/admin/RefundModal.tsx`)
  - Purpose: Process refunds
  - APIs Used:
    - `POST /api/admin/payments/refund`

- **DisputesSection** (`components/admin/DisputesSection.tsx`)
  - Purpose: Payment disputes management
  - APIs Used:
    - `GET /api/admin/payments/disputes`

- **FinancialReportsSection** (`components/admin/FinancialReportsSection.tsx`)
  - Purpose: Financial reports
  - APIs Used: Direct Supabase queries

- **HoldManagementDashboard** (`components/admin/HoldManagementDashboard.tsx`)
  - Purpose: Security hold management
  - APIs Used:
    - `POST /api/stripe/place-security-hold`
    - `POST /api/stripe/release-security-hold`
    - `POST /api/stripe/capture-security-hold`

### Communications
- **EmailCustomerModal** (`components/admin/EmailCustomerModal.tsx`)
  - Purpose: Send email to customer
  - APIs Used:
    - `GET /api/admin/communications/templates`
    - `POST /api/admin/bookings/send-email`

- **EmailDeliveryDashboard** (`components/admin/EmailDeliveryDashboard.tsx`)
  - Purpose: Email delivery statistics and logs
  - APIs Used:
    - `GET /api/admin/email/delivery-stats`
    - `GET /api/admin/email/delivery-logs`

### System Administration
- **JobsMonitor** (`components/admin/JobsMonitor.tsx`)
  - Purpose: Monitor background jobs
  - APIs Used:
    - `GET /api/admin/jobs/status`
    - `GET /api/admin/jobs/runs`
    - `POST /api/admin/jobs/[name]/trigger`

- **ScheduledReportsManager** (`components/admin/ScheduledReportsManager.tsx`)
  - Purpose: Manage scheduled reports
  - APIs Used:
    - `GET /api/admin/reports/scheduled`
    - `POST /api/admin/reports/scheduled`
    - `PATCH /api/admin/reports/scheduled/[id]`
    - `DELETE /api/admin/reports/scheduled/[id]`
    - `POST /api/admin/reports/scheduled/[id]/run`

- **PermissionManager** (`components/admin/PermissionManager.tsx`)
  - Purpose: Manage permissions and roles
  - APIs Used:
    - `GET /api/admin/permissions`
    - `GET /api/admin/permissions/roles`
    - `GET /api/admin/permissions/user-roles`
    - `POST /api/admin/permissions/roles`
    - `PATCH /api/admin/permissions/roles/[id]`
    - `POST /api/admin/permissions/user-roles`
    - `DELETE /api/admin/permissions/user-roles/[id]`

- **PermissionAuditLog** (`components/admin/PermissionAuditLog.tsx`)
  - Purpose: Permission audit log viewer
  - APIs Used:
    - `GET /api/admin/permissions/audit`

- **PermissionGate** (`components/admin/PermissionGate.tsx`)
  - Purpose: Permission-based access control wrapper
  - APIs Used:
    - `GET /api/admin/permissions/check`

- **RoleModal** (`components/admin/RoleModal.tsx`)
  - Purpose: Create/edit role modal
  - APIs Used:
    - `GET /api/admin/permissions`
    - `POST /api/admin/permissions/roles`
    - `PATCH /api/admin/permissions/roles/[id]`

- **UserRoleAssignmentModal** (`components/admin/UserRoleAssignmentModal.tsx`)
  - Purpose: Assign roles to users
  - APIs Used:
    - `GET /api/admin/users`
    - `GET /api/admin/permissions/roles`
    - `POST /api/admin/permissions/user-roles`

- **NotificationRulesManager** (`components/admin/NotificationRulesManager.tsx`)
  - Purpose: Manage notification rules
  - APIs Used:
    - `GET /api/admin/notifications/rules`
    - `POST /api/admin/notifications/rules`
    - `PATCH /api/admin/notifications/rules/[id]`
    - `DELETE /api/admin/notifications/rules/[id]`

- **RealtimeConnectionIndicator** (`components/admin/RealtimeConnectionIndicator.tsx`)
  - Purpose: Display realtime connection status
  - APIs Used: None (Supabase realtime only)

### Settings
- **SettingsPageClient** (`components/admin/SettingsPageClient.tsx`)
  - Purpose: Settings page client component
  - APIs Used:
    - `PATCH /api/admin/users/[id]`

- **AdminUserModal** (`components/admin/AdminUserModal.tsx`)
  - Purpose: Admin user management modal
  - APIs Used:
    - User management APIs

### Filters & Utilities
- **AdvancedFilters** (`components/admin/AdvancedFilters.tsx`)
  - Purpose: Advanced filtering UI
  - APIs Used: None (filter logic only)

- **FilterPresets** (`components/admin/FilterPresets.tsx`)
  - Purpose: Filter presets management
  - APIs Used: None

## Summary

### Components with API Integration: 30+
- Direct API calls: 20+
- Props-based (no direct API): 10+
- Direct Supabase queries: 15+

### API Integration Patterns
- Many components use `fetchWithAuth` for API calls
- Some components use direct Supabase queries
- Some components receive data as props (no API calls)
- Modal components typically have API integration
- Table components often use direct Supabase queries

## Notes

- Components may be used on pages that also make API calls (dual integration)
- Some components have partial API integration (mixing Supabase and API calls)
- Modal components typically have full API integration
- Table components often rely on page-level API calls or direct Supabase queries














