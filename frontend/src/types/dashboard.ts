export type DateRangeKey = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface DashboardSummary {
  totalBookings: number;
  totalRevenue: number;
  activeEquipment: number;
  totalCustomers: number;
  bookingsGrowth: number | null;
  revenueGrowth: number | null;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  equipmentUtilization: number;
  snapshotDate: string | null;
  lastGeneratedAt: string | null;
}

export interface RevenueChartPoint {
  date: string;
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  paymentsCount: number;
}

export interface RevenueComparisonPoint {
  date: string;
  netRevenue: number;
}

export interface RevenueChartTotals {
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
}

export interface BookingChartPoint {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  active: number;
}

export interface BookingChartTotals {
  total: number;
  completed: number;
  cancelled: number;
}

export interface BookingChartConversion {
  completionRate: number;
  cancellationRate: number;
}

export interface UtilizationSummary {
  averageUtilization: number;
  activeOrMaintenanceCount: number;
  lifetimeRevenue: number;
}

export interface UtilizationEquipmentRecord {
  equipmentId: string;
  label: string;
  status: string;
  utilizationPct: number;
  rentedDays: number;
  revenue: number;
}

export interface DashboardChartsPayload {
  revenue: {
    series: RevenueChartPoint[];
    comparison: RevenueComparisonPoint[];
    totals: RevenueChartTotals;
  };
  bookings: {
    series: BookingChartPoint[];
    comparison: BookingChartPoint[];
    totals: BookingChartTotals;
    conversion: BookingChartConversion;
  };
  utilization: {
    summary: UtilizationSummary;
    equipment: UtilizationEquipmentRecord[];
  };
}

export interface DashboardMetadata {
  generatedAt: string;
  snapshotDate: string | null;
  range: DateRangeKey;
  comparisonRange: {
    start: string;
    end: string;
  };
}

export interface DashboardOverviewResponse {
  summary: DashboardSummary;
  charts?: unknown;
  chartsV2?: DashboardChartsPayload;
  metadata?: DashboardMetadata;
  alerts?: {
    active: unknown[];
    candidates: unknown[];
  };
}
