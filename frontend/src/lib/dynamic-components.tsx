/**
 * Dynamic Component Imports for Bundle Optimization
 * Lazy-loads heavy libraries only when needed
 */

import dynamic from 'next/dynamic';

// Simple fallback for non-existent components
const Fallback = () => <div>Component not available</div>;

// Existing components with proper typing
export const RevenueChart = dynamic<any>(
  () => import('@/components/admin/RevenueChart') as any,
  { ssr: false }
);

// Not yet implemented components
export const PDFGenerator = Fallback;
export const ContractPDF = Fallback;
export const BookingTrendsChart = Fallback;
export const EquipmentUtilizationChart = Fallback;
export const CustomerSatisfactionChart = Fallback;
export const MaintenanceScheduleChart = Fallback;
export const SpinWheel = Fallback;
export const FileUploader = Fallback;
export const InsuranceUploader = Fallback;
export const DrawSignature = Fallback;
export const TypedSignature = Fallback;
export const SignatureCanvas = Fallback;
export const ContestWheel = Fallback;
export const AdminMetrics = Fallback;
export const AnalyticsPanel = Fallback;
export const PaymentDashboard = Fallback;
export const AdvancedFilters = Fallback;
export const DataExporter = Fallback;
export const ReportGenerator = Fallback;
export const AdvancedScheduler = Fallback;
export const MaintenanceTracker = Fallback;
export const PriceCalculator = Fallback;
export const GeofenceMap = Fallback;
export const LiveTracking = Fallback;
export const RouteOptimizer = Fallback;
