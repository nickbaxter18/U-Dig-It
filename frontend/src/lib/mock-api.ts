// Mock API implementation for development
import { ApiResponse } from './api-client';

export interface MockEquipment {
  id: string;
  name: string;
  model: string;
  category: string;
  dailyRate: number;
  description: string;
  specifications: Record<string, any>;
  images: string[];
  available: boolean;
  location: {
    city: string;
    region: string;
  };
}

export interface MockBooking {
  id: string;
  bookingNumber: string;
  equipmentId: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  totalAmount: number;
  deliveryAddress: string;
  deliveryCity: string;
  createdAt: string;
  updatedAt: string;
}

export class MockApiClient {
  private mockEquipment: MockEquipment[] = [
    {
      id: '1',
      name: 'Kubota BX23S Tractor',
      model: 'BX23S',
      category: 'Tractors',
      dailyRate: 150,
      description: 'Compact utility tractor with backhoe and loader',
      specifications: {
        engine: '22.5 HP',
        weight: '1814 lbs',
        fuelCapacity: '6.1 gallons',
      },
      images: ['/images/tractor1.jpg'],
      available: true,
      location: {
        city: 'Fresno',
        region: 'CA',
      },
    },
  ];

  private mockBookings: MockBooking[] = [];

  // Equipment methods
  async getEquipment(): Promise<ApiResponse<MockEquipment[]>> {
    return {
      data: this.mockEquipment,
      success: true,
      message: 'Equipment retrieved successfully',
    };
  }

  async getEquipmentById(id: string): Promise<ApiResponse<MockEquipment>> {
    const equipment = this.mockEquipment.find(e => e.id === id);
    if (!equipment) {
      return {
        data: {} as MockEquipment,
        success: false,
        message: 'Equipment not found',
      };
    }
    return {
      data: equipment,
      success: true,
      message: 'Equipment retrieved successfully',
    };
  }

  async getEquipmentList(params?: unknown): Promise<ApiResponse<MockEquipment[]>> {
    return {
      data: this.mockEquipment,
      success: true,
      message: 'Equipment list retrieved successfully',
    };
  }

  async checkAvailability(
    equipmentId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<{ available: boolean }>> {
    return {
      data: { available: true },
      success: true,
      message: 'Availability checked successfully',
    };
  }

  // Booking methods
  async createBooking(bookingData: unknown): Promise<ApiResponse<MockBooking>> {
    const booking: MockBooking = {
      id: Math.random().toString(36).substr(2, 9),
      bookingNumber: `BK${Date.now()}`,
      ...(bookingData as any),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockBookings.push(booking);

    return {
      data: booking,
      success: true,
      message: 'Booking created successfully',
    };
  }

  async getBookings(): Promise<ApiResponse<MockBooking[]>> {
    return {
      data: this.mockBookings,
      success: true,
      message: 'Bookings retrieved successfully',
    };
  }

  // HTTP methods to match ApiClient interface
  async get<T>(url: string, config?: unknown): Promise<ApiResponse<T>> {
    return {
      data: {} as T,
      success: true,
      message: 'Mock GET response',
    };
  }

  async post<T>(url: string, data?: unknown, config?: unknown): Promise<ApiResponse<T>> {
    return {
      data: {} as T,
      success: true,
      message: 'Mock POST response',
    };
  }

  async put<T>(url: string, data?: unknown, config?: unknown): Promise<ApiResponse<T>> {
    return {
      data: {} as T,
      success: true,
      message: 'Mock PUT response',
    };
  }

  async patch<T>(url: string, data?: unknown, config?: unknown): Promise<ApiResponse<T>> {
    return {
      data: {} as T,
      success: true,
      message: 'Mock PATCH response',
    };
  }

  async delete<T>(url: string, config?: unknown): Promise<ApiResponse<T>> {
    return {
      data: {} as T,
      success: true,
      message: 'Mock DELETE response',
    };
  }
}
