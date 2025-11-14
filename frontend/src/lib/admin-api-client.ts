// Admin API client for centralized backend communication
export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  activeEquipment: number;
  totalCustomers: number;
  bookingsGrowth: number;
  revenueGrowth: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  equipmentUtilization: number;
}

export interface RevenueAnalytics {
  data: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  totalRevenue: number;
  growthPercentage: number;
  averageDailyRevenue: number;
}

export interface BookingAnalytics {
  data: Array<{
    date: string;
    bookings: number;
    completed: number;
    cancelled: number;
  }>;
  totalBookings: number;
  completionRate: number;
  cancellationRate: number;
}

export interface EquipmentUtilization {
  data: Array<{
    equipmentId: string;
    equipmentName: string;
    utilizationRate: number;
    totalHours: number;
    revenue: number;
  }>;
  averageUtilization: number;
  topPerformer: {
    equipmentId: string;
    equipmentName: string;
    utilizationRate: number;
  };
}

export interface CustomerAnalytics {
  data: Array<{
    date: string;
    newCustomers: number;
    returningCustomers: number;
  }>;
  totalCustomers: number;
  newCustomers: number;
  retentionRate: number;
  averageLifetimeValue: number;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  dateRange?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  groupBy?: 'day' | 'week' | 'month';
}

class AdminApiClient {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders: any = {
      'Content-Type': 'application/json',
    };

    // Add authentication token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null;
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Dashboard Statistics
  async getDashboardStats(filters?: AnalyticsFilters): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.dateRange) params.append('dateRange', filters.dateRange);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);

    const queryString = params.toString();
    const endpoint = `/admin/stats/dashboard${queryString ? `?${queryString}` : ''}`;

    return this.request<DashboardStats>(endpoint);
  }

  // Analytics
  async getRevenueAnalytics(filters?: AnalyticsFilters): Promise<RevenueAnalytics> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.dateRange) params.append('dateRange', filters.dateRange);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);

    const queryString = params.toString();
    const endpoint = `/admin/analytics/revenue${queryString ? `?${queryString}` : ''}`;

    return this.request<RevenueAnalytics>(endpoint);
  }

  async getBookingAnalytics(filters?: AnalyticsFilters): Promise<BookingAnalytics> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.dateRange) params.append('dateRange', filters.dateRange);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);

    const queryString = params.toString();
    const endpoint = `/admin/analytics/bookings${queryString ? `?${queryString}` : ''}`;

    return this.request<BookingAnalytics>(endpoint);
  }

  async getEquipmentUtilization(filters?: AnalyticsFilters): Promise<EquipmentUtilization> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.dateRange) params.append('dateRange', filters.dateRange);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);

    const queryString = params.toString();
    const endpoint = `/admin/analytics/equipment${queryString ? `?${queryString}` : ''}`;

    return this.request<EquipmentUtilization>(endpoint);
  }

  async getCustomerAnalytics(filters?: AnalyticsFilters): Promise<CustomerAnalytics> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.dateRange) params.append('dateRange', filters.dateRange);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);

    const queryString = params.toString();
    const endpoint = `/admin/analytics/customers${queryString ? `?${queryString}` : ''}`;

    return this.request<CustomerAnalytics>(endpoint);
  }

  // Bookings
  async getBookings(filters?: {
    status?: string;
    customerId?: string;
    equipmentId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    type?: string;
  }) {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const queryString = params.toString();
    const endpoint = `/bookings/admin/all${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  async getBooking(id: string) {
    return this.request(`/bookings/${id}`);
  }

  async getBookingTimeline(id: string) {
    return this.request(`/bookings/admin/timeline/${id}`);
  }

  async getFlaggedBookings() {
    return this.request('/bookings/admin/flagged');
  }

  async getUpcomingDeliveries() {
    return this.request('/bookings/admin/upcoming-deliveries');
  }

  // Equipment
  async getAllEquipment(filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const queryString = params.toString();
    const endpoint = `/equipment${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  async getEquipment(id: string) {
    return this.request(`/equipment/${id}`);
  }

  async createEquipment(data: unknown) {
    return this.request('/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEquipment(id: string, data: unknown) {
    return this.request(`/equipment/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEquipment(id: string) {
    return this.request(`/equipment/${id}`, {
      method: 'DELETE',
    });
  }

  async updateBooking(id: string, data: unknown) {
    return this.request(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateBookingStatus(id: string, status: string) {
    return this.request(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async cancelBooking(id: string, reason?: string) {
    return this.request(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancellationReason: reason }),
    });
  }
}

// Export singleton instance
export const adminApi = new AdminApiClient();
