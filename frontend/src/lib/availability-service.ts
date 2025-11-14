/**
 * Enhanced availability service with real-time updates and smart suggestions
 */

import { logger } from '@/lib/logger';
import { supabaseApi } from './supabase/api-client';
import { supabase } from './supabase/client';

export interface AvailabilityResult {
  available: boolean;
  message: string;
  alternatives?: Array<{
    startDate: string;
    endDate: string;
    reason: string;
    savings?: number;
  }>;
  pricing?: {
    dailyRate: number;
    currency: string;
  };
  nextAvailableDate?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SmartSuggestion {
  label: string;
  startDate: string;
  endDate: string;
  reason: string;
  savings?: number;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface AvailabilityOptions {
  equipmentId?: string;
  includeAlternatives?: boolean;
  maxAlternatives?: number;
  includePricing?: boolean;
  includeSmartSuggestions?: boolean;
}

class AvailabilityService {
  private cache = new Map<string, { result: AvailabilityResult; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ALTERNATIVES = 5;

  /**
   * Check equipment availability with enhanced features
   */
  async checkAvailability(
    startDate: string,
    endDate: string,
    options: AvailabilityOptions = {}
  ): Promise<AvailabilityResult> {
    const cacheKey = `${startDate}-${endDate}-${options.equipmentId || 'default'}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result;
    }

    try {
      // ✅ BULLETPROOF FIX: Get equipment without status filter
      // Equipment status reflects CURRENT availability, not future bookings!
      // We'll check date-specific availability separately
      let equipmentId = options.equipmentId;
      if (!equipmentId) {
        const equipment = await supabaseApi.getEquipmentList({ limit: 1 });

        if (!equipment || equipment.length === 0) {
          return {
            available: false,
            message: 'No equipment configured. Please contact support.',
            confidence: 'low',
          };
        }
        const equipmentData: any = equipment[0];
        equipmentId = equipmentData?.id;

        if (!equipmentId) {
          return {
            available: false,
            message: 'Unable to determine equipment. Please try again.',
            confidence: 'low',
          };
        }
      }

      // Check availability using direct query
      const { data: conflictingBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, startDate, endDate')
        .eq('equipmentId', equipmentId)
        .neq('status', 'cancelled')
        .or(`startDate.lte.${endDate},endDate.gte.${startDate}`);

      if (bookingError) throw bookingError;

      const isAvailable = !conflictingBookings || conflictingBookings.length === 0;

      const result: AvailabilityResult = {
        available: isAvailable,
        message: isAvailable
          ? 'Equipment is available for your selected dates!'
          : 'Equipment is not available for your selected dates.',
        confidence: 'high',
        pricing: {
          dailyRate: 450, // TODO: get from equipment table
          currency: 'CAD',
        },
      };

      // Generate alternatives if requested and not available
      if (!result.available && options.includeAlternatives) {
        result.alternatives = await this.generateAlternatives(
          startDate,
          endDate,
          equipmentId,
          options.maxAlternatives || this.MAX_ALTERNATIVES
        );
      }

      // Find next available date if not available
      if (!result.available) {
        result.nextAvailableDate = await this.findNextAvailableDate(
          startDate,
          endDate,
          equipmentId
        );
      }

      // Cache the result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });

      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Availability check failed:', {
          component: 'availability-service',
          action: 'error',
        }, error instanceof Error ? error : new Error(String(error)));
      }
      return {
        available: false,
        message: 'Unable to check availability. Please try again.',
        confidence: 'low',
      };
    }
  }

  /**
   * Generate alternative date suggestions when equipment is unavailable
   */
  private async generateAlternatives(
    originalStart: string,
    originalEnd: string,
    equipmentId: string,
    maxAlternatives: number
  ): Promise<AvailabilityResult['alternatives']> {
    const alternatives: AvailabilityResult['alternatives'] = [];
    const originalStartDate = new Date(originalStart);
    const originalEndDate = new Date(originalEnd);
    const daysDiff = Math.ceil(
      (originalEndDate.getTime() - originalStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Try different offset strategies
    const offsets = [1, 2, 3, 7, 14]; // 1 day, 2 days, 3 days, 1 week, 2 weeks

    for (const offset of offsets) {
      if (alternatives.length >= maxAlternatives) break;

      // Try earlier dates
      const earlierStart = new Date(originalStartDate);
      earlierStart.setDate(originalStartDate.getDate() - offset);
      const earlierEnd = new Date(earlierStart);
      earlierEnd.setDate(earlierStart.getDate() + daysDiff);

      if (earlierStart >= new Date()) {
        try {
          const availabilityResponse = await supabaseApi.checkAvailability(
            equipmentId,
            earlierStart.toISOString().split('T')[0],
            earlierEnd.toISOString().split('T')[0]
          );

          if (availabilityResponse.available) {
            alternatives.push({
              startDate: earlierStart.toISOString().split('T')[0],
              endDate: earlierEnd.toISOString().split('T')[0],
              reason: `${offset} day${offset > 1 ? 's' : ''} earlier`,
              savings: this.calculateSavings(offset, 'earlier'),
            });
          }
        } catch (error) {
          // Continue if availability check fails
        }
      }

      // Try later dates
      const laterStart = new Date(originalStartDate);
      laterStart.setDate(originalStartDate.getDate() + offset);
      const laterEnd = new Date(laterStart);
      laterEnd.setDate(laterStart.getDate() + daysDiff);

      try {
        const availabilityResponse = await supabaseApi.checkAvailability(
          equipmentId,
          laterStart.toISOString().split('T')[0],
          laterEnd.toISOString().split('T')[0]
        );

        if (availabilityResponse.available) {
          alternatives.push({
            startDate: laterStart.toISOString().split('T')[0],
            endDate: laterEnd.toISOString().split('T')[0],
            reason: `${offset} day${offset > 1 ? 's' : ''} later`,
            savings: this.calculateSavings(offset, 'later'),
          });
        }
      } catch (error) {
        // Continue if availability check fails
      }
    }

    return alternatives.slice(0, maxAlternatives);
  }

  /**
   * Find the next available date for the same duration
   */
  private async findNextAvailableDate(
    startDate: string,
    endDate: string,
    equipmentId: string
  ): Promise<string | undefined> {
    const originalStartDate = new Date(startDate);
    const originalEndDate = new Date(endDate);
    const daysDiff = Math.ceil(
      (originalEndDate.getTime() - originalStartDate.getDate()) / (1000 * 60 * 60 * 24)
    );

    // Check up to 30 days in the future
    for (let offset = 1; offset <= 30; offset++) {
      const testStart = new Date(originalStartDate);
      testStart.setDate(originalStartDate.getDate() + offset);
      const testEnd = new Date(testStart);
      testEnd.setDate(testStart.getDate() + daysDiff);

      try {
        const isAvailable = await this.checkAvailability(
          testStart.toISOString().split('T')[0],
          testEnd.toISOString().split('T')[0],
          { equipmentId, includeAlternatives: false }
        );

        if (isAvailable.available) {
          return testStart.toISOString().split('T')[0];
        }
      } catch (error) {
        // Continue if availability check fails
      }
    }

    return undefined;
  }

  /**
   * Calculate potential savings for alternative dates
   */
  private calculateSavings(offset: number, direction: 'earlier' | 'later'): number {
    // Simple savings calculation based on offset and direction
    // Earlier dates might have lower demand, later dates might have seasonal pricing
    if (direction === 'earlier') {
      return Math.min(offset * 10, 50); // Up to $50 savings for earlier dates
    } else {
      return Math.min(offset * 5, 25); // Up to $25 savings for later dates
    }
  }

  /**
   * Generate smart date suggestions based on various factors
   */
  async generateSmartSuggestions(
    preferences: {
      suggestWeekends?: boolean;
      suggestMidWeek?: boolean;
      suggestExtendedWeekends?: boolean;
      maxSuggestions?: number;
    } = {}
  ): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];
    const today = new Date();
    const maxSuggestions = preferences.maxSuggestions || 5;

    // Weekend suggestions
    if (preferences.suggestWeekends !== false) {
      const nextSaturday = new Date(today);
      nextSaturday.setDate(today.getDate() + (6 - today.getDay()));
      const nextSunday = new Date(nextSaturday);
      nextSunday.setDate(nextSaturday.getDate() + 1);

      suggestions.push({
        label: 'Next Weekend',
        startDate: nextSaturday.toISOString().split('T')[0],
        endDate: nextSunday.toISOString().split('T')[0],
        reason: 'Perfect for weekend projects',
        priority: 'high',
        confidence: 0.9,
      });
    }

    // Mid-week suggestions
    if (preferences.suggestMidWeek !== false) {
      const midWeek = new Date(today);
      midWeek.setDate(today.getDate() + 3);
      if (midWeek.getDay() !== 0 && midWeek.getDay() !== 6) {
        const endMidWeek = new Date(midWeek);
        endMidWeek.setDate(midWeek.getDate() + 2);

        suggestions.push({
          label: 'Mid-Week Special',
          startDate: midWeek.toISOString().split('T')[0],
          endDate: endMidWeek.toISOString().split('T')[0],
          reason: 'Lower demand, better availability',
          savings: 50,
          priority: 'medium',
          confidence: 0.8,
        });
      }
    }

    // Extended weekend suggestions
    if (preferences.suggestExtendedWeekends !== false) {
      const extendedWeekend = new Date(today);
      extendedWeekend.setDate(today.getDate() + (5 - today.getDay())); // Next Friday
      const extendedEnd = new Date(extendedWeekend);
      extendedEnd.setDate(extendedWeekend.getDate() + 3); // Monday

      suggestions.push({
        label: 'Extended Weekend',
        startDate: extendedWeekend.toISOString().split('T')[0],
        endDate: extendedEnd.toISOString().split('T')[0],
        reason: 'Long weekend for bigger projects',
        priority: 'medium',
        confidence: 0.7,
      });
    }

    // Check availability for each suggestion and filter
    const availableSuggestions: SmartSuggestion[] = [];

    for (const suggestion of suggestions) {
      if (availableSuggestions.length >= maxSuggestions) break;

      try {
        const availability = await this.checkAvailability(
          suggestion.startDate,
          suggestion.endDate,
          { includeAlternatives: false }
        );

        if (availability.available) {
          availableSuggestions.push(suggestion);
        }
      } catch (error) {
        // If we can't check availability, include the suggestion anyway
        availableSuggestions.push(suggestion);
      }
    }

    // Sort by priority and confidence
    return availableSuggestions
      .sort((a: any, b: any) => {
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 0;
        const bPriority = priorityOrder[b.priority] || 0;
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        return b.confidence - a.confidence;
      })
      .slice(0, maxSuggestions);
  }

  /**
   * Clear cache (useful for testing or when data changes)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const availabilityService = new AvailabilityService();
